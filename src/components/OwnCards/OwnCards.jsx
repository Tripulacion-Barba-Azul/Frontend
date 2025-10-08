import React, { useState, useCallback, useEffect } from "react";
import "./OwnCards.css";
import { CARDS_MAP } from "../generalMaps.js";
import DiscardButton from "./DiscardButton/DiscardButton";
import DrawRegularCardButton from "./DrawRegularCardButton/DrawRegularCardButton.jsx";

export default function OwnCards({
  cards = [],
  className = "",
  turnStatus = "playing", // "waiting" | "playing" | "discarding" | "drawing"
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

  const canSelect = "playing" === "playing" || turnStatus === "discarding";

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
    <div>
      <div
        className={`owncards-wrapper ${className}`}
        aria-label="own-cards-area"
      >
        <div className="owncards-row">
          {cards.map((card) => {
            const isSelected = selectedIds.has(card.id);
            const disabledClass = canSelect ? "" : "owncards-card--disabled";

            const imgSrc = CARDS_MAP[card.name];
            if (!imgSrc) {
              console.warn(
                `⚠️ Missing entry in CARDS_MAP for name: "${card.name}"`
              );
            }

            return (
              <img
                key={card.id}
                src={imgSrc || ""}
                alt={`Card ${card.name}`}
                className={`owncards-card ${
                  isSelected ? "owncards-card--selected" : ""
                } ${disabledClass}`}
                width={130}
                height={198}
                draggable={false}
                onClick={() => toggleSelect(card.id)}
              />
            );
          })}
        </div>
      </div>
      {/* Action placeholders — no functionality */}
      <div className="owncards-actions">
        {"playing" === "playing" &&
          (selectedArray.length === 0 ? (
            <button className="owncards-action">Play nothing</button>
          ) : (
            <button className="owncards-action">
              Play ({selectedArray.length})
            </button>
          ))}

        {"" === "discarding" && (
          <DiscardButton
            selectedCards={selectedArray}
            handSize={cards.length}
            onDiscardSuccess={() => setSelectedIds(new Set())}
          />
        )}

        {"" === "drawing" && (
          <DrawRegularCardButton
            isDrawCardPhase={true}
            playerCardCount={cards.length}
          />
        )}
      </div>
    </div>
  );
}
