import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./GameEndSreen.css";

export default function GameEndScreen({ websocket }) {
  const [gameEndData, setGameEndData] = useState(null);
  const navigate = useNavigate();

  // Websocket
  useEffect(() => {
    if (!websocket) return;

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.event === "gameEnded") {
          console.log("🏁 Game end detected");
          setGameEndData({
            players: data.payload,
          });
        }
      } catch (error) {
        console.error("❌ Error parsing WebSocket message:", error);
      }
    };

    websocket.addEventListener("message", handleMessage);

    return () => {
      websocket.removeEventListener("message", handleMessage);
    };
  }, [websocket]);

  const handleBackToHome = () => {
    setGameEndData(null);
    navigate("/");
  };

  // if didnt get any data, dont show anything
  if (!gameEndData || !gameEndData.players || gameEndData.players.length === 0) {
    return null;
  }

  // Define booleans to define title
  const players = gameEndData.players;

  const hasmurderer = players.some(
    (player) => player.role && player.role.toLowerCase() === "murderer"
  );
  const hasAccomplice = players.some(
    (player) => player.role && player.role.toLowerCase() === "accomplice"
  );
  const detectiveCount = players.filter(
    (player) => player.role && player.role.toLowerCase() === "detective"
  ).length;

  // Define title
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

  // Assign color by role
  const getRoleColor = (role) => {
    if (!role) return "#cccccc";
    switch (role.toLowerCase()) {
      case "detective":
        return "#ffffff";
      case "murderer":
        return "#e74c3c";
      case "accomplice":
        return "#ff8c00";
      default:
        return "#cccccc";
    }
  };

  // Assign badge by role
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
          <div className="winners-section">
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
                            : "#ffffff",
                      }}
                    >
                      {getRoleBadge(player.role)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
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
