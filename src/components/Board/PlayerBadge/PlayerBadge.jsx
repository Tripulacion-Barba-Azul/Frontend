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
import SetsGrid from "../SetsGrid/SetsGrid.jsx";

/**
 * Props:
 * - name: string
 * - avatar: key from AVATAR_MAP
 * - size: "big" | "small"                      // maps to CSS size classes
 * - ringColor: "green" | "yellow" | "red" | "gray"
 * - nameBgColor: "white" | "red" | "orange"
 * - position: "up" | "left" | "right" | "down" // drives overlay presets
 * - numCards: number | null                    // show CardCount if number
 * - secrets: array | null                      // show ViewSecrets if array
 * - sets: array | null                         // show SetsGrid if non-empty
 */
export default function PlayerBadge({
  name = "Player",
  avatar = 1,
  size = "small",
  ringColor = "gray",
  nameBgColor = "white",
  position = "right",
  numCards = 0,
  secrets = null,
  sets = null,
}) {
  const sizeClass = SIZES[size] ?? SIZES.small;
  const ringCol = RING_COLORS[ringColor] ?? RING_COLORS.gray;
  const nameBgCol = NAME_BG_COLORS[nameBgColor] ?? NAME_BG_COLORS.white;
  const avatarSrc = AVATAR_MAP[avatar] ?? AVATAR_MAP[1];

  const showCount = typeof numCards === "number" && numCards >= 0;
  const showSecrets = Array.isArray(secrets);
  const showSets = Array.isArray(sets) && sets.length > 0;

  // Map PlayerBadge.position -> SetsGrid.position
  const setsLayout =
    position === "up"
      ? "horizontal"
      : position === "down"
      ? "doubleHorizontal"
      : "vertical"; // for "left" or "right"

  return (
    <div className="player-badge">
      {/* Name badge above the avatar */}
      <span className="player-name-box" style={{ ["--name-bg"]: nameBgCol }}>
        {name}
      </span>

      {/* Avatar stack: avatar + positioned overlays (CardCount / Secrets / Sets) */}
      <div className={`avatar-stack ${sizeClass} position-${position}`}>
        <div className="avatar-circle" style={{ ["--tw-ring-color"]: ringCol }}>
          <img
            src={avatarSrc}
            alt={`Avatar of ${name}`}
            className="avatar-img"
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
