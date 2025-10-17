import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import SelectPlayer from "../SelectPlayer/SelectPlayer";
import SelectSet from "../SelectSet/SelectSet";
import SelectSecret from "../SelectSecret/SelectSecret";
import SelectDiscardPileCards from "../SelectDiscardPileCards/SelectDiscardPileCards";
import OrderDiscardPileCards from "../OrderDiscardPileCards/OrderDiscardPileCards";

/** ─────────────────────────────────────────────────────────────────────────────
 * Para testear sin servidor
 * Llamar en el punto app a <EffectScenarioRunnerAuto event="eventName" />
 * con cualquier eventName de los que se manejan en EffectManager
 * ────────────────────────────────────────────────────────────────────────────*/

/** ─────────────────────────────────────────────────────────────────────────────
 * Endpoints per-event (rename to real routes)
 * ────────────────────────────────────────────────────────────────────────────*/
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
};

/** Small log helpers (keep console clean) */
const log = (...a) => console.log("[EffectManager]", ...a);
const warn = (...a) => console.warn("[EffectManager]", ...a);
const error = (...a) => console.error("[EffectManager]", ...a);

export default function EffectManager({
  publicData,
  privateData,
  actualPlayerId,
  wsRef,
}) {
  /** ───────────────────────────────────────────────────────────────────────────
   * Flow state
   * ─────────────────────────────────────────────────────────────────────────*/
  const [currentEvent, setCurrentEvent] = useState(null); // string | null
  const [payload, setPayload] = useState(null);
  // steps: 'selectPlayer' | 'selectPlayer2' | 'selectSecret' | 'selectSet' | 'selectDiscard' | 'orderDiscard' | null
  const [step, setStep] = useState(null);

  // User selections
  const [selPlayer1, setSelPlayer1] = useState(null);
  const [selPlayer2, setSelPlayer2] = useState(null);
  const [selSecret, setSelSecret] = useState(null);
  const [selSet, setSelSet] = useState(null);
  const [selCard, setSelCard] = useState(null);
  const [selOrderIds, setSelOrderIds] = useState(null); // NEW: ids from OrderDiscardPileCards confirm

  // Back navigation flag (children request going one step back)
  const [backRequested, setBackRequested] = useState(false);
  const requestBack = useCallback(() => setBackRequested(true), []);

  // Simple step setter with log
  const gotoStep = useCallback(
    (next) => {
      if (step !== next) log("step ->", next);
      setStep(next);
    },
    [step]
  );

  // Full flow reset
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
    setPayload(null);
    setBackRequested(false);
  }, []);

  /** ───────────────────────────────────────────────────────────────────────────
   * Networking (per-event POST)
   * ─────────────────────────────────────────────────────────────────────────*/
  const { gameId } = useParams();

  const sendEffectResponse = useCallback(
    async (eventName, responsePayload) => {
      const template = EFFECT_ENDPOINTS[eventName];
      if (!template) {
        warn(`No endpoint configured for event "${eventName}". Skipping POST.`);
        resetFlow();
        return;
      }

      const url =
        typeof template === "string"
          ? template.replace("{id}", String(gameId ?? "0"))
          : "";

      if (!url) {
        warn("Empty URL resolved. Skipping POST.", { eventName, template });
        resetFlow();
        return;
      }

      const body = { event: eventName, ...responsePayload };
      log("POST", url, body);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          throw new Error(`POST failed (${response.status})`);
        }
        log("POST ok:", eventName);
      } catch (err) {
        error("POST error:", err?.message ?? err);
      } finally {
        resetFlow();
      }
    },
    [gameId, resetFlow]
  );

  /** ───────────────────────────────────────────────────────────────────────────
   * WebSocket listener (entry point for effects)
   * ─────────────────────────────────────────────────────────────────────────*/
  useEffect(() => {
    if (!wsRef) {
      warn("wsRef is not defined; EffectManager idle.");
      return;
    }

    wsRef.onmessage = (event) => {
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

      // Reset selections for a new flow
      setSelPlayer1(null);
      setSelPlayer2(null);
      setSelSecret(null);
      setSelSet(null);
      setSelCard(null);
      setSelOrderIds(null);
      setPayload(data.payload ?? null);
      setBackRequested(false);

      // Initialize step based on event type
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
          gotoStep("selectDiscard");
          break;

        case "delayTheMurderersEscape":
          log("WS event:", data.event);
          setCurrentEvent("delayTheMurderersEscape");
          gotoStep("orderDiscard");
          break;

        default:
          warn("Unknown WS event:", data.event);
          setCurrentEvent(null);
          setStep(null);
      }
    };
  }, [wsRef, gotoStep]);

  /** ───────────────────────────────────────────────────────────────────────────
   * Derived data
   * ─────────────────────────────────────────────────────────────────────────*/
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

  // Secrets of target: if target is me -> privateData.secrets; else -> publicData.players[].secrets
  const secretsOfTarget = useMemo(() => {
    if (!selPlayer1) return [];
    const isMe = String(selPlayer1) === String(actualPlayerId);
    if (isMe) return privateData?.secrets ?? [];
    const target = playersAll.find((p) => String(p.id) === String(selPlayer1));
    return target?.secrets ?? [];
  }, [selPlayer1, actualPlayerId, privateData, playersAll]);

  const ownSecrets = useMemo(() => privateData?.secrets ?? [], [privateData]);

  // For discard-based events: payload
  const discardTopFive = useMemo(() => payload ?? [], [payload]);

  /** ───────────────────────────────────────────────────────────────────────────
   * Navigation / completion per event
   * ─────────────────────────────────────────────────────────────────────────*/
  useEffect(() => {
    if (!currentEvent) return;

    // Back navigation handling
    if (backRequested) {
      log("goBack requested from step:", step, "event:", currentEvent);

      // From selectSet -> back to selectPlayer (stealSet)
      if (step === "selectSet" && currentEvent === "stealSet") {
        setSelSet(null);
        setSelPlayer1(null); // prevent auto-forward from selectPlayer
        setBackRequested(false);
        gotoStep("selectPlayer");
        return;
      }

      // From selectSecret -> back to selectPlayer
      if (
        step === "selectSecret" &&
        (currentEvent === "revealSecret" ||
          currentEvent === "andThenThereWasOneMore" ||
          currentEvent === "hideSecret")
      ) {
        setSelSecret(null);
        setSelPlayer1(null); // prevent auto-forward from selectPlayer
        setBackRequested(false);
        gotoStep("selectPlayer");
        return;
      }

      // From selectPlayer2 -> back to selectSecret (andThenThereWasOneMore)
      if (
        step === "selectPlayer2" &&
        currentEvent === "andThenThereWasOneMore"
      ) {
        setSelPlayer2(null);
        setSelSecret(null); // prevent auto-forward from selectSecret
        setBackRequested(false);
        gotoStep("selectSecret");
        return;
      }

      // From selectSecret in revealOwnSecret: there is no back
      if (step === "selectSecret" && currentEvent === "revealOwnSecret") {
        setBackRequested(false);
        return;
      }

      // Fallback
      setBackRequested(false);
    }

    // Forward progression / finish
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
            stolenPlayerId: selPlayer2, // player who receives the hidden secret
            selectedPlayerId: selPlayer1, // player we stole from
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
        if (step === "selectDiscard" && selCard != null) {
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

      default:
        // Unknown / unsupported (shouldn't happen as we filter at WS handler)
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
    backRequested,
    actualPlayerId,
    gotoStep,
    sendEffectResponse,
  ]);

  /** ───────────────────────────────────────────────────────────────────────────
   * UI copy per step
   * ─────────────────────────────────────────────────────────────────────────*/
  const promptText = useMemo(() => {
    switch (currentEvent) {
      case "selectAnyPlayer":
        return "Select any player to discard all their NotSoFast cards";
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
      default:
        return "";
    }
  }, [currentEvent, step]);

  /** ───────────────────────────────────────────────────────────────────────────
   * Collections for each step
   * ─────────────────────────────────────────────────────────────────────────*/
  const playersForThisStep = useMemo(() => {
    switch (currentEvent) {
      case "stealSet":
        return playersExceptMe; // cannot target yourself
      case "selectAnyPlayer":
      case "andThenThereWasOneMore":
      case "revealSecret":
      case "hideSecret":
        return playersAll;
      default:
        return [];
    }
  }, [currentEvent, playersAll, playersExceptMe]);

  const revealedForThisStep = useMemo(() => {
    switch (currentEvent) {
      case "andThenThereWasOneMore": // needs revealed secret
      case "hideSecret": // needs revealed secret
        return true;
      case "revealSecret": // needs hidden secret
      case "revealOwnSecret": // needs hidden secret
        return false;
      default:
        return undefined; // not used in other steps
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
  const discardForThisStep = discardTopFive; // used by lookIntoTheAshes and NEW delayTheMurderersEscape

  /** ───────────────────────────────────────────────────────────────────────────
   * Render
   * ─────────────────────────────────────────────────────────────────────────*/
  return (
    <>
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
          // goBack active for all except revealOwnSecret
          goBack={currentEvent === "revealOwnSecret" ? null : requestBack}
          text={promptText}
        />
      )}

      {step === "selectSet" && (
        <SelectSet
          actualPlayerId={actualPlayerId}
          sets={setsForThisStep}
          selectedSetId={setSelSet}
          goBack={requestBack}
          text={promptText}
        />
      )}

      {step === "selectDiscard" && (
        <SelectDiscardPileCards
          cards={discardForThisStep}
          selectedCardId={setSelCard}
          text={promptText}
        />
      )}

      {step === "orderDiscard" && (
        <OrderDiscardPileCards
          cards={discardForThisStep}
          selectedCardsOrder={setSelOrderIds} // returns array of ids
          text={promptText}
        />
      )}
    </>
  );
}
