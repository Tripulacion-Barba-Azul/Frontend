import React, { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

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
      const response = await fetch(`https://dotc-production.up.railway.app/play/${gameId}/actions/play-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cards: [],
          playerId: playerId
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
    <div>
      <button
        className="owncards-action"
        onClick={handleNoAction}
        disabled={loading}
      >
        {loading ? "Processing..." : "Play nothing"}
      </button>
      {error && <div style={{ color: "#f4e1a3", fontSize: "12px" }}>{error}</div>}
      </div>
  );
}
