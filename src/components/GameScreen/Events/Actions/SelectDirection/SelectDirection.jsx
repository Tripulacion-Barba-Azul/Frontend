// SelectDirection.jsx

/**
 * @file SelectDirection.jsx
 * @description Modal component to select a direction ("left" or "right") by showing adjacent players.
 *
 * === Props ===
 * @typedef {Object} SelectDirectionProps
 * @property {number|string} playerId - Current user's id (to find adjacent players).
 * @property {PublicPlayer[]} players - Player list with turnOrder to determine left/right players.
 * @property {string} text - Prompt text shown above the selection.
 * @property {(direction: "left"|"right") => void} selectedDirection - Callback with the chosen direction.
 */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AVATAR_MAP } from "../../../../../utils/generalMaps";
import "./SelectDirection.css";

/** @param {SelectDirectionProps} props */
export default function SelectDirection({
  playerId,
  players,
  text,
  selectedDirection,
}) {
  const [chosenDirection, setChosenDirection] = useState(null);

  // Lock page scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Find the current player and adjacent players
  const currentPlayer = players.find(player => player.id === playerId);
  const totalPlayers = players.length;
  
  // Find left and right players based on turnOrder
  let leftPlayer = null;
  let rightPlayer = null;
  
  if (currentPlayer && totalPlayers > 1) {
    const currentTurnOrder = currentPlayer.turnOrder;
    
    // Left player (previous turn order, with wrap-around)
    const leftTurnOrder = currentTurnOrder === 1 ? totalPlayers : currentTurnOrder - 1;
    leftPlayer = players.find(player => player.turnOrder === leftTurnOrder);
    
    // Right player (next turn order, with wrap-around)
    const rightTurnOrder = currentTurnOrder === totalPlayers ? 1 : currentTurnOrder + 1;
    rightPlayer = players.find(player => player.turnOrder === rightTurnOrder);
  }

  const handleConfirm = () => {
    if (chosenDirection != null) {
      selectedDirection(chosenDirection);
    }
  };

  return (
    <div className="selectdirection-overlay">
      <motion.div
        className="selectdirection-content"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.1 }}
      >
        <h2 className="selectdirection-text">{text}</h2>

        <div className="selectdirection-grid">
          {/* Left Player */}
          <motion.div
            className={`selectdirection-item ${chosenDirection === "left" ? "selected" : ""}`}
            onClick={() => setChosenDirection("left")}
            whileHover={{ scale: 1.08 }}
            animate={{ scale: chosenDirection === "left" ? 1.08 : 1 }}
            transition={{ type: "spring", stiffness: 30000, damping: 5 }}
          >
            <div className="selectdirection-direction-label">LEFT</div>
            <div className="selectdirection-icon">
              <svg
                width="80"
                height="80"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M60 20L25 50L60 80"
                  stroke="#f4e1a3"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            {leftPlayer && (
              <>
                <img
                  src={AVATAR_MAP[leftPlayer.avatar] || AVATAR_MAP[1]}
                  alt={leftPlayer.name}
                  className="selectdirection-avatar"
                />
                <div className="selectdirection-player-name">{leftPlayer.name}</div>
              </>
            )}
          </motion.div>

          {/* Right Player */}
          <motion.div
            className={`selectdirection-item ${chosenDirection === "right" ? "selected" : ""}`}
            onClick={() => setChosenDirection("right")}
            whileHover={{ scale: 1.08 }}
            animate={{ scale: chosenDirection === "right" ? 1.08 : 1 }}
            transition={{ type: "spring", stiffness: 30000, damping: 5 }}
          >
            <div className="selectdirection-direction-label">RIGHT</div>
            <div className="selectdirection-icon">
              <svg
                width="80"
                height="80"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M40 20L75 50L40 80"
                  stroke="#f4e1a3"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            {rightPlayer && (
              <>
                <img
                  src={AVATAR_MAP[rightPlayer.avatar] || AVATAR_MAP[1]}
                  alt={rightPlayer.name}
                  className="selectdirection-avatar"
                />
                <div className="selectdirection-player-name">{rightPlayer.name}</div>
              </>
            )}
          </motion.div>
        </div>

        <button
          className="selectdirection-confirm"
          onClick={handleConfirm}
          disabled={chosenDirection == null}
        >
          Confirm
        </button>
      </motion.div>
    </div>
  );
}