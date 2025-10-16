import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./OwnCards.css";
import { CARDS_MAP } from "../generalMaps.js";
import DiscardButton from "./DiscardButton/DiscardButton";
import NoActionButton from "./NoActionButton/NoActionButton";
import DrawRegularCardButton from "./DrawRegularCardButton/DrawRegularCardButton.jsx";
import PlayCardsButton from "./PlayButton/PlayCardsButton.jsx";

export default function OwnCards({
  cards = [],
  className = "",
  turnStatus = "waiting",
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  console.log("OwnCards render", { turnStatus });
  useEffect(() => {
    setSelectedIds(new Set());
  }, [cards, turnStatus]);

  const canSelect =
    turnStatus === "playing" ||
    turnStatus === "discarding" ||
    turnStatus === "discardingOpt";

  const toggleSelect = useCallback(
    (id) => {
      if (!canSelect) return;
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [canSelect]
  );

  const selectedArray = Array.from(selectedIds);

  return (
    <div className={`owncards-overlay ${className}`} aria-label="cards-row">
      <div className="owncards-row">
        <AnimatePresence initial={false}>
          {cards.map(({ id, name }) => {
            const isSelected = selectedIds.has(id);
            const disabledClass = canSelect ? "" : "owncards-card--disabled";

            const imgSrc = CARDS_MAP[name];
            if (!imgSrc) {
              console.warn(`⚠️ Missing entry in CARDS_MAP for name: "${name}"`);
            }

            return (
              <motion.div
                key={id}
                layout
                initial={{ opacity: 0, y: 60, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -60, scale: 0.9 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 28,
                }}
              >
                <img
                  src={imgSrc || ""}
                  alt={`Card ${name}`}
                  className={`owncards-card ${
                    isSelected ? "owncards-card--selected" : ""
                  } ${disabledClass}`}
                  width={130}
                  height={198}
                  draggable={false}
                  onClick={() => toggleSelect(id)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="owncards-actions">
        {turnStatus === "playing" &&
          (selectedArray.length === 0 ? (
            <NoActionButton />
          ) : (
            <PlayCardsButton
              selectedCards={selectedArray}
              onPlaySuccess={() => setSelectedIds(new Set())}
            />
          ))}

        {turnStatus === "discarding" ||
          (turnStatus === "discardingOpt" && (
            <DiscardButton
              selectedCards={selectedArray}
              handSize={cards.length}
              onDiscardSuccess={() => setSelectedIds(new Set())}
            />
          ))}

        {turnStatus === "drawing" && (
          <DrawRegularCardButton
            isDrawCardPhase={true}
            playerCardCount={cards.length}
          />
        )}
      </div>
    </div>
  );
}
