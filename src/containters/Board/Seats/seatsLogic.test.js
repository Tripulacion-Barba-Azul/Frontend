import { describe, it, expect } from "vitest";

import { buildSeatedPlayersFromOrders } from "./seatsLogic.js";
import {
  SEAT_POSITIONS,
  SEATING_BY_COUNT,
  RING_COLORS,
} from "./seatsConstants.js";

describe("buildSeatedPlayersFromOrders", () => {
  it("places the actualPlayer first (size=big) and respects seating by player count", () => {
    // Arrange a full table to exercise seat mapping
    const players = [
      {
        name: "P1",
        order: 1,
        role: "detective",
        avatar: "default1",
        actualPlayer: false,
        turn: false,
      },
      {
        name: "P2",
        order: 2,
        role: "detective",
        avatar: "default1",
        actualPlayer: true,
        turn: true,
      },
      {
        name: "P3",
        order: 3,
        role: "detective",
        avatar: "default1",
        actualPlayer: false,
        turn: false,
      },
      {
        name: "P4",
        order: 4,
        role: "detective",
        avatar: "default1",
        actualPlayer: false,
        turn: false,
      },
      {
        name: "P5",
        order: 5,
        role: "detective",
        avatar: "default1",
        actualPlayer: false,
        turn: false,
      },
      {
        name: "P6",
        order: 6,
        role: "detective",
        avatar: "default1",
        actualPlayer: false,
        turn: false,
      },
    ];

    // Act
    const seated = buildSeatedPlayersFromOrders(players);

    // Assert: returned count equals valid players (clamped 2..6)
    expect(seated).toHaveLength(6);

    // First element should be the actual player and be "big"
    expect(seated[0].name).toBe("P2");
    expect(seated[0].size).toBe("big");

    // Seat ids must follow SEATING_BY_COUNT[6]
    const expectedSeatIds = SEATING_BY_COUNT[6];
    expect(seated.map((s) => s.id)).toEqual(expectedSeatIds);

    // Each item should contain an inline style from SEAT_POSITIONS[id]
    for (const s of seated) {
      expect(s.style).toEqual(SEAT_POSITIONS[s.id].style);
    }
  });

  it("cycles ringColor from RING_COLORS by index", () => {
    const players = [
      {
        name: "A",
        order: 1,
        role: "detective",
        avatar: "a",
        actualPlayer: true,
        turn: false,
      },
      {
        name: "B",
        order: 2,
        role: "detective",
        avatar: "b",
        actualPlayer: false,
        turn: false,
      },
      {
        name: "C",
        order: 3,
        role: "detective",
        avatar: "c",
        actualPlayer: false,
        turn: false,
      },
      {
        name: "D",
        order: 4,
        role: "detective",
        avatar: "d",
        actualPlayer: false,
        turn: false,
      },
    ];
    const seated = buildSeatedPlayersFromOrders(players);
    // ringColor must repeat from RING_COLORS[0..] in order
    seated.forEach((s, idx) => {
      expect(RING_COLORS).toContain(s.ringColor);
      expect(s.ringColor).toBe(RING_COLORS[idx % RING_COLORS.length]);
    });
  });

  it("highlights murderer/red and accomplice/orange only if actualPlayer is hidden team", () => {
    // Case 1: actualPlayer is 'murderer' => murderer=red, accomplice=orange, others=white
    const hiddenAP1 = [
      {
        name: "AP",
        order: 1,
        role: "murderer",
        avatar: "x",
        actualPlayer: true,
        turn: true,
      },
      {
        name: "AC",
        order: 2,
        role: "accomplice",
        avatar: "x",
        actualPlayer: false,
        turn: false,
      },
      {
        name: "DT",
        order: 3,
        role: "detective",
        avatar: "x",
        actualPlayer: false,
        turn: false,
      },
    ];
    const seatedH1 = buildSeatedPlayersFromOrders(hiddenAP1);
    const mapH1 = Object.fromEntries(
      seatedH1.map((p) => [p.name, p.nameBgColor])
    );
    expect(mapH1["AP"]).toBe("red");
    expect(mapH1["AC"]).toBe("orange");
    expect(mapH1["DT"]).toBe("white");

    // Case 2: actualPlayer is 'accomplice' => murderer=red, accomplice=orange, others=white
    const hiddenAP2 = [
      {
        name: "AP",
        order: 1,
        role: "accomplice",
        avatar: "x",
        actualPlayer: true,
        turn: true,
      },
      {
        name: "AC",
        order: 2,
        role: "murderer",
        avatar: "x",
        actualPlayer: false,
        turn: false,
      },
      {
        name: "DT",
        order: 3,
        role: "detective",
        avatar: "x",
        actualPlayer: false,
        turn: false,
      },
    ];
    const seatedH2 = buildSeatedPlayersFromOrders(hiddenAP2);
    const mapH2 = Object.fromEntries(
      seatedH2.map((p) => [p.name, p.nameBgColor])
    );
    expect(mapH2["AP"]).toBe("orange");
    expect(mapH2["AC"]).toBe("red");
    expect(mapH2["DT"]).toBe("white");

    // Case 3: actualPlayer is 'detective' => everyone white
    const detectiveAP = [
      {
        name: "AP",
        order: 1,
        role: "detective",
        avatar: "x",
        actualPlayer: true,
        turn: true,
      },
      {
        name: "AC",
        order: 2,
        role: "accomplice",
        avatar: "x",
        actualPlayer: false,
        turn: false,
      },
      {
        name: "MU",
        order: 3,
        role: "murderer",
        avatar: "x",
        actualPlayer: false,
        turn: false,
      },
    ];
    const seatedD = buildSeatedPlayersFromOrders(detectiveAP);
    seatedD.forEach((p) => expect(p.nameBgColor).toBe("white"));
  });

  it("throws if validatePlayersOrThrow yields fewer than 2 valid players (e.g., only one in [1..6])", () => {
    // Only one valid (order in [1..6]) => should throw by validation
    const invalid = [
      {
        name: "Only",
        order: 1,
        role: "detective",
        avatar: "x",
        actualPlayer: true,
        turn: false,
      },
      {
        name: "OutOfRange",
        order: 7,
        role: "detective",
        avatar: "x",
        actualPlayer: false,
        turn: false,
      }, // filtered out
    ];
    expect(() => buildSeatedPlayersFromOrders(invalid)).toThrow(
      /At least 2 valid players/i
    );
  });
  it("throws when players list is empty", () => {
    // Empty input => not enough valid players
    expect(() => buildSeatedPlayersFromOrders([])).toThrow(
      /At least 2 valid players/i
    );
  });

  it("throws when there are more than 6 valid players (orders within 1..6)", () => {
    // 7 entries all with orders in [1..6]
    const tooMany = [
      { name: "A", order: 1, role: "detective", actualPlayer: true },
      { name: "B", order: 2, role: "detective", actualPlayer: false },
      { name: "C", order: 3, role: "detective", actualPlayer: false },
      { name: "D", order: 4, role: "detective", actualPlayer: false },
      { name: "E", order: 5, role: "detective", actualPlayer: false },
      { name: "F", order: 6, role: "detective", actualPlayer: false },
      // Duplicate an order still keeps it "valid" (1..6), pushing valid.length to 7
      { name: "G", order: 1, role: "detective", actualPlayer: false },
    ];
    expect(() => buildSeatedPlayersFromOrders(tooMany)).toThrow(
      /At most 6 players are supported/i
    );
  });

  it("throws when more than one player has actualPlayer === true", () => {
    // Exactly one actualPlayer is required; here we set two
    const twoAnchors = [
      { name: "AP1", order: 1, role: "detective", actualPlayer: true },
      { name: "AP2", order: 2, role: "detective", actualPlayer: true },
      { name: "N3", order: 3, role: "detective", actualPlayer: false },
    ];
    expect(() => buildSeatedPlayersFromOrders(twoAnchors)).toThrow(
      /Exactly one player.*multiple found/i
    );
  });

  it("throws when two players share the same order value", () => {
    // Orders must be unique; here 1 is duplicated
    const dupOrders = [
      { name: "AP", order: 1, role: "detective", actualPlayer: true },
      { name: "B", order: 1, role: "detective", actualPlayer: false },
      { name: "C", order: 2, role: "detective", actualPlayer: false },
    ];
    expect(() => buildSeatedPlayersFromOrders(dupOrders)).toThrow(
      /Order values must be unique/i
    );
  });
});
