import BackgroundBoard from "./BackgroundBoard.jsx";
import PlayerBadge from "./PlayerBadge/PlayerBadge.jsx";
import {
  SEAT_POSITIONS,
  SEATING_BY_COUNT,
  RING_COLORS,
} from "./seatsConfig.js";

function buildSeatedPlayers(names) {
  // 1) Clamp count between 2 and 6
  const count = Math.max(2, Math.min(6, names.length));

  // 2) Resolve seat ids for that count
  const seatIds = SEATING_BY_COUNT[count];

  // 3) Map each name to a seat with visual metadata
  return names.slice(0, count).map((name, idx) => {
    const seatId = seatIds[idx];
    const seat = SEAT_POSITIONS[seatId];

    return {
      id: seatId,
      name,
      src: "/Board/Icons/defaultIcon.png",
      size: idx === 0 ? "big" : "small",
      // Cycle ring colors for differentiation
      ringColor: RING_COLORS[idx % RING_COLORS.length],
      style: seat.style,
    };
  });
}

export default function Board({ players = ["Jugador 1", "Jugador 2"] }) {
  // Anchor container defines the positioning plane (full board)
  const anchor = { bottom: "0%", top: "0%", right: "0%", left: "0%" };

  // Build rendered seats from the incoming player list
  const seated = buildSeatedPlayers(players);

  return (
    // Main container which defines the positioning plane
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background layer: board */}
      <BackgroundBoard />

      {/* Foreground layer: badges */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Anchor wrapper; all seats are positioned relative to this box */}
        <div className="absolute pointer-events-none" style={anchor}>
          {seated.map((p) => (
            <div
              key={p.id}
              className="absolute pointer-events-auto"
              style={p.style}
            >
              <PlayerBadge
                name={p.name}
                src={p.src}
                size={p.size}
                ringColor={p.ringColor}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
