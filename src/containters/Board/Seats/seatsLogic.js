import {
  SEAT_POSITIONS,
  SEATING_BY_COUNT,
  RING_COLORS,
  MAX_NAME_LEN,
} from "./seatsConstants";
import validatePlayersOrThrow from "./seatsValidations.js";

function makeNameBgResolver(actualPlayerRoleNorm) {
  const isHiddenTeam =
    actualPlayerRoleNorm === "complice" || actualPlayerRoleNorm === "asesino";

  // When the actualPlayer is hidden team ("complice"/"asesino"), highlight both hidden roles
  if (isHiddenTeam) {
    return (playerRole) => {
      return playerRole === "asesino"
        ? "red"
        : playerRole === "complice"
        ? "orange"
        : "white";
    };
  }
  // Otherwise (actualPlayer is "detective"), every label is white
  return () => "white";
}

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
  const resolveNameBg = makeNameBgResolver(actualPlayer.rol);

  // Map each player into a seat with visual metadata
  return trimmed.map((p, idx) => {
    // Truncate long names
    const name =
      p.name.length > MAX_NAME_LEN
        ? p.name.slice(0, MAX_NAME_LEN) + "…"
        : p.name;

    const seatId = seatIds[idx];
    const seat = SEAT_POSITIONS[seatId];

    return {
      id: seatId, // seat id (p1..p6)
      name, // display name
      avatar: "default1", // avatar key your PlayerBadge understands
      size: idx === 0 ? "big" : "small", // make actualPlayer larger by convention
      ringColor: RING_COLORS[idx % RING_COLORS.length], // cycle ring colors
      nameBgColor: resolveNameBg(p.rol), // <<< "red" for complice/asesino iff actualPlayer is hidden team; else "white"
      style: seat.style,
      meta: {
        order: p.order,
        actualPlayer: !!p.actualPlayer,
        rol: p.rol ?? null,
      },
    };
  });
}
