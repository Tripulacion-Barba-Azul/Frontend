import React, { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import "./DrawRegularCardButton.css";

export default function DrawRegularCardButton({
  isDrawCardPhase = false,
  playerCardCount = 0,
  onCardDrawn,
}) {
  const [searchParams] = useSearchParams();
  const { gameId } = useParams();
  const playerId = searchParams.get("playerId");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // disabled by default; enabled only when in draw phase and player has < 6 cards
  const canDraw = isDrawCardPhase && playerCardCount < 6 && !loading;

  const handleDraw = async () => {
    setError("");
    if (!canDraw) return;
    setLoading(true);
    try {
      const response = await fetch(`/games/${gameId}/actions/draw-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actualPlayerID: Number(playerId) }),
      });

      if (!response.ok) {
        throw new Error(`Draw failed with status ${response.status}`);
      }

      const data = await response.json();

      // only keep a console.log of the received card
      console.log("Carta recibida:", data.card);

      if (onCardDrawn) onCardDrawn(data);
    } catch (err) {
      console.error(err);
      setError("Failed to draw");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        className="owncards-action"
        onClick={handleDraw}
        disabled={!canDraw}
        data-testid="draw-card-button"
      >
        {loading ? "Tomando..." : `Tomar Carta`}
      </button>
      {error && <div style={{ color: "#f4e1a3", fontSize: "12px" }}>{error}</div>}
    </div>
  );
}
