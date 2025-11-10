/**
 * @file Notifier.jsx
 * @description In-app overlay notifications for game events coming from WebSocket messages.
 * Renders small, transient popups with optional card/set imagery.
 */

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  CARDS_MAP,
  SETS_MAP,
  SECRETS_MAP,
  AVATAR_MAP,
} from "../../../../utils/generalMaps";
import "./Notifier.css";

/** Presentation-only card notification; auto-hides after a delay */
function Notification({ text, cards = [], setImage = null, onClose, shouldAutoClose = true }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!shouldAutoClose) return;
    
    const t = setTimeout(() => {
      handleClose();
    }, 5000);
    return () => clearTimeout(t);
  }, [shouldAutoClose]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 150);
    }, 150);
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

  const getCardBackImage = () => {
    return "/Cards/05-secret_front.png";
  };

  if (!isVisible) return null;

  return createPortal(
    <div
      className={`notifier-overlay ${isClosing ? "closing" : ""}`}
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
                {card.shouldFlip ? (
                  <div className={`card-flip-container ${card.flipDirection === "reveal" ? "flip-to-front" : "flip-to-back"}`}>
                    <div className="card-flip-inner">
                      <div className="card-flip-front">
                        <img src={getCardImage(card)} alt={card.name} />
                      </div>
                      <div className="card-flip-back">
                        <img src={getCardBackImage()} alt="Secret back" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img src={getCardImage(card)} alt={card.name} />
                )}
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

function PointYourSuspiciousOverlay({
  players,
  actualPlayerId,
  playersSelections,
  selectedPlayerId,
  onClose,
  getPlayerNameColored, 
}) {
  // Ordenar jugadores para que el actual quede abajo
  const total = players.length;
  const actualIndex = Math.max(0, players.findIndex((p) => p.id === actualPlayerId));
  const orderedPlayers =
    total > 0
      ? [...players.slice(actualIndex), ...players.slice(0, actualIndex)]
      : players;

  const selectionsMap = Object.fromEntries(playersSelections || []);
  const radiusPercent = 43.5;

  // Posiciones circulares
  const positions = orderedPlayers.map((player, i) => {
    const angle = Math.PI / 2 - (Math.PI * 2 * i) / total;
    const x = 50 + radiusPercent * Math.cos(angle);
    const y = 50 + radiusPercent * Math.sin(angle);
    return { id: player.id, player, angle, x, y };
  });

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);

  const headline = `${getPlayerNameColored(selectedPlayer?.id ?? "Unknown")} was pointed as a suspicious!`;

  return createPortal(
    <div className="notifier-overlay special-pointyour" onClick={onClose}>
      <div className="notifier-content" onClick={(e) => e.stopPropagation()}>
        <div
          className="notifier-text"
          style={{ marginBottom: "1vw" }}
          dangerouslySetInnerHTML={{ __html: headline }}
        />

        <div
          className="pointyour-container"
          role="img"
          aria-label="Point your suspicious"
          onClick={(e) => e.stopPropagation()} // 🔹 evita cierre accidental
        >
          {/* Flechas (más cortas) */}
          <svg
            className="pointyour-svg"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="6"
                markerHeight="6"
                refX="3"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0.95 L5,3 L0,5 z" fill="rgba(244,225,163,1)" />
              </marker>
            </defs>

            {positions.map((pos) => {
              const targetId = selectionsMap[pos.id];
              if (!targetId) return null;
              const targetPos = positions.find((p) => p.id === targetId);
              if (!targetPos) return null;

              const vx = targetPos.x - pos.x;
              const vy = targetPos.y - pos.y;
              const dist = Math.sqrt(vx * vx + vy * vy) || 1;
              const ux = vx / dist;
              const uy = vy / dist;

              const len = 22; // 🔹 más corto que antes
              const x1 = pos.x + ux * 4;
              const y1 = pos.y + uy * 4;
              const x2 = pos.x + ux * len;
              const y2 = pos.y + uy * len;

              return (
                <line
                  key={`line-${pos.id}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(244,225,163,1)"
                  strokeWidth={1.2}
                  strokeLinecap="round"
                  markerEnd="url(#arrowhead)"
                />
              );
            })}
          </svg>

          {/* Avatares y nombres coloreados */}
          {positions.map((pos) => {
            const isSelected = pos.id === selectedPlayerId;
            const coloredName = getPlayerNameColored(pos.id);
            return (
              <div
                key={pos.id}
                className={`player-avatar-wrapper ${isSelected ? "selected" : ""}`}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
                title={pos.player.name}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="player-label"
                  aria-hidden
                  dangerouslySetInnerHTML={{ __html: coloredName }}
                />
                <img
                  className="player-avatar"
                  src={AVATAR_MAP[pos.player.avatar]}
                  alt={pos.player.name}
                />
              </div>
            );
          })}
        </div>

        <div className="notifier-hint" style={{ marginTop: "1vw" }}>
          Click anywhere to close
        </div>
      </div>
    </div>,
    document.body
  );
}


/** Orchestrator: listens WS events and opens one notification at a time (display-only) */
export default function Notifier({ publicData, actualPlayerId, wsRef }) {
  const [currentNotification, setCurrentNotification] = useState(null);
  const [pendingNotification, setPendingNotification] = useState(null);
  const isReplacingRef = useRef(false);

  // Manejar cola de notificaciones
  useEffect(() => {
    if (pendingNotification && !currentNotification) {
      setCurrentNotification(pendingNotification);
      setPendingNotification(null);
      isReplacingRef.current = false;
    }
  }, [currentNotification, pendingNotification]);

  const showNotification = (notification) => {
    if (currentNotification && !isReplacingRef.current) {
      // Hay una notificación activa, esperar 1s antes de reemplazarla
      isReplacingRef.current = true;
      setPendingNotification(notification);
      setTimeout(() => {
        setCurrentNotification(null);
      }, 1000);
    } else {
      setCurrentNotification(notification);
      isReplacingRef.current = false;
    }
  };

  const closeNotification = () => {
    setCurrentNotification(null);
    setPendingNotification(null);
    isReplacingRef.current = false;
  };

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
          case "notifierCardsPlayed":
            handleCardsPlayed(payload);
            break;
          case "notifierDiscardEvent":
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
    showNotification({
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
    showNotification({
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
    showNotification({
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
      shouldFlip: true,
      flipDirection: "hide",
    };

    if (stolenPlayerId === playerId && giftedPlayerId === playerId) {
      showNotification({
        text: `${p} took one of their revealed secrets <br /> and hid it`,
        cards: [card],
        setImage: null,
      });
    } else if (stolenPlayerId === playerId && giftedPlayerId !== playerId) {
      showNotification({
        text: `${p} took one of their own secrets <br /> and gave it to ${to}. <br /> Now the secret is hidden`,
        cards: [card],
        setImage: null,
      });
    } else if (stolenPlayerId !== playerId && giftedPlayerId === playerId) {
      showNotification({
        text: `${p} stole a secret from ${from}. <br /> Now the secret is hidden`,
        cards: [card],
        setImage: null,
      });
    } else if (giftedPlayerId === stolenPlayerId) {
      showNotification({
        text: `${p} took a secret from ${from} <br /> and gave it back to them. <br /> Now the secret is hidden`,
        cards: [card],
        setImage: null,
      });
    } else {
      showNotification({
        text: `${p} took a secret from ${from} <br /> and gave it to ${to}. <br /> Now the secret is hidden`,
        cards: [card],
        setImage: null,
      });
    }
  };

  const handleRevealSecret = (payload) => {
    const { playerId, secretId, selectedPlayerId, secretName } = payload;
    const p = getPlayerNameColored(playerId);
    const t = getPlayerNameColored(selectedPlayerId);
    const targetPlayer = publicData.players.find(
      (pl) => pl.id === selectedPlayerId
    );
    const secret = targetPlayer?.secrets?.find((s) => s.id === secretId);
    const card = {
      id: secret.id,
      name: secretName? secretName : secret.name,
      revealed: true,
      isSecret: true,
      shouldFlip: secretName? true : false,
      flipDirection: "reveal",
    };

    showNotification({
      text:
        selectedPlayerId === playerId
          ? `${p} revealed one of their own secrets`
          : `${p} revealed ${t}'s secret`,
      cards: [card],
      setImage: null,
    });
  };

  const handleRevealSecretForce = (payload) => {
    const { playerId, secretId, selectedPlayerId, secretName } = payload;
    const p = getPlayerNameColored(playerId);
    const t = getPlayerNameColored(selectedPlayerId);
    const targetPlayer = publicData.players.find(
      (pl) => pl.id === selectedPlayerId
    );
    const secret = targetPlayer?.secrets?.find((s) => s.id === secretId);
    const card = {
      id: secret.id,
      name: secretName? secretName : secret.name,
      revealed: true,
      isSecret: true,
      shouldFlip: secretName? true : false,
      flipDirection: "reveal",
    };

    showNotification({
      text:
        selectedPlayerId === playerId
          ? `${p} revealed one of their own secrets`
          : `${p} made ${t} reveal a secret`,
      cards: [card],
      setImage: null,
    });
  };

  const handleSatterthwaiteWild = (payload) => {
    const { playerId, secretId, secretName, selectedPlayerId } = payload;
    const p = getPlayerNameColored(playerId);
    const t = getPlayerNameColored(selectedPlayerId);
    const card = {
      id: secretId,
      name: secretName,
      revealed: true,
      isSecret: true,
      shouldFlip: true,
      flipDirection: "hide",
    };

    showNotification({
      text:
        selectedPlayerId === playerId
          ? `${p} showed one of their own secrets. <br /> The secret remains hidden`
          : `${p} stole one of ${t}'s secrets. <br /> The secret is now hidden`,
      cards: [card],
      setImage: null,
    });
  };

  const handleHideSecret = (payload) => {
    const { playerId, secretId, selectedPlayerId, secretName } = payload;
    const p = getPlayerNameColored(playerId);
    const t = getPlayerNameColored(selectedPlayerId);
    
    const targetPlayer = publicData.players.find(
      (pl) => pl.id === selectedPlayerId
    );
    const secret = targetPlayer?.secrets?.find((s) => s.id === secretId);
    
    const card = {
      id: secretId,
      name: secretName? secretName : (secret?.name || "Secret"),
      revealed: secretName? true : false,
      isSecret: true,
      shouldFlip: secretName? true : false,
      flipDirection: "hide",
    };

    showNotification({
      text:
        selectedPlayerId !== playerId
          ? `${p} hid one of ${t}'s secrets`
          : `${p} hid one of their secrets`,
      cards: [card],
      setImage: null,
    });
  };

  const handleDelayTheMurderersEscape = (payload) => {
    const { playerId } = payload;
    showNotification({
      text: `${getPlayerNameColored(
        playerId
      )} took cards from the discard pile <br /> and put them on top of the deck <br /> in some order`,
      cards: [],
      setImage: null,
    });
  };

  const handleCardsPlayed = (payload) => {
    const { playerId, cards, actionType, setOwnerId } = payload;
    const p = getPlayerNameColored(playerId);
    let s = "";
    let isActualPlayerSet = false;
    setOwnerId ? (isActualPlayerSet = playerId == setOwnerId,
                 s =  getPlayerNameColored(setOwnerId))
                 : isActualPlayerSet = false;

    let actionText = "played cards";
    if (actionType === "set") actionText = "played a set of detectives";
    else if (actionType === "detective")
      actionText = isActualPlayerSet ? `added a detective <br /> to a set of his own` : 
                                       `added a detective <br /> to a set owned by ${s}`;
    else if (actionType === "event") 
      actionText = "played an event card";
    else if (actionType == "instant") {
      actionText = "played a Not so Fast!";
    }

    const displayCards = cards.map((c) => ({
      ...c,
      isSecret: false,
      revealed: false,
    }));

    showNotification({
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
    showNotification({
      text: `${getPlayerNameColored(playerId)} discarded ${cards.length} cards`,
      cards: displayCards,
      setImage: null,
    });
  };

  const handleNoEffect = () => {
    showNotification({
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

    showNotification({
      text:`${p} gave you a card`,
      cards: [card],
      setImage: null,
    });
  };

  const handleCardTradePublic = (payload) => {
    const { playerId, selectedPlayerId } = payload;
    const p = getPlayerNameColored(playerId);
    const s = getPlayerNameColored(selectedPlayerId);

    showNotification({
      text: `${p} traded cards with ${s}`,
      cards: [],
      setImage: null,
    });
  };

  const handleDeadCardFolly = () => {
    showNotification({
      text: `Everyone passed a card to their side`,
      cards: [],
      setImage: null,
    });
  };

  const handlePointYourSuspicious = (payload) => {
    const { playersSelections, selectedPlayerId } = payload;
    const players = publicData.players;
  
    showNotification({
      text: "Point Your Suspicious",
      cards: [],
      setImage: null,
      customType: "pointYourSuspicious",
      players,
      playersSelections,
      selectedPlayerId,
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
      shouldFlip: true,
      flipDirection: "reveal",
    };

    showNotification({
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

    showNotification({
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

    showNotification({
      text,
      cards: [card],
      setImage: null,
    });
  };

  if (!currentNotification) return null;

  if (currentNotification.customType === "pointYourSuspicious") {
    return (
      <PointYourSuspiciousOverlay
        players={currentNotification.players}
        actualPlayerId={actualPlayerId}
        playersSelections={currentNotification.playersSelections}
        selectedPlayerId={currentNotification.selectedPlayerId}
        onClose={closeNotification}
        getPlayerNameColored={getPlayerNameColored}
      />
    );
  }
  
  return (
    <Notification
      text={currentNotification.text}
      cards={currentNotification.cards}
      setImage={currentNotification.setImage}
      onClose={closeNotification}
      shouldAutoClose={!pendingNotification}
    />
  );
  
}