import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useSearchParams } from "react-router-dom";
import "./DrawDraftCardButton.css";
import { CARDS_MAP } from "../generalMaps.js";

export default function DrawDraftCardButton({ 
  cards = [], 
  turnStatus = "waiting" 
}) {
  const [searchParams] = useSearchParams();
  const { gameId } = useParams();
  const playerId = searchParams.get("playerId");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canDraw = turnStatus === "drawing" && !loading;

  const handleCardClick = async (cardId) => {
    setError("");
    if (!canDraw) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/play/${gameId}/actions/draw-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: Number(playerId) }),
      });

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

  // No renderizar nada si no hay cartas
  if (!cards || cards.length === 0) {
    console.log(`Empty draftCard: ${cards}`);
    return null;
  }

  return (
    <div className="draw-draft-card-container">
    <div className="draft-cards-row">
      {cards.map((card, index) => (
        <AnimatePresence key={index} mode="wait">
          <motion.div
            key={card.id}
            layout
            initial={{ opacity: 0, y: -60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.9 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 28,
            }}
          >
            <img
              src={CARDS_MAP[card.name] || ""}
              alt={`Draft Card ${card.name}`}
              className={`draft-card ${
                turnStatus === "drawing" && !loading
                  ? "draft-card--enabled"
                  : "draft-card--disabled"
              }`}
              onClick={() => handleCardClick(card.id)}
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>
      ))}
    </div>
      {error && <div className="draft-card-error">{error}</div>}
    </div>
  );
}