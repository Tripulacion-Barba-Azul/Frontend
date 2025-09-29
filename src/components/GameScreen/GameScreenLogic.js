import GameScreen from "./GameScreen";
import { cardMapping, secretMapping } from "./GameScreenConstants";

function mapRoleToUi(roleStr) {
  // Input examples: "PlayerRol.DETECTIVE", "PlayerRol.MURDERER", "PlayerRol.ACCOMPLICE"
  if (typeof roleStr !== "string") return "nothing";
  const key = roleStr.toUpperCase();
  if (key.includes("DETECTIVE")) return "detective";
  if (key.includes("MURDERER")) return "murderer";
  if (key.includes("ACCOMPLICE")) return "accomplice";
  return "nothing";
}

/**
 * Rotate an array by k positions to the left (k may be 0..len-1).
 * Keeps the direction (order) but changes the starting point.
 */
function rotateLeft(arr, k) {
  if (!arr.length) return arr.slice();
  const n = arr.length;
  const off = ((k % n) + n) % n;
  return arr.slice(off).concat(arr.slice(0, off));
}

export function buildUiPlayers({
  players,
  playerTurnId,
  playerId,
  rng = Math.random,
}) {
  if (!Array.isArray(players)) return [];

  // 1) Split: current-turn first, remainder keeps original direction
  const turnIdx = players.findIndex((p) => p.id === playerTurnId);
  // If not found, just treat as if the first player had the turn
  const normalized =
    turnIdx >= 0
      ? [
          players[turnIdx],
          ...players.slice(0, turnIdx),
          ...players.slice(turnIdx + 1),
        ]
      : players.slice();

  const current = normalized[0] ? [normalized[0]] : [];
  const rest = normalized.slice(1);

  // 2) Rotate the remainder by a random offset to randomize relative positions
  // while preserving direction (sense of order).
  const k = rest.length ? Math.floor(rng() * rest.length) : 0;
  const rotatedRest = rotateLeft(rest, k);

  const finalOrder = current.concat(rotatedRest);

  // 3) Map to UI shape
  return finalOrder.map((p, idx) => ({
    name: p.name,
    avatar: "default",
    order: idx + 1, // 1..N
    actualPlayer: p.id === playerId,
    role: mapRoleToUi(p.rol),
    turn: p.id === playerTurnId,
  }));
}

///////////////////////////////////////////////////////////////////////////////////////

export function toCanonicalCardName(name) {
  if (Object.prototype.hasOwnProperty.call(cardMapping, name)) {
    return String(cardMapping[name]);
  }
  return "";
}

function normalizeExistingCards(cards) {
  if (!Array.isArray(cards)) return [];
  return cards.map((c) => ({
    cardName: toCanonicalCardName(c?.cardName),
    cardID: Number(c.cardID),
    cardOwnerID: Number.isFinite(c.cardOwnerID) ? Number(c.cardOwnerID) : null,
    isInDeck: false,
    isInDiscard: false,
    isInDiscardTop: false,
  }));
}

function generateDeckCards(remainingOnDeck, takenIds) {
  const n = Math.max(0, Number.isFinite(remainingOnDeck) ? remainingOnDeck : 0);

  // Pick a starting point above the current max to keep it simple and unique
  const maxId = takenIds.size ? Math.max(...takenIds) : 0;
  const out = [];
  let nextId = maxId + 1;

  for (let i = 0; i < n; i++) {
    while (takenIds.has(nextId)) nextId++; // ensure uniqueness
    out.push({
      cardName: "detective_poirot",
      cardID: nextId,
      cardOwnerID: 1, // "empty" owner for deck cards
      isInDeck: true,
      isInDiscard: false,
      isInDiscardTop: false,
    });
    takenIds.add(nextId);
    nextId++;
  }
  return out;
}

export function buildCardsState({ remainingOnDeck, cards }) {
  const normalized = normalizeExistingCards(cards);
  const taken = new Set(normalized.map((c) => c.cardID));
  const deck = generateDeckCards(remainingOnDeck, taken);
  return [...normalized, ...deck];
}

////////////////////////////////////////////////////////////////////////////////////////

export function toCanonicalSecretName(name) {
  if (!name || typeof name !== "string" || !secretMapping) return fallback;

  // 1) Exact match
  if (Object.prototype.hasOwnProperty.call(secretMapping, name)) {
    return String(secretMapping[name]);
  }

  // 3) Fallback
  return "";
}

export function buildSecretsState(secrets) {
  if (!Array.isArray(secrets) || !secretMapping) return [];

  const out = [];
  let nextId = 1000;
  const used = new Set(); // ensure uniqueness within this batch

  for (const s of secrets) {
    const canonical = toCanonicalSecretName(s?.secretName, secretMapping);

    // assign a unique integer id
    let sid = nextId++;
    while (used.has(sid)) sid = nextId++;
    used.add(sid);

    out.push({
      secretName: canonical,
      secretID: sid,
      revealed: !!s?.revealed,
      secretOwnerID: Number(s?.secretOwnerID) || 0,
    });
  }

  return out;
}
