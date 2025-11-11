// SelectPlayer.jsx

/**
 * @file SelectPlayer.jsx
 * @description Modal grid to pick a player (returns the selected player's id).
 *
 * === Canonical shapes (from API DOCUMENT) ===
 * @typedef {"waiting"|"playing"|"discarding"|"discardingOpt"|"drawing"} TurnStatus
 *
 * @typedef {{ id:number, revealed:boolean, name:(string|null) }} PublicSecret
 *
 * @typedef {{ id:number, name:string }} DetectiveCard
 *
 * @typedef {{ setId:number, setName:string, cards:DetectiveCard[] }} DetectiveSet
 *
 * @typedef {{
 *   id:number,
 *   name:string,
 *   avatar:number,
 *   socialDisgrace:boolean,
 *   turnOrder:number,
 *   turnStatus:TurnStatus,
 *   cardCount:number,
 *   secrets:PublicSecret[],
 *   sets:DetectiveSet[]
 * }} PublicPlayer
 *
 * === Props ===
 * @typedef {Object} SelectPlayerProps
 * @property {number|string} actualPlayerId - Current user's id (to tag "(you)").
 * @property {PublicPlayer[]} [players=[]] - Player list to render as choices.
 * @property {(id:number|string)=>void} selectedPlayerId - Called on confirm with the chosen id.
 * @property {(() => void)|null} [goBack] - Optional “back” handler; if omitted, back button is hidden.
 * @property {string} [text=""] - Prompt text shown above the grid.
 */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AVATAR_MAP } from "../../../../../utils/generalMaps";
import "./SelectPlayer.css";

/** @param {SelectPlayerProps} props */
export default function SelectPlayer({
  actualPlayerId,
  players = [],
  selectedPlayerId,
  goBack, // NEW: optional back handler
  text = "",
}) {
  const [chosenId, setChosenId] = useState(null);

  // Lock page scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleConfirm = () => {
    if (chosenId != null) selectedPlayerId(chosenId);
  };

  return (
    <div className="selectplayer-overlay">
      <motion.div
        className="selectplayer-content"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.1 }}
      >
        <h2 className="selectplayer-text">{text}</h2>

        <div className="selectplayer-grid">
          {players.map((player) => {
            const isSelected = chosenId === player.id;
            const isActual = player.id === actualPlayerId;

            return (
              <motion.div
                key={player.id}
                className={`selectplayer-item ${isSelected ? "selected" : ""}`}
                onClick={() => setChosenId(player.id)}
                whileHover={{ scale: 1.08 }}
                animate={{ scale: isSelected ? 1.08 : 1 }}
                transition={{ type: "spring", stiffness: 30000, damping: 5 }}
              >
                <img
                  src={AVATAR_MAP[player.avatar] || AVATAR_MAP[1]}
                  alt={player.name}
                  className="selectplayer-avatar"
                />
                <div className="selectplayer-name">
                  {isActual ? `${player.name} (you)` : player.name}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Actions row: Back (optional) + Confirm */}
        <div className="selectplayer-actions">
          {goBack && (
            <button className="selectplayer-back" onClick={goBack}>
              Go Back
            </button>
          )}
          <button
            className="selectplayer-confirm"
            onClick={handleConfirm}
            disabled={chosenId == null}
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  );
}
