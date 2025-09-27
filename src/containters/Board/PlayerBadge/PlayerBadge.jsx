import React from "react";
import "./PlayerBadge.css";
import {
  SIZES,
  RING_COLORS,
  NAME_BG_COLORS,
  AVATAR_MAP,
  MAX_NAME_LEN,
} from "./playerBadgeConstants.js";

/**
 * PlayerBadge
 * Compact UI badge for a player: shows a name, a circular avatar
 * with a colored ring, and a small turn indicator below the avatar.
 *
 * Props:
 * - name          {string}                       Display name (auto-truncated to MAX_NAME_LEN).
 * - avatar        {string}                       Key for avatar image in AVATAR_MAP.
 * - size          {string: "small"|"big"}        Avatar size variant.
 * - ringColor     {string}                       Token from RING_COLORS for the avatar ring.
 * - nameBgColor   {string}                       Token from NAME_BG_COLORS for the name box background.
 * - turn          {boolean}                      Highlights the turn indicator when true.
 */

export default function PlayerBadge({
  name = "Jugador",
  avatar = "default",
  size = "small",
  ringColor = "black",
  nameBgColor = "white",
  turn = false,
}) {
  const circleSize = SIZES[size] ?? SIZES.small;
  const ringCol = RING_COLORS[ringColor] ?? RING_COLORS.black;
  const nameBgCol = NAME_BG_COLORS[nameBgColor] ?? NAME_BG_COLORS.white;
  const avatarSrc = AVATAR_MAP[avatar] ?? AVATAR_MAP.default;
  // Truncate long names
  const nameT =
    name.length > MAX_NAME_LEN ? name.slice(0, MAX_NAME_LEN) + "…" : name;

  return (
    <div className="player-badge">
      {/* Name box with background color */}
      <span className="player-name-box" style={{ ["--name-bg"]: nameBgCol }}>
        {nameT}
      </span>

      {/* Avatar circle with ring color */}
      <div
        className={`avatar-circle ${circleSize}`}
        style={{ ["--tw-ring-color"]: ringCol }}
        aria-label={`Avatar of ${nameT}`}
      >
        {/* Avatar image */}
        <img
          src={avatarSrc}
          alt={`Avatar of ${nameT}`}
          className="avatar-img"
        />
      </div>

      {/* Turn indicator */}
      <span
        className={`turn-indicator ${turn ? "on" : "off"}`}
        aria-label={turn ? "Current turn" : "Not current turn"}
        aria-live="polite"
      />
    </div>
  );
}
