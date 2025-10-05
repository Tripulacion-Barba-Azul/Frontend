import React, { useState, useCallback, useEffect } from "react";
import "./OwnCards.css";
import { CARD_SRC } from "./ownCardsConstants.js";
import DiscardButton from "./DiscardButton/DiscardButton";

function validateCardIds(cardIds) {
  if (!Array.isArray(cardIds)) return false;
  if (cardIds.length > 6) return false;
  return cardIds.every((id) => Number.isInteger(id) && id >= 7 && id <= 27);
}

export default function OwnCards({
  cardIds = [],
  className = "",
  turnStatus = "waiting" // "waiting" | "playing" | "discarding" | "drawing"
}) {
  if (!validateCardIds(cardIds)) {
    throw new Error("Invalid array of cards");
  }

  const [selectedIds, setSelectedIds] = useState(new Set());

  // keep selected set trimmed if cardIds prop changes
  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => cardIds.includes(id)));
      return next;
    });
  }, [cardIds]);

  const canSelect = turnStatus === "playing" || turnStatus === "discarding";

  const toggleSelect = useCallback(
    (id) => {
      if (!canSelect) return; // selection disabled in "waiting" and "drawing"
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
        {cardIds.map((id) => {
          const isSelected = selectedIds.has(id);
          const disabledClass = canSelect ? "" : "owncards-card--disabled";
          return (
            <img
              key={id}
              src={CARD_SRC[id]}
              alt={`Card ${id}`}
              className={`owncards-card ${isSelected ? "owncards-card--selected" : ""} ${disabledClass}`}
              width={130}
              height={198}
              draggable={false}
              onClick={() => toggleSelect(id)}
            />
          );
        })}
      </div>

      {/* Action placeholders — minimal, no functionality */}
      <div className="owncards-actions">
        {turnStatus === "playing" && (
          selectedArray.length === 0 ? (
            <button className="owncards-action">Play nothing</button>
          ) : (
            <button className="owncards-action">Play ({selectedArray.length})</button>
          )
        )}

        {turnStatus === "discarding" && (
          <DiscardButton
          selectedCards={selectedArray}     
          handSize={cardIds.length}        
          onDiscardSuccess={() => setSelectedIds(new Set())} 
        />
        )}

        {turnStatus === "drawing" && (
          <button className="owncards-action">Draw 1 from deck</button>
        )}
      </div>
    </div>
  );
}