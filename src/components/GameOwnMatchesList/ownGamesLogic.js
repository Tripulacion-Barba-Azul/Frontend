// Helpers to extract "own games" from a cookie and filter a list accordingly.
// This version is robust to weird encodings (octal escapes like \054) and double-encoded JSON.
// Code comments in English.

/** Debug toggle: set window.DOTC_DEBUG = false in DevTools to silence logs. */
const DEBUG =
  (typeof window !== "undefined" && window.DOTC_DEBUG !== false) || false;
const DTAG = "[ownGamesLogic]";

/** Safe debug logger */
function dlog(...args) {
  if (!DEBUG) return;
  try {
    console.log(DTAG, ...args);
  } catch { /* noop */ }
}

/** Short preview for logging. */
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

/** Replace octal escapes like \054 with their ASCII char (comma). */
function unescapeOctal(str) {
  if (typeof str !== "string") return str;
  return str.replace(/\\([0-7]{3})/g, (_, oct) =>
    String.fromCharCode(parseInt(oct, 8))
  );
}

/** Strip surrounding quotes if the whole string is quoted. */
function stripOuterQuotes(str) {
  if (typeof str !== "string") return str;
  if ((str.startsWith('"') && str.endsWith('"')) ||
      (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1);
  }
  return str;
}

/**
 * Try hard to obtain a JS value (Array/Object) out of a messy cookie string.
 * Steps:
 *  - raw
 *  - decodeURIComponent(raw)
 *  - unescapeOctal(raw)
 *  - unescapeOctal(decodeURIComponent(raw))
 * For each candidate, also try with outer quotes stripped,
 * and if JSON.parse -> string, parse again once (handles nested JSON-as-string).
 */
function parseCookieJSON(raw) {
  if (!raw) return null;

  const candidates = new Set();

  const push = (s) => {
    if (typeof s === "string" && s.length) candidates.add(s);
  };

  push(raw);
  try { push(decodeURIComponent(raw)); } catch {}
  push(unescapeOctal(raw));
  try { push(unescapeOctal(decodeURIComponent(raw))); } catch {}

  // plus versions without outer quotes
  [...candidates].forEach((c) => push(stripOuterQuotes(c)));

  dlog("parseCookieJSON: candidates", Array.from(candidates).map(preview));

  for (const c of candidates) {
    try {
      const v = JSON.parse(c);
      // If it parsed to a string that itself looks like JSON, try one more pass.
      if (typeof v === "string") {
        const s2 = unescapeOctal(stripOuterQuotes(v));
        try {
          const v2 = JSON.parse(s2);
          dlog("parseCookieJSON success (nested)", { candidate: preview(c) });
          return v2;
        } catch {
          // fallthrough; we still might accept primitive strings (unlikely useful here)
        }
      }
      dlog("parseCookieJSON success", { candidate: preview(c) });
      return v;
    } catch {
      // try next candidate
    }
  }
  dlog("parseCookieJSON failed for all candidates");
  return null;
}

/** Get array part from various shapes: array directly or object.{games|playersGames|pairs|data}. */
function extractArrayPayload(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    for (const key of ["games", "playersGames", "pairs", "data"]) {
      const arr = data[key];
      if (Array.isArray(arr)) return arr;
    }
  }
  return null;
}

/** Number coercion guard; returns null if not a finite number. */
function toNumSafe(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Accepts raw cookie string and returns a Set<number> of gameIds.
 * Supports items like:
 *   - [{ gameId, playerId }, ...]
 *   - [["123","45"], ...]
 * Works even if the cookie used octal escapes like \054 for commas.
 */
export function parseOwnPairsCookie(raw) {
  dlog("parseOwnPairsCookie: raw len/snippet", {
    length: raw?.length ?? 0,
    snippet: typeof raw === "string" ? preview(raw) : raw,
  });

  const ids = new Set();
  const data = parseCookieJSON(raw);
  dlog("parseOwnPairsCookie: parsed", preview(data));
  const arr = extractArrayPayload(data);
  if (!arr) {
    dlog("parseOwnPairsCookie: no array payload -> empty Set");
    return ids;
  }

  for (const item of arr) {
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

/**
 * Builds a Map<gameId:number, playerId:number> from the cookie value.
 * Accepts either: [["123","45"], ...] or [{gameId:123, playerId:45}, ...]
 */
export function parseOwnPairsMap(raw) {
  dlog("parseOwnPairsMap: raw len/snippet", {
    length: raw?.length ?? 0,
    snippet: typeof raw === "string" ? preview(raw) : raw,
  });

  const map = new Map();
  const data = parseCookieJSON(raw);
  dlog("parseOwnPairsMap: parsed", preview(data));
  const arr = extractArrayPayload(data);
  if (!arr) {
    dlog("parseOwnPairsMap: no array payload -> empty Map");
    return map;
  }

  for (const item of arr) {
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

/** Normalizes status to detect “in progress” across variants. */
export function isInProgress(status) {
  const s = String(status ?? "").toLowerCase().trim();
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

/* ------------------------------
 * Example cookie (decoded JSON, recommended):
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
 *
 * This parser also tolerates odd encodings with octal escapes like "\054" for commas,
 * and JSON nested as a string (stringified twice).
 * ------------------------------ */
