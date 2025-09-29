export function computeSecretsState(allSecrets = [], playerId) {
  if (!playerId) return [];

  // Filtrar secretos que correspondan al jugador
  const playerSecrets = allSecrets.filter((s) => s?.secretOwnerID === playerId);

  // Mapear cada secreto a { name, revealed }
  return playerSecrets.map((s) => ({
    class: s.secretName,
    revealed: Boolean(s.revealed),
  }));
}

export default computeSecretsState;
