import PlayerBadge from "./PlayerBadge/PlayerBadge.jsx";
import { buildSeatedPlayersFromOrders } from "./Seats/seatsLogic.js";

/**
 * Input:
 * - players: Array[{
 *     name: string,
 *     avatar: string,          // key in AVATAR_MAP
 *     order: number,           // 1..N ordering within the match
 *     actualPlayer: boolean,   // marks the local user
 *     role: string "detective"|"murderer"|"accomplice",
 *     turnStatus: string “waiting”|“playing”|“discarding”|“drawing”
 *     numCards: Int,
 *     secrets: Array:[{secretName: string,
 *                      revealed: Bool}]
 *   }>
 */

export default function Board({ players }) {
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
  const seated = buildSeatedPlayersFromOrders(players);

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

      {/* Foreground: badges */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute pointer-events-none" style={anchorStyle}>
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
                turn={p.turn}
                numCards={
                  p.meta?.actualPlayer ? null : p.numCards ?? p.numCards ?? 0
                }
                secrets={p.meta?.actualPlayer ? null : p.secrets ?? []}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
