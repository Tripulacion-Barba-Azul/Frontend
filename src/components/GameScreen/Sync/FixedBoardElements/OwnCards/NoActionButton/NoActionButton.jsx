// NoActionButton.jsx

import React, { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

/**
 * @file NoActionButton.jsx
 * @description Sends a "play nothing" action (empty cards array).
 *
 * === Endpoint (API DOCUMENT) ===
 * POST /play/{id}/actions/play-card
 * @typedef {{ playerId:number, cards:number[] }} PlayCardsRequestBody
 *
 * Props: none.
 */

export default function NoActionButton() {
  const [searchParams] = useSearchParams();
  const { gameId } = useParams();
  const playerId = searchParams.get("playerId");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /** Sends an empty selection to the play-card endpoint. */
  const handleNoAction = async () => {
    setError("");

    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:8000/play/${gameId}/actions/play-card`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          /** @type {PlayCardsRequestBody} */
          body: JSON.stringify({
            cards: [],
            playerId: playerId, // backend tolerates string/number per API
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`No action failed with status ${response.status}`);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to perform no action");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        className="owncards-action"
        onClick={handleNoAction}
        disabled={loading}
      >
        {loading ? "Processing..." : "Play nothing"}
      </button>
      {error && (
        <div style={{ color: "#f4e1a3", fontSize: "0.7vw" }}>{error}</div>
      )}
    </div>
  );
}
