import React from "react";
import "./OwnCards.css";
import { CARDS_MAP } from "../generalMaps.js";

function validateCards(cards) {
  const isArray = Array.isArray(cards);
  const hasValidLength = isArray && cards.length <= 6;
  const hasRequiredFields =
    isArray &&
    cards.every((card) => card?.cardID != null && card?.cardName != null);
  const hasKnownNames =
    hasRequiredFields &&
    cards.every(({ cardName }) => CARDS_MAP[cardName] !== undefined);

  return isArray && hasValidLength && hasRequiredFields && hasKnownNames;
}

export default function OwnCards({ cards = [] }) {
  if (!validateCards(cards)) {
    throw new Error("Invalid array of cards");
  }

  return (
    <div className={`owncards-overlay`} aria-label="cards-row">
      <div className="owncards-row">
        {cards.map((card) => {
          return (
            <img
              key={card.cardID}
              src={CARDS_MAP[card.cardName]}
              alt={`Card ${card.cardID}`}
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
