import React from "react";
import "./PlayerBadge.css";
import { SIZES, RING_COLORS, NAME_BG_COLORS } from "./playerBadgeConstants.js";
import { AVATAR_MAP } from "../../generalMaps";
import CardCount from "../CardCount/CardCount.jsx";
import ViewSecrets from "../ViewSecrets/ViewSecrets.jsx";
import SetsGrid from "../SetsGrid/SetsGrid.jsx";

/** Tailwind-based ramp used when ringColor prop is not provided */
const TURN_STATUS_RING = {
  waiting: "#9CA3AF", // gray-400
  playing: "#10B981", // emerald-500
  takingAction: "#84CC16", // lime-500
  discarding: "#F59E0B", // amber-500
  discardingOpt: "#FBBF24", // amber-400 (softer than discarding)
  drawing: "#EF4444", // red-500
};

/** Resolve the ring color.
 * Priority:
 * 1) Explicit ringColor prop: try key in RING_COLORS, otherwise use as-is (HEX/CSS color).
 * 2) turnStatus ramp.
 * 3) Fallback to gray.
 */
function resolveRingColor(turnStatus, ringColorProp) {
  if (typeof ringColorProp === "string" && ringColorProp.length > 0) {
    if (RING_COLORS && ringColorProp in RING_COLORS) {
      return RING_COLORS[ringColorProp];
    }
    return ringColorProp; // raw hex or css color string
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

/**
 * PlayerBadge
 *
 * Props:
 * - name: string
 * - avatar: key from AVATAR_MAP
 * - socialDisgrace: boolean              // grayscale avatar + subtle mark on name box
 * - size: "big" | "small"
 * - ringColor?: string                   // optional override (key from RING_COLORS or any CSS color/HEX)
 * - nameBgColor: "white" | "red" | "orange"
 * - position: "up" | "left" | "right" | "down"
 * - numCards: number | null
 * - secrets: array | null
 * - sets: array | null
 * - turnStatus?: "waiting" | "playing" | "takingAction" | "discarding" | "discardingOpt" | "drawing"
 */
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

  // Map PlayerBadge.position -> SetsGrid position layout
  const setsLayout =
    position === "up"
      ? "horizontal"
      : position === "down"
      ? "doubleHorizontal"
      : position == "left"
      ? "vertical-right"
      : position == "right" 
      ? "vertical-left" : "";

  return (
    <div className="player-badge">
      {/* Name box */}
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
