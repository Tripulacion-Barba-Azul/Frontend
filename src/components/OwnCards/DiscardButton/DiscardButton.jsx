import React, { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

export default function DiscardButton({selectedCards, handSize, onDiscardSuccess }) {

  // Si le llegamos a meter esta info en cookies obviamente que esto hay que cambiarlo
  const [searchParams] = useSearchParams();
  const { gameId } = useParams();
  const playerId = searchParams.get("playerId");
  //
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canDiscard =
    (handSize < 6) || (handSize === 6 && selectedCards.length > 0);

  const handleDiscard = async () => {
    
    setError("");

    if (handSize === 6 && selectedCards.length === 0) {
      setError("You must discard at least one card!");
      return;
    }

    if (!canDiscard || loading) return;

    setLoading(true);
   
    try {
      const response = await fetch(`/play/${gameId}/actions/discard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cards: selectedCards.map((id) => ({ cardId: id })),
          actualPlayerID: Number(playerId),
        }),
      });

      if (!response.ok) {
        throw new Error(`Discard failed with status ${response.status}`);
      }

      // clear selection after successful discard
      onDiscardSuccess();
    } catch (err) {
      console.error(err);
      setError("Failed to discard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        className="owncards-action"
        onClick={handleDiscard}
        disabled={loading}
      >
        {loading ? "Discarding..." : `Discard (${selectedCards.length})`}
      </button>
      {error && <div style={{ color: "#f4e1a3", fontSize: "12px" }}>{error}</div>}
    </div>
  );
}