// seatsLogic.test.js
import { describe, it, expect } from "vitest";
import { buildSeatedPlayersFromOrders } from "./seatsLogic.js";
import {
  SEAT_POSITIONS,
  SEATING_BY_COUNT,
  RING_COLORS,
} from "./seatsConstants.js";

// Helper to build a player object in the new format
function mkPlayer({
  id,
  name,
  avatar = "default1",
  turnOrder,
  turnStatus = "waiting", // "waiting" | "playing" | "discarding" | "discardingOpt" | "Drawing"
  cardCount = 0,
  secrets = [], // [{ id, name, revealed }]
}) {
  return {
    id,
    name,
    avatar,
    turnOrder,
    turnStatus,
    cardCount,
    secrets,
  };
}

describe("buildSeatedPlayersFromOrders (new player shape + new signature)", () => {
  it("places the currentPlayer first (size=big) and respects seating by player count", () => {
    const players = [
      mkPlayer({ id: 1, name: "P1", turnOrder: 1 }),
      mkPlayer({ id: 2, name: "P2", turnOrder: 2, turnStatus: "playing" }),
      mkPlayer({ id: 3, name: "P3", turnOrder: 3 }),
      mkPlayer({ id: 4, name: "P4", turnOrder: 4 }),
      mkPlayer({ id: 5, name: "P5", turnOrder: 5 }),
      mkPlayer({ id: 6, name: "P6", turnOrder: 6 }),
    ];

    const CURRENT_ID = 2;
    const OUT = buildSeatedPlayersFromOrders(
      players,
      CURRENT_ID,
      "detective",
      null
    );

    // returned count equals valid players (clamped 2..6)
    expect(OUT).toHaveLength(6);

    // first element is the current player and is "big"
    expect(OUT[0].name).toBe("P2");
    expect(OUT[0].size).toBe("big");

    // seat ids follow SEATING_BY_COUNT[6]
    const expectedSeatIds = SEATING_BY_COUNT[6];
    expect(OUT.map((s) => s.id)).toEqual(expectedSeatIds);

    // each item contains inline style from SEAT_POSITIONS[id]
    for (const s of OUT) {
      expect(s.style).toEqual(SEAT_POSITIONS[s.id].style);
    }

    // meta echoes turnOrder and marks the anchor as actualPlayer
    expect(OUT[0].meta).toMatchObject({
      order: 2,
      actualPlayer: true,
      playerId: 2,
    });
  });

  it("cycles ringColor from RING_COLORS by index", () => {
    const players = [
      mkPlayer({ id: 1, name: "A", turnOrder: 1 }),
      mkPlayer({ id: 2, name: "B", turnOrder: 2 }),
      mkPlayer({ id: 3, name: "C", turnOrder: 3 }),
      mkPlayer({ id: 4, name: "D", turnOrder: 4 }),
    ];

    const OUT = buildSeatedPlayersFromOrders(players, 1, "detective", null);

    OUT.forEach((s, idx) => {
      expect(RING_COLORS).toContain(s.ringColor);
      expect(s.ringColor).toBe(RING_COLORS[idx % RING_COLORS.length]);
    });
  });

  it("computes 'turn' from turnStatus !== 'waiting' (case-insensitive)", () => {
    const players = [
      mkPlayer({ id: 1, name: "AP", turnOrder: 1, turnStatus: "waiting" }),
      mkPlayer({ id: 2, name: "B", turnOrder: 2, turnStatus: "playing" }),
      mkPlayer({ id: 3, name: "C", turnOrder: 3, turnStatus: "discarding" }),
      mkPlayer({ id: 4, name: "D", turnOrder: 4, turnStatus: "Drawing" }), // capitalized
    ];

    const OUT = buildSeatedPlayersFromOrders(players, 1, "detective", null);

    expect(OUT[0].name).toBe("AP");
    expect(OUT[0].turn).toBe(false); // waiting -> false
    expect(OUT[1].turn).toBe(true); // playing -> true
    expect(OUT[2].turn).toBe(true); // discarding -> true
    expect(OUT[3].turn).toBe(true); // Drawing -> true
  });

  it("colors only visible roles when current player is hidden-team and knows the ally", () => {
    // current is murderer, ally is accomplice
    const players = [
      mkPlayer({ id: 1, name: "ME", turnOrder: 1 }),
      mkPlayer({ id: 2, name: "ALLY", turnOrder: 2 }),
      mkPlayer({ id: 3, name: "OTHER", turnOrder: 3 }),
    ];

    const currentPlayerId = 1;
    const currentPlayerRole = "murderer";
    const currentPlayerAlly = { id: 2, role: "accomplice" };

    const OUT = buildSeatedPlayersFromOrders(
      players,
      currentPlayerId,
      currentPlayerRole,
      currentPlayerAlly
    );

    const colors = Object.fromEntries(OUT.map((p) => [p.name, p.nameBgColor]));
    expect(colors["ME"]).toBe("red"); // self murderer -> red
    expect(colors["ALLY"]).toBe("orange"); // ally accomplice -> orange
    expect(colors["OTHER"]).toBe("white"); // unknown to current -> white
  });

  it("when current player is detective, all labels are white (no hidden roles visible)", () => {
    const players = [
      mkPlayer({ id: 10, name: "AP", turnOrder: 1 }),
      mkPlayer({ id: 20, name: "B", turnOrder: 2 }),
      mkPlayer({ id: 30, name: "C", turnOrder: 3 }),
    ];
    const OUT = buildSeatedPlayersFromOrders(players, 10, "detective", null);
    OUT.forEach((p) => expect(p.nameBgColor).toBe("white"));
  });

  it("throws if fewer than 2 valid players (turnOrder in 1..6) remain after filtering", () => {
    const invalid = [
      mkPlayer({ id: 1, name: "Only", turnOrder: 1 }),
      mkPlayer({ id: 2, name: "OutOfRange", turnOrder: 7 }), // filtered out
    ];
    expect(() =>
      buildSeatedPlayersFromOrders(invalid, 1, "detective", null)
    ).toThrow(/At least 2 valid players are required/i);
  });

  it("throws when players list is empty", () => {
    expect(() =>
      buildSeatedPlayersFromOrders([], 1, "detective", null)
    ).toThrow(/At least 2 valid players are required/i);
  });

  it("throws when more than 6 valid players (1..6) are provided", () => {
    const tooMany = [
      mkPlayer({ id: 1, name: "A", turnOrder: 1 }),
      mkPlayer({ id: 2, name: "B", turnOrder: 2 }),
      mkPlayer({ id: 3, name: "C", turnOrder: 3 }),
      mkPlayer({ id: 4, name: "D", turnOrder: 4 }),
      mkPlayer({ id: 5, name: "E", turnOrder: 5 }),
      mkPlayer({ id: 6, name: "F", turnOrder: 6 }),
      // extra valid (duplicate order but still within 1..6 -> valid length becomes 7)
      mkPlayer({ id: 7, name: "G", turnOrder: 1 }),
    ];
    expect(() =>
      buildSeatedPlayersFromOrders(tooMany, 1, "detective", null)
    ).toThrow(/At most 6 players are supported/i);
  });

  it("throws when two players share the same turnOrder (uniqueness)", () => {
    const dupOrders = [
      mkPlayer({ id: 1, name: "AP", turnOrder: 1 }),
      mkPlayer({ id: 2, name: "B", turnOrder: 1 }),
      mkPlayer({ id: 3, name: "C", turnOrder: 2 }),
    ];
    expect(() =>
      buildSeatedPlayersFromOrders(dupOrders, 1, "detective", null)
    ).toThrow(/turnOrder values must be unique/i);
  });

  it("throws when currentPlayerId is not present among players", () => {
    const players = [
      mkPlayer({ id: 1, name: "A", turnOrder: 1 }),
      mkPlayer({ id: 2, name: "B", turnOrder: 2 }),
    ];
    expect(() =>
      buildSeatedPlayersFromOrders(players, 999, "detective", null)
    ).toThrow(/Exactly one player must match currentPlayerId \(none found\)/i);
  });

  it("throws when turnOrder does not form the exact sequence 1..count (no gaps)", () => {
    const players = [
      mkPlayer({ id: 1, name: "A", turnOrder: 1 }),
      mkPlayer({ id: 2, name: "B", turnOrder: 3 }), // gap at 2
    ];
    expect(() =>
      buildSeatedPlayersFromOrders(players, 1, "detective", null)
    ).toThrow(/turnOrder values must be the sequence 1..2/i);
  });

  it("maps input name -> output name and preserves cardCount & secrets", () => {
    const players = [
      mkPlayer({
        id: 1,
        name: "AP",
        turnOrder: 1,
        turnStatus: "playing",
        cardCount: 4,
        secrets: [{ id: 101, name: "You are the murderer", revealed: true }],
      }),
      mkPlayer({ id: 2, name: "B", turnOrder: 2, cardCount: 2, secrets: [] }),
    ];

    const OUT = buildSeatedPlayersFromOrders(players, 1, "detective", null);

    expect(OUT[0].name).toBe("AP");
    expect(OUT[0].numCards).toBe(4);
    expect(Array.isArray(OUT[0].secrets)).toBe(true);
    expect(OUT[0].secrets[0]).toEqual({
      id: 101,
      name: "You are the murderer",
      revealed: true,
    });

    expect(OUT[1].name).toBe("B");
    expect(OUT[1].numCards).toBe(2);
    expect(OUT[1].secrets).toEqual([]);
  });

  it("sets meta.role only for self and (if provided) ally; null for others", () => {
    const players = [
      mkPlayer({ id: 1, name: "ME", turnOrder: 1 }),
      mkPlayer({ id: 2, name: "ALLY", turnOrder: 2 }),
      mkPlayer({ id: 3, name: "X", turnOrder: 3 }),
    ];
    const OUT = buildSeatedPlayersFromOrders(players, 1, "accomplice", {
      id: 2,
      role: "murderer",
    });

    const metaByName = Object.fromEntries(
      OUT.map((p) => [p.name, p.meta.role])
    );
    expect(metaByName["ME"]).toBe("accomplice");
    expect(metaByName["ALLY"]).toBe("murderer");
    expect(metaByName["X"]).toBeNull();
  });
});
