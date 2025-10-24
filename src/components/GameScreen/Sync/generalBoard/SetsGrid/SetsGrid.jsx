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
 * - sets: [{ setId, setName, cards: [...] }, ...]
 * - position: "horizontal" | "vertical" | "doubleHorizontal" | "vertical-left" | "vertical-right"
 */
export default function SetsGrid({ sets = [], position = "horizontal" }) {
  if (!Array.isArray(sets) || sets.length === 0) return null;

  const pos = position || "horizontal";

  const motionProps = {
    initial: { opacity: 0, y: 8, scale: 0.985 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -8, scale: 0.985 },
    transition: { type: "spring", stiffness: 320, damping: 32 },
  };

  // doubleHorizontal: one centered row
  if (pos === "doubleHorizontal") {
    return (
      <div className="sets-grid sets-double-horizontal" data-position={pos}>
        <div className="sets-single-row" role="list">
          <AnimatePresence initial={false} mode="popLayout">
            {sets.map((s, idx) => (
              <motion.div
                {...motionProps}
                layout
                key={s.setId ?? s.setName ?? idx}
                className="sets-item"
                role="listitem"
                style={{ willChange: "transform, opacity" }}
              >
                <ViewSet cards={s.cards} setName={s.setName} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // horizontal: rows of up to 4
  if (pos === "horizontal") {
    const rows = chunkArray(sets, 4);
    return (
      <div className="sets-grid sets-horizontal" data-position={pos}>
        <AnimatePresence initial={false} mode="popLayout">
          {rows.map((row, rowIndex) => (
            <motion.div layout key={`row-${rowIndex}`} className="sets-row-wrapper" role="list">
              <div className="sets-row">
                {row.map((s, idx) => (
                  <motion.div
                    {...motionProps}
                    layout
                    key={s.setId ?? s.setName ?? `${rowIndex}-${idx}`}
                    className="sets-item"
                    role="listitem"
                    style={{ willChange: "transform, opacity" }}
                  >
                    <ViewSet cards={s.cards} setName={s.setName} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }


  if (pos === "vertical") {
    const cols = chunkArray(sets, 4);
    return (
      <div className="sets-grid sets-vertical" data-position={pos}>
        <AnimatePresence initial={false} mode="popLayout">
          {cols.map((col, colIndex) => (
            <motion.div layout key={`col-${colIndex}`} className="sets-column" role="list">
              {col.map((s, idx) => (
                <motion.div
                  {...motionProps}
                  layout
                  key={s.setId ?? s.setName ?? `${colIndex}-${idx}`}
                  className="sets-item"
                  role="listitem"
                  style={{ willChange: "transform, opacity" }}
                >
                  <ViewSet cards={s.cards} setName={s.setName} />
                </motion.div>
              ))}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  if (pos === "vertical-left" || pos === "vertical-right") {
    const cols = chunkArray(sets, 4);
    const className = `sets-grid sets-${pos}`;
    return (
      <div className={className} data-position={pos}>
        <AnimatePresence initial={false} mode="popLayout">
          {cols.map((col, colIndex) => (
            <motion.div layout key={`vcol-${colIndex}`} className="sets-column" role="list">
              {col.map((s, idx) => (
                <motion.div
                  {...motionProps}
                  layout
                  key={s.setId ?? s.setName ?? `${colIndex}-${idx}`}
                  className="sets-item"
                  role="listitem"
                  style={{ willChange: "transform, opacity" }}
                >
                  <ViewSet cards={s.cards} setName={s.setName} />
                </motion.div>
              ))}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  return null;
}
