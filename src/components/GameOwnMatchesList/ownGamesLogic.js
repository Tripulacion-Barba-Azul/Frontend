// src/GameOwnMatchesList/ownGamesLogic.js
// Helpers to extract "own games" from a cookie and filter a list accordingly.
// This version includes verbose console logs for debugging.

/** Debug toggle: set window.DOTC_DEBUG = false in DevTools to silence logs. */
const DEBUG =
  (typeof window !== "undefined" && window.DOTC_DEBUG !== false) || false;
const DTAG = "[ownGamesLogic]";

/** Safe debug logger */
function dlog(...args) {
  if (!DEBUG) return;
  // Avoid logging massive payloads by default
  try {
    console.log(DTAG, ...args);
  } catch {
    /* ignore */
  }
}

/** Returns a shortened preview for large strings/arrays/objects. */
function preview(value, max = 200) {
  try {
    if (typeof value === "string") {
      return value.length > max ? value.slice(0, max) + "…(trimmed)" : value;
    }
    const str = JSON.stringify(value);
    return str.length > max ? str.slice(0, max) + "…(trimmed)" : str;
  } catch {
    return value;
  }
}

/**
 * Accepts raw cookie string and returns a Set<number> of gameIds.
 * Cookie may contain:
 *   - [["123","456"],["789","111"]]  // [gameId, playerId]
 *   - [{ "gameId": 123, "playerId": 456 }, ...]
 * Values can be string or number; we coerce to Number safely.
 */
export function parseOwnPairsCookie(raw) {
  dlog("parseOwnPairsCookie: raw cookie len/snippet", {
    length: raw?.length ?? 0,
    snippet: typeof raw === "string" ? preview(raw) : raw,
  });

  const ids = new Set();
  if (!raw) {
    dlog("parseOwnPairsCookie: no cookie provided -> empty Set");
    return ids;
  }

  let data = null;
  let parseMode = "direct";
  try {
    data = JSON.parse(raw);
  } catch {
    // support already-encoded JSON in case backend double-encodes
    try {
      data = JSON.parse(decodeURIComponent(raw));
      parseMode = "decodedURIComponent";
    } catch {
      dlog("parseOwnPairsCookie: failed to parse cookie JSON");
      return ids;
    }
  }

  dlog("parseOwnPairsCookie: parsed data", {
    parseMode,
    isArray: Array.isArray(data),
    preview: preview(data),
  });

  if (!Array.isArray(data)) {
    dlog("parseOwnPairsCookie: data is not an array -> empty Set");
    return ids;
  }

  for (const item of data) {
    if (Array.isArray(item)) {
      const gameId = toNumSafe(item[0]);
      if (gameId != null) ids.add(gameId);
    } else if (item && typeof item === "object") {
      const gameId = toNumSafe(item.gameId);
      if (gameId != null) ids.add(gameId);
    }
  }

  dlog("parseOwnPairsCookie: result ids", {
    size: ids.size,
    ids: Array.from(ids).slice(0, 50),
  });

  return ids;
}

/** Normalizes status to detect “in progress” across variants. */
export function isInProgress(status) {
  const s = String(status ?? "")
    .toLowerCase()
    .trim();
  const result =
    s === "in_progress" ||
    s === "inprogress" ||
    s === "in-progress" ||
    s === "in progress";
  dlog("isInProgress:", { input: status, norm: s, result });
  return result;
}

/**
 * Filters an array of matches to own + inProgress.
 * Each match is expected to have: { id, gameStatus, ... }
 */
export function filterOwnInProgress(allMatches, cookieRaw) {
  dlog("filterOwnInProgress: input sizes", {
    allMatches: Array.isArray(allMatches) ? allMatches.length : 0,
    cookieLen: cookieRaw?.length ?? 0,
  });

  const ownIds = parseOwnPairsCookie(cookieRaw);
  if (ownIds.size === 0) {
    dlog("filterOwnInProgress: no ownIds in cookie -> []");
    return [];
  }

  const result = (Array.isArray(allMatches) ? allMatches : []).filter(
    (m) => ownIds.has(toNumSafe(m.id)) && isInProgress(m.gameStatus)
  );

  dlog("filterOwnInProgress: done", {
    ownIdsCount: ownIds.size,
    outputCount: result.length,
    outputIds: result.map((m) => m.id),
  });

  return result;
}

/**
 * Builds a Map<gameId:number, playerId:number> from the cookie value.
 * Accepts either: [["123","45"], ...] or [{gameId:123, playerId:45}, ...]
 */
export function parseOwnPairsMap(raw) {
  dlog("parseOwnPairsMap: raw cookie len/snippet", {
    length: raw?.length ?? 0,
    snippet: typeof raw === "string" ? preview(raw) : raw,
  });

  const map = new Map();
  if (!raw) {
    dlog("parseOwnPairsMap: no cookie provided -> empty Map");
    return map;
  }

  let data = null;
  let parseMode = "direct";
  try {
    data = JSON.parse(raw);
  } catch {
    try {
      data = JSON.parse(decodeURIComponent(raw));
      parseMode = "decodedURIComponent";
    } catch {
      dlog("parseOwnPairsMap: failed to parse cookie JSON");
      return map;
    }
  }

  dlog("parseOwnPairsMap: parsed data", {
    parseMode,
    isArray: Array.isArray(data),
    preview: preview(data),
  });

  if (!Array.isArray(data)) {
    dlog("parseOwnPairsMap: data is not an array -> empty Map");
    return map;
  }

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

  dlog("parseOwnPairsMap: result", {
    size: map.size,
    entries: Array.from(map.entries()).slice(0, 50),
  });

  return map;
}

/** Convenience: returns the playerId (number) for a given gameId or null. */
export function getPlayerIdForGame(cookieRaw, gameId) {
  const nGid = toNumSafe(gameId);
  dlog("getPlayerIdForGame: lookup", { gameId, nGid });

  const map = parseOwnPairsMap(cookieRaw);
  const pid = map.get(nGid);

  dlog("getPlayerIdForGame: result", {
    gameId: nGid,
    playerId: pid,
    found: typeof pid === "number" && Number.isFinite(pid),
  });

  return typeof pid === "number" && Number.isFinite(pid) ? pid : null;
}

/** Number coercion guard; returns null if not a finite number. */
function toNumSafe(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/* ------------------------------
 * Example cookie (decoded JSON):
 * [
 *   { "gameId": 1,  "playerId": 5  },
 *   { "gameId": 42, "playerId": 12 }
 * ]
 * Encoded as stored in document.cookie:
 * DOTC_OWN_PAIRS=%5B%7B%22gameId%22%3A1%2C%22playerId%22%3A5%7D%2C%7B%22gameId%22%3A42%2C%22playerId%22%3A12%7D%5D
 *
 * Alternative (tuples):
 * Decoded:  [["1","5"],["42","12"]]
 * Encoded:  DOTC_OWN_PAIRS=%5B%5B%221%22%2C%225%22%5D%2C%5B%2242%22%2C%2212%22%5D%5D
 * ------------------------------ */
