// cookieUtils.js
// Simple cookie reader. Values are URI-encoded in document.cookie,
// so we decode before returning.

/**
 * SHAPE DOCUMENTATION (cookie "DOTC_OWN_PAIRS")
 *
 * Recommended (decoded JSON):
 * [
 *   { "gameId": 1,  "playerId": 5  },
 *   { "gameId": 42, "playerId": 12 }
 * ]
 *
 * Cookie string as stored in document.cookie (encoded):
 * DOTC_OWN_PAIRS=%5B%7B%22gameId%22%3A1%2C%22playerId%22%3A5%7D%2C%7B%22gameId%22%3A42%2C%22playerId%22%3A12%7D%5D
 *
 * Alternative shape (decoded): [["1","5"],["42","12"]]
 * Alternative encoded:
 * DOTC_OWN_PAIRS=%5B%5B%221%22%2C%225%22%5D%2C%5B%2242%22%2C%2212%22%5D%5D
 *
 * Example usage:
 *   import { getCookie } from "./cookies";
 *   const raw = getCookie("DOTC_OWN_PAIRS"); // returns decoded JSON string or null
 *   const pairs = raw ? JSON.parse(raw) : [];
 *   // Access example (object shape):
 *   // find playerId for gameId=1
 *   const entry = pairs.find(p => Number(p.gameId) === 1);
 *   const playerId = entry ? Number(entry.playerId) : null;
 */

/** Get a cookie value by name (decoded) or null if missing. */
export function getCookie(name) {
  const row = document.cookie.split("; ").find((x) => x.startsWith(name + "="));
  if (!row) return null;
  const raw = row.slice(name.length + 1); // after "name="
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
