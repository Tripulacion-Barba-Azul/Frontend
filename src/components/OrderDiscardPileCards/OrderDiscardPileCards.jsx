import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Reorder } from "framer-motion";
import "./OrderDiscardPileCards.css";
import { CARDS_MAP } from "../generalMaps.js"; // adjust path if needed

export default function OrderDiscardPileCards({
  cards = [],
  selectedCardsOrder,
  text = "Reorder the cards",
}) {
  // Normalize incoming cards (1..5, filter falsy)
  const baseCards = useMemo(() => {
    const list = Array.isArray(cards) ? cards.filter(Boolean) : [];
    return list.slice(0, 5);
  }, [cards]);

  // Keep only cards with an image mapping
  const validCards = useMemo(
    () => baseCards.filter((c) => c?.name && CARDS_MAP?.[c.name]),
    [baseCards]
  );

  // Local order
  const [order, setOrder] = useState(validCards);
  useEffect(() => setOrder(validCards), [validCards]);

  // Number of columns (1..5) for CSS layout (width/columns controlled in CSS)
  const COLS = Math.max(1, Math.min(order.length || 1, 5));

  // Reorder handler for framer-motion
  const handleReorder = (newOrderIds) => {
    setOrder(
      newOrderIds.map((id) => order.find((c) => c.id === id)).filter(Boolean)
    );
  };

  // Confirm returns only the ids in the new order
  const handleConfirm = () => {
    if (typeof selectedCardsOrder !== "function" || order.length === 0) return;
    selectedCardsOrder(order.map((c) => c.id));
  };

  // Modal UI (portal). Panel/grid sizing handled by CSS via [data-cols].
  return (
    <>
      {createPortal(
        <div className="odp-modal" role="dialog" aria-modal="true">
          <div className="odp-overlay" />
          <div className="odp-panel" data-cols={COLS}>
            <div className="odp-header">
              <h3 className="odp-title">{text}</h3>
            </div>

            <div className="odp-content">
              {order.length > 0 ? (
                <>
                  <Reorder.Group
                    as="div"
                    axis="x"
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
                          style={{
                            flexShrink: 0,
                          }}
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

                  {/* Leftmost indicator (icon + small caption) */}
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