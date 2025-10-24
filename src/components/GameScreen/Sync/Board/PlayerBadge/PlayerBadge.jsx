// PlayerBadge.jsx

import React from "react";
import "./PlayerBadge.css";
import { SIZES, RING_COLORS, NAME_BG_COLORS } from "./playerBadgeConstants.js";
import { AVATAR_MAP } from "../../../../../utils/generalMaps.js";
import CardCount from "../CardCount/CardCount.jsx";
import ViewSecrets from "../ViewSecrets/ViewSecrets.jsx";
import SetsGrid from "../SetsGrid/SetsGrid.jsx";

/**
 * @file PlayerBadge.jsx
 * @description Compact player chip showing name, avatar with ring color (turn/role),
 * optional card count, secrets indicator, and detective sets preview.
 *
 * === Canonical shapes (from API DOCUMENT) ===
 * @typedef {"waiting"|"playing"|"takingAction"|"discarding"|"discardingOpt"|"drawing"} TurnStatus
 * @typedef {{ id:number, revealed:boolean, name:(string|null) }} PublicSecret
 * @typedef {{ id:number, name:string }} DetectiveCard
 * @typedef {{ setId:number, setName:string, cards:DetectiveCard[] }} DetectiveSet
 *
 * === Props ===
 * @typedef {Object} PlayerBadgeProps
 * @property {string} name
 * @property {number|string} avatar                - Key for AVATAR_MAP.
 * @property {boolean} [socialDisgrace=false]      - When true, avatar/name get a degraded style.
 * @property {"big"|"small"} [size="small"]
 * @property {string} [ringColor]                  - Optional override. If matches a key in RING_COLORS, that value is used; otherwise treated as any CSS color/hex.
 * @property {"white"|"red"|"orange"} [nameBgColor="white"]
 * @property {"up"|"left"|"right"|"down"} [position="right"]
 * @property {number|null} [numCards=0]            - When null, the badge hides the counter.
 * @property {PublicSecret[]|null} [secrets=null]  - When null, secrets indicator is hidden.
 * @property {DetectiveSet[]|null} [sets=null]     - When empty/null, sets preview is hidden.
 * @property {TurnStatus} [turnStatus="waiting"]   - Used to derive default ring color if ringColor is not provided.
 */

/** Tailwind-based ramp used when ringColor prop is not provided */
const TURN_STATUS_RING = {
  waiting: "#9CA3AF", // gray-400
  playing: "#10B981", // emerald-500
  takingAction: "#84CC16", // lime-500
  discarding: "#F59E0B", // amber-500
  discardingOpt: "#FBBF24", // amber-400 (softer than discarding)
  drawing: "#EF4444", // red-500
};

/** Resolve the ring color:
 * 1) Use explicit ringColor prop (key in RING_COLORS or raw CSS color).
 * 2) Else use TurnStatus ramp.
 * 3) Else fallback to gray.
 */
function resolveRingColor(turnStatus, ringColorProp) {
  if (typeof ringColorProp === "string" && ringColorProp.length > 0) {
    if (RING_COLORS && ringColorProp in RING_COLORS) {
      return RING_COLORS[ringColorProp];
    }
    return ringColorProp; // raw hex/CSS color string
  }
  if (turnStatus && TURN_STATUS_RING[turnStatus]) {
    return TURN_STATUS_RING[turnStatus];
  }
  return (RING_COLORS && RING_COLORS.gray) || TURN_STATUS_RING.waiting;
}

/** Detect "gray" ring to disable glow/shadows */
function isGrayRingColor(ringCol, ringColorKey) {
  const keyIsGray = (ringColorKey || "")
    .toString()
    .toLowerCase()
    .includes("gray");
  const c = (ringCol || "").toString().trim().toLowerCase();
  const hex = c.replace("#", "");
  // Tailwind gray-400 (#9CA3AF) + generic "gray" keyword
  return keyIsGray || hex === "9ca3af" || c === "gray";
}

/** @param {PlayerBadgeProps} props */
export default function PlayerBadge({
  name = "Player",
  avatar = 1,
  socialDisgrace = false,
  size = "small",
  ringColor, // optional override
  nameBgColor = "white",
  position = "right",
  numCards = 0,
  secrets = null,
  sets = null,
  turnStatus = "waiting",
}) {
  const sizeClass = SIZES[size] ?? SIZES.small;
  const nameBgCol = NAME_BG_COLORS[nameBgColor] ?? NAME_BG_COLORS.white;
  const avatarSrc = AVATAR_MAP[avatar] ?? AVATAR_MAP[1];

  // Resolve ring color from prop or turnStatus ramp
  const ringCol = resolveRingColor(turnStatus, ringColor);
  const grayRing = isGrayRingColor(ringCol, ringColor);

  // Visual state classes
  const nameBoxClass = `player-name-box${
    socialDisgrace ? " is-disgraced" : ""
  }`;
  const avatarCircleClass = `avatar-circle${
    socialDisgrace ? " is-disgraced" : ""
  }${grayRing ? " no-glow" : ""}`;

  // Overlays visibility
  const showCount = typeof numCards === "number" && numCards >= 0;
  const showSecrets = Array.isArray(secrets);
  const showSets = Array.isArray(sets) && sets.length > 0;

  // Map PlayerBadge.position -> SetsGrid layout
  const setsLayout =
    position === "up"
      ? "horizontal"
      : position === "down"
      ? "doubleHorizontal"
      : position == "left"
      ? "vertical-right"
      : position == "right"
      ? "vertical-left"
      : "";

  return (
    <div className="player-badge">
      {/* Name box (bg color via CSS variable) */}
      <span
        className={nameBoxClass}
        style={{ ["--name-bg"]: nameBgCol }}
        title={socialDisgrace ? "Social disgrace" : undefined}
      >
        {name}
      </span>

      {/* Avatar + overlays */}
      <div className={`avatar-stack ${sizeClass} position-${position}`}>
        <div
          className={avatarCircleClass}
          style={{ ["--tw-ring-color"]: ringCol }}
        >
          <img
            src={avatarSrc}
            alt={`Avatar of ${name}`}
            className="avatar-img"
            draggable={false}
          />
        </div>

        {showCount && (
          <div className="badge-cardcount">
            <CardCount number={numCards} />
          </div>
        )}

        {showSecrets && (
          <div className="badge-secrets">
            <ViewSecrets secrets={secrets} />
          </div>
        )}

        {showSets && (
          <div className="badge-sets">
            <SetsGrid sets={sets} position={setsLayout} />
          </div>
        )}
      </div>
    </div>
  );
}
