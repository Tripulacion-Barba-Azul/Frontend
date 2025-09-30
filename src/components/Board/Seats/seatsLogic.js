import {
  SEAT_POSITIONS,
  SEATING_BY_COUNT,
  RING_COLORS,
} from "./seatsConstants";
import validatePlayersOrThrow from "./seatsValidations.js";

function makeNameBgResolver(actualPlayerRoleNorm) {
  const isHiddenTeam =
    actualPlayerRoleNorm === "accomplice" ||
    actualPlayerRoleNorm === "murderer";

  // When the actualPlayer is hidden team ("accomplice"/"murderer"), highlight both hidden roles
  if (isHiddenTeam) {
    return (playerRole) => {
      return playerRole === "murderer"
        ? "red"
        : playerRole === "accomplice"
        ? "orange"
        : "white";
    };
  }
  // Otherwise (actualPlayer is "detective"), every label is white
  return () => "white";
}

/**
 * buildSeatedPlayersFromOrders
 * Computes the visual seating layout for a table (2–6 players) from a raw players array.
 * Fixes the seating start at the actual player, orders the rest circularly by `order`,
 * and returns render-ready entries with seat id, style, sizes, and colors.
 *
 * Input:
 * - players: Array<{
 *     name: string,
 *     avatar: string,          // key in AVATAR_MAP
 *     order: number,           // 1..N ordering within the match
 *     actualPlayer: boolean,   // marks the local user
 *     role: string "detective"|"asesino"|"complice",
 *     turn?: boolean
 *   }>
 *
 * Returns:
 * - Array<{
 *     id: "p1"|"p2"|"p3"|"p4"|"p5"|"p6",
 *     name: string,
 *     avatar: string,
 *     size: "big"|"small",
 *     ringColor: string,       // token from RING_COLORS
 *     nameBgColor: string,     // resolved color token
 *     turn: boolean,
 *     style: React.CSSProperties, // absolute positioning for that seat
 *     meta: { order: number, actualPlayer: boolean, role: string|null }
 *   }>
 */

export function buildSeatedPlayersFromOrders(players) {
  // Validate and sanitize input (throws if invalid)
  const valid = validatePlayersOrThrow(players);
  const count = Math.max(2, Math.min(6, valid.length));

  //Find the actual player
  const actualPlayer =
    valid.find((p) => p.actualPlayer) ||
    [...valid].sort((a, b) => a.order - b.order)[0];

  //Sort players circularly by "order" starting from the actuaLPlayer's order.
  const startOrder = actualPlayer.order;
  const byCircularOrder = [...valid].sort((a, b) => {
    const N = valid.length;
    const da = (((a.order - startOrder) % N) + N) % N;
    const db = (((b.order - startOrder) % N) + N) % N;
    return da - db;
  });

  // Resolve seat ids for that count
  const trimmed = byCircularOrder.slice(0, count);
  const seatIds = SEATING_BY_COUNT[count];

  // Prepare background resolver based on the actualPlayer's role
  const resolveNameBg = makeNameBgResolver(actualPlayer.role);

  // Map each player into a seat with visual metadata
  return trimmed.map((p, idx) => {
    const seatId = seatIds[idx];
    const seat = SEAT_POSITIONS[seatId];

    return {
      id: seatId, // seat id (p1..p6)
      name: p.name,
      avatar: p.avatar,
      size: idx === 0 ? "big" : "small", // make actualPlayer larger by convention
      ringColor: RING_COLORS[idx % RING_COLORS.length],
      nameBgColor: resolveNameBg(p.role), // <<< "red" for accomplice/murderer iff actualPlayer is hidden team; else "white"
      turn: p.turn,
      numCards: p.numCards,
      secrets: p.secrets,
      style: seat.style,
      meta: {
        order: p.order,
        actualPlayer: p.actualPlayer,
        role: p.role ?? null,
      },
    };
  });
}
