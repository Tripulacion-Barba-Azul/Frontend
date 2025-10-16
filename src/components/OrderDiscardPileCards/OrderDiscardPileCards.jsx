import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
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

  // Drag state
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const [dragId, setDragId] = useState(null);

  // FLIP animation refs
  const itemRefs = useRef(new Map()); // key -> HTMLElement
  const prevRectsRef = useRef(new Map()); // key -> DOMRect
  const needAnimateRef = useRef(false);

  const getKey = (card) => String(card?.id ?? card?.name);
  const setItemRef = (key) => (el) => {
    if (el) itemRefs.current.set(key, el);
    else itemRefs.current.delete(key);
  };

  const measureRects = () => {
    const m = new Map();
    order.forEach((card) => {
      const key = getKey(card);
      const el = itemRefs.current.get(key);
      if (el) m.set(key, el.getBoundingClientRect());
    });
    return m;
  };

  // Play FLIP animations after order update
  useLayoutEffect(() => {
    if (!needAnimateRef.current) return;
    const prev = prevRectsRef.current;
    order.forEach((card) => {
      const key = getKey(card);
      const el = itemRefs.current.get(key);
      if (!el) return;

      const last = el.getBoundingClientRect();
      const first = prev.get(key);
      if (!first) return;

      const dx = first.left - last.left;
      const dy = first.top - last.top;
      if (dx === 0 && dy === 0) return;

      if (typeof el.animate === "function") {
        el.animate(
          [
            { transform: `translate(${dx}px, ${dy}px)` },
            { transform: "translate(0, 0)" },
          ],
          { duration: 220, easing: "ease" }
        );
      } else {
        el.style.transition = "none";
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        requestAnimationFrame(() => {
          el.style.transition = "transform 220ms ease";
          el.style.transform = "translate(0,0)";
        });
      }
    });
    needAnimateRef.current = false;
  }, [order]);

  // DnD handlers
  const onDragStart = (idx) => (e) => {
    setDragIndex(idx);
    setDragId(getKey(order[idx]));
    try {
      e.dataTransfer.effectAllowed = "move";
      const img = itemRefs.current
        .get(getKey(order[idx]))
        ?.querySelector("img");
      if (img && e.dataTransfer.setDragImage) {
        e.dataTransfer.setDragImage(img, img.width / 2, img.height / 2);
      }
      e.dataTransfer.setData("text/plain", String(idx));
    } catch {
      /* ignore */
    }
  };

  const onDragOver = (idx) => (e) => {
    e.preventDefault(); // allow drop
    if (overIndex !== idx) setOverIndex(idx);
    try {
      e.dataTransfer.dropEffect = "move";
    } catch {
      /* ignore */
    }
  };

  const onDrop = (idx) => (e) => {
    e.preventDefault();
    let from = dragIndex;
    if (from == null) {
      const raw = e.dataTransfer?.getData?.("text/plain");
      const parsed = Number(raw);
      if (!Number.isNaN(parsed)) from = parsed;
    }
    if (from == null || from === idx) {
      setOverIndex(null);
      setDragIndex(null);
      setDragId(null);
      return;
    }

    // Measure BEFORE changing order
    prevRectsRef.current = measureRects();
    needAnimateRef.current = true;

    // Apply new order
    setOrder((prev) => {
      const next = prev.slice();
      const [moved] = next.splice(from, 1);
      next.splice(idx, 0, moved);
      return next;
    });

    setOverIndex(null);
    setDragIndex(null);
    setDragId(null);
  };

  const onDragEnd = () => {
    setOverIndex(null);
    setDragIndex(null);
    setDragId(null);
  };

  // Confirm returns only the ids in the new order
  const handleConfirm = () => {
    if (typeof selectedCardsOrder !== "function" || order.length === 0) return;
    selectedCardsOrder(order.map((c) => c.id));
  };

  // Modal UI (portal). Panel/grid sizing handled by CSS via [data-cols].
  return (
    <>
      createPortal(
      <div className="odp-modal" role="dialog" aria-modal="true">
        <div className="odp-overlay" />
        <div className="odp-panel" data-cols={COLS}>
          <div className="odp-header">
            <h3 className="odp-title">{text}</h3>
          </div>

          <div className="odp-content">
            {order.length > 0 ? (
              <>
                <div className="odp-grid" data-cols={COLS}>
                  {order.map((card, idx) => {
                    const key = getKey(card);
                    const src = CARDS_MAP[card.name];
                    const isOver = overIndex === idx;
                    const isDragging = dragId === key;

                    return (
                      <button
                        ref={setItemRef(key)}
                        key={key}
                        className={[
                          "odp-card",
                          isOver ? "is-drop-target" : "",
                          isDragging ? "is-dragging" : "",
                        ].join(" ")}
                        title={card.name}
                        type="button"
                        draggable
                        onDragStart={onDragStart(idx)}
                        onDragOver={onDragOver(idx)}
                        onDrop={onDrop(idx)}
                        onDragEnd={onDragEnd}
                      >
                        <img
                          src={src}
                          alt={`Card ${card.name}`}
                          className="odp-card-img"
                          draggable={false}
                        />
                      </button>
                    );
                  })}
                </div>

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
      </div>
      , document.body );
    </>
  );
}
