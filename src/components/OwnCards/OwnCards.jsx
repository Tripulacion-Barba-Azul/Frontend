import React, { useState, useCallback, useEffect } from "react";
import "./OwnCards.css";
import { CARDS_MAP } from "../generalMaps.js";
import DiscardButton from "./DiscardButton/DiscardButton";
import NoActionButton from "./NoActionButton/NoActionButton";
import DrawRegularCardButton from "./DrawRegularCardButton/DrawRegularCardButton.jsx";

export default function OwnCards({
  cards = [],
  className = "",
  turnStatus = "waiting", // "waiting" | "playing" | "discarding" | "drawing"
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());

  // keep selected set trimmed if cards prop changes
  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set(
        [...prev].filter((id) => cards.some((card) => card.id === id))
      );
      return next;
    });
  }, [cards]);

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
        {cards.map(({ id, name }) => {
          const isSelected = selectedIds.has(id);
          const disabledClass = canSelect ? "" : "owncards-card--disabled";

          const imgSrc = CARDS_MAP[name];
          if (!imgSrc) {
            console.warn(`⚠️ Missing entry in CARDS_MAP for name: "${name}"`);
          }

          return (
            <img
              key={id}
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
          );
        })}
      </div>

      {/* Action placeholders — no functionality */}
      <div className="owncards-actions">
        {turnStatus === "playing" &&
          (selectedArray.length === 0 ? (
            <NoActionButton />
          ) : (
            <button className="owncards-action">
              Play ({selectedArray.length})
            </button>
          ))}

        {turnStatus === "discarding" && (
          <DiscardButton
            selectedCards={selectedArray}
            handSize={cards.length}
            onDiscardSuccess={() => setSelectedIds(new Set())}
          />
        )}

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
