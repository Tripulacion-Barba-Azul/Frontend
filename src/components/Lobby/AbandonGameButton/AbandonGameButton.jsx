// AbandonGameButton.jsx

/**
 * @description Button that lets a non-owner player leave the current game.
 *
 * @typedef {Object} AbandonGameButtonProps
 * @property {boolean} isOwner - When true, the button is hidden (owners cannot leave this way).
 * @property {string} playerId - Current player's id; sent to the server to exit.
 * @property {string} gameId - Current game id.
 *
 * @param {AbandonGameButtonProps} props
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AbandonGameButton.css";

export default function AbandonGameButton({ isOwner, playerId, gameId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // POST exit; then redirect to Title Screen. Guarded against double clicks.
  const handleAbandonGame = async () => {
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:8000/games/${gameId}/exit?player_id=${playerId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok)
        throw new Error(`Failed to leave game: ${response.status}`);

      navigate("/");
    } catch (err) {
      console.error("Error leaving game:", err);
      setError("Failed to leave the game. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Hide the button for owners.
  if (isOwner) return null;

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
