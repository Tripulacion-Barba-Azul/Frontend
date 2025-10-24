// PlayCardsButton.jsx

import React, { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

/**
 * @file PlayCardsButton.jsx
 * @description Plays the selected set of cards (0..6).
 *
 * === Canonical shapes (API DOCUMENT) ===
 * @typedef {{ id:number, name:string, type:string }} HandCard
 *
 * === Endpoint (API DOCUMENT) ===
 * POST /play/{id}/actions/play-card
 * @typedef {{ playerId:number, cards:number[] }} PlayCardsRequestBody
 *
 * === Props ===
 * @typedef {Object} PlayCardsButtonProps
 * @property {(string|number)[]} [selectedCards=[]] - Selected card IDs to play (≤ 6).
 * @property {() => void} onPlaySuccess - Callback after request resolves (success or handled error).
 */

/** @param {PlayCardsButtonProps} props */
export default function PlayCardsButton({ selectedCards = [], onPlaySuccess }) {
  const [searchParams] = useSearchParams();
  const { gameId } = useParams();
  const playerId = Number(searchParams.get("playerId"));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /** Validates selection length, then POSTs the play action. */
  const handlePlayCards = async () => {
    setError("");

    if (loading) return;

    if (selectedCards.length > 6) {
      setError("Something went wrong with your selection");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:8000/play/${gameId}/actions/play-card`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          /** @type {PlayCardsRequestBody} */
          body: JSON.stringify({
            playerId: playerId,
            cards: selectedCards.map((id) => id),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Play failed with status ${response.status}`);
      }

      if (onPlaySuccess) onPlaySuccess();
    } catch (err) {
      console.error(err);
      setError("Failed to play cards");
      if (onPlaySuccess) onPlaySuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        className="owncards-action"
        onClick={handlePlayCards}
        disabled={loading}
      >
        {loading ? "Playing..." : `Play (${selectedCards.length})`}
      </button>
      {error && (
        <div style={{ color: "#f4e1a3", fontSize: "12px" }}>{error}</div>
      )}
    </div>
  );
}
