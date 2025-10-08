import {
  SEAT_POSITIONS,
  SEATING_BY_COUNT,
  RING_COLORS,
} from "./seatsConstants";
import validatePlayersOrThrow from "./seatsValidations.js";

function normalizeRole(role) {
  return typeof role === "string" ? role.toLowerCase() : null;
}

function makeNameBgResolver(actualPlayerRoleNorm) {
  const isHiddenTeam =
    actualPlayerRoleNorm === "accomplice" ||
    actualPlayerRoleNorm === "murderer";

  // When the actual player is hidden team, color hidden roles (murderer/accomplice).
  if (isHiddenTeam) {
    return (visibleRole) => {
      return visibleRole === "murderer"
        ? "red"
        : visibleRole === "accomplice"
        ? "orange"
        : "white";
    };
  }
  // Otherwise (actual is detective or unknown), every label is white.
  return () => "white";
}

/**
 * New Input (as consumed by Board):
 * - players: Array[{
 *     id: number,
 *     name: string,
 *     avatar: string,         // key in AVATAR_MAP
 *     turnOrder: number,      // 1..N
 *     turnStatus: string,     // "waiting" | "playing" | "discarding" | "discardingOpt" | "Drawing"
 *     cardCount: number,
 *     secrets: Array[{ id: number, name: string|null, revealed: boolean }]
 *   }]
 * - currentPlayerId: number
 * - currentPlayerRole: string | null   // "detective" | "murderer" | "accomplice" | null
 * - currentPlayerAlly: { id: number, role: string } | null
 */
export function buildSeatedPlayersFromOrders(
  players,
  currentPlayerId,
  currentPlayerRole,
  currentPlayerAlly
) {
  // Validate and sanitize input (throws if invalid)
  const valid = validatePlayersOrThrow(players, currentPlayerId);
  const count = Math.max(2, Math.min(6, valid.length));

  // Resolve the "anchor" (actual player)
  const anchor =
    valid.find((p) => p.id === currentPlayerId) ||
    [...valid].sort((a, b) => a.turnOrder - b.turnOrder)[0];

  // Circular sort by turnOrder starting from the anchor
  const startOrder = anchor.turnOrder;
  const byCircularOrder = [...valid].sort((a, b) => {
    const N = valid.length;
    const da = (((a.turnOrder - startOrder) % N) + N) % N;
    const db = (((b.turnOrder - startOrder) % N) + N) % N;
    return da - db;
  });

  // Resolve seat ids for that count
  const trimmed = byCircularOrder.slice(0, count);
  const seatIds = SEATING_BY_COUNT[count];

  // Name background color resolver based on actual player's role
  const actualRoleNorm = normalizeRole(currentPlayerRole);
  const resolveNameBg = makeNameBgResolver(actualRoleNorm);

  // Visible role for each player (what the current player is allowed to know)
  const allyId = currentPlayerAlly?.id ?? null;
  const allyRoleNorm = normalizeRole(currentPlayerAlly?.role);
  const visibleRoleOf = (p) => {
    if (p.id === currentPlayerId) return actualRoleNorm;
    if (allyId != null && p.id === allyId) return allyRoleNorm;
    return null; // unknown to current player → render as white label
  };

  return trimmed.map((p, idx) => {
    const seatId = seatIds[idx];
    const seat = SEAT_POSITIONS[seatId];

    // Normalize turn boolean (anything not strictly "waiting" is considered "in turn")
    const turnStatusNorm = (p.turnStatus || "").toLowerCase();
    const isTurning = turnStatusNorm !== "waiting";

    // Compute visual metadata
    const visibleRole = visibleRoleOf(p);

    return {
      id: seatId, // seat id ("p1".."p6") keeps seats stable around the board
      name: p.name,
      avatar: p.avatar,
      size: idx === 0 ? "big" : "small", // anchor is larger by convention
      ringColor: RING_COLORS[idx % RING_COLORS.length],
      nameBgColor: resolveNameBg(visibleRole), // "red"/"orange" only if actual is hidden-team
      turn: isTurning,
      numCards: p.cardCount ?? 0,
      secrets: Array.isArray(p.secrets) ? p.secrets : [],
      style: seat.style,
      meta: {
        order: p.turnOrder,
        actualPlayer: p.id === currentPlayerId,
        role: visibleRole, // what the current player is allowed to see about this player
        playerId: p.id,
      },
    };
  });
}
