import { useState } from "react";
import { createPortal } from "react-dom";
import "./SelectDiscardPileCards.css";
import { CARDS_MAP } from "../generalMaps.js";

export default function SelectDiscardPileCards({
  cards = [],
  selectedCardId,
  text = "Select a card",
}) {
  console.log("SelectDiscardPileCards render", { cards, text });
  // Always-open modal
  const [pickedId, setPickedId] = useState(null);

  // Validate against map
  const validCards = Array.isArray(cards)
    ? cards.filter((c) => c && CARDS_MAP[c.name] !== undefined)
    : [];
  // Dynamic grid columns for 1 to 5 cards
  const fixedCols =
    validCards.length > 0 && validCards.length <= 5
      ? {
          gridTemplateColumns: `repeat(${validCards.length}, minmax(160px, 1fr))`,
        }
      : undefined;

  const handlePick = (id) => setPickedId(id);

  const handleConfirm = () => {
    if (pickedId == null || typeof selectedCardId !== "function") return;
    selectedCardId(pickedId); // update parent
    setPickedId(null); // disable Confirm + clear selection
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
