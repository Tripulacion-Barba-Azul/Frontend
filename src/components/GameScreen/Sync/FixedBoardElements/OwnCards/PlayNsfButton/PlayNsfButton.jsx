// PlayNsfButton.jsx
import React, { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

/**
 * Minimal "Not so fast!" button for the `actionStatus === "unblocked"` mode.
 *
 * Props:
 * - selectedCards: (string|number)[]  -> IDs
 * - selectedCardsMeta: { id, name, type }[] -> card objects
 * - onPlaySuccess: () => void
 */
export default function PlayNsfButton({
  selectedCards = [],
  selectedCardsMeta = [],
  onPlaySuccess,
}) {
  const [searchParams] = useSearchParams();
  const { gameId } = useParams();
  const playerId = Number(searchParams.get("playerId"));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const k = (selectedCards || []).length;

  const isInstant = (meta = []) =>
    meta.length === 1 &&
    String(meta[0]?.type ?? "").toLowerCase() === "instant";

  const handleClick = async () => {
    setError("");
    if (loading) return;

    // Validation: only allow 0 or 1 card
    if (k > 1) {
      setError("Select at most one card");
      return;
    }

    // If 1 card ensure it's instant
    if (k === 1 && !isInstant(selectedCardsMeta)) {
      setError("Only instant cards allowed");
      return;
    }

    setLoading(true);
    try {
      const url = `http://localhost:8000/play/${gameId}/actions/play-nsf`;

      const body =
        k === 0
          ? { cardId: null, playerId: playerId }
          : { cardId: selectedCards[0], playerId: playerId };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      onPlaySuccess?.();
    } catch (err) {
      console.error(err);
      setError("Failed to send");
      onPlaySuccess?.(); // keep parity with PlayCardsButton behavior
    } finally {
      setLoading(false);
    }
  };

  const buttonText = loading ? "Sending..." : k === 0 ? "Skip" : "Not so fast!";

  // If user selected an invalid count, show disabled invalid style
  const disabled =
    loading || k > 1 || (k === 1 && !isInstant(selectedCardsMeta));

  return (
    <div>
      <button
        type="button"
        className={`owncards-action ${
          disabled ? "owncards-action--invalid" : ""
        }`}
        onClick={handleClick}
        disabled={disabled}
        title={k === 0 ? "Skip" : "Play Not so fast!"}
      >
        {buttonText}
      </button>

      {error && (
        <div role="alert" style={{ color: "#f4e1a3", fontSize: "0.7vw" }}>
          {error}
        </div>
      )}
    </div>
  );
}
