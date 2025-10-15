// seatsLogic.test.js
import { describe, it, expect } from "vitest";
import { buildSeatedPlayersFromOrders } from "./seatsLogic.js";
import { SEAT_POSITIONS, SEATING_BY_COUNT } from "./seatsConstants.js";

/** Helper: builds a player object with the new input shape */
function mkPlayer({
  id,
  name,
  avatar = "default1",
  turnOrder,
  turnStatus = "waiting", // "waiting" | "playing" | "discarding" | "drawing" (case-insensitive)
  cardCount = 0,
  secrets = [], // [{ id, name, revealed }]
  sets = undefined, // optional: will default to [] in the output
}) {
  return {
    id,
    name,
    avatar,
    turnOrder,
    turnStatus,
    cardCount,
    secrets,
    sets,
  };
}

describe("buildSeatedPlayersFromOrders (updated behavior)", () => {
  it("anchors currentPlayer first (size=big), respects seating map and positions per seatId", () => {
    const players = [
      mkPlayer({ id: 1, name: "P1", turnOrder: 1 }),
      mkPlayer({ id: 2, name: "P2", turnOrder: 2 }),
      mkPlayer({ id: 3, name: "P3", turnOrder: 3 }),
      mkPlayer({ id: 4, name: "P4", turnOrder: 4 }),
      mkPlayer({ id: 5, name: "P5", turnOrder: 5 }),
      mkPlayer({ id: 6, name: "P6", turnOrder: 6 }),
    ];

    const CURRENT_ID = 2;
    const out = buildSeatedPlayersFromOrders(
      players,
      CURRENT_ID,
      "detective",
      null
    );

    // Count and anchor
    expect(out).toHaveLength(6);
    expect(out[0].name).toBe("P2");
    expect(out[0].size).toBe("big");
    expect(out[0].meta).toMatchObject({
      order: 2,
      actualPlayer: true,
      playerId: 2,
    });

    // Seat ids must follow SEATING_BY_COUNT[6]
    const expectedSeatIds = SEATING_BY_COUNT[6];
    expect(out.map((s) => s.id)).toEqual(expectedSeatIds);

    // Each item carries inline style from SEAT_POSITIONS[id]
    for (const s of out) {
      expect(s.style).toEqual(SEAT_POSITIONS[s.id].style);
    }

    // Position mapping derived from seatId
    const expectedBySeat = {
      p1: "down",
      p2: "right",
      p6: "left",
      // Remaining seats default to "up"
    };
    out.forEach((s) => {
      const expected = expectedBySeat[s.id] ?? "up";
      expect(s.position).toBe(expected);
    });
  });

  it("derives ringColor from turnStatus (case-insensitive)", () => {
    const players = [
      mkPlayer({ id: 1, name: "A", turnOrder: 1, turnStatus: "waiting" }),
      mkPlayer({ id: 2, name: "B", turnOrder: 2, turnStatus: "playing" }),
      mkPlayer({ id: 3, name: "C", turnOrder: 3, turnStatus: "discarding" }),
      mkPlayer({ id: 4, name: "D", turnOrder: 4, turnStatus: "Drawing" }), // capitalized
    ];

    const out = buildSeatedPlayersFromOrders(players, 1, "detective", null);

    // Order is circular starting at current (id=1, order=1)
    expect(out[0].name).toBe("A");
    expect(out[1].name).toBe("B");
    expect(out[2].name).toBe("C");
    expect(out[3].name).toBe("D");

    // ringColor mapping
    expect(out[0].ringColor).toBe("gray"); // waiting
    expect(out[1].ringColor).toBe("green"); // playing
    expect(out[2].ringColor).toBe("yellow"); // discarding
    expect(out[3].ringColor).toBe("red"); // drawing (capitalization ignored)
  });

  it("colors only visible roles when current player is hidden-team and knows the ally", () => {
    // current is murderer, ally is accomplice
    const players = [
      mkPlayer({ id: 1, name: "ME", turnOrder: 1 }),
      mkPlayer({ id: 2, name: "ALLY", turnOrder: 2 }),
      mkPlayer({ id: 3, name: "OTHER", turnOrder: 3 }),
    ];

    const out = buildSeatedPlayersFromOrders(players, 1, "murderer", {
      id: 2,
      role: "accomplice",
    });

    const byName = Object.fromEntries(out.map((p) => [p.name, p.nameBgColor]));
    expect(byName["ME"]).toBe("red"); // self murderer -> red
    expect(byName["ALLY"]).toBe("orange"); // ally accomplice -> orange
    expect(byName["OTHER"]).toBe("white"); // unknown -> white
  });

  it("when current player is detective, all labels are white", () => {
    const players = [
      mkPlayer({ id: 10, name: "AP", turnOrder: 1 }),
      mkPlayer({ id: 20, name: "B", turnOrder: 2 }),
      mkPlayer({ id: 30, name: "C", turnOrder: 3 }),
    ];
    const out = buildSeatedPlayersFromOrders(players, 10, "detective", null);
    out.forEach((p) => expect(p.nameBgColor).toBe("white"));
  });

  it("preserves cardCount, secrets and passes sets array (defaults to [])", () => {
    const players = [
      mkPlayer({
        id: 1,
        name: "AP",
        turnOrder: 1,
        turnStatus: "playing",
        cardCount: 4,
        secrets: [{ id: 101, name: "You are the murderer", revealed: true }],
        sets: [
          {
            setName: "Tommy Beresford",
            cards: [{ id: 1001, name: "Tommy Beresford" }],
          },
        ],
      }),
      mkPlayer({
        id: 2,
        name: "B",
        turnOrder: 2,
        cardCount: 2,
        secrets: [],
        // sets omitted on purpose
      }),
    ];

    const out = buildSeatedPlayersFromOrders(players, 1, "detective", null);

    // Anchor data
    expect(out[0].name).toBe("AP");
    expect(out[0].numCards).toBe(4);
    expect(out[0].secrets[0]).toEqual({
      id: 101,
      name: "You are the murderer",
      revealed: true,
    });
    expect(Array.isArray(out[0].sets)).toBe(true);
    expect(out[0].sets).toHaveLength(1);

    // Second player data
    expect(out[1].name).toBe("B");
    expect(out[1].numCards).toBe(2);
    expect(out[1].secrets).toEqual([]);
    expect(Array.isArray(out[1].sets)).toBe(true);
    expect(out[1].sets).toHaveLength(0); // defaulted to []
  });

  it("throws on invalid player lists (quantity, duplicates, gaps, or missing current)", () => {
    // fewer than 2 valid players
    expect(() =>
      buildSeatedPlayersFromOrders(
        [mkPlayer({ id: 1, name: "Only", turnOrder: 1 })],
        1,
        "detective",
        null
      )
    ).toThrow();

    // duplicate turnOrder
    expect(() =>
      buildSeatedPlayersFromOrders(
        [
          mkPlayer({ id: 1, name: "A", turnOrder: 1 }),
          mkPlayer({ id: 2, name: "B", turnOrder: 1 }),
          mkPlayer({ id: 3, name: "C", turnOrder: 2 }),
        ],
        1,
        "detective",
        null
      )
    ).toThrow();

    // gaps in 1..N
    expect(() =>
      buildSeatedPlayersFromOrders(
        [
          mkPlayer({ id: 1, name: "A", turnOrder: 1 }),
          mkPlayer({ id: 2, name: "B", turnOrder: 3 }), // gap at 2
        ],
        1,
        "detective",
        null
      )
    ).toThrow();

    // currentPlayerId not present
    expect(() =>
      buildSeatedPlayersFromOrders(
        [
          mkPlayer({ id: 1, name: "A", turnOrder: 1 }),
          mkPlayer({ id: 2, name: "B", turnOrder: 2 }),
        ],
        999,
        "detective",
        null
      )
    ).toThrow();

    // more than 6 valid players
    expect(() =>
      buildSeatedPlayersFromOrders(
        [
          mkPlayer({ id: 1, name: "A", turnOrder: 1 }),
          mkPlayer({ id: 2, name: "B", turnOrder: 2 }),
          mkPlayer({ id: 3, name: "C", turnOrder: 3 }),
          mkPlayer({ id: 4, name: "D", turnOrder: 4 }),
          mkPlayer({ id: 5, name: "E", turnOrder: 5 }),
          mkPlayer({ id: 6, name: "F", turnOrder: 6 }),
          mkPlayer({ id: 7, name: "G", turnOrder: 1 }), // extra still-valid -> >6
        ],
        1,
        "detective",
        null
      )
    ).toThrow();
  });
});
