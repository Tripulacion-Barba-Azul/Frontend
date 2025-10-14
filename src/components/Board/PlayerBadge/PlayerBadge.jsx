import React from "react";
import "./PlayerBadge.css";
import {
  SIZES,
  RING_COLORS,
  NAME_BG_COLORS,
} from "./playerBadgeConstants.js";
import { AVATAR_MAP } from "../../generalMaps";
import CardCount from "../CardCount/CardCount.jsx";
import ViewSecrets from "../ViewSecrets/ViewSecrets.jsx";

/**
 * Input:
 * - Array[{
 *     name: string //Length [1,20]
 *     avatar: string,          // key in AVATAR_MAP
 *     size: string "big"|"small"
 *     ringColor: string "black"|"blue"|"pink"|"red"|"purple"|"yellow"
 *     nameBgColor: string "white"|"red"|"orange"
 *     turn: bool,
 *     numCards: int,
 *     secrets: Array:[{secretName: string,
 *                      revealed: Bool}]
 *   }>
 */

export default function PlayerBadge({
  name = "Jugador",
  avatar = 1,
  size = "small",
  ringColor = "black",
  nameBgColor = "white",
  turn = false,
  numCards = 0, // null to hide for (actualPlayer)
  secrets = null, // null to hide for (actualPlayer)
}) {
  const circleSize = SIZES[size] ?? SIZES.small;
  const ringCol = RING_COLORS[ringColor] ?? RING_COLORS.black;
  const nameBgCol = NAME_BG_COLORS[nameBgColor] ?? NAME_BG_COLORS.white;
  const avatarSrc = AVATAR_MAP[avatar] ?? AVATAR_MAP[1];
  const showCount = typeof numCards === "number" && numCards >= 0;
  const showSecrets = Array.isArray(secrets) && secrets.length >= 0;

  return (
    <div className="player-badge">
      {/* Turn indicator */}
      <span className={`turn-indicator ${turn ? "on" : "off"}`} />

      {/* Name */}
      <span className="player-name-box" style={{ ["--name-bg"]: nameBgCol }}>
        {name}
      </span>

      {/* Avatar */}
      <div
        className={`avatar-circle ${circleSize}`}
        style={{ ["--tw-ring-color"]: ringCol }}
      >
        <img src={avatarSrc} alt={`Avatar of ${name}`} className="avatar-img" />
      </div>

      {/* Card count */}
      {showCount && (
        <div className="badge-cardcount">
          <CardCount number={numCards} />
        </div>
      )}

      {/* Secrets */}
      {showSecrets && (
        <div className="badge-secrets-fixed">
          <ViewSecrets secrets={secrets} />
        </div>
      )}
    </div>
  );
}
