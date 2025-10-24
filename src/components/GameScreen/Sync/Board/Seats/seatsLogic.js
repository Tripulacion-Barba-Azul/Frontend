// seatsLogic.js

/**
 * @file Seats logic: converts validated players into positioned "seated players"
 * ready for rendering around the table, keeping the current player as the anchor.
 *
 * === Canonical shapes (from API DOCUMENT) ===
 * @typedef {"detective"|"murderer"|"accomplice"} Role
 * @typedef {"waiting"|"playing"|"discarding"|"discardingOpt"|"drawing"} TurnStatus
 *
 * @typedef {{ id:number, revealed:boolean, name:(string|null) }} PublicSecret
 * @typedef {{ id:number, name:string }} DetectiveCard
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
 * @typedef {{ id:number, role:Exclude<Role,"detective"> }} AllyInfo
 *
 * @typedef {"p1"|"p2"|"p3"|"p4"|"p5"|"p6"} SeatId
 *
 * @typedef {{
 *   id:SeatId,                         // seat id to keep DOM positions stable
 *   name:string,
 *   avatar:number,
 *   size:"big"|"small",                // anchor → big; others → small
 *   socialDisgrace:boolean,
 *   ringColor:"emerald"|"lime"|"amber"|"lightAmber"|"red"|"gray",
 *   position:"down"|"right"|"up"|"left",
 *   nameBgColor:"red"|"orange"|"white",// depends on what the current player can know
 *   numCards:number,
 *   secrets:PublicSecret[],
 *   sets:DetectiveSet[],
 *   style:Record<string,string>,       // absolute positioning (SEAT_POSITIONS[seatId].style)
 *   meta:{
 *     order:number,                    // original turnOrder
 *     actualPlayer:boolean,            // seat belongs to current player
 *     role:(Role|null),                // visible role from current player's POV (null if unknown)
 *     playerId:number
 *   }
 * }} SeatedPlayer
 */

import { SEAT_POSITIONS, SEATING_BY_COUNT } from "./seatsConstants.js";
import validatePlayersOrThrow from "./seatsValidations.js";

/** Normalizes a role string to lower-case or null. */
function normalizeRole(role) {
  return typeof role === "string" ? role.toLowerCase() : null;
}

/**
 * Returns a function that resolves the name background color ("red"/"orange"/"white")
 * depending on the actual player's team (hidden team sees hidden roles colored).
 */
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
 * Converts ordered players into concrete seats with absolute styles and UI metadata.
 *
 * @param {PublicPlayer[]} players
 * @param {number} currentPlayerId
 * @param {Role|null} currentPlayerRole
 * @param {AllyInfo|null} currentPlayerAlly
 * @returns {SeatedPlayer[]} stable list of seats starting from the current player.
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

    // Ringcolor logic
    const ringColor =
      turnStatusNorm === "playing"
        ? "emerald"
        : turnStatusNorm === "takingaction"
        ? "lime"
        : turnStatusNorm === "discarding"
        ? "amber"
        : turnStatusNorm === "discardingopt"
        ? "lightAmber"
        : turnStatusNorm === "drawing"
        ? "red"
        : "gray";

    // Compute visual metadata
    const visibleRole = visibleRoleOf(p);

    // Position logic
    const position =
      seatId === "p1"
        ? "down"
        : seatId === "p2"
        ? "right"
        : seatId === "p6"
        ? "left"
        : "up";

    return {
      id: seatId, // seat id ("p1".."p6") keeps seats stable around the board
      name: p.name,
      avatar: p.avatar,
      size: idx === 0 ? "big" : "small", // anchor is larger by convention
      socialDisgrace: p.socialDisgrace ?? false,
      ringColor: ringColor,
      position: position,
      nameBgColor: resolveNameBg(visibleRole), // "red"/"orange" only if actual is hidden-team
      numCards: p.cardCount ?? 0,
      secrets: Array.isArray(p.secrets) ? p.secrets : [],
      sets: Array.isArray(p.sets) ? p.sets : [],
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
