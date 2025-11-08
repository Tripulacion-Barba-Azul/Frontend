// Notifier.jsx

/**
 * @file Notifier.jsx
 * @description In-app overlay notifications for game events coming from WebSocket messages.
 * Renders small, transient popups with optional card/set imagery.
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
 *
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
 *
 * @typedef {{
 *   actionStatus:ActionStatus,
 *   gameStatus:GameStatus,
 *   regularDeckCount:number,
 *   discardPileTop:(SimpleCard|null),
 *   draftCards:SimpleCard[],
 *   discardPileCount:number,
 *   players:PublicPlayer[]
 * }} PublicData
 *
 * @typedef {{
 *   cards:HandCard[],
 *   secrets:PublicSecret[],
 *   role:Role,
 *   ally: ({ id:number, role:Exclude<Role,"detective"> } | null)
 * }} PrivateData
 *
 * === WebSocket notifier events (payloads used by this component) ===
 * (Event names per API DOCUMENT; only display-side fields are listed)
 *
 * @typedef {{ playerId:number, quantity:number, selectedPlayerId:number }} NotifierCardsOffTheTablePayload
 * @typedef {{ playerId:number, stolenPlayerId:number, setId:number }} NotifierStealSetPayload
 * @typedef {{ playerId:number }} NotifierLookIntoTheAshesPayload
 * @typedef {{ playerId:number, secretId:number, secretName:string, stolenPlayerId:number, giftedPlayerId:number }} NotifierAndThenThereWasOneMorePayload
 * @typedef {{ playerId:number, secretId:number, selectedPlayerId:number }} NotifierRevealSecretPayload
 * @typedef {{ playerId:number, secretId:number, selectedPlayerId:number }} NotifierRevealSecretForcePayload
 * @typedef {{ playerId:number, secretId:number, secretName:string, selectedPlayerId:number }} NotifierSatterthwaiteWildPayload
 * @typedef {{ playerId:number, secretId:number, selectedPlayerId:number }} NotifierHideSecretPayload
 * @typedef {{ playerId:number }} NotifierDelayTheMurderersEscapePayload
 * @typedef {{ playerId:number, actionType:"set"|"detective"|"event"|string, cards:SimpleCard[] }} CardsPlayedPayload
 * @typedef {{ playerId:number, cards:SimpleCard[] }} DiscardEventPayload
 *
 * === Props ===
 * @param {Object}   props
 * @param {PublicData} props.publicData             - Public game snapshot (authoritative shape in API DOCUMENT).
 * @param {number|string} props.actualPlayerId     - Current player's id.
 * @param {{current:WebSocket|null}} props.wsRef   - Active WebSocket reference.
 */

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  CARDS_MAP,
  SETS_MAP,
  SECRETS_MAP,
} from "../../../../utils/generalMaps";
import "./Notifier.css";

/** Presentation-only card notification; auto-hides after a delay */
function Notification({ text, cards = [], setImage = null, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500);
    }, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const getCardImage = (card) => {
    if (card.isSecret) {
      if (card.revealed && card.name) {
        return SECRETS_MAP[card.name] || "/Cards/05-secret_front.png";
      }
      return "/Cards/05-secret_front.png";
    }
    return CARDS_MAP[card.name] || "/Cards/05-secret_front.png";
  };

  if (!isVisible) return null;

  return createPortal(
    <div
      className={`notifier-overlay ${isVisible ? "visible" : "hidden"}`}
      onClick={handleClose}
    >
      <div className="notifier-content" onClick={(e) => e.stopPropagation()}>
        <div
          className="notifier-text"
          dangerouslySetInnerHTML={{ __html: text }}
        />
        {setImage && (
          <div className="notifier-set">
            <img src={setImage} alt="Set" />
          </div>
        )}
        {cards.length > 0 && (
          <div className="notifier-cards">
            {cards.map((card, index) => (
              <div key={index} className="notifier-card">
                <img src={getCardImage(card)} alt={card.name} />
              </div>
            ))}
          </div>
        )}
        <div className="notifier-hint">
          Click outside to close • (Auto-closes in 5s)
        </div>
      </div>
    </div>,
    document.body
  );
}

