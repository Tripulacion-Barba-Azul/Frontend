import { MAX_NAME_LEN } from "./seatsConstants";

export default function validatePlayersOrThrow(players) {
  // Basic shape validation
  if (!Array.isArray(players) || players.length === 0) {
    throw new Error("Players must be a non-empty array.");
  }

  // Filter valid player entries
  const valid = players.filter(
    (p) =>
      p &&
      typeof p.name === "string" &&
      Number.isInteger(p.order) &&
      p.order >= 1 &&
      p.order <= 6
  );
  if (valid.length < 2) {
    throw new Error("At least 2 valid players are required.");
  }
  if (valid.length > 6) {
    throw new Error("At most 6 players are supported.");
  }

  // Exactly one actualPlayer === true
  const anchors = valid.filter((p) => !!p.actualPlayer);
  if (anchors.length === 0) {
    throw new Error(
      "Exactly one player must have actualPlayer === true (none found)."
    );
  }
  if (anchors.length > 1) {
    throw new Error(
      "Exactly one player must have actualPlayer === true (multiple found)."
    );
  }

  // Orders must be unique and must form the exact set {1..count}
  const count = valid.length;
  const orders = valid.map((p) => p.order);

  // Uniqueness check
  const uniqueOrders = new Set(orders);
  if (uniqueOrders.size !== orders.length) {
    throw new Error("Order values must be unique.");
  }

  // Sequence 1..count check (no gaps)
  const expected = new Set(Array.from({ length: count }, (_, i) => i + 1));
  for (const o of uniqueOrders) {
    if (!expected.has(o)) {
      throw new Error(
        `Order values must be the sequence 1..${count}. Received: [${orders.join(
          ", "
        )}].`
      );
    }
  }

  // If all checks pass, return a valid copy
  return valid.map((p) => ({
    ...p,
    name:
      p.name.length > MAX_NAME_LEN
        ? p.name.slice(0, MAX_NAME_LEN) + "…"
        : p.name,
  }));
}
