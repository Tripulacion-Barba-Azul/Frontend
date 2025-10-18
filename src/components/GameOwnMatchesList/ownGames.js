// Helpers to extract "own games" from a cookie and filter a list accordingly.

/**
 * Accepts raw cookie string and returns a Set<number> of gameIds.
 * Cookie may contain:
 *   - [["123","456"],["789","111"]]  // [gameId, playerId]
 *   - [{ "gameId": 123, "playerId": 456 }, ...]
 * Values can be string or number; we coerce to Number safely.
 */
export function parseOwnPairsCookie(raw) {
  const ids = new Set();
  if (!raw) return ids;

  let data = null;
  try {
    data = JSON.parse(raw);
  } catch {
    // support already-encoded JSON in case backend double-encodes
    try {
      data = JSON.parse(decodeURIComponent(raw));
    } catch {
      return ids;
    }
  }

  if (!Array.isArray(data)) return ids;

  for (const item of data) {
    if (Array.isArray(item)) {
      const gameId = toNumSafe(item[0]);
      if (gameId != null) ids.add(gameId);
    } else if (item && typeof item === "object") {
      const gameId = toNumSafe(item.gameId);
      if (gameId != null) ids.add(gameId);
    }
  }
  return ids;
}

/** Normalizes status to detect “in progress” across variants. */
export function isInProgress(status) {
  const s = String(status ?? "")
    .toLowerCase()
    .trim();
  return (
    s === "in_progress" ||
    s === "inprogress" ||
    s === "in-progress" ||
    s === "in progress"
  );
}

/**
 * Filters an array of matches to own + inProgress.
 * Each match is expected to have: { id, gameStatus, ... }
 */
export function filterOwnInProgress(allMatches, cookieRaw) {
  const ownIds = parseOwnPairsCookie(cookieRaw);
  if (ownIds.size === 0) return [];
  return allMatches.filter(
    (m) => ownIds.has(toNumSafe(m.id)) && isInProgress(m.gameStatus)
  );
}

function toNumSafe(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// src/GameOwnMatchesList/ownGames.js

// ... (deja lo que ya tenías) ...

/**
 * Builds a Map<gameId:number, playerId:number> from the cookie value.
 * Accepts either: [["123","45"], ...] or [{gameId:123, playerId:45}, ...]
 */
export function parseOwnPairsMap(raw) {
  const map = new Map();
  if (!raw) return map;

  let data = null;
  try {
    data = JSON.parse(raw);
  } catch {
    try {
      data = JSON.parse(decodeURIComponent(raw));
    } catch {
      return map;
    }
  }
  if (!Array.isArray(data)) return map;

  for (const item of data) {
    if (Array.isArray(item)) {
      const gid = toNumSafe(item[0]);
      const pid = toNumSafe(item[1]);
      if (gid != null && pid != null) map.set(gid, pid);
    } else if (item && typeof item === "object") {
      const gid = toNumSafe(item.gameId);
      const pid = toNumSafe(item.playerId);
      if (gid != null && pid != null) map.set(gid, pid);
    }
  }
  return map;
}

/** Convenience: returns the playerId (number) for a given gameId or null. */
export function getPlayerIdForGame(cookieRaw, gameId) {
  const map = parseOwnPairsMap(cookieRaw);
  const pid = map.get(toNumSafe(gameId));
  return typeof pid === "number" && Number.isFinite(pid) ? pid : null;
}
