// Board.jsx

import PlayerBadge from "./PlayerBadge/PlayerBadge.jsx";
import { buildSeatedPlayersFromOrders } from "./Seats/seatsLogic.js";
import Instructions from "../../../Instructions/Instructions.jsx";

/**
 * @file Board.jsx
 * @description Renders the game board background and all player badges seated around the table.
 * It receives public player data and delegates seat/position styling to `buildSeatedPlayersFromOrders`.
 *
 * === Canonical shapes (from API DOCUMENT) ===
 *
 * @typedef {"waiting"|"playing"|"takingAction"|"discarding"|"discardingOpt"|"drawing"} TurnStatus
 *
 * @typedef {{ id:number, revealed:boolean, name:(string|null) }} PublicSecret
 *
 * @typedef {{ id:number, name:string }} DetectiveCard
 *
 * @typedef {{ setId:number, setName:string, cards:DetectiveCard[] }} DetectiveSet
 *
 * @typedef {{
 *   id:number,
 *   name:string,
 *   avatar:number,
 *   socialDisgrace:boolean,
 *   turnOrder:number,
 *   turnStatus:TurnStatus,
 *   cardCount:number,
 *   secrets:PublicSecret[],
 *   sets:DetectiveSet[]
 * }} PublicPlayer
 *
 * @typedef {"detective"|"murderer"|"accomplice"} Role
 *
 * === Props ===
 * @param {Object} props
 * @param {PublicPlayer[]} props.players                - Public players snapshot to render around the table.
 * @param {number}          props.currentPlayerId       - Current player's id; used for seat orientation.
 * @param {Role|null}       props.currentPlayerRole     - Current player's role (private), forwarded to seat logic.
 * @param {{id:number, role:Exclude<Role,"detective">}|null} props.currentPlayerAlly - Ally info (private), forwarded to seat logic.
 */

export default function Board({
  players,
  currentPlayerId,
  currentPlayerRole,
  currentPlayerAlly,
}) {
  // Early guard: if we don't have enough players, just show the background.
  if (!Array.isArray(players) || players.length < 2) {
    return (
      <div className="relative w-full h-screen overflow-hidden">
        <div
          style={{
            backgroundImage: `url("/Board/backgroundBoard.png")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "bottom",
            backgroundSize: "cover",
          }}
          className="w-full h-screen bg-black"
        ></div>
      </div>
    );
  }

  // Compute seat positions/styles and per-player decoration (ringColor, size, etc.).
  // This function encapsulates the layout rules; Board stays dumb.
  const seated = buildSeatedPlayersFromOrders(
    players,
    currentPlayerId,
    currentPlayerRole,
    currentPlayerAlly
  );

  // Absolute anchor to place all badges
  const anchorStyle = { bottom: "0%", top: "0%", right: "0%", left: "0%" };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background layer */}
      <div
        style={{
          backgroundImage: `url("/Board/backgroundBoard.png")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "bottom",
          backgroundSize: "cover",
        }}
        className="w-full h-screen bg-black"
      ></div>

      {/* Compact in-game instructions (overlay) */}
      <Instructions mode="game" />

      {/* Foreground: seated player badges */}
      <div className="absolute inset-0 z-10 pointer-events-auto">
        <div className="absolute pointer-events-auto" style={anchorStyle}>
          {seated.map((p) => (
            <div
              key={p.id}
              className="absolute pointer-events-auto"
              style={p.style}
            >
              <PlayerBadge
                name={p.name}
                avatar={p.avatar}
                socialDisgrace={p.socialDisgrace}
                size={p.size}
                ringColor={p.ringColor}
                nameBgColor={p.nameBgColor}
                position={p.position}
                // Hide card count and secrets for the actual player; show for others
                numCards={
                  p.meta?.actualPlayer ? null : p.numCards ?? p.numCards ?? 0
                }
                secrets={p.meta?.actualPlayer ? null : p.secrets ?? []}
                sets={p.sets ?? []}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
