import React from "react";
import "./PlayerBadge.css";
import {
  sizes,
  ringColors,
  nameBgColors,
  avatarMap,
} from "./playerBadgeConstants.js";

export default function PlayerBadge({
  name = "Jugador",
  avatar = "default1",
  size = "small",
  ringColor = "black",
  nameBgColor = "white",
}) {
  const circleSize = sizes[size] ?? sizes.small;
  const ringCol = ringColors[ringColor] ?? ringColors.black;
  const nameBgCol = nameBgColors[nameBgColor] ?? nameBgColors.white;
  const avatarSrc = avatarMap[avatar] ?? avatarMap.default1;

  return (
    <div className="player-badge">
      {/* Name box with background color */}
      <span className="player-name-box" style={{ ["--name-bg"]: nameBgCol }}>
        {name}
      </span>

      {/* Avatar circle with ring color */}
      <div
        className={`avatar-circle ${circleSize}`}
        style={{ ["--tw-ring-color"]: ringCol }}
        aria-label={`Avatar of ${name}`}
      >
        {
          <img
            src={avatarSrc}
            alt={`Avatar of ${name}`}
            className="avatar-img"
          />
        }
      </div>
    </div>
  );
}
