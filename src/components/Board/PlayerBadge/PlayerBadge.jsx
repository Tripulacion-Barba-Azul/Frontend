import React from "react";
import "./PlayerBadge.css";
import {
  SIZES,
  RING_COLORS,
  NAME_BG_COLORS,
  AVATAR_MAP,
  MAX_NAME_LEN,
} from "./playerBadgeConstants.js";
import CardCount from "../CardCount/CardCount.jsx";
import ViewSecrets from "../ViewSecrets/ViewSecrets.jsx"; // ⬅️ usa Secrets

export default function PlayerBadge({
  name = "Jugador",
  avatar = "default",
  size = "small",
  ringColor = "black",
  nameBgColor = "white",
  turn = false,
  numCards = 0, // null para ocultar (actualPlayer)
  secrets = null, // null para ocultar (actualPlayer)
}) {
  const circleSize = SIZES[size] ?? SIZES.small;
  const ringCol = RING_COLORS[ringColor] ?? RING_COLORS.black;
  const nameBgCol = NAME_BG_COLORS[nameBgColor] ?? NAME_BG_COLORS.white;
  const avatarSrc = AVATAR_MAP[avatar] ?? AVATAR_MAP.default;
  const nameT =
    name.length > MAX_NAME_LEN ? name.slice(0, MAX_NAME_LEN) + "…" : name;

  const showCount = typeof numCards === "number" && numCards >= 0;
  const showSecrets = Array.isArray(secrets) && secrets.length >= 0;

  return (
    <div className="player-badge">
      {/* indicador de turno arriba del nombre */}
      <span className={`turn-indicator ${turn ? "on" : "off"}`} />

      {/* nombre */}
      <span className="player-name-box" style={{ ["--name-bg"]: nameBgCol }}>
        {nameT}
      </span>

      {/* avatar (es el ancla relativa) */}
      <div
        className={`avatar-circle ${circleSize}`}
        style={{ ["--tw-ring-color"]: ringCol }}
      >
        <img
          src={avatarSrc}
          alt={`Avatar of ${nameT}`}
          className="avatar-img"
        />
      </div>

      {/* card count (se mantiene) */}
      {showCount && (
        <div className="badge-cardcount">
          <CardCount number={numCards} />
        </div>
      )}

      {/* secrets con clase hardcodeada */}
      {showSecrets && (
        <div className="badge-secrets-fixed">
          <ViewSecrets secrets={secrets} />
        </div>
      )}
    </div>
  );
}
