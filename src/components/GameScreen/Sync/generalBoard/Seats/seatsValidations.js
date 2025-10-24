// seatsValidations.js
export default function validatePlayersOrThrow(players, currentPlayerId) {
  if (!Array.isArray(players)) {
    throw new Error("Players must be an array.");
  }

  // Keep only players with a valid turnOrder in [1..6]
  const valid = players.filter(
    (p) => Number.isFinite(p?.turnOrder) && p.turnOrder >= 1 && p.turnOrder <= 6
  );

  if (valid.length < 2) {
    throw new Error("At least 2 valid players are required.");
  }
  if (valid.length > 6) {
    throw new Error("At most 6 players are supported.");
  }

  // Exactly one "anchor": the current player must be present exactly once
  const anchors = valid.filter((p) => p?.id === currentPlayerId);
  if (anchors.length === 0) {
    throw new Error(
      "Exactly one player must match currentPlayerId (none found)."
    );
  }
  if (anchors.length > 1) {
    throw new Error(
      "Exactly one player must match currentPlayerId (multiple found)."
    );
  }

  // turnOrder must be unique and form the exact sequence 1..count (no gaps)
  const count = valid.length;
  const orders = valid.map((p) => p.turnOrder);

  const uniqueOrders = new Set(orders);
  if (uniqueOrders.size !== orders.length) {
    throw new Error("turnOrder values must be unique.");
  }

  const expected = new Set(Array.from({ length: count }, (_, i) => i + 1));
  for (const o of uniqueOrders) {
    if (!expected.has(o)) {
      throw new Error(
        `turnOrder values must be the sequence 1..${count}. Received: [${orders.join(
          ", "
        )}].`
      );
    }
  }

  return valid;
}
