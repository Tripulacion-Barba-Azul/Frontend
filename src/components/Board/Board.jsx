import PlayerBadge from "./PlayerBadge/PlayerBadge.jsx";
import { buildSeatedPlayersFromOrders } from "./Seats/seatsLogic.js";

/**
 * Board
 * Top-level table view. Renders the background board and overlays positioned PlayerBadge
 * components according to computed seating.
 *
 * Props:
 * - players {Array<{
 *     name: string,
 *     avatar: string,            // key in AVATAR_MAP
 *     order: number,             // seating order (1..N)
 *     actualPlayer: boolean,     // local user flag
 *     role: string,              // "detective" | "asesino" | "complice" | ...
 *     turn?: boolean
 *   }>}
 *
 * Behavior:
 * - Calls `buildSeatedPlayersFromOrders(players)` to derive an ordered seating array.
 * - Paints a full-screen background board.
 * - For each seated entry, places an absolutely-positioned <PlayerBadge/> at its seat style.
 */

export default function Board({ players }) {
  // Build seated data
  const seated = buildSeatedPlayersFromOrders(players);

  // Anchor box (full board plane)
  const anchorStyle = { bottom: "0%", top: "0%", right: "0%", left: "0%" };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background */}
      <div
        style={{
          backgroundImage: `url("Board/backgroundBoard.png")`,
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
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
