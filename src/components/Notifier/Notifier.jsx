import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CARDS_MAP, SETS_MAP, SECRETS_MAP } from "../generalMaps.js";
import "./Notifier.css";

// Simple notification component for individual events
function Notification({ text, cards = [], setImage = null, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade-out animation
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for fade-out animation
  };

  // Helper function to get card image with secret handling
  const getCardImage = (card) => {
    // Handle secret cards based on revealed status
    if (card.isSecret) {
      if (card.revealed && card.name) {
        // Revealed secret with a name - use SECRETS_MAP
        return SECRETS_MAP[card.name] || "/Cards/05-secret_front.png";
      } else {
        // Unrevealed secret OR revealed but no name - use front image
        return "/Cards/05-secret_front.png";
      }
    }

    // Regular cards - use CARDS_MAP
    return CARDS_MAP[card.name] || "/Cards/05-secret_front.png"; // Fallback
  };

  if (!isVisible) {
    return null;
  }

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

        {/* Display set image if provided */}
        {setImage && (
          <div className="notifier-set">
            <img src={setImage} alt="Set" />
          </div>
        )}

        {/* Display cards if provided */}
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
          Click outside to close • (Auto-closes in 3s)
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Notifier({ publicData, actualPlayerId, wsRef }) {
  const [currentNotification, setCurrentNotification] = useState(null);

  useEffect(() => {
    if (!wsRef?.current) return;

    const handleWebSocketMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { event: eventType, payload } = data;

        console.log("Notifier received:", eventType, payload);

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
          default:
            console.warn("Unknown event type:", eventType);
        }
      } catch (error) {
        console.error("Error processing websocket message:", error);
      }
    };

    const ws = wsRef.current;
    ws.addEventListener("message", handleWebSocketMessage);

    return () => {
      ws.removeEventListener("message", handleWebSocketMessage);
    };
  }, [wsRef, publicData]);

  const PLAYER_COLORS = [
    "#e6194B",
    "#3cb44b",
    "#ffe119",
    "#4363d8",
    "#f58231",
    "#911eb4",
  ];

  // Helper to wrap a player name in a colored span
  const colorName = (name, index) => {
    const color = PLAYER_COLORS[index % PLAYER_COLORS.length];
    return `<span style="color:${color}; font-weight:bold">${name}</span>`;
  };

  const playerColorIndexMap = {};
  publicData?.players?.forEach((p, idx) => {
    playerColorIndexMap[p.id] = idx;
  });

  // Helper function to get player name by ID
  const getPlayerNameColored = (playerId) => {
    const player = publicData.players.find((p) => p.id === playerId);
    if (!player) return `Player ${playerId}`;
    return colorName(player.name, playerColorIndexMap[playerId]);
  };

  // Helper function to get set name by ID
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

  // Helper function to get set image by ID
  const getSetImage = (setId, playerId) => {
    const player = publicData.players.find((p) => p.id === playerId);
    if (!player) return null;

    const set = player.sets.find((s) => s.setId === setId);
    return set ? SETS_MAP[set.setName] : null;
  };

  // Helper function to create secret card object
  const createSecretCard = (secret) => {
    if (!secret) return null;

    return {
      id: secret.id,
      name: secret.name || "Unknown Secret", // Provide fallback name
      isSecret: true,
      revealed: secret.revealed || false,
    };
  };

  // Event handlers
  const handleCardsOffTheTable = (payload) => {
    const { playerId, quantity, selectedPlayerId } = payload;
    const playerName = getPlayerNameColored(playerId);
    const targetName = getPlayerNameColored(selectedPlayerId);

    // Create an array with 'quantity' number of "Not so Fast!" cards
    const notSoFastCards = Array.from({ length: quantity }, (_, index) => ({
      id: index,
      name: "Not so Fast!",
      isSecret: false,
      revealed: false,
    }));

    if (selectedPlayerId === playerId) {
      setCurrentNotification({
        text: `${playerName} made themselves discard <br /> ${quantity} "Not so Fast!" cards`,
        cards: notSoFastCards,
        setImage: null,
      });
    } else {
      setCurrentNotification({
        text: `${playerName} made ${targetName} discard <br /> ${quantity} "Not so Fast!" cards`,
        cards: notSoFastCards,
        setImage: null,
      });
    }
  };

  const handleStealSet = (payload) => {
    const { playerId, stolenPlayerId, setId } = payload;
    const playerName = getPlayerNameColored(playerId);
    const stolenFromName = getPlayerNameColored(stolenPlayerId);
    const setName = getSetName(setId, stolenPlayerId);
    const setImage = getSetImage(setId, stolenPlayerId);

    setCurrentNotification({
      text: `${playerName} stole <br /> "${setName}" detective set <br /> from ${stolenFromName}`,
      cards: [],
      setImage: setImage,
    });
  };

  const handleLookIntoTheAshes = (payload) => {
    const { playerId } = payload;
    const playerName = getPlayerNameColored(playerId);

    setCurrentNotification({
      text: `${playerName} looked into the ashes`,
      cards: [],
      setImage: null,
    });
  };

  const handleAndThenThereWasOneMore = (payload) => {
    const { playerId, secretId, secretName, stolenPlayerId, giftedPlayerId } =
      payload;
    const playerName = getPlayerNameColored(playerId);
    const stolenFromName = getPlayerNameColored(stolenPlayerId);
    const giftedToName = getPlayerNameColored(giftedPlayerId);

    // All possible combinations:
    if (stolenPlayerId === playerId && giftedPlayerId === playerId) {
      // Player takes their own secret and gives it to themselves
      setCurrentNotification({
        text: `${playerName} took one of their revealed secrets <br /> and hid it`,
        cards: [
          { id: secretId, name: secretName, revealed: true, isSecret: true },
        ],
        setImage: null,
      });
    } else if (stolenPlayerId === playerId && giftedPlayerId !== playerId) {
      // Player takes their own secret and gives it to someone else
      setCurrentNotification({
        text: `${playerName} took one of their own secrets <br /> and gave it to ${giftedToName}. <br /> Now the secret is hidden`,
        cards: [
          { id: secretId, name: secretName, revealed: true, isSecret: true },
        ],
        setImage: null,
      });
    } else if (stolenPlayerId !== playerId && giftedPlayerId === playerId) {
      // Player takes from someone else and gives it to themselves
      setCurrentNotification({
        text: `${playerName} stole a secret from ${stolenFromName}. <br /> Now the secret is hidden`,
        cards: [
          { id: secretId, name: secretName, revealed: true, isSecret: true },
        ],
        setImage: null,
      });
    } else if (
      stolenPlayerId !== playerId &&
      giftedPlayerId !== playerId &&
      giftedPlayerId === stolenPlayerId
    ) {
      // Player takes from someone and gives it back to the same person
      setCurrentNotification({
        text: `${playerName} took a secret from ${stolenFromName} <br /> and gave it back to them. <br /> Now the secret is hidden`,
        cards: [
          { id: secretId, name: secretName, revealed: true, isSecret: true },
        ],
        setImage: null,
      });
    } else {
      // Player takes from someone and gives it to a third person
      setCurrentNotification({
        text: `${playerName} took a secret from ${stolenFromName} <br /> and gave it to ${giftedToName}. <br /> Now the secret is hidden`,
        cards: [
          { id: secretId, name: secretName, revealed: true, isSecret: true },
        ],
        setImage: null,
      });
    }
  };

  const handleRevealSecret = (payload) => {
    const { playerId, secretId, selectedPlayerId } = payload;
    const playerName = getPlayerNameColored(playerId);
    const targetName = getPlayerNameColored(selectedPlayerId);

    // Find the secret card
    const targetPlayer = publicData.players.find(
      (p) => p.id === selectedPlayerId
    );
    const secret = targetPlayer?.secrets?.find((s) => s.id === secretId);

    // For reveal events, create a revealed secret card
    const displayCard = secret
      ? {
          id: secret.id,
          name: secret.name,
          isSecret: true,
          revealed: secret.revealed,
        }
      : null;

    if (selectedPlayerId === playerId) {
      setCurrentNotification({
        text: `${playerName} revealed one of their own secrets`,
        cards: displayCard ? [displayCard] : [],
        setImage: null,
      });
    } else {
      setCurrentNotification({
        text: `${playerName} revealed ${targetName}'s secret`,
        cards: displayCard ? [displayCard] : [],
        setImage: null,
      });
    }
  };

  const handleRevealSecretForce = (payload) => {
    const { playerId, secretId, selectedPlayerId } = payload;
    const playerName = getPlayerNameColored(playerId);
    const targetName = getPlayerNameColored(selectedPlayerId);

    // Find the secret card
    const targetPlayer = publicData.players.find(
      (p) => p.id === selectedPlayerId
    );
    const secret = targetPlayer?.secrets?.find((s) => s.id === secretId);

    // For force reveal events, create a revealed secret card
    const displayCard = secret
      ? {
          id: secret.id,
          name: secret.name,
          isSecret: true,
          revealed: true,
        }
      : null;

    if (selectedPlayerId === playerId) {
      setCurrentNotification({
        text: `${playerName} revealed one of their own secrets`,
        cards: displayCard ? [displayCard] : [],
        setImage: null,
      });
    } else {
      setCurrentNotification({
        text: `${playerName} told ${targetName} to reveal a secret`,
        cards: displayCard ? [displayCard] : [],
        setImage: null,
      });
    }
  };

  const handleSatterthwaiteWild = (payload) => {
    const { playerId, secretId, secretName, selectedPlayerId } = payload;
    const playerName = getPlayerNameColored(playerId);
    const targetName = getPlayerNameColored(selectedPlayerId);

    // Find the secret card
    const targetPlayer = publicData.players.find(
      (p) => p.id === selectedPlayerId
    );
    const secret = targetPlayer?.secrets?.find((s) => s.id === secretId);

    const displayCard = createSecretCard(secret);

    if (selectedPlayerId === playerId) {
      setCurrentNotification({
        text: `${playerName} showed one of their own secrets. <br /> The secret remains hidden`,
        cards: [
          { id: secretId, name: secretName, revealed: true, isSecret: true },
        ],
        setImage: null,
      });
    } else {
      setCurrentNotification({
        text: `${playerName} stole one of ${targetName}'s secrets. <br /> The secret is now hidden`,
        cards: [
          { id: secretId, name: secretName, revealed: true, isSecret: true },
        ],
        setImage: null,
      });
    }
  };

  const handleHideSecret = (payload) => {
    const { playerId, secretId, selectedPlayerId } = payload;
    const playerName = getPlayerNameColored(playerId);
    const targetName = getPlayerNameColored(selectedPlayerId);

    if (selectedPlayerId != playerId) {
      setCurrentNotification({
        text: `${playerName} hid one of ${targetName}'s secrets`,
        cards: [{ id: secretId, revealed: false, isSecret: true }],
        setImage: null,
      });
    } else {
      setCurrentNotification({
        text: `${playerName} hid one of their secrets`,
        cards: [{ id: secretId, revealed: false, isSecret: true }],
        setImage: null,
      });
    }
  };

  const handleDelayTheMurderersEscape = (payload) => {
    const { playerId } = payload;
    const playerName = getPlayerNameColored(playerId);

    setCurrentNotification({
      text: `${playerName} took cards from the discard pile <br /> and put them on top of the deck <br /> in some order`,
      cards: [],
      setImage: null,
    });
  };

  const handleCardsPlayed = (payload) => {
    const { playerId, cards, actionType } = payload;
    const playerName = getPlayerNameColored(playerId);

    let actionText = "";
    switch (actionType) {
      case "set":
        actionText = "played a set of detectives";
        break;
      case "detective":
        actionText = "added a detective card to a set";
        break;
      case "event":
        actionText = "played an event card";
        break;
      default:
        actionText = "played cards";
    }

    // Add isSecret and revealed properties to regular cards
    const displayCards = cards.map((card) => ({
      ...card,
      isSecret: false,
      revealed: false,
    }));

    setCurrentNotification({
      text: `${playerName} ${actionText}`,
      cards: displayCards,
      setImage: null,
    });
  };

  const handleDiscardEvent = (payload) => {
    const { playerId, cards } = payload;
    const playerName = getPlayerNameColored(playerId);

    // Add isSecret and revealed properties to regular cards
    const displayCards = cards.map((card) => ({
      ...card,
      isSecret: false,
      revealed: false,
    }));

    setCurrentNotification({
      text: `${playerName} discarded ${cards.length} cards`,
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

  const closeNotification = () => {
    setCurrentNotification(null);
  };

  // If no notification, render nothing
  if (!currentNotification) {
    return null;
  }

  return (
    <Notification
      text={currentNotification.text}
      cards={currentNotification.cards}
      setImage={currentNotification.setImage}
      onClose={closeNotification}
    />
  );
}
