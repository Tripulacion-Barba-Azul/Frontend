// SelectCard.jsx
/**
 * @file SelectCard.jsx
 * @description Modal to pick one card from a horizontal row (1..6 cards).
 * - Single row layout (no wrapping).
 * - Panel width adapts to card count using vw units.
 * - Public API unchanged: { cards, selectedCardId, text }.
 */

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import "./SelectCard.css";
import { CARDS_MAP } from "../../../../../utils/generalMaps";

/** @typedef {{ id:number, name:string }} SimpleCard */

/**
 * @param {{
 *   cards?: SimpleCard[],
 *   selectedCardId: (id:number) => void,
 *   text?: string
 * }} props
 */
export default function SelectCard({
  cards = [],
  selectedCardId,
  text = "Select a card",
}) {
  // Local selection state
  const [pickedId, setPickedId] = useState(null);

  // Only render cards that resolve to an image; hard-cap to 6
  const validCards = useMemo(() => {
    return Array.isArray(cards)
      ? cards.filter((c) => c && CARDS_MAP[c.name] !== undefined).slice(0, 6)
      : [];
  }, [cards]);

  const count = validCards.length;

  const handlePick = (id) => setPickedId(id);

  const handleConfirm = () => {
    if (pickedId == null || typeof selectedCardId !== "function") return;
    selectedCardId(pickedId);
    setPickedId(null);
  };

  // Expose count to CSS via custom properties for width calculation in vw units
  const panelStyle = {
    // CSS variables consumed in SelectCard.css
    "--count": count,
  };

  return createPortal(
    <div
      className="sdp-modal"
      role="dialog"
      aria-modal="true"
      data-testid="sdp-root"
    >
      <div className="sdp-overlay" />
      <div className="sdp-panel" style={panelStyle}>
        <div className="sdp-header">
          <h3 className="sdp-title">{text}</h3>
        </div>

        <div className="sdp-content">
          {count > 0 ? (
            <div
              className="sdp-row"
              data-count={count}
              role="listbox"
              aria-label="cards"
            >
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
                    role="option"
                    aria-selected={isSelected}
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
