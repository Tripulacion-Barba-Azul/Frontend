import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import "./OwnCards.css";
import { CARDS_MAP } from "../generalMaps.js";
import DiscardButton from "./DiscardButton/DiscardButton";
import NoActionButton from "./NoActionButton/NoActionButton";
import PlayCardsButton from "./PlayButton/PlayCardsButton.jsx";

export default function OwnCards({
  cards = [],
  className = "",
  turnStatus = "waiting",
  socialDisgrace = false,
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [orderedCards, setOrderedCards] = useState(cards);
  const dragStart = useRef(null);

  useEffect(() => {
    setOrderedCards((prev) => {
      const prevIds = prev.map((c) => c.id);
      const newOnes = cards.filter((c) => !prevIds.includes(c.id));
      const stillPresent = prev.filter((c) => cards.some((n) => n.id === c.id));
      return [...stillPresent, ...newOnes];
    });
  }, [cards]);

  useEffect(() => setSelectedIds(new Set()), [cards, turnStatus]);

  const isDrawingPhase = turnStatus === "drawing";
  const isForcedDiscard =
    socialDisgrace && !isDrawingPhase && !(turnStatus === "waiting");

  const canSelect =
    isForcedDiscard ||
    turnStatus === "playing" ||
    turnStatus === "discarding" ||
    turnStatus === "discardingOpt";

  const toggleSelect = useCallback(
    (id) => {
      if (!canSelect) return;
      setSelectedIds((prev) => {
        if (isForcedDiscard) {
          if (prev.has(id)) {
            const next = new Set(prev);
            next.delete(id);
            return next;
          }
          return new Set([id]);
        }
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [canSelect, isForcedDiscard]
  );

  const selectedArray = Array.from(selectedIds);

  const handleReorder = (newOrderIds) => {
    setOrderedCards(
      newOrderIds.map((id) => cards.find((c) => c.id === id)).filter(Boolean)
    );
  };

  return (
    <div className={`owncards-overlay ${className}`} aria-label="cards-row">
      <Reorder.Group
        as="div"
        axis="x"
        values={orderedCards.map((c) => c.id)}
        onReorder={handleReorder}
        className="owncards-row"
      >
        <AnimatePresence initial={false}>
          {orderedCards.map(({ id, name }) => {
            const isSelected = selectedIds.has(id);
            const disabledClass = canSelect ? "" : "owncards-card--disabled";
            const imgSrc = CARDS_MAP[name];

            return (
              <Reorder.Item
                key={id}
                value={id}
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
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    duration: 0.1,
                    ease: "easeOut",
                  }}
                >
                  <img
                    src={imgSrc}
                    alt={`Card ${name}`}
                    className={`owncards-card ${
                      isSelected ? "owncards-card--selected" : ""
                    } ${disabledClass}`}
                    width={140}
                    height="auto"
                    draggable={false}
                    onPointerDown={(e) => {
                      dragStart.current = { x: e.clientX, y: e.clientY };
                    }}
                    onPointerUp={(e) => {
                      if (!dragStart.current) return;
                      const dx = Math.abs(e.clientX - dragStart.current.x);
                      const dy = Math.abs(e.clientY - dragStart.current.y);
                      const moved = Math.sqrt(dx * dx + dy * dy);
                      if (moved < 8) toggleSelect(id);
                      dragStart.current = null;
                    }}
                  />
                </motion.div>
              </Reorder.Item>
            );
          })}
        </AnimatePresence>
      </Reorder.Group>

      <div className="owncards-actions">
        {isForcedDiscard ? (
          <DiscardButton
            selectedCards={selectedArray}
            handSize={cards.length}
            requireExactlyOne={true}
            onDiscardSuccess={() => setSelectedIds(new Set())}
          />
        ) : (
          <>
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
                requireAtLeastOne={turnStatus === "discarding"}
                onDiscardSuccess={() => setSelectedIds(new Set())}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
