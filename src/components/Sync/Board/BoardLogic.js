function groupCountsByOwner(serverCards) {
  const counts = new Map();
  if (Array.isArray(serverCards)) {
    for (const c of serverCards) {
      const owner = c.cardOwnerID;
      if (owner == null) continue;
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
        secretID: s.secretID,
        revealed: s.revealed,
      });
    }
  }
  return map;
}

export function buildBoardPlayers({
  serverPlayers,
  serverCards,
  serverSecrets,
  currentPlayerId,
}) {
  if (!Array.isArray(serverPlayers)) return [];

  const cardCounts = groupCountsByOwner(serverCards);
  const secretsByOwner = groupSecretsByOwner(serverSecrets);

  const playersForBoard = serverPlayers.map((sp) => {
    const pid = sp.playerID;
    const order = sp.orderNumber;
    const isActual = pid === currentPlayerId;

    return {
      name: sp.playerName,
      avatar: sp.avatar,
      order,
      actualPlayer: isActual,
      role: sp.role,
      turn: sp.isTurn,
      numCards: isActual ? null : cardCounts.get(pid) ?? 0,
      secrets: isActual ? null : secretsByOwner.get(pid) ?? [],
    };
  });

  playersForBoard.sort((a, b) => (a.order || 0) - (b.order || 0));
  return playersForBoard;
}
