// OrderCards.jsx

/**
 * @file OrderCards.jsx
 * @description Modal to reorder a small subset (1..5) of discard-pile cards.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Reorder } from "framer-motion";
import "./OrderCards.css";
import { CARDS_MAP } from "../../../../../utils/generalMaps";

/** @param {OrderCardsProps} props */
export default function OrderCards({
  cards = [],
  selectedCardsOrder,
  text = "Reorder the cards",
}) {
  // Normalize incoming cards (only truthy, clamp to first 5)
  const baseCards = useMemo(() => {
    const list = Array.isArray(cards) ? cards.filter(Boolean) : [];
    return list.slice(0, 5);
  }, [cards]);

  // Keep only cards that have an image mapping in CARDS_MAP
  const validCards = useMemo(
    () => baseCards.filter((c) => c?.name && CARDS_MAP?.[c.name]),
    [baseCards]
  );

  // Local order state mirrors the valid input cards
  const [order, setOrder] = useState(validCards);
  useEffect(() => setOrder(validCards), [validCards]);

  // Number of columns for the grid (used by CSS via data-cols)
  const COLS = Math.max(1, Math.min(order.length || 1, 5));

  // Panel ref used for drag constraints (limits drag to the gray window)
  const panelRef = useRef(null);

  // Adapt framer-motion's array of ids back into the card array
  const handleReorder = (newOrderIds) => {
    setOrder(
      newOrderIds.map((id) => order.find((c) => c.id === id)).filter(Boolean)
    );
  };

  // Emit only the ids in the chosen order
  const handleConfirm = () => {
    if (typeof selectedCardsOrder !== "function" || order.length === 0) return;
    selectedCardsOrder(order.map((c) => c.id));
  };

  // Always-open modal rendered via portal; sizing handled by CSS and data-cols
  return (
    <>
      {createPortal(
        <div className="odp-modal" role="dialog" aria-modal="true">
          <div className="odp-overlay" />
          <div className="odp-panel" data-cols={COLS} ref={panelRef}>
            <div className="odp-header">
              <h3 className="odp-title">{text}</h3>
            </div>

            <div className="odp-content">
              {order.length > 0 ? (
                <>
                  <Reorder.Group
                    as="div"
                    axis="x" // restrict reordering to the X axis
                    values={order.map((c) => c.id)}
                    onReorder={handleReorder}
                    className="odp-grid"
                    data-cols={COLS}
                  >
                    {order.map((card) => {
                      const src = CARDS_MAP[card.name];

                      return (
                        <Reorder.Item
                          key={card.id}
                          value={card.id}
                          // Constrain dragging within the gray panel bounds
                          dragConstraints={panelRef}
                          dragElastic={0} // no overscroll beyond the bounds
                          dragMomentum={false} // stop drifting after release
                          whileDrag={{
                            scale: 1.05,
                            zIndex: 20,
                            filter: "brightness(1.05)",
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 600,
                            damping: 28,
                          }}
                          style={{ flexShrink: 0 }}
                        >
                          <button
                            className="odp-card"
                            title={card.name}
                            type="button"
                          >
                            <img
                              src={src}
                              alt={`Card ${card.name}`}
                              className="odp-card-img"
                              draggable={false}
                            />
                          </button>
                        </Reorder.Item>
                      );
                    })}
                  </Reorder.Group>

                  {/* Visual cue: leftmost card goes on top of the deck */}
                  <div
                    className="odp-grid-indicator"
                    data-cols={COLS}
                    aria-hidden="true"
                  >
                    <div className="odp-top-indicator">
                      <span className="odp-top-indicator-icon">
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          role="img"
                          aria-label="Top indicator"
                        >
                          <path
                            d="M12 19V6"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          <path
                            d="M5.5 11.5L12 5l6.5 6.5"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <div className="odp-top-indicator-text">
                        This card will be on top of the regular deck
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="odp-empty">No cards available</div>
              )}
            </div>

            <div className="odp-footer">
              <button
                className="odp-confirm"
                onClick={handleConfirm}
                disabled={order.length === 0}
                type="button"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
