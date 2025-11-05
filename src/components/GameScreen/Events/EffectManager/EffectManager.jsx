// EffectManager.jsx

/**
 * @file EffectManager.jsx
 * @description Orchestrates multi-step, player-driven effects requested by the server via WebSocket.
 * Listens to WS events (e.g., "revealSecret", "stealSet"), renders the proper selection step UI,
 * and POSTs the chosen result back to the server. All event/payload shapes are defined in API DOCUMENT.
 *
 * === Canonical data shapes (from API DOCUMENT) ===
 *
 * @typedef {"blocked"|"unblocked"} ActionStatus
 * @typedef {"waiting"|"inProgress"|"finished"} GameStatus
 * @typedef {"waiting"|"playing"|"discarding"|"discardingOpt"|"drawing"} TurnStatus
 * @typedef {"detective"|"murderer"|"accomplice"} Role
 *
 * @typedef {{ id:number, name:string }} SimpleCard
 * @typedef {{ id:number, name:string, type:string }} HandCard
 * @typedef {{ id:number, revealed:boolean, name:(string|null) }} PublicSecret
 * @typedef {{ id:number, name:string }} DetectiveCard
 * @typedef {{ setId:number, setName:string, cards:DetectiveCard[] }} DetectiveSet
 * @typedef {{
 *   id:number,
 *   name:string,
 *   avatar:number,
 *   socialDisgrace:boolean,
 *   turnOrder:number,
 *   turnStatus:TurnStatus,
 *   cardCount:number,
 *   secrets:PublicSecret[],
 *   sets:DetectiveSet[]
 * }} PublicPlayer
 * @typedef {{
 *   actionStatus:ActionStatus,
 *   gameStatus:GameStatus,
 *   regularDeckCount:number,
 *   discardPileTop:(SimpleCard|null),
 *   draftCards:SimpleCard[],
 *   discardPileCount:number,
 *   players:PublicPlayer[]
 * }} PublicData
 * @typedef {{
 *   cards:HandCard[],
 *   secrets:PublicSecret[],
 *   role:Role,
 *   ally: ({ id:number, role:Exclude<Role,"detective"> } | null)
 * }} PrivateData
 *
 * === Effect WS events handled here (payloads) ===
 * (Event names per API DOCUMENT)
 * - "selectAnyPlayer":           payload: null | {}
 * - "andThenThereWasOneMore":    payload: null | {}
 * - "revealSecret":              payload: null | {}
 * - "revealOwnSecret":           payload: null | {}
 * - "hideSecret":                payload: null | {}
 * - "stealSet":                  payload: null | {}
 * - "lookIntoTheAshes":          payload: SimpleCard[]   // top N discard cards to choose 1
 * - "delayTheMurderersEscape":   payload: SimpleCard[]   // cards to reorder for top of deck
 *
 * === Endpoints used (see API DOCUMENT for exact request/response) ===
 * - POST /play/{id}/actions/select-any-player            { playerId, selectedPlayerId }
 * - POST /play/{id}/actions/and-then-there-was-one-more  { playerId, secretId, stolenPlayerId, selectedPlayerId }
 * - POST /play/{id}/actions/reveal-secret                { playerId, secretId, revealedPlayerId }
 * - POST /play/{id}/actions/reveal-own-secret            { playerId, secretId }
 * - POST /play/{id}/actions/hide-secret                  { playerId, secretId, hiddenPlayerId }
 * - POST /play/{id}/actions/steal-set                    { playerId, setId, stolenPlayerId }
 * - POST /play/{id}/actions/look-into-the-ashes          { playerId, cardId }
 * - POST /play/{id}/actions/delay-the-murderers-escape   { playerId, cards:number[] } // ordered ids
 *
 * === Props ===
 * @param {Object} props
 * @param {PublicData}  props.publicData
 * @param {PrivateData} props.privateData
 * @param {number|string} props.actualPlayerId
 * @param {{current:WebSocket}|WebSocket} props.wsRef
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import Clock from "../../Clock/Clock";
import SelectPlayer from "../Actions/SelectPlayer/SelectPlayer";
import SelectSet from "../Actions/SelectSet/SelectSet";
import SelectSecret from "../Actions/SelectSecret/SelectSecret";
import SelectCard from "../Actions/SelectCard/SelectCard";
import OrderCards from "../Actions/OrderCards/OrderCards";
import SelectDirection from "../Actions/SelectDirection/SelectDirection";

/** Endpoints template per effect; {id} is replaced with current :gameId */
const EFFECT_ENDPOINTS = {
  selectAnyPlayer: "http://localhost:8000/play/{id}/actions/select-any-player",
  andThenThereWasOneMore:
    "http://localhost:8000/play/{id}/actions/and-then-there-was-one-more",
  revealSecret: "http://localhost:8000/play/{id}/actions/reveal-secret",
  revealOwnSecret: "http://localhost:8000/play/{id}/actions/reveal-own-secret",
  hideSecret: "http://localhost:8000/play/{id}/actions/hide-secret",
  stealSet: "http://localhost:8000/play/{id}/actions/steal-set",
  lookIntoTheAshes:
    "http://localhost:8000/play/{id}/actions/look-into-the-ashes",
  delayTheMurderersEscape:
    "http://localhost:8000/play/{id}/actions/delay-the-murderers-escape",
  selectOwnCard: "http://localhost:8000/play/{id}/actions/select-own-card",
  selectDirection: "http://localhost:8000/play/{id}/actions/select-direction",
};