/** Orchestrator: listens WS events and opens one notification at a time (display-only) */
export default function Notifier({ publicData, actualPlayerId, wsRef }) {
  const [currentNotification, setCurrentNotification] = useState(null);

  useEffect(() => {
    if (!wsRef?.current) return;

    const handleWebSocketMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { event: eventType, payload } = data;

        switch (eventType) {
          case "notifierCardsOffTheTable":
            handleCardsOffTheTable(payload);
            break;
          case "notifierStealSet":
            handleStealSet(payload);
            break;
          case "notifierLookIntoTheAshes":
            handleLookIntoTheAshes(payload);
            break;
          case "notifierAndThenThereWasOneMore":
            handleAndThenThereWasOneMore(payload);
            break;
          case "notifierRevealSecret":
            handleRevealSecret(payload);
            break;
          case "notifierRevealSecretForce":
            handleRevealSecretForce(payload);
            break;
          case "notifierSatterthwaiteWild":
            handleSatterthwaiteWild(payload);
            break;
          case "notifierHideSecret":
            handleHideSecret(payload);
            break;
          case "notifierDelayTheMurderersEscape":
            handleDelayTheMurderersEscape(payload);
            break;
          case "cardsPlayed":
            handleCardsPlayed(payload);
            break;
          case "discardEvent":
            handleDiscardEvent(payload);
            break;
          case "notifierNoEffect":
            handleNoEffect();
            break;
          case "notifierCardTrade":
            handleCardTrade(payload);
            break;
          case "notifierCardTradePublic":
            handleCardTradePublic(payload);
            break;
          case "notifierDeadCardFolly":
            handleDeadCardFolly();
            break;
          case "notifierPointYourSuspicious":
            handlePointYourSuspicious(payload);
            break;
          case "notifierBlackmailedCard":
            handleBlackmailedCard(payload);
            break;
          case "notifierBlackmailed":
            handleBlackmailed(payload);
            break;
          case "notifierFauxPass":
            handleFauxPass(payload);
            break;
          default:
            // Unknown events are safely ignored (no state changes)
            console.warn("Unknown event type:", eventType);
            break;
        }
      } catch (error) {
        console.error("Error processing websocket message:", error);
      }
    };

    const ws = wsRef.current;
    ws.addEventListener("message", handleWebSocketMessage);
    return () => ws.removeEventListener("message", handleWebSocketMessage);
  }, [wsRef, publicData, actualPlayerId]);

  const PLAYER_COLORS = [
    "#e6194B",
    "#3cb44b",
    "#ffe119",
    "#4363d8",
    "#f58231",
    "#911eb4",
  ];

  const colorName = (name, index) => {
    const color = PLAYER_COLORS[index % PLAYER_COLORS.length];
    return `<span style="color:${color}; font-weight:bold">${name}</span>`;
  };

  const playerColorIndexMap = {};
  publicData?.players?.forEach((p, idx) => {
    playerColorIndexMap[p.id] = idx;
  });

  const getPlayerNameColored = (playerId) => {
    const player = publicData.players.find((p) => p.id === playerId);
    if (!player) return `Player ${playerId}`;
    return colorName(player.name, playerColorIndexMap[playerId]);
  };

  const getSetName = (setId, playerId) => {
    const player = publicData.players.find((p) => p.id === playerId);
    if (!player) return `Set ${setId}`;
    const set = player.sets.find((s) => s.setId === setId);
    if (
      set &&
      (set.setName === "Tommy Beresford" ||
        set.setName === "Tuppence Beresford")
    ) {
      set.setName = "The Beresfords";
    }
    return set ? set.setName : `Set ${setId}`;
  };

  const getSetImage = (setId, playerId) => {
    const player = publicData.players.find((p) => p.id === playerId);
    if (!player) return null;
    const set = player.sets.find((s) => s.setId === setId);
    return set ? SETS_MAP[set.setName] : null;
  };

  /* === Event-specific handlers (display-only text + optional imagery) === */

  const handleCardsOffTheTable = (payload) => {
    const { playerId, quantity, selectedPlayerId } = payload;
    const playerName = getPlayerNameColored(playerId);
    const targetName = getPlayerNameColored(selectedPlayerId);
    const cards = Array.from({ length: quantity }, (_, i) => ({
      id: i,
      name: "Not so Fast!",
      isSecret: false,
      revealed: false,
    }));
    setCurrentNotification({
      text:
        selectedPlayerId === playerId
          ? `${playerName} made themselves discard <br /> ${quantity} "Not so Fast!" cards`
          : `${playerName} made ${targetName} discard <br /> ${quantity} "Not so Fast!" cards`,
      cards,
      setImage: null,
    });
  };

  const handleStealSet = (payload) => {
    const { playerId, stolenPlayerId, setId } = payload;
    const playerName = getPlayerNameColored(playerId);
    const stolenFromName = getPlayerNameColored(stolenPlayerId);
    setCurrentNotification({
      text: `${playerName} stole <br /> "${getSetName(
        setId,
        stolenPlayerId
      )}" detective set <br /> from ${stolenFromName}`,
      cards: [],
      setImage: getSetImage(setId, stolenPlayerId),
    });
  };

  const handleLookIntoTheAshes = (payload) => {
    const { playerId } = payload;
    setCurrentNotification({
      text: `${getPlayerNameColored(playerId)} looked into the ashes`,
      cards: [],
      setImage: null,
    });
  };

  const handleAndThenThereWasOneMore = (payload) => {
    const { playerId, secretId, secretName, stolenPlayerId, giftedPlayerId } =
      payload;
    const p = getPlayerNameColored(playerId);
    const from = getPlayerNameColored(stolenPlayerId);
    const to = getPlayerNameColored(giftedPlayerId);
    const card = {
      id: secretId,
      name: secretName,
      revealed: true,
      isSecret: true,
    };

    if (stolenPlayerId === playerId && giftedPlayerId === playerId) {
      setCurrentNotification({
        text: `${p} took one of their revealed secrets <br /> and hid it`,
        cards: [card],
        setImage: null,
      });
    } else if (stolenPlayerId === playerId && giftedPlayerId !== playerId) {
      setCurrentNotification({
        text: `${p} took one of their own secrets <br /> and gave it to ${to}. <br /> Now the secret is hidden`,
        cards: [card],
        setImage: null,
      });
    } else if (stolenPlayerId !== playerId && giftedPlayerId === playerId) {
      setCurrentNotification({
        text: `${p} stole a secret from ${from}. <br /> Now the secret is hidden`,
        cards: [card],
        setImage: null,
      });
    } else if (giftedPlayerId === stolenPlayerId) {
      setCurrentNotification({
        text: `${p} took a secret from ${from} <br /> and gave it back to them. <br /> Now the secret is hidden`,
        cards: [card],
        setImage: null,
      });
    } else {
      setCurrentNotification({
        text: `${p} took a secret from ${from} <br /> and gave it to ${to}. <br /> Now the secret is hidden`,
        cards: [card],
        setImage: null,
      });
    }
  };

  const handleRevealSecret = (payload) => {
    const { playerId, secretId, selectedPlayerId } = payload;
    const p = getPlayerNameColored(playerId);
    const t = getPlayerNameColored(selectedPlayerId);
    const targetPlayer = publicData.players.find(
      (pl) => pl.id === selectedPlayerId
    );
    const secret = targetPlayer?.secrets?.find((s) => s.id === secretId);
    const card = {
      id: secret.id,
      name: secret.name,
      revealed: true,
      isSecret: true,
    };

    setCurrentNotification({
      text:
        selectedPlayerId === playerId
          ? `${p} revealed one of their own secrets`
          : `${p} revealed ${t}'s secret`,
      cards: [card],
      setImage: null,
    });
  };

  const handleRevealSecretForce = (payload) => {
    const { playerId, secretId, selectedPlayerId } = payload;
    const p = getPlayerNameColored(playerId);
    const t = getPlayerNameColored(selectedPlayerId);
    setCurrentNotification({
      text:
        selectedPlayerId === playerId
          ? `${p} revealed one of their own secrets`
          : `${p} told ${t} to reveal a secret`,
      cards: [{ id: secretId, name: "Secret", revealed: true, isSecret: true }],
      setImage: null,
    });
  };

  const handleSatterthwaiteWild = (payload) => {
    const { playerId, secretId, secretName, selectedPlayerId } = payload;
    const p = getPlayerNameColored(playerId);
    const t = getPlayerNameColored(selectedPlayerId);
    setCurrentNotification({
      text:
        selectedPlayerId === playerId
          ? `${p} showed one of their own secrets. <br /> The secret remains hidden`
          : `${p} stole one of ${t}'s secrets. <br /> The secret is now hidden`,
      cards: [
        { id: secretId, name: secretName, revealed: true, isSecret: true },
      ],
      setImage: null,
    });
  };

  const handleHideSecret = (payload) => {
    const { playerId, secretId, selectedPlayerId } = payload;
    const p = getPlayerNameColored(playerId);
    const t = getPlayerNameColored(selectedPlayerId);
    setCurrentNotification({
      text:
        selectedPlayerId !== playerId
          ? `${p} hid one of ${t}'s secrets`
          : `${p} hid one of their secrets`,
      cards: [{ id: secretId, revealed: false, isSecret: true }],
      setImage: null,
    });
  };

  const handleDelayTheMurderersEscape = (payload) => {
    const { playerId } = payload;
    setCurrentNotification({
      text: `${getPlayerNameColored(
        playerId
      )} took cards from the discard pile <br /> and put them on top of the deck <br /> in some order`,
      cards: [],
      setImage: null,
    });
  };

  const handleCardsPlayed = (payload) => {
    const { playerId, cards, actionType } = payload;
    const p = getPlayerNameColored(playerId);
    let actionText = "played cards";
    if (actionType === "set") actionText = "played a set of detectives";
    else if (actionType === "detective")
      actionText = "added a detective card to a set";
    else if (actionType === "event") actionText = "played an event card";

    const displayCards = cards.map((c) => ({
      ...c,
      isSecret: false,
      revealed: false,
    }));
    setCurrentNotification({
      text: `${p} ${actionText}`,
      cards: displayCards,
      setImage: null,
    });
  };

  const handleDiscardEvent = (payload) => {
    const { playerId, cards } = payload;
    const displayCards = cards.map((c) => ({
      ...c,
      isSecret: false,
      revealed: false,
    }));
    setCurrentNotification({
      text: `${getPlayerNameColored(playerId)} discarded ${cards.length} cards`,
      cards: displayCards,
      setImage: null,
    });
  };

  const handleNoEffect = () => {
    setCurrentNotification({
      text: `Nothing happened.`,
      cards: [],
      setImage: null,
    });
  };

  const handleCardTrade = (payload) => {
    const { playerId, cardName } = payload;
    const p = getPlayerNameColored(playerId);    
    const card = {
      id: 0,
      name: cardName,
      isSecret: false,
      revealed: false,
    };

    setCurrentNotification({
      text:`${p} gave you a card`,
      cards: [card],
      setImage: null,
    });
  };

  const handleCardTradePublic = (payload) => {
    const { playerId, selectedPlayerId } = payload;
    const p = getPlayerNameColored(playerId);
    const s = getPlayerNameColored(selectedPlayerId);

    setCurrentNotification({
      text: `${p} traded cards with ${s}`,
      cards: [],
      setImage: null,
    });
  };

  const handleDeadCardFolly = () => {
    setCurrentNotification({
      text: `Everyone passed a card to their side`,
      cards: [],
      setImage: null,
    });
  };

  const handlePointYourSuspicious = (payload) => {
    // Estructura preparada para implementación futura
    const { playersSelections, selectedPlayerId } = payload;
    
    // TODO: Implementar visualización compleja de las selecciones
    setCurrentNotification({
      text: `Point Your Suspicious was played`,
      cards: [],
      setImage: null,
    });
  };

  const handleBlackmailedCard = (payload) => {
    const { playerId, secretName } = payload;
    const p = getPlayerNameColored(playerId);

    const card = {
      id: 0,
      name: secretName,
      revealed: true,
      isSecret: true,
    };

    setCurrentNotification({
      text: `You now know one of <br /> ${p}'s secrets`,
      cards: [card],
      setImage: null,
    });
  };

  const handleBlackmailed = (payload) => {
    const { playerId, selectedPlayerId } = payload;
    const p = getPlayerNameColored(playerId);
    const s = getPlayerNameColored(selectedPlayerId);
    const isActualPlayerReceiver = selectedPlayerId === actualPlayerId;

    const card = {
      id: 0,
      name: "Blackmailed!",
      revealed: false,
      isSecret: false,
    };

    let text;
    if (isActualPlayerReceiver) {
      text = `You were blackmailed by ${p}!`;
    } else {
      text = `${s} was blackmailed by ${p}!`;
    }

    setCurrentNotification({
      text,
      cards: [card],
      setImage: null,
    });
  };

  const handleFauxPass = (payload) => {
    const { playerId, selectedPlayerId } = payload;
    const p = getPlayerNameColored(playerId);
    const s = getPlayerNameColored(selectedPlayerId);
    const isActualPlayerSender = playerId === actualPlayerId;

    const card = {
      id: 0,
      name: "Social Faux Pas",
      revealed: false,
      isSecret: false,
    };

    let text;
    if (isActualPlayerSender) {
      text = `You tricked ${s} <br /> into a Social Faux Pas!`;
    } else {
      text = `${s} has been tricked into <br /> a Social Faux Pas by ${p}! `;
    }

    setCurrentNotification({
      text,
      cards: [card],
      setImage: null,
    });
  };

  if (!currentNotification) return null;

  return (
    <Notification
      text={currentNotification.text}
      cards={currentNotification.cards}
      setImage={currentNotification.setImage}
      onClose={() => setCurrentNotification(null)}
    />
  );
}