// PlayCardsButton.jsx

import React, { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

/**
 * @file PlayCardsButton.jsx
 * @description Plays the selected set of cards (0..6) with client-side validations.
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
 * @property {(string|number)[]} [selectedCards=[]]  - Selected card IDs to play (≤ 6).
 * @property {HandCard[]}        [selectedCardsMeta] - Optional detailed objects for validation/labels.
 * @property {() => void}        [onPlaySuccess]     - Callback after request resolves (success or handled error).
 * @property {string}            [label]             - Optional label override (e.g., "Play (detective)").
 */

/* ------------------------------ Helpers ------------------------------ */
const norm = (s) =>
  String(s ?? "")
    .trim()
    .toLowerCase();
const isName = (card, target) => norm(card?.name) === norm(target);

/** Returns true if every meta card has type "detective" (case-insensitive). */
function allDetective(meta = []) {
  if (!Array.isArray(meta) || meta.length === 0) return false;
  return meta.every((c) => norm(c?.type) === "detective");
}

/**
 * Validate a detective set with k>1 according to custom rules:
 *
 * VALID if:
 *  - All names are the same (ignoring "Harley Quin"), possibly including one or more "Harley Quin"; OR
 *  - All non-"Harley Quin" names are Tommy/Tuppence only (any combination), possibly including "Harley Quin".
 *
 * EXTRA VALIDITY REQUIREMENT:
 *  - If the (non-HQ) base name is "Hercule Poirot" or "Miss Marple", the total set size must be >= 3.
 *
 * INVALID if:
 *  - Any card is "Ariadne Oliver"; OR
 *  - All cards are "Harley Quin"; OR
 *  - Anything not covered by the valid cases.
 *
 * Returns { ok:boolean, message?:string }
 */
function validateDetectiveSet(meta = []) {
  const k = meta.length;
  if (k <= 1) return { ok: true }; // this validator is only for sets (k>1)

  // Hard invalid: contains Ariadne Oliver
  if (meta.some((c) => isName(c, "Ariadne Oliver"))) {
    return {
      ok: false,
      message: `Detective set cannot include "Ariadne Oliver"`,
    };
  }

  // Names (lowercased)
  const names = meta.map((c) => norm(c?.name));
  const uniqNames = Array.from(new Set(names));

  // Hard invalid: all Harley Quin
  if (uniqNames.length === 1 && uniqNames[0] === norm("Harley Quin")) {
    return {
      ok: false,
      message: `Set cannot be composed only of "Harley Quin"`,
    };
  }

  // Remove Harley Quin to evaluate the "base" validity
  const namesNoHQ = names.filter((n) => n !== norm("Harley Quin"));
  const uniqNoHQ = Array.from(new Set(namesNoHQ));

  // If nothing left after removing HQ => all were HQ -> already invalid above
  if (uniqNoHQ.length === 0) {
    return {
      ok: false,
      message: `Set cannot be composed only of "Harley Quin"`,
    };
  }

  // Base valid cases
  const allSameNonHQ = uniqNoHQ.length === 1;
  const allowedPair = new Set([
    norm("Tommy Beresford"),
    norm("Tuppence Beresford"),
  ]);
  const allTommyTuppence = uniqNoHQ.every((n) => allowedPair.has(n));

  const baseIsValid = allSameNonHQ || allTommyTuppence;

  if (!baseIsValid) {
    return { ok: false, message: "Invalid detective set" };
  }

  // EXTRA RULE: If base is a single non-HQ name and it's Poirot/Marple, require k>=3
  if (allSameNonHQ) {
    const base = uniqNoHQ[0]; // normalized name
    if (base === norm("Hercule Poirot") || base === norm("Miss Marple")) {
      if (k < 3) {
        const display =
          base === norm("Hercule Poirot") ? "Hercule Poirot" : "Miss Marple";
        return {
          ok: false,
          message: `"${display}"s set must have at least 3 cards`,
        };
      }
    }
  }

  return { ok: true };
}

/* ------------------------------ Component ------------------------------ */
/** @param {PlayCardsButtonProps} props */
export default function PlayCardsButton({
  selectedCards = [],
  selectedCardsMeta = [],
  onPlaySuccess,
  label,
}) {
  const [searchParams] = useSearchParams();
  const { gameId } = useParams();
  const playerId = Number(searchParams.get("playerId"));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /** Validates selection, then POSTs the play action. */
  const handlePlayCards = async () => {
    setError("");
    if (loading) return;

    // Defensive guard
    if (selectedCards.length > 6) {
      setError("Something went wrong with your selection");
      return; // do NOT fetch
    }

    // RULE 1: single "Harley Quin" cannot be played via this action
    if (selectedCards.length === 1) {
      const only = selectedCardsMeta?.[0];
      if (isName(only, "Harley Quin")) {
        setError(`Can't add "Harley Quin" to an existing set`);
        return; // do NOT fetch
      }
    }

    // RULE 2: detective set validation when k>1 and all cards are type detective
    if (selectedCards.length > 1 && allDetective(selectedCardsMeta)) {
      const { ok, message } = validateDetectiveSet(selectedCardsMeta);
      if (!ok) {
        setError(message || "Invalid detective set");
        return; // do NOT fetch
      }
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
            playerId,
            cards: selectedCards.map((id) => id),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Play failed with status ${response.status}`);
      }

      onPlaySuccess?.();
    } catch (err) {
      console.error(err);
      setError("Failed to play cards");
      onPlaySuccess?.(); // parity with DiscardButton on handled error
    } finally {
      setLoading(false);
    }
  };

  // Prefer the custom label (from OwnCards type rules). Fallback to default.
  const buttonText = loading
    ? "Playing..."
    : label ?? `Play (${selectedCards.length})`;

  return (
    <div>
      <button
        className="owncards-action"
        onClick={handlePlayCards}
        disabled={loading}
        title="Play selected cards"
      >
        {buttonText}
      </button>

      {/* Error text — mirrors DiscardButton visual */}
      {error && (
        <div role="alert" style={{ color: "#f4e1a3", fontSize: "12px" }}>
          {error}
        </div>
      )}
    </div>
  );
}
