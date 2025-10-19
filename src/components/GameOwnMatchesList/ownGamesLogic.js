// Helpers to extract "own games" from a cookie and filter a list accordingly.
// Robust to odd encodings (octal escapes like \054) and double-encoded JSON.
// Code comments in English.

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
  if (
    (str.startsWith('"') && str.endsWith('"')) ||
    (str.startsWith("'") && str.endsWith("'"))
  ) {
    return str.slice(1, -1);
  }
  return str;
}

/**
 * Try to obtain a JS value (Array/Object) out of a messy cookie string.
 * Steps:
 *   raw
 *   decodeURIComponent(raw)
 *   unescapeOctal(raw)
 *   unescapeOctal(decodeURIComponent(raw))
 * For each candidate, also try with outer quotes stripped,
 * and if JSON.parse -> string, parse again once (nested JSON-as-string).
 */
function parseCookieJSON(raw) {
  if (!raw) return null;

  const candidates = new Set();
  const push = (s) => {
    if (typeof s === "string" && s.length) candidates.add(s);
  };

  push(raw);
  try {
    push(decodeURIComponent(raw));
  } catch {}
  push(unescapeOctal(raw));
  try {
    push(unescapeOctal(decodeURIComponent(raw)));
  } catch {}

  // Versions without outer quotes
  [...candidates].forEach((c) => push(stripOuterQuotes(c)));

  for (const c of candidates) {
    try {
      const v = JSON.parse(c);
      if (typeof v === "string") {
        const s2 = unescapeOctal(stripOuterQuotes(v));
        try {
          return JSON.parse(s2);
        } catch {
          // fall through
        }
      }
      return v;
    } catch {
      // try next candidate
    }
  }
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
  const ids = new Set();
  const data = parseCookieJSON(raw);
  const arr = extractArrayPayload(data);
  if (!arr) return ids;

  for (const item of arr) {
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

/**
 * Builds a Map<gameId:number, playerId:number> from the cookie value.
 * Accepts either: [["123","45"], ...] or [{gameId:123, playerId:45}, ...]
 */
export function parseOwnPairsMap(raw) {
  const map = new Map();
  const data = parseCookieJSON(raw);
  const arr = extractArrayPayload(data);
  if (!arr) return map;

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
  return map;
}

/** Convenience: returns the playerId (number) for a given gameId or null. */
export function getPlayerIdForGame(cookieRaw, gameId) {
  const nGid = toNumSafe(gameId);
  const map = parseOwnPairsMap(cookieRaw);
  const pid = map.get(nGid);
  return typeof pid === "number" && Number.isFinite(pid) ? pid : null;
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
  return (Array.isArray(allMatches) ? allMatches : []).filter(
    (m) => ownIds.has(toNumSafe(m.id)) && isInProgress(m.gameStatus)
  );
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
