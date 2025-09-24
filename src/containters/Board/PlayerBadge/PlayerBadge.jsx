import React from "react";
import "./PlayerBadge.css";

export default function PlayerBadge({
  name = "Jugador",
  src,
  size = "small",
  ringColor = "black",
}) {
  const sizes = {
    big: "badge-big",
    small: "badge-small",
  };
  const colors = {
    black: "rgb(51 65 85 / 0.70)",
    green: "rgb(34 197 94 / 0.70)",
    red: "rgb(239 68 68 / 0.70)",
    blue: "rgb(59 130 246 / 0.70)",
    yellow: "rgb(234 179 8 / 0.70)",
    purple: "rgb(168 85 247 / 0.70)",
    pink: "rgb(236 72 153 / 0.70)",
    gray: "rgb(107 114 128 / 0.70)",
  };

  const circleSize = sizes[size] ?? sizes.small;
  const ringCol = colors[ringColor] ?? colors.black;

  return (
    <div className="player-badge">
      {/* Name */}
      <span className="player-name">{name}</span>

      {/* Avatar */}
      <div
        className={`avatar-circle ${circleSize}`}
        style={{ ["--tw-ring-color"]: ringCol }}
      >
        {src ? (
          <img src={src} alt={`Avatar de ${name}`} className="avatar-img" />
        ) : (
          <span className="avatar-placeholder">?</span>
        )}
      </div>
    </div>
  );
}
