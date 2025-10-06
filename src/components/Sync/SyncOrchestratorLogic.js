// Regular deck logic
export function computeDeckCount(serverCards) {
  if (!Array.isArray(serverCards)) return null;
  let count = 0;
  for (const c of serverCards) {
    if (c && c.isInDeck === true && c.isInDiscardPile !== true) count += 1;
  }
  return count;
}

// Discard pile logic
export function computeDiscardState(serverCards) {
  if (!Array.isArray(serverCards)) return null;

  const count = serverCards.filter((c) => c?.isInDiscardPile === true).length;
  const top = serverCards.find((c) => c?.isInDiscardTop === true) || null;

  return { discardCount: count, discardTop: top };
}

// Own cards and View my cards logic
export function computeOwnCards(serverCards, currentPlayerId) {
  if (!Array.isArray(serverCards)) return null;

  const hand = [];
  for (const c of serverCards) {
    if (c?.cardOwnerID !== currentPlayerId) continue;
    if (c?.isInDeck || c?.isInDiscardPile) continue;

    hand.push(c);
  }

  return hand;
}

// View my secrets logic
export function computeOwnSecrets(serverSecrets, currentPlayerId) {
  if (!Array.isArray(serverSecrets)) return null;

  const hand = [];
  for (const s of serverSecrets) {
    if (s?.secretOwnerID !== currentPlayerId) continue;
    hand.push(s);
  }
  return hand;
}

// Board logic
function groupCountsByOwner(serverCards) {
  const counts = new Map();
  if (Array.isArray(serverCards)) {
    for (const c of serverCards) {
      const owner = c?.cardOwnerID;
      if (owner == null) continue;
      if (c?.isInDeck || c?.isInDiscardPile) continue;
      counts.set(owner, (counts.get(owner) || 0) + 1);
    }
  }
  return counts;
}

function groupSecretsByOwner(serverSecrets) {
  const map = new Map();
  if (Array.isArray(serverSecrets)) {
    for (const s of serverSecrets) {
      const owner = s.secretOwnerID;
      if (owner == null) continue;
      if (!map.has(owner)) map.set(owner, []);
      map.get(owner).push({
        secretName: s.secretName,
        revealed: s.revealed,
      });
    }
  }
  return map;
}

export function computeBoardPlayers({
  serverPlayers,
  serverCards,
  serverSecrets,
  currentPlayerId,
}) {
  if (!Array.isArray(serverPlayers)) return null;
  if (!Array.isArray(serverCards)) return null;
  if (!Array.isArray(serverSecrets)) return null;

  const cardCounts = groupCountsByOwner(serverCards);
  const secretsByOwner = groupSecretsByOwner(serverSecrets);
  const playersForBoard = serverPlayers.map((sp) => {
    const isActual = sp?.playerID === currentPlayerId;
    return {
      playerName: sp.playerName,
      avatar: sp.avatar,
      order: sp.orderNumber,
      actualPlayer: isActual,
      role: sp.role,
      turnStatus: sp.turnStatus,
      numCards: isActual ? null : cardCounts.get(sp.playerID) ?? 0,
      secrets: isActual ? null : secretsByOwner.get(sp.playerID) ?? [],
    };
  });

  return playersForBoard;
}
