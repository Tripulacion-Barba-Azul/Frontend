import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import ViewSet from "./ViewSet/ViewSet";
import "./SetsGrid.css";

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

/**
 * SetsGrid
 *
 * props:
 * - sets: [{ setId: int, setName: string, cards: [{ id, name }] }, ...]
 * - position: "horizontal" | "vertical" | "doubleHorizontal"
 *
 * Behavior:
 * - if sets is empty or not an array -> returns null (renders nothing)
 * - horizontal: make rows of up to 10 items (each row is centered)
 * - vertical: make columns of up to 10 items (each column centered; columns are centered as a group)
 * - doubleHorizontal: single row, grows horizontally (no 10-per-row split), horizontal scroll if needed
 * - spacing between buttons is minimal; overrides ViewSet's default button margin inside this grid
 */
export default function SetsGrid({ sets = [], position = "horizontal" }) {
  if (!Array.isArray(sets) || sets.length === 0) return null;

  const pos = position || "horizontal";

  const motionProps = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 0.95 },
    transition: { type: "spring", stiffness: 100, damping: 40 },
  };

  if (pos === "doubleHorizontal") {
    return (
      <div className="sets-grid sets-double-horizontal" data-position={pos}>
        <div className="sets-single-row" role="list">
          <AnimatePresence>
            {sets.map((s, idx) => (
              <motion.div
                {...motionProps}
                key={s.setId ?? s.setName ?? idx}
                className="sets-item"
                role="listitem"
              >
                <ViewSet cards={s.cards} setName={s.setName} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  if (pos === "horizontal") {
    const rows = chunkArray(sets, 4);
    return (
      <div className="sets-grid sets-horizontal" data-position={pos}>
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="sets-row" role="list">
            <AnimatePresence>
              {row.map((s, idx) => (
                <motion.div
                  {...motionProps}
                  key={s.setId ?? s.setName ?? `${rowIndex}-${idx}`}
                  className="sets-item"
                  role="listitem"
                >
                  <ViewSet cards={s.cards} setName={s.setName} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ))}
      </div>
    );
  }

  if (pos === "vertical") {
    const cols = chunkArray(sets, 4);
    return (
      <div className="sets-grid sets-vertical" data-position={pos}>
        {cols.map((col, colIndex) => (
          <div key={colIndex} className="sets-column" role="list">
            <AnimatePresence>
              {col.map((s, idx) => (
                <motion.div
                  {...motionProps}
                  key={s.setId ?? s.setName ?? `${colIndex}-${idx}`}
                  className="sets-item"
                  role="listitem"
                >
                  <ViewSet cards={s.cards} setName={s.setName} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
