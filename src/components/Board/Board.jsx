import PlayerBadge from "./PlayerBadge/PlayerBadge.jsx";
import { buildSeatedPlayersFromOrders } from "./Seats/seatsLogic.js";
import Instructions from "../Instructions/Instructions.jsx";

/**
 * Input:
 * - players: Array[{
 *     id: number,
 *     name: string,
 *     avatar: string,          // key in AVATAR_MAP
 *     turnOrder: number,           // 1..N ordering within the match
 *     turnStatus: string “waiting”|“playing”|“discarding”|“drawing”
 *     cardCount: number,
 *     secrets: Array:[{id: number,
 *                      name: string #default null,
 *                      revealed: Bool}]
 *   }>
 *
 * - currentPlayerId: number
 *
 * - currentPlayerRole: string | null
 *
 * - currentPlayerAlly: {id: number, role: string} | null
 */

export default function Board({
  players,
  currentPlayerId,
  currentPlayerRole,
  currentPlayerAlly,
}) {
  // Early validation to prevent errors
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

  // Build seated data
  const seated = buildSeatedPlayersFromOrders(
    players,
    currentPlayerId,
    currentPlayerRole,
    currentPlayerAlly
  );

  // Anchor box (full board plane)
  const anchorStyle = { bottom: "0%", top: "0%", right: "0%", left: "0%" };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background */}
      <div
        style={{
          backgroundImage: `url("/Board/backgroundBoard.png")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "bottom",
          backgroundSize: "cover",
        }}
        className="w-full h-screen bg-black"
      ></div>

      {/* Instructions */}
      <Instructions mode="game" />

      {/* Foreground: badges */}
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
                size={p.size}
                ringColor={p.ringColor}
                nameBgColor={p.nameBgColor}
                position={p.position}
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
