// GameEndSreen.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./GameEndSreen.css";

/**
 * @component GameEndScreen
 * @description Listens to WebSocket game-end events and displays a winners overlay.
 *
 * Props:
 * @param {Object}   props
 * @param {WebSocket|null} props.websocket - Active WebSocket connection. When it receives
 *   an event with { event: "gameEnded", payload: Winner[] } the popup is shown.
 *
 * Notes:
 * - The exact shape of the "gameEnded" payload is defined in the API DOCUMENT.
 * - This component is passive until a valid "gameEnded" message arrives.
 * - It cleans up the WebSocket "message" listener on unmount.
 */
export default function GameEndScreen({ websocket }) {
  // Local snapshot of end-game data; null means "no popup"
  const [gameEndData, setGameEndData] = useState(null);
  const navigate = useNavigate();

  // Subscribe to WebSocket "message" and handle "gameEnded" events
  useEffect(() => {
    if (!websocket) return;

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // According to API DOCUMENT: event === "gameEnded" carries winners in payload
        if (data.event === "gameEnded") {
          console.log("🏁 Game end detected");
          setGameEndData({
            players: data.payload, // keep as-is; rendering below uses this array
          });
        }
      } catch (error) {
        // Defensive: any non-JSON payloads are ignored
        console.error("❌ Error parsing WebSocket message:", error);
      }
    };

    websocket.addEventListener("message", handleMessage);

    return () => {
      // Ensure we detach the exact handler instance
      websocket.removeEventListener("message", handleMessage);
    };
  }, [websocket]);

  // CTA: clear local state and go back to home screen
  const handleBackToHome = () => {
    setGameEndData(null);
    navigate("/");
  };

  // If we never received valid data, render nothing (no overlay)
  if (
    !gameEndData ||
    !gameEndData.players ||
    gameEndData.players.length === 0
  ) {
    return null;
  }

  // Convenience references
  const players = gameEndData.players;

  // Title flags derived from winners' roles (labels kept as in original UI)
  const hasmurderer = players.some(
    (player) => player.role && player.role.toLowerCase() === "murderer"
  );
  const hasAccomplice = players.some(
    (player) => player.role && player.role.toLowerCase() === "accomplice"
  );
  const detectiveCount = players.filter(
    (player) => player.role && player.role.toLowerCase() === "detective"
  ).length;

  // Decide heading text (string remains exactly the same as original)
  let title = "";

  if (hasmurderer && hasAccomplice) {
    title = "Murderer Escapes!";
  } else if (hasmurderer && !hasAccomplice) {
    title = "Murderer Escapes!";
  } else if (detectiveCount > 1) {
    title = "The Murderer has been caught!";
  } else if (detectiveCount === 1) {
    title = "The Murderer has been caught!";
  }

  // UI helpers: color per role (kept 1:1 with original palette)
  const getRoleColor = (role) => {
    if (!role) return "#cccccc";
    switch (role.toLowerCase()) {
      case "detective":
        return "#f4f1b4";
      case "murderer":
        return "#d12222";
      case "accomplice":
        return "#ff5900";
      default:
        return "#cccccc";
    }
  };

  // UI helpers: badge label per role (lowercase tags)
  const getRoleBadge = (role) => {
    if (!role) return "";
    switch (role.toLowerCase()) {
      case "detective":
        return "detective";
      case "murderer":
        return "murderer";
      case "accomplice":
        return "accomplice";
      default:
        return role;
    }
  };

  return (
    <div className="game-end-overlay">
      <div className="game-end-popup">
        <div className="game-end-header">
          <h2>{title}</h2>
        </div>

        <div className="game-end-content">
          <ul className="winners-list">
            {players.map((player, index) => (
              <li key={index} className="winner-item">
                <span
                  className="winner-name"
                  style={{ color: getRoleColor(player.role) }}
                >
                  {player.name}
                </span>
                {player.role && (
                  <span
                    className="role-badge"
                    style={{
                      backgroundColor: getRoleColor(player.role),
                      color:
                        player.role.toLowerCase() === "detective"
                          ? "#000000"
                          : "#f4e1a3",
                    }}
                  >
                    {getRoleBadge(player.role)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="game-end-actions">
          <button className="btn-back-home" onClick={handleBackToHome}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
