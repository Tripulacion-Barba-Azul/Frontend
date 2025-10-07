import React, { useState, useCallback, useEffect } from "react";
import "./OwnCards.css";
import { CARDS_MAP } from "../generalMaps.js";
import DiscardButton from "./DiscardButton/DiscardButton";
import DrawRegularCardButton from "./DrawRegularCardButton/DrawRegularCardButton.jsx";

export default function OwnCards({
  cardIds = [],
  className = "",
  turnStatus = "waiting", // "waiting" | "playing" | "discarding" | "drawing"
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());

  // keep selected set trimmed if cardIds prop changes
  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) =>
        cardIds.some((card) => card.cardID === id)
      ));
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
        {cardIds.map(({ cardID, cardName }) => {
          const isSelected = selectedIds.has(cardID);
          const disabledClass = canSelect ? "" : "owncards-card--disabled";

          const imgSrc = CARDS_MAP[cardName];
          if (!imgSrc) {
            console.warn(`⚠️ Missing entry in CARDS_MAP for cardName: "${cardName}"`);
          }

          return (
            <img
              key={cardID}
              src={imgSrc || ""}
              alt={`Card ${cardName}`}
              className={`owncards-card ${
                isSelected ? "owncards-card--selected" : ""
              } ${disabledClass}`}
              width={130}
              height={198}
              draggable={false}
              onClick={() => toggleSelect(cardID)}
            />
          );
        })}
      </div>

      {/* Action placeholders — no functionality */}
      <div className="owncards-actions">
        {turnStatus === "playing" &&
          (selectedArray.length === 0 ? (
            <button className="owncards-action">Play nothing</button>
          ) : (
            <button className="owncards-action">
              Play ({selectedArray.length})
            </button>
          ))}

        {turnStatus === "discarding" && (
          <DiscardButton
            selectedCards={selectedArray}
            handSize={cardIds.length}
            onDiscardSuccess={() => setSelectedIds(new Set())}
          />
        )}

        {turnStatus === "drawing" && (
          <DrawRegularCardButton
          isDrawCardPhase={true}
          playerCardCount={cardIds.length}
        />
        )}
      </div>
    </div>
  );
}