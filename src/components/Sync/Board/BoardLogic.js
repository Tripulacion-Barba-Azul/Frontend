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

  // Los serverPlayers ya vienen procesados por buildUiPlayers con la estructura correcta
  const playersForBoard = serverPlayers.map((sp) => {
    return {
      name: sp.name,
      avatar: sp.avatar || "default",
      order: sp.order, // Esta ya viene de buildUiPlayers
      actualPlayer: sp.actualPlayer,
      role: sp.role,
      turn: sp.turn,
      numCards: sp.actualPlayer ? null : cardCounts.get(currentPlayerId) ?? 0,
      secrets: sp.actualPlayer ? null : secretsByOwner.get(currentPlayerId) ?? [],
    };
  });

  playersForBoard.sort((a, b) => (a.order || 0) - (b.order || 0));
  return playersForBoard;
}
