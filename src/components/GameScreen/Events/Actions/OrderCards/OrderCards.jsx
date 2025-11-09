// OrderCards.jsx

/**
 * @file OrderCards.jsx
 * @description Modal to reorder a small subset (1..5) of discard-pile cards.
 * Robustness:
 *  - Re-mount Reorder.Group on viewport or card-set change (clears stale transforms).
 *  - Update visual order in useLayoutEffect so it applies before paint (avoids jumps).
 *  - Force each item to reset x=0 after updates (prevent residual offsets).
 *  - Arrow indicator font-size is computed from the *actual first card width in px*,
 *    and re-measured on zoom/resize to keep a fixed proportion to the card.
 */

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import { Reorder } from "framer-motion";
import "./OrderCards.css";
import { CARDS_MAP } from "../../../../../utils/generalMaps";

/** Debounce for resize-driven remount (ms). */
const RESIZE_DEBOUNCE_MS = 100;
/** Proportion of the first card width used as indicator base font-size. */
const INDICATOR_RATIO = 0.12; // e.g., 12% of card width

/** @param {OrderCardsProps} props */
export default function OrderCards({
  cards = [],
  selectedCardsOrder,
  text = "Reorder the cards",
}) {
  /* ------------------------------ Normalize input ------------------------------ */
  const baseCards = useMemo(() => {
    const list = Array.isArray(cards) ? cards.filter(Boolean) : [];
    return list.slice(0, 5);
  }, [cards]);

  const validCards = useMemo(
    () => baseCards.filter((c) => c?.name && CARDS_MAP?.[c.name]),
    [baseCards]
  );

  /* -------------------------------- Local state -------------------------------- */
  const [order, setOrder] = useState(validCards);
  const [viewportEpoch, setViewportEpoch] = useState(0); // remount key for layout
  const panelRef = useRef(null); // drag bounds = panel (gray window)

  // Ref to the *first* card's button (visual leftmost). Used to measure width in px.
  const firstCardRef = useRef(null);
  // Indicator font-size in px, derived from the first card measured width.
  const [indicatorPx, setIndicatorPx] = useState(null);

  /* -------------------------- Viewport resize → remount ------------------------- */
  useEffect(() => {
    let t = null;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => setViewportEpoch((k) => k + 1), RESIZE_DEBOUNCE_MS);
    };
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener?.("resize", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener?.("resize", onResize);
    };
  }, []);

  /* -------- Maintain visual order BEFORE paint to avoid layout jumps -------- */
  useLayoutEffect(() => {
    setOrder((prev) => {
      const prevIds = prev.map((c) => c.id);
      const stillPresent = prev.filter((c) =>
        validCards.some((n) => n.id === c.id)
      );
      const newOnes = validCards.filter((c) => !prevIds.includes(c.id));
      return [...stillPresent, ...newOnes];
    });
  }, [validCards]);

  /* ------------------------------- Derived values ------------------------------ */
  const COLS = Math.max(1, Math.min(order.length || 1, 5));

  // Remount key also changes when the id set changes (cleans stale transforms)
  const orderSignature = useMemo(
    () => validCards.map((c) => c.id).join("|"),
    [validCards]
  );
  const groupKey = `${viewportEpoch}:${orderSignature}`;

  /* --------------------- Measure first card width → indicator -------------------- */
  useEffect(() => {
    const measure = () => {
      const el = firstCardRef.current;
      if (!el) return;
      const w = el.getBoundingClientRect().width; // px at current zoom
      if (w > 0) setIndicatorPx(w * INDICATOR_RATIO);
    };

    // Measure asap after layout settles
    requestAnimationFrame(measure);

    // Re-measure on viewport/zoom changes
    const onResize = () => requestAnimationFrame(measure);
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener?.("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener?.("resize", onResize);
    };
  }, [groupKey, order.length]); // re-run when set of cards or layout key changes

  /* --------------------------------- Handlers ---------------------------------- */
  const handleReorder = (newOrderIds) => {
    setOrder(
      newOrderIds.map((id) => order.find((c) => c.id === id)).filter(Boolean)
    );
  };

  const handleConfirm = () => {
    if (typeof selectedCardsOrder !== "function" || order.length === 0) return;
    selectedCardsOrder(order.map((c) => c.id));
  };

  /* ----------------------------------- Render ---------------------------------- */
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
                    key={groupKey} // clean remount on viewport/card-set changes
                    layout="position" // position-only animation (no size jumps)
                    as="div"
                    axis="x" // restrict reordering to the X axis
                    values={order.map((c) => c.id)}
                    onReorder={handleReorder}
                    className="odp-grid"
                    data-cols={COLS}
                  >
                    {order.map((card, idx) => {
                      const src = CARDS_MAP[card.name];
                      return (
                        <Reorder.Item
                          key={card.id}
                          value={card.id}
                          layout="position"
                          dragConstraints={panelRef} // bounded to gray panel
                          dragElastic={0}
                          dragMomentum={false}
                          animate={{ x: 0 }} // reset residual offsets
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
                            // Measure the *visual first* card (index 0)
                            ref={idx === 0 ? firstCardRef : null}
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
                    <div
                      className="odp-top-indicator"
                      // Inline font-size in px from the measured first card width.
                      // Fallback to CSS if not yet measured.
                      style={
                        typeof indicatorPx === "number"
                          ? { fontSize: `${Math.round(indicatorPx)}px` }
                          : undefined
                      }
                    >
                      <span className="odp-top-indicator-icon">
                        <svg
                          width="1em"
                          height="1em"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          role="img"
                          aria-label="Top indicator"
                          focusable="false"
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
                        This card will be <br /> on top of the regular deck
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