const log = (...a) => console.log("[EffectManager]", ...a);
const warn = (...a) => console.warn("[EffectManager]", ...a);
const error = (...a) => console.error("[EffectManager]", ...a);

export default function EffectManager({
  publicData,
  privateData,
  actualPlayerId,
  wsRef,
}) {
  const [currentEvent, setCurrentEvent] = useState(null);
  const [payload, setPayload] = useState(null);
  const [step, setStep] = useState(null);

  const [selPlayer1, setSelPlayer1] = useState(null);
  const [selPlayer2, setSelPlayer2] = useState(null);
  const [selSecret, setSelSecret] = useState(null);
  const [selSet, setSelSet] = useState(null);
  const [selCard, setSelCard] = useState(null);
  const [selOrderIds, setSelOrderIds] = useState(null);
  const [selDirection, setSelDirection] = useState(null);

  const [backRequested, setBackRequested] = useState(false);
  const requestBack = useCallback(() => setBackRequested(true), []);

  const gotoStep = useCallback(
    (next) => {
      if (step !== next) log("step ->", next);
      setStep(next);
    },
    [step]
  );

  const resetFlow = useCallback(() => {
    log("reset flow");
    setCurrentEvent(null);
    setStep(null);
    setSelPlayer1(null);
    setSelPlayer2(null);
    setSelSecret(null);
    setSelSet(null);
    setSelCard(null);
    setSelOrderIds(null);
    setSelDirection(null);
    setPayload(null);
    setBackRequested(false);
  }, []);

  const { gameId } = useParams();

  const sendEffectResponse = useCallback(
    async (eventName, responsePayload) => {
      const template = EFFECT_ENDPOINTS[eventName];
      if (!template) {
        warn(`No endpoint configured for event "${eventName}". Skipping POST.`);
        resetFlow();
        return;
      }
      const url = template.replace("{id}", String(gameId ?? "0"));
      const body = { event: eventName, ...responsePayload };
      log("POST", url, body);
      resetFlow();
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!response.ok) throw new Error(`POST failed (${response.status})`);
        log("POST ok:", eventName);
      } catch (err) {
        error("POST error:", err?.message ?? err);
      }
    },
    [gameId, resetFlow]
  );

  useEffect(() => {
    const wsInstance = wsRef?.current ?? wsRef;
    if (!wsInstance) {
      warn("wsRef is not defined; EffectManager idle.");
      return;
    }
    const listener = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        warn("Ignoring non-JSON WS message");
        return;
      }
      if (!data?.event) {
        warn("WS message without 'event' field:", data);
        return;
      }

      setSelPlayer1(null);
      setSelPlayer2(null);
      setSelSecret(null);
      setSelSet(null);
      setSelCard(null);
      setSelOrderIds(null);
      setSelDirection(null);
      setPayload(data.payload ?? null);
      setBackRequested(false);

      switch (data.event) {
        case "selectAnyPlayer":
          log("WS event:", data.event);
          setCurrentEvent("selectAnyPlayer");
          gotoStep("selectPlayer");
          break;
        case "andThenThereWasOneMore":
          log("WS event:", data.event);
          setCurrentEvent("andThenThereWasOneMore");
          gotoStep("selectPlayer");
          break;
        case "revealSecret":
          log("WS event:", data.event);
          setCurrentEvent("revealSecret");
          gotoStep("selectPlayer");
          break;
        case "revealOwnSecret":
          log("WS event:", data.event);
          setCurrentEvent("revealOwnSecret");
          gotoStep("selectSecret");
          break;
        case "hideSecret":
          log("WS event:", data.event);
          setCurrentEvent("hideSecret");
          gotoStep("selectPlayer");
          break;
        case "stealSet":
          log("WS event:", data.event);
          setCurrentEvent("stealSet");
          gotoStep("selectPlayer");
          break;
        case "lookIntoTheAshes":
          log("WS event:", data.event);
          setCurrentEvent("lookIntoTheAshes");
          gotoStep("selectCard");
          break;
        case "delayTheMurderersEscape":
          log("WS event:", data.event);
          setCurrentEvent("delayTheMurderersEscape");
          gotoStep("orderDiscard");
          break;
        case "selectOwnCard":
          log("WS event:", data.event);
          setCurrentEvent("selectOwnCard");
          gotoStep("selectCard");
          break;
        case "selectDirection":
          log("WS event:", data.event);
          setCurrentEvent("selectDirection");
          gotoStep("selectDirection");
          break;
        case "selectSet":
          log("WS event:", data.event);
          setCurrentEvent("selectSet");
          gotoStep("selectPlayer");
          break;
        default:
          warn("Unknown WS event (EffectManager):", data.event);
          setCurrentEvent(null);
          setStep(null);
      }
    };

    if (wsInstance.addEventListener) {
      wsInstance.addEventListener("message", listener);
    } else {
      const prev = wsInstance.onmessage;
      wsInstance.onmessage = (event) => {
        listener(event);
        if (prev) prev(event);
      };
    }
    return () => {
      if (wsInstance.removeEventListener) {
        wsInstance.removeEventListener("message", listener);
      }
    };
  }, [wsRef?.current ?? wsRef, gotoStep]);

  const playersAll = publicData?.players ?? [];

  const playersExceptMe = useMemo(
    () => playersAll.filter((p) => String(p.id) !== String(actualPlayerId)),
    [playersAll, actualPlayerId]
  );

  const selectedPlayer1Obj = useMemo(
    () => playersAll.find((p) => String(p.id) === String(selPlayer1)) ?? null,
    [playersAll, selPlayer1]
  );

  const setsOfPlayer1 = useMemo(
    () => selectedPlayer1Obj?.sets ?? [],
    [selectedPlayer1Obj]
  );

  const secretsOfTarget = useMemo(() => {
    if (!selPlayer1) return [];
    const isMe = String(selPlayer1) === String(actualPlayerId);
    if (isMe) return privateData?.secrets ?? [];
    const target = playersAll.find((p) => String(p.id) === String(selPlayer1));
    return target?.secrets ?? [];
  }, [selPlayer1, actualPlayerId, privateData, playersAll]);

  const ownSecrets = useMemo(() => privateData?.secrets ?? [], [privateData]);

  const discardTopFive = useMemo(() => payload ?? [], [payload]);

  const ownCards = useMemo(() => privateData?.cards ?? [], [privateData]);

  useEffect(() => {
    if (!currentEvent) return;

    if (backRequested) {
      if (
        step === "selectSet" &&
        (currentEvent === "stealSet" || currentEvent === "selectSet")
      ) {
        setSelSet(null);
        setSelPlayer1(null);
        setBackRequested(false);
        gotoStep("selectPlayer");
        return;
      }
      if (
        step === "selectSecret" &&
        (currentEvent === "revealSecret" ||
          currentEvent === "andThenThereWasOneMore" ||
          currentEvent === "hideSecret")
      ) {
        setSelSecret(null);
        setSelPlayer1(null);
        setBackRequested(false);
        gotoStep("selectPlayer");
        return;
      }
      if (
        step === "selectPlayer2" &&
        currentEvent === "andThenThereWasOneMore"
      ) {
        setSelPlayer2(null);
        setSelSecret(null);
        setBackRequested(false);
        gotoStep("selectSecret");
        return;
      }
      if (step === "selectSecret" && currentEvent === "revealOwnSecret") {
        setBackRequested(false);
        return;
      }
      setBackRequested(false);
    }

    switch (currentEvent) {
      case "selectAnyPlayer": {
        if (step === "selectPlayer" && selPlayer1 != null) {
          sendEffectResponse("selectAnyPlayer", {
            playerId: actualPlayerId,
            selectedPlayerId: selPlayer1,
          });
        }
        break;
      }
      case "andThenThereWasOneMore": {
        if (step === "selectPlayer" && selPlayer1 != null) {
          gotoStep("selectSecret");
        } else if (step === "selectSecret" && selSecret != null) {
          gotoStep("selectPlayer2");
        } else if (step === "selectPlayer2" && selPlayer2 != null) {
          sendEffectResponse("andThenThereWasOneMore", {
            playerId: actualPlayerId,
            secretId: selSecret,
            stolenPlayerId: selPlayer1,
            selectedPlayerId: selPlayer2,
          });
        }
        break;
      }
      case "revealSecret": {
        if (step === "selectPlayer" && selPlayer1 != null) {
          gotoStep("selectSecret");
        } else if (step === "selectSecret" && selSecret != null) {
          sendEffectResponse("revealSecret", {
            playerId: actualPlayerId,
            secretId: selSecret,
            revealedPlayerId: selPlayer1,
          });
        }
        break;
      }
      case "revealOwnSecret": {
        if (step === "selectSecret" && selSecret != null) {
          sendEffectResponse("revealOwnSecret", {
            playerId: actualPlayerId,
            secretId: selSecret,
          });
        }
        break;
      }
      case "hideSecret": {
        if (step === "selectPlayer" && selPlayer1 != null) {
          gotoStep("selectSecret");
        } else if (step === "selectSecret" && selSecret != null) {
          sendEffectResponse("hideSecret", {
            playerId: actualPlayerId,
            secretId: selSecret,
            hiddenPlayerId: selPlayer1,
          });
        }
        break;
      }
      case "stealSet": {
        if (step === "selectPlayer" && selPlayer1 != null) {
          gotoStep("selectSet");
        } else if (step === "selectSet" && selSet != null) {
          sendEffectResponse("stealSet", {
            playerId: actualPlayerId,
            setId: selSet,
            stolenPlayerId: selPlayer1,
          });
        }
        break;
      }
      case "lookIntoTheAshes": {
        if (step === "selectCard" && selCard != null) {
          sendEffectResponse("lookIntoTheAshes", {
            playerId: actualPlayerId,
            cardId: selCard,
          });
        }
        break;
      }
      case "delayTheMurderersEscape": {
        if (step === "orderDiscard" && Array.isArray(selOrderIds)) {
          sendEffectResponse("delayTheMurderersEscape", {
            playerId: actualPlayerId,
            cards: selOrderIds,
          });
        }
        break;
      }
      case "selectOwnCard": {
        if (step === "selectCard" && selCard != null) {
          sendEffectResponse("selectOwnCard", {
            playerId: actualPlayerId,
            cardId: selCard,
          });
        }
        break;
      }
      case "selectDirection": {
        if (step === "selectDirection" && selDirection != null) {
          sendEffectResponse("selectDirection", {
            playerId: actualPlayerId,
            direction: selDirection,
          });
        }
        break;
      }
      case "selectSet": {
        if (step === "selectPlayer" && selPlayer1 != null) {
          gotoStep("selectSet");
        } else if (step === "selectSet" && selSet != null) {
          sendEffectResponse("selectSet", {
            playerId: actualPlayerId,
            setId: selSet,
            stolenPlayerId: selPlayer1,
          });
        }
        break;
      }
      default:
        break;
    }
  }, [
    currentEvent,
    step,
    selPlayer1,
    selPlayer2,
    selSecret,
    selSet,
    selCard,
    selOrderIds,
    selDirection,
    backRequested,
    actualPlayerId,
    gotoStep,
    sendEffectResponse,
  ]);

  const promptText = useMemo(() => {
    switch (currentEvent) {
      case "selectAnyPlayer":
        return "Select any player";
      case "andThenThereWasOneMore":
        if (step === "selectPlayer")
          return "Select one player to steal a secret from";
        if (step === "selectSecret")
          return "Select one revealed secret to steal";
        if (step === "selectPlayer2")
          return "Select one player to give the secret hidden to";
        return "";
      case "revealSecret":
        if (step === "selectPlayer")
          return "Select one player to reveal a secret from";
        if (step === "selectSecret")
          return "Select one hidden secret to reveal";
        return "";
      case "revealOwnSecret":
        return "Select one of your hidden secrets to reveal";
      case "hideSecret":
        if (step === "selectPlayer")
          return "Select one player to hide a secret from";
        if (step === "selectSecret")
          return "Select one revealed secret to hide";
        return "";
      case "stealSet":
        if (step === "selectPlayer")
          return "Select one player to steal a set from";
        if (step === "selectSet") return "Select one set to steal";
        return "";
      case "lookIntoTheAshes":
        return "Select one card to steal from the top five cards of the discard pile";
      case "delayTheMurderersEscape":
        return "Reorder the cards of the discard pile that are going to the top of the regular deck";
      case "selectOwnCard":
        return "Select one of your own cards to trade";
      case "selectDirection":
        return "Select a direction for the card trade effect";
      case "selectSet":
        if (step === "selectPlayer")
          return "Select one player to add a card to their set";
        if (step === "selectSet") return "Select one set to add a card to";
        return "";
      default:
        return "";
    }
  }, [currentEvent, step]);

  const playersForThisStep = useMemo(() => {
    switch (currentEvent) {
      case "stealSet":
        return playersExceptMe;
      case "selectAnyPlayer":
      case "andThenThereWasOneMore":
      case "revealSecret":
      case "hideSecret":
      case "selectDirection":
      case "selectSet":
        return playersAll;
      default:
        return [];
    }
  }, [currentEvent, playersAll, playersExceptMe]);

  const revealedForThisStep = useMemo(() => {
    switch (currentEvent) {
      case "andThenThereWasOneMore":
      case "hideSecret":
        return true; // needs revealed secret
      case "revealSecret":
      case "revealOwnSecret":
        return false; // needs hidden secret
      default:
        return undefined;
    }
  }, [currentEvent]);

  const secretsForThisStep = useMemo(() => {
    switch (currentEvent) {
      case "andThenThereWasOneMore":
      case "revealSecret":
      case "hideSecret":
        return secretsOfTarget;
      case "revealOwnSecret":
        return ownSecrets;
      default:
        return [];
    }
  }, [currentEvent, secretsOfTarget, ownSecrets]);

  const setsForThisStep = setsOfPlayer1;
  const cardsForThisStep = useMemo(() => {
    switch (currentEvent) {
      case "lookIntoTheAshes":
      case "delayTheMurderersEscape":
        return discardTopFive;
      case "selectOwnCard":
        return ownCards;
      default:
        return [];
    }
  }, [currentEvent, discardTopFive, ownCards]);

  return (
    <>
      {step !== null && (
        <Clock
          websocket={wsRef.ref}
          publicPlayers={playersAll}
          actualPlayerId={actualPlayerId}
          activeEffect={true}
          actionStatus={publicData.actionStatus}
        />
      )}
      {step === "selectPlayer" && (
        <SelectPlayer
          actualPlayerId={actualPlayerId}
          players={playersForThisStep}
          selectedPlayerId={setSelPlayer1}
          text={promptText}
        />
      )}

      {step === "selectPlayer2" && (
        <SelectPlayer
          actualPlayerId={actualPlayerId}
          players={playersAll}
          selectedPlayerId={setSelPlayer2}
          text={promptText}
        />
      )}

      {step === "selectSecret" && (
        <SelectSecret
          actualPlayerId={actualPlayerId}
          secrets={secretsForThisStep}
          playerId={selPlayer1 ?? actualPlayerId}
          revealed={revealedForThisStep}
          selectedSecretId={setSelSecret}
          goBack={
            currentEvent === "revealOwnSecret"
              ? null
              : () => setBackRequested(true)
          }
          text={promptText}
        />
      )}

      {step === "selectSet" && (
        <SelectSet
          actualPlayerId={actualPlayerId}
          sets={setsForThisStep}
          selectedSetId={setSelSet}
          goBack={() => setBackRequested(true)}
          text={promptText}
        />
      )}

      {step === "selectCard" && (
        <SelectCard
          cards={cardsForThisStep}
          selectedCardId={setSelCard}
          text={promptText}
        />
      )}

      {step === "orderDiscard" && (
        <OrderCards
          cards={cardsForThisStep}
          selectedCardsOrder={setSelOrderIds}
          text={promptText}
        />
      )}

      {step === "selectDirection" && (
        <SelectDirection
          playerId={actualPlayerId}
          players={playersForThisStep}
          selectedDirection={setSelDirection}
          text={promptText}
        />
      )}
    </>
  );
}
