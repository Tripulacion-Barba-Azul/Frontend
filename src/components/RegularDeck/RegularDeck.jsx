import "./RegularDeck.css";
import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";

const fullDeck = "/Icons/deckicon-full.png";
const halfDeck = "/Icons/deckicon-half.png";
const thinDeck = "/Icons/deckicon-thin.png";
const murdererEscapes = "/Cards/02-murder_escapes.png";

export default function RegularDeck({
  number,
  turnStatus = "waiting",
}) {
  const validatedNumber = Math.max(0, Math.min(61, Number(number)));

  const [searchParams] = useSearchParams();
  const { gameId } = useParams();
  const playerId = searchParams.get("playerId");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canDraw =
    turnStatus === "drawing" && !loading && validatedNumber > 0;

  // pick deck image
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

  // trigger shake animation when card count changes
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
        `https://dotc-production.up.railway.app/play/${gameId}/actions/draw-card`,
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
      key={shakeKey} // triggers re-animation when deck size changes
      className={`RegularDeck-container ${deckClass} ${
        canDraw ? "deck--enabled" : "deck--disabled"
      }`}
      data-testid="deck-container"
      animate={{
        rotate: [0, -1.5, 1.5, -0.5, 0.5, 0],
      }}
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
          cursor: turnStatus=="drawing" ? "pointer" : "not-allowed",
          filter: turnStatus=="drawing" ? "drop-shadow(0 0 15px #f6e4aae1)" : "none",
        }}
        draggable={false}
      />
      <div className="RegularDeck-count">{validatedNumber}</div>
      {error && <div className="RegularDeck-error">{error}</div>}
    </motion.div>
  );
}
