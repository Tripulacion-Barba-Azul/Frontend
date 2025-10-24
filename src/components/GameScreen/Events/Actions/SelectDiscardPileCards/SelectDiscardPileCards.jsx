// SelectDiscardPileCards.jsx

/**
 * @file SelectDiscardPileCards.jsx
 * @description Modal to pick **one** card from the top-N discard pile (1..5).
 *
 * === Canonical shapes (from API DOCUMENT) ===
 * @typedef {{ id:number, name:string }} SimpleCard
 *
 * === Props ===
 * @typedef {Object} SelectDiscardPileCardsProps
 * @property {SimpleCard[]} [cards=[]] - Cards to display (subset from discard pile, typically top 5).
 * @property {(id:number)=>void} selectedCardId - Callback fired on confirm with the chosen card id.
 * @property {string} [text="Select a card"] - Modal title/prompt.
 */

import { useState } from "react";
import { createPortal } from "react-dom";
import "./SelectDiscardPileCards.css";
import { CARDS_MAP } from "../../../../../utils/generalMaps";

/** @param {SelectDiscardPileCardsProps} props */
export default function SelectDiscardPileCards({
  cards = [],
  selectedCardId,
  text = "Select a card",
}) {
  // Trace renders (useful when wiring with WS effects)
  console.log("SelectDiscardPileCards render", { cards, text });

  // Always-open modal with local selected id
  const [pickedId, setPickedId] = useState(null);

  // Only accept cards that have an image mapping
  const validCards = Array.isArray(cards)
    ? cards.filter((c) => c && CARDS_MAP[c.name] !== undefined)
    : [];

  // Grid columns adapt to 1..5 cards (CSS can also read a data-attr if preferred)
  const fixedCols =
    validCards.length > 0 && validCards.length <= 5
      ? {
          gridTemplateColumns: `repeat(${validCards.length}, minmax(160px, 1fr))`,
        }
      : undefined;

  const handlePick = (id) => setPickedId(id);

  const handleConfirm = () => {
    if (pickedId == null || typeof selectedCardId !== "function") return;
    selectedCardId(pickedId); // notify parent
    setPickedId(null); // clear local selection (disables Confirm)
  };

  return createPortal(
    <div
      className="sdp-modal"
      role="dialog"
      aria-modal="true"
      data-testid="sdp-root"
    >
      <div className="sdp-overlay" />
      <div className="sdp-panel">
        <div className="sdp-header">
          <h3 className="sdp-title">{text}</h3>
        </div>

        <div className="sdp-content">
          {validCards.length > 0 ? (
            <div className="sdp-grid" style={fixedCols} data-testid="sdp-grid">
              {validCards.map((card) => {
                const src = CARDS_MAP[card.name];
                const isSelected = pickedId === card.id;
                return (
                  <button
                    key={card.id ?? card.name}
                    className={`sdp-card ${isSelected ? "selected" : ""}`}
                    onClick={() => handlePick(card.id)}
                    title={card.name}
                    type="button"
                  >
                    <img
                      src={src}
                      alt={`Card ${card.id}`}
                      className="sdp-card-img"
                      draggable={false}
                    />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="sdp-empty">No cards available</div>
          )}
        </div>

        <div className="sdp-footer">
          <button
            className="sdp-confirm"
            onClick={handleConfirm}
            disabled={pickedId == null}
            type="button"
            data-testid="sdp-confirm"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
