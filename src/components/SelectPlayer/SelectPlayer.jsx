import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AVATAR_MAP } from "../Board/PlayerBadge/playerBadgeConstants";
import "./SelectPlayer.css"

export default function SelectPlayer({
  actualPlayerId,
  players = [],
  selectedPlayerId,
  text = "",
}) {
  const [chosenId, setChosenId] = useState(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
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

        <button
          className="selectplayer-confirm"
          onClick={handleConfirm}
          disabled={chosenId == null}
        >
          Confirm
        </button>
      </motion.div>
    </div>
  );
}
