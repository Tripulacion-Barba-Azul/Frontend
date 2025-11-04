// DiscardButton.jsx

import React, { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

/**
 * @file DiscardButton.jsx
 * @description Sends a discard action to the backend.
 *
 * === Canonical shapes (API DOCUMENT) ===
 * @typedef {"waiting"|"playing"|"discarding"|"discardingOpt"|"drawing"} TurnStatus
 * @typedef {{ id:number, name:string, type:string }} HandCard
 *
 * === Endpoint (API DOCUMENT) ===
 * POST /play/{id}/actions/discard
 * @typedef {{ playerId:number, cards:number[] }} DiscardRequestBody
 *
 * === Props ===
 * @typedef {Object} DiscardButtonProps
 * @property {(string|number)[]} selectedCards - Selected card IDs to discard.
 * @property {number} handSize - Current hand size (used by UI messages).
 * @property {() => void} [onDiscardSuccess] - Callback after request resolves (success or handled error).
 * @property {boolean} [requireAtLeastOne=false] - If true, must discard >= 1.
 * @property {boolean} [requireExactlyOne=false] - If true, must discard exactly 1.
 * @property {string} [labelWhenZero] - Optional label when k === 0 (e.g., "Discard nothing").
 */

/** @param {DiscardButtonProps} props */
export default function DiscardButton({
  selectedCards = [],
  handSize = 0,
  onDiscardSuccess,
  requireAtLeastOne = false,
  requireExactlyOne = false,
  labelWhenZero,
}) {
  const [searchParams] = useSearchParams();
  const { gameId } = useParams();
  const playerId = searchParams.get("playerId");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /** Validates selection based on props, then POSTs the discard. */
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
        `http://localhost:8000/play/${gameId}/actions/discard`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          /** @type {DiscardRequestBody} */
          body: JSON.stringify({
            playerId: Number(playerId),
            cards: selectedCards.map((id) => id),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Discard failed with status ${response.status}`);
      }

      onDiscardSuccess?.();
    } catch (err) {
      console.error(err);
      setError("Failed to discard");
      onDiscardSuccess?.(); // keep existing behavior
    } finally {
      setLoading(false);
    }
  };

  const k = selectedCards.length;
  const label = loading
    ? "Discarding..."
    : k === 0 && labelWhenZero
    ? labelWhenZero
    : `Discard (${k})`;

  return (
    <div>
      <button
        className="owncards-action"
        onClick={handleDiscard}
        disabled={loading}
        title={
          requireExactlyOne
            ? "Discard exactly one card"
            : requireAtLeastOne
            ? "Discard at least one card"
            : "Discard (optional)"
        }
      >
        {label}
      </button>

      {error && (
        <div style={{ color: "#f4e1a3", fontSize: "12px" }}>{error}</div>
      )}
    </div>
  );
}
