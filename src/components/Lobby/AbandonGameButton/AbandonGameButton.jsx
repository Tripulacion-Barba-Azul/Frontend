import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AbandonGameButton.css";

export default function AbandonGameButton({ isOwner, playerId, gameId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleAbandonGame = async () => {
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`http://localhost:8000/games/${gameId}/exit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: parseInt(playerId),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to leave game: ${response.status}`);
      }

      
      // Redirect to Title Screen
      navigate("/");
      
    } catch (err) {
      console.error("Error leaving game:", err);
      setError("Failed to leave the game. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Solo mostrar el botón si NO es el owner
  if (isOwner) {
    return null;
  }

  return (
    <div className="abandon-game-container">
      {error && <div className="abandon-game-error">{error}</div>}
      <button
        className="abandon-game-button"
        onClick={handleAbandonGame}
        disabled={loading}
      >
        {loading ? "Leaving..." : "Leave Game"}
      </button>
    </div>
  );
}
