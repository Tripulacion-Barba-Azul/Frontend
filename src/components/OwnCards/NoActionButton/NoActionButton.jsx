import React, { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import "./NoActionButton.css";

export default function NoActionButton() {
  const [searchParams] = useSearchParams();
  const { gameId } = useParams();
  const playerId = searchParams.get("playerId");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNoAction = async () => {
    setError("");

    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch(`http://localhost:8000/play/${gameId}/actions/play-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: playerId,
          cards: []
        }),
      });

      if (!response.ok) {
        throw new Error(`No action failed with status ${response.status}`);
      }

      // Request sent successfully - no additional actions needed
    } catch (err) {
      console.error(err);
      setError("Failed to perform no action");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="no-action-button-container">
      <button
        className="owncards-action no-action-button"
        onClick={handleNoAction}
        disabled={loading}
      >
        {loading ? "Processing..." : "Play nothing"}
      </button>
      {error && <div className="no-action-error">{error}</div>}
    </div>
  );
}
