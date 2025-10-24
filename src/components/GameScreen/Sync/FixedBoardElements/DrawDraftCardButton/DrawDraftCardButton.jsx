// DrawDraftCardButton.jsx

/**
 * @file DrawDraftCardButton.jsx
 * @description Shows the visible draft cards and lets the current player draw one (by position).
 *
 * === Canonical shapes (from API DOCUMENT) ===
 * @typedef {"waiting"|"playing"|"discarding"|"discardingOpt"|"drawing"} TurnStatus
 * @typedef {{ id:number, name:string }} SimpleCard
 *
 * === Props ===
 * @typedef {Object} DrawDraftCardButtonProps
 * @property {SimpleCard[]} [cards=[]] - Current draft cards (visible to everyone).
 * @property {TurnStatus} [turnStatus="waiting"] - Controls whether drawing is enabled.
 *
 * Notes:
 * - On click, POSTs to `/play/:gameId/actions/draw-card` with { playerId, deck:"draft", order }.
 * - `order` is 1-based index within `cards`.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useSearchParams } from "react-router-dom";
import "./DrawDraftCardButton.css";
import { CARDS_MAP } from "../../../../../utils/generalMaps";

/** @param {DrawDraftCardButtonProps} props */
export default function DrawDraftCardButton({
  cards = [],
  turnStatus = "waiting",
}) {
  const [searchParams] = useSearchParams();
  const { gameId } = useParams();
  const playerId = searchParams.get("playerId");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canDraw = turnStatus === "drawing" && !loading;

  const handleCardClick = async (cardId) => {
    setError("");
    if (!canDraw) return;

    // 1-based order of the selected card within the row
    const cardOrder = cards.findIndex((card) => card.id === cardId) + 1;

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/play/${gameId}/actions/draw-card`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: Number(playerId),
            deck: "draft",
            order: cardOrder,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Draw failed with status ${response.status}`);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to draw");
    } finally {
      setLoading(false);
    }
  };

  // Nothing to render without cards
  if (!cards || cards.length === 0) {
    console.log(`Empty draftCard: ${cards}`);
    return null;
  }

  return (
    <div className="draw-draft-card-container">
      <div className="draft-cards-row">
        {cards.map((card, index) => (
          <AnimatePresence key={index} mode="wait">
            <motion.div
              key={card.id}
              layout
              initial={{ opacity: 0, y: -60, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            >
              <img
                src={(() => {
                  const imgSrc = CARDS_MAP[card.name];
                  if (!imgSrc) {
                    console.warn(
                      `⚠️ Missing entry in CARDS_MAP for name: "${card.name}"`
                    );
                  }
                  return imgSrc || "";
                })()}
                alt={`Draft Card ${card.name}`}
                className={`draft-card ${
                  turnStatus === "drawing" && !loading
                    ? "draft-card--enabled"
                    : "draft-card--disabled"
                }`}
                onClick={() => handleCardClick(card.id)}
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>
        ))}
      </div>
      {error && <div className="draft-card-error">{error}</div>}
    </div>
  );
}
