// ViewMyCards.jsx

/**
 * @file ViewMyCards.jsx
 * @description Floating button that opens a portal with the player's **private hand** (max 6 cards).
 *
 * === Canonical shapes (from API DOCUMENT) ===
 * @typedef {{ id:number, name:string, type:string }} HandCard
 *
 * === Props ===
 * @typedef {Object} ViewMyCardsProps
 * @property {HandCard[]} cards - Current player's private hand.
 *
 * Notes:
 * - Validates: array, length ≤ 6, all names exist in `CARDS_MAP`. Throws if invalid (by design).
 * - Uses a body class to lock scroll and style the backdrop while the modal is open.
 */

import { useState } from "react";
import { createPortal } from "react-dom";
import "./ViewMyCards.css";
import { CARDS_MAP } from "../../../../../utils/generalMaps";

/** Defensive validation kept as in original component */
function validateCards(cards) {
  const isArray = Array.isArray(cards);
  const hasValidLength = isArray && cards.length <= 6;
  const hasKnownNames = cards.every(
    ({ name }) => CARDS_MAP[name] !== undefined
  );
  return isArray && hasValidLength && hasKnownNames;
}

/** @param {ViewMyCardsProps} props */
export default function ViewMyCards({ cards }) {
  if (!validateCards(cards)) {
    console.error("Invalid array of cards" + JSON.stringify(cards));
    throw new Error("Invalid array of cards");
  }

  // Modal visibility (keeps original naming to avoid logic changes)
  const [ViewMyCards, setViewMyCards] = useState(false);
  const [mounted, setMounted] = useState(false); // reserved for future use

  const toggleViewMyCards = () => setViewMyCards(!ViewMyCards);

  const hasCards = cards && cards.length > 0 && cards.length < 7;

  // Body class for modal-open state (CSS-driven)
  if (ViewMyCards) {
    document.body.classList.add("active-viewmycards");
  } else {
    document.body.classList.remove("active-viewmycards");
  }

  return (
    <>
      <button onClick={toggleViewMyCards} className="btn-viewmycards">
        <img src={"/Icons/zoomviewicon.png"} alt="zoomviewicon" />
      </button>

      {ViewMyCards &&
        createPortal(
          <div className="viewmycards">
            <div onClick={toggleViewMyCards} className="overlay"></div>
            <div className="cards-grid">
              {hasCards ? (
                cards.map((card) => (
                  <div key={card.id} className="card">
                    <img src={CARDS_MAP[card.name]} alt={`card ${card.id}`} />
                  </div>
                ))
              ) : (
                <div className="no-cards-message">
                  <p>Out of cards!</p>
                </div>
              )}
            </div>
            <button className="close-viewmycards" onClick={toggleViewMyCards}>
              X
            </button>
          </div>,
          document.body
        )}
    </>
  );
}
