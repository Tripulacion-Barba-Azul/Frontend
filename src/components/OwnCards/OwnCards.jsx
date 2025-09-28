import React from "react";
import "./OwnCards.css";
import { CARD_SRC } from "./ownCardsConstants.js";

function validateCardIds(cardIds) {
  if (!Array.isArray(cardIds)) return false;
  if (cardIds.length > 6) return false;
  return cardIds.every((id) => Number.isInteger(id) && id >= 7 && id <= 27);
}

/**
 * Render the player's hand row.
 *
 * Behavior:
 *      + Validates `cardIds` and throws on invalid input.
 *      + Shows cards in a fixed row at the bottom-center of the screen (at the actualPlayer own cards view).
 *
 * Props:
 *     cardIds=[]       - Array of card IDs(ints) (each in [7, 27], max 6 elements).
 *     className=""     - Extra class names for outer styling (reserved).
 */

export default function OwnCards({ cardIds = [], className = "" }) {
  if (!validateCardIds(cardIds)) {
    throw new Error("Invalid array of cards");
  }

  return (
    <div className={`owncards-overlay ${className}`} aria-label="cards-row">
      <div className="owncards-row">
        {cardIds.map((id) => {
          return (
            <img
              key={id}
              src={CARD_SRC[id]}
              alt={`Card ${id}`}
              className="owncards-card"
              width={130}
              height={198}
              draggable={false}
            />
          );
        })}
      </div>
    </div>
  );
}
