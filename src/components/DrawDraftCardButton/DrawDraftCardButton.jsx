import React, { useState } from "react";
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
        {cards.map((card) => {
          const imgSrc = CARDS_MAP[card.name];
          if (!imgSrc) {
            console.warn(`⚠️ Missing entry in CARDS_MAP for name: "${card.name}"`);
          }

          return (
            <img
              key={card.id}
              src={imgSrc || ""}
              alt={`Draft Card ${card.name}`}
              className={`draft-card ${canDraw ? "draft-card--enabled" : "draft-card--disabled"}`}
              onClick={() => handleCardClick(card.id)}
              draggable={false}
            />
          );
        })}
      </div>
      {error && <div className="draft-card-error">{error}</div>}
    </div>
  );
}