// RegularDeck.jsx

/**
 * @file RegularDeck.jsx
 * @description Regular deck widget: shows remaining count + deck sprite, handles draw from main deck.
 *
 * === Canonical shapes (from API DOCUMENT) ===
 * @typedef {"waiting"|"playing"|"discarding"|"discardingOpt"|"drawing"} TurnStatus
 *
 * === Props ===
 * @typedef {Object} RegularDeckProps
 * @property {number} number - Remaining cards (0..61). Clamped internally.
 * @property {TurnStatus} [turnStatus="waiting"] - Enables draw when "drawing".
 *
 * Notes:
 * - When `number` is 0, shows the "Murderer Escapes!" card art.
 * - On click (if enabled), POSTs to `/play/:gameId/actions/draw-card` with { playerId, deck:"regular" }.
 */

import "./RegularDeck.css";
import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";

const fullDeck = "/Icons/deckicon-full.png";
const halfDeck = "/Icons/deckicon-half.png";
const thinDeck = "/Icons/deckicon-thin.png";
const murdererEscapes = "/Cards/02-murder_escapes.png";

/** @param {RegularDeckProps} props */
export default function RegularDeck({ number, turnStatus = "waiting" }) {
  // Clamp count for visuals
  const validatedNumber = Math.max(0, Math.min(61, Number(number)));

  const [searchParams] = useSearchParams();
  const { gameId } = useParams();
  const playerId = searchParams.get("playerId");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canDraw = turnStatus === "drawing" && !loading && validatedNumber > 0;

  // Pick deck sprite based on thresholds
  let deckImage, deckClass;
  if (validatedNumber >= 31) {
    deckImage = fullDeck;
    deckClass = "full";
  } else if (validatedNumber >= 11) {
    deckImage = halfDeck;
    deckClass = "half";
  } else if (validatedNumber >= 1) {
    deckImage = thinDeck;
    deckClass = "thin";
  } else {
    deckImage = murdererEscapes;
    deckClass = "murderer";
  }

  // Re-animate shake when `number` changes
  const [shakeKey, setShakeKey] = useState(0);
  useEffect(() => {
    setShakeKey((prev) => prev + 1);
  }, [number]);

  const handleDraw = async () => {
    setError("");
    if (!canDraw) return;
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/play/${gameId}/actions/draw-card`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: Number(playerId),
            deck: "regular",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Draw failed with status ${response.status}`);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to draw");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      key={shakeKey}
      className={`RegularDeck-container ${deckClass} ${
        canDraw ? "deck--enabled" : "deck--disabled"
      }`}
      data-testid="deck-container"
      animate={{ rotate: [0, -1.5, 1.5, -0.5, 0.5, 0] }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      <motion.img
        src={deckImage}
        alt={`Deck (${validatedNumber} cards left)`}
        className="RegularDeck-image"
        onClick={handleDraw}
        whileHover={canDraw ? { scale: 1.05, y: -4 } : {}}
        whileTap={canDraw ? { scale: 0.95 } : {}}
        style={{
          cursor: turnStatus == "drawing" ? "pointer" : "not-allowed",
          filter:
            turnStatus == "drawing"
              ? "drop-shadow(0 0 15px #f6e4aae1)"
              : "none",
        }}
        draggable={false}
      />
      <div className="RegularDeck-count">{validatedNumber}</div>
      {error && <div className="RegularDeck-error">{error}</div>}
    </motion.div>
  );
}
