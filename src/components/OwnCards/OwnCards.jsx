// OwnCards.jsx
import React from "react";
import "./OwnCards.css";
import { CARD_SRC } from "./ownCardsConstants.js";

function validateCardIds(cardIds) {
  if (!Array.isArray(cardIds)) return false;
  if (cardIds.length > 6) return false;
  return cardIds.every((id) => Number.isInteger(id) && id >= 7 && id <= 27);
}

export default function OwnCards({ cardIds = [], className = "" }) {
  if (!validateCardIds(cardIds)) {
    // 🔎 DEBUG: volcá exactamente qué llegó cuando falla la validación
    try {
      console.groupCollapsed(
        "%c[OwnCards] Invalid cardIds",
        "color:#d00;font-weight:bold;"
      );
      console.log("Prop `cardIds` (raw):", cardIds);
      console.log("Array.isArray:", Array.isArray(cardIds));
      if (Array.isArray(cardIds)) {
        console.log("Length:", cardIds.length);
        console.table(
          cardIds.map((v, i) => ({
            index: i,
            value: v,
            type: typeof v,
            isInteger: Number.isInteger(v),
            inRange_7_27: Number.isInteger(v) && v >= 7 && v <= 27,
          }))
        );
      }
      console.trace("Trace (where invalid was passed)");
    } finally {
      console.groupEnd();
    }

    throw new Error("Invalid array of cards");
  }

  return (
    <div className={`owncards-overlay ${className}`} aria-label="cards-row">
      <div className="owncards-row">
        {cardIds.map((id) => (
          <img
            key={id}
            src={CARD_SRC[id]}
            alt={`Card ${id}`}
            className="owncards-card"
            width={130}
            height={198}
            draggable={false}
          />
        ))}
      </div>
    </div>
  );
}
