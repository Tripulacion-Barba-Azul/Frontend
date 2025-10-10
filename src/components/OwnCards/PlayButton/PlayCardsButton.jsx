import React, { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

export default function PlayCardsButton({ selectedCards = [], onPlaySuccess }) {
  const [searchParams] = useSearchParams();
  const { gameId } = useParams();
  const playerId = Number(searchParams.get("playerId"));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePlayCards = async () => {
    setError("");

    if (loading) return;

    if (selectedCards.length > 6) {
      setError("Something went wrong with your selection");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/play/${gameId}/actions/play-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cards: selectedCards.map((id) => ({ cardId: id })),
          actualPlayerID: playerId,
        }),
      });

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
      {error && <div style={{ color: "#f4e1a3", fontSize: "12px" }}>{error}</div>}
    </div>
  );
}
