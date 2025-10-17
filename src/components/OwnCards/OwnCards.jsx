import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./OwnCards.css";
import { CARDS_MAP } from "../generalMaps.js";
import DiscardButton from "./DiscardButton/DiscardButton";
import NoActionButton from "./NoActionButton/NoActionButton";
import PlayCardsButton from "./PlayButton/PlayCardsButton.jsx";

/**
 * OwnCards
 *
 * Props:
 * - cards: Array<{ id: string|number, name: string }>
 * - className?: string
 * - turnStatus: "waiting" | "playing" | "takingAction" | "discarding" | "discardingOpt" | "drawing"
 * - socialDisgrace: boolean
 *
 * Behavior:
 * - When socialDisgrace === false -> behaves EXACTLY as before.
 * - When socialDisgrace === true:
 *     - If turnStatus is one of waiting | playing | takingAction | discarding | discardingOpt,
 *       the UI is forced into a discard stage where the player must discard EXACTLY one card.
 *       Selection becomes single-select: clicking a different card replaces the previous selection;
 *       clicking the same card toggles it off.
 *     - If turnStatus === "drawing", behavior remains unchanged.
 */
export default function OwnCards({
  cards = [],
  className = "",
  turnStatus = "waiting",
  socialDisgrace = false,
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Reset selection on cards or turnStatus change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [cards, turnStatus]);

  const isDrawingPhase = turnStatus === "drawing";
  // Forced discard applies to ANY non-drawing status when socially disgraced
  const isForcedDiscard = socialDisgrace && !isDrawingPhase;

  // Selection is allowed when playing/discarding/discardingOpt,
  // and also when forced discard mode is active.
  const canSelect =
    isForcedDiscard ||
    turnStatus === "playing" ||
    turnStatus === "discarding" ||
    turnStatus === "discardingOpt";

  /**
   * Toggle/select logic:
   * - In forced single-select mode, keep at most ONE selected:
   *   - Clicking a different card selects ONLY that one.
   *   - Clicking the same card deselects (back to zero).
   * - In normal mode, toggle add/remove freely.
   */
  const toggleSelect = useCallback(
    (id) => {
      if (!canSelect) return;

      setSelectedIds((prev) => {
        if (isForcedDiscard) {
          // Single-select behavior
          if (prev.has(id)) {
            const next = new Set(prev);
            next.delete(id);
            return next; // allow zero - DiscardButton will error if none
          }
          return new Set([id]); // replace with ONLY this id
        }

        // Normal multi-select behavior
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [canSelect, isForcedDiscard]
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
              // Keep a friendly console hint instead of breaking the UI
              console.warn(`Missing entry in CARDS_MAP for name: "${name}"`);
            }

            return (
              <motion.div
                key={id}
                layout
                initial={{ opacity: 0, y: 60, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -60, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
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
        {/* Forced discard (socialDisgrace true and NOT drawing): must discard exactly ONE card */}
        {isForcedDiscard ? (
          <DiscardButton
            selectedCards={selectedArray}
            handSize={cards.length}
            requireExactlyOne={true} // strict single discard
            onDiscardSuccess={() => setSelectedIds(new Set())}
          />
        ) : (
          <>
            {/* Normal behavior preserved when not forced */}

            {turnStatus === "playing" &&
              (selectedArray.length === 0 ? (
                <NoActionButton />
              ) : (
                <PlayCardsButton
                  selectedCards={selectedArray}
                  onPlaySuccess={() => setSelectedIds(new Set())}
                />
              ))}

            {(turnStatus === "discarding" ||
              turnStatus === "discardingOpt") && (
              <DiscardButton
                selectedCards={selectedArray}
                handSize={cards.length}
                requireAtLeastOne={turnStatus === "discarding"} // mandatory vs optional
                onDiscardSuccess={() => setSelectedIds(new Set())}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
