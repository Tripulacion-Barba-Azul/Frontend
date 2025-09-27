import React, { useEffect, useState } from "react";
import { CARD_SRC } from "./ownCardsConstants.js";

function validateCardIds(cardIds) {
  if (!Array.isArray(cardIds)) return false;
  if (cardIds.length > 6) return false;
  return cardIds.every((id) => Number.isInteger(id) && id >= 7 && id <= 27);
}

/**
 * Render the player's hand row and an image modal for zooming a selected card.
 *
 * Behavior:
 *      + Validates `cardIds` and throws on invalid input.
 *      + Shows cards in a fixed row at the bottom-center of the screen (at the actualPlayer own cards view).
 *      + Clicking a card opens a modal with a large preview.
 *      + Modal closes via the "✕" button or the Escape key.
 *
 * Props:
 *     cardIds=[]       - Array of card IDs(ints) (each in [7, 27], max 6 elements).
 *     className=""     - Extra class names for outer styling (reserved).
 */

export default function OwnCards({ cardIds = [], className = "" }) {
  if (!validateCardIds(cardIds)) {
    throw new Error("Invalid array of cards");
  }

  // Selected card id (null = no modal)
  const [selectedId, setSelectedId] = useState(null);

  // Close modal on Escape
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    if (selectedId != null) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId]);

  // Whether modal is open (used to disable other clicks)
  const modalOpen = selectedId != null;

  return (
    <>
      {/* Cards layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-label="cards-row"
      >
        <div
          className="absolute -translate-x-1/2 flex"
          style={{ bottom: "1%", left: "49.8%", gap: "12px" }}
        >
          {cardIds.map((id) => {
            const src = CARD_SRC[id];

            return (
              <button
                key={id}
                type="button"
                // Enable interaction only when modal is closed
                className={`pointer-events-auto rounded-md ring-1 ring-black/20 shadow focus:outline-none focus:ring-2 focus:ring-cyan-400 `}
                onClick={() => !modalOpen && setSelectedId(id)} // block click if modal open
                aria-label={`Open card ${id}`}
                title={
                  modalOpen
                    ? "Cerrar la carta actual para abrir otra"
                    : "Ver carta"
                }
                disabled={modalOpen} // also disable for keyboard users
                style={{ width: 130, height: 198 }}
              >
                <img
                  src={src}
                  alt={`Card ${id}`}
                  width={130}
                  height={198}
                  className="rounded-md object-cover w-[130px] h-[198px]"
                  draggable={false}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal overlay as a sibling so it receives pointer events correctly */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px] flex items-center justify-center p-4 pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-label={`Card ${selectedId} viewer`}
        >
          <div
            className="relative bg-white rounded-xl shadow-2xl max-w-[92vw] max-h-[92vh] p-3 sm:p-4"
            // Stop event bubbling just in case
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button (X) */}
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 rounded-full bg-white text-slate-700 shadow p-2 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              aria-label="Close"
              title="Cerrar"
            >
              ✕
            </button>

            {/* Large preview */}
            <img
              src={CARD_SRC[selectedId]}
              alt={`Card ${selectedId}`}
              className="block max-w-[80vw] max-h-[80vh] w-auto h-auto object-contain rounded-lg"
              draggable={false}
            />

            <div className="mt-2 text-center text-xs text-slate-600 select-none">
              Presiona <kbd className="px-1 py-0.5 border rounded">Esc</kbd> o
              la ✕ para cerrar
            </div>
          </div>
        </div>
      )}
    </>
  );
}
