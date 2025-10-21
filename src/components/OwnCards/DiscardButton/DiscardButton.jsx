import React, { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

/**
 * DiscardButton
 *
 * Props:
 * - selectedCards: string[] | number[]
 * - handSize: number
 * - onDiscardSuccess: () => void
 * - requireAtLeastOne?: boolean  // keeps previous behavior (>=1)
 * - requireExactlyOne?: boolean  // NEW: must be exactly one
 *
 * Notes:
 * - When requireExactlyOne === true, the button remains clickable even with 0 or >1
 *   selections; clicking will show an explicit error message as requested.
 */
export default function DiscardButton({
  selectedCards,
  handSize,
  onDiscardSuccess,
  requireAtLeastOne = false,
  requireExactlyOne = false,
}) {
  const [searchParams] = useSearchParams();
  const { gameId } = useParams();
  const playerId = searchParams.get("playerId");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDiscard = async () => {
    setError("");

    // Validation: EXACTLY ONE
    if (requireExactlyOne && selectedCards.length !== 1) {
      setError("You must discard exactly one card!");
      return;
    }

    // Validation: AT LEAST ONE
    if (!requireExactlyOne && requireAtLeastOne && selectedCards.length === 0) {
      setError("You must discard at least one card!");
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch(
        `https://dotc-production.up.railway.app/play/${gameId}/actions/discard`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: Number(playerId),
            // Can be an empty array ONLY when optional flows (not when requireExactlyOne)
            cards: selectedCards.map((id) => id),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Discard failed with status ${response.status}`);
      }

      onDiscardSuccess();
    } catch (err) {
      console.error(err);
      setError("Failed to discard");
      // Keep previous pattern: still call success handler to clear selection/state if needed
      onDiscardSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        className="owncards-action"
        onClick={handleDiscard}
        disabled={loading} // keep clickable for validation errors when not valid
        title={
          requireExactlyOne
            ? "Discard exactly one card"
            : requireAtLeastOne
            ? "Discard at least one card"
            : "Discard (optional)"
        }
      >
        {loading ? "Discarding..." : `Discard (${selectedCards.length})`}
      </button>

      {error && (
        <div style={{ color: "#f4e1a3", fontSize: "12px" }}>{error}</div>
      )}
    </div>
  );
}
