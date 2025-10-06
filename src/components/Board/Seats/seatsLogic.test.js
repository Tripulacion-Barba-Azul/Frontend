// seatsLogic.test.js
import { describe, it, expect } from "vitest";
import { buildSeatedPlayersFromOrders } from "./seatsLogic.js";
import {
  SEAT_POSITIONS,
  SEATING_BY_COUNT,
  RING_COLORS,
} from "./seatsConstants.js";

// helper to build a player object in the new format
function mkPlayer({
  playerName,
  order,
  role = "detective",
  avatar = "default1",
  actualPlayer = false,
  turnStatus = "waiting",
  numCards = 0,
  secrets = [],
}) {
  return {
    playerName,
    order,
    role,
    avatar,
    actualPlayer,
    turnStatus,
    numCards,
    secrets,
  };
}

describe("buildSeatedPlayersFromOrders (new player shape)", () => {
  it("places the actualPlayer first (size=big) and respects seating by player count", () => {
    const players = [
      mkPlayer({ playerName: "P1", order: 1 }),
      mkPlayer({
        playerName: "P2",
        order: 2,
        actualPlayer: true,
        turnStatus: "playing",
      }),
      mkPlayer({ playerName: "P3", order: 3 }),
      mkPlayer({ playerName: "P4", order: 4 }),
      mkPlayer({ playerName: "P5", order: 5 }),
      mkPlayer({ playerName: "P6", order: 6 }),
    ];

    const seated = buildSeatedPlayersFromOrders(players);

    // returned count equals valid players (clamped 2..6)
    expect(seated).toHaveLength(6);

    // first element is actual player and is "big"
    expect(seated[0].name).toBe("P2");
    expect(seated[0].size).toBe("big");

    // seat ids follow SEATING_BY_COUNT[6]
    const expectedSeatIds = SEATING_BY_COUNT[6];
    expect(seated.map((s) => s.id)).toEqual(expectedSeatIds);

    // each item contains inline style from SEAT_POSITIONS[id]
    for (const s of seated) {
      expect(s.style).toEqual(SEAT_POSITIONS[s.id].style);
    }
  });

  it("cycles ringColor from RING_COLORS by index", () => {
    const players = [
      mkPlayer({ playerName: "A", order: 1, actualPlayer: true }),
      mkPlayer({ playerName: "B", order: 2 }),
      mkPlayer({ playerName: "C", order: 3 }),
      mkPlayer({ playerName: "D", order: 4 }),
    ];

    const seated = buildSeatedPlayersFromOrders(players);

    seated.forEach((s, idx) => {
      expect(RING_COLORS).toContain(s.ringColor);
      expect(s.ringColor).toBe(RING_COLORS[idx % RING_COLORS.length]);
    });
  });

  it("computes 'turn' from turnStatus !== 'waiting'", () => {
    const players = [
      mkPlayer({
        playerName: "AP",
        order: 1,
        actualPlayer: true,
        turnStatus: "waiting",
      }),
      mkPlayer({ playerName: "B", order: 2, turnStatus: "playing" }),
      mkPlayer({ playerName: "C", order: 3, turnStatus: "discarding" }),
    ];

    const seated = buildSeatedPlayersFromOrders(players);

    // First is actual player, but turn is derived from status
    expect(seated[0].name).toBe("AP");
    expect(seated[0].turn).toBe(false); // waiting -> false
    expect(seated[1].turn).toBe(true); // playing -> true
    expect(seated[2].turn).toBe(true); // discarding -> true
  });

  it("highlights murderer=red and accomplice=orange only if actualPlayer is hidden team", () => {
    // Case 1: actualPlayer is 'murderer'
    const hiddenAP1 = [
      mkPlayer({
        playerName: "AP",
        order: 1,
        role: "murderer",
        actualPlayer: true,
      }),
      mkPlayer({ playerName: "AC", order: 2, role: "accomplice" }),
      mkPlayer({ playerName: "DT", order: 3, role: "detective" }),
    ];
    const seatedH1 = buildSeatedPlayersFromOrders(hiddenAP1);
    const mapH1 = Object.fromEntries(
      seatedH1.map((p) => [p.name, p.nameBgColor])
    );
    expect(mapH1["AP"]).toBe("red");
    expect(mapH1["AC"]).toBe("orange");
    expect(mapH1["DT"]).toBe("white");

    // Case 2: actualPlayer is 'accomplice'
    const hiddenAP2 = [
      mkPlayer({
        playerName: "AP",
        order: 1,
        role: "accomplice",
        actualPlayer: true,
      }),
      mkPlayer({ playerName: "MU", order: 2, role: "murderer" }),
      mkPlayer({ playerName: "DT", order: 3, role: "detective" }),
    ];
    const seatedH2 = buildSeatedPlayersFromOrders(hiddenAP2);
    const mapH2 = Object.fromEntries(
      seatedH2.map((p) => [p.name, p.nameBgColor])
    );
    expect(mapH2["AP"]).toBe("orange");
    expect(mapH2["MU"]).toBe("red");
    expect(mapH2["DT"]).toBe("white");

    // Case 3: actualPlayer is 'detective'
    const detectiveAP = [
      mkPlayer({
        playerName: "AP",
        order: 1,
        role: "detective",
        actualPlayer: true,
      }),
      mkPlayer({ playerName: "AC", order: 2, role: "accomplice" }),
      mkPlayer({ playerName: "MU", order: 3, role: "murderer" }),
    ];
    const seatedD = buildSeatedPlayersFromOrders(detectiveAP);
    seatedD.forEach((p) => expect(p.nameBgColor).toBe("white"));
  });

  it("throws if fewer than 2 valid players (orders in 1..6) remain after filtering", () => {
    const invalid = [
      mkPlayer({ playerName: "Only", order: 1, actualPlayer: true }),
      mkPlayer({ playerName: "OutOfRange", order: 7 }), // filtered out
    ];
    expect(() => buildSeatedPlayersFromOrders(invalid)).toThrow(
      /At least 2 valid players are required/i
    );
  });

  it("throws when players list is empty", () => {
    expect(() => buildSeatedPlayersFromOrders([])).toThrow(
      /At least 2 valid players are required/i
    );
  });

  it("throws when there are more than 6 valid players (orders within 1..6)", () => {
    const tooMany = [
      mkPlayer({ playerName: "A", order: 1, actualPlayer: true }),
      mkPlayer({ playerName: "B", order: 2 }),
      mkPlayer({ playerName: "C", order: 3 }),
      mkPlayer({ playerName: "D", order: 4 }),
      mkPlayer({ playerName: "E", order: 5 }),
      mkPlayer({ playerName: "F", order: 6 }),
      // Duplicate an order (still within 1..6) to push valid length to 7
      mkPlayer({ playerName: "G", order: 1 }),
    ];
    expect(() => buildSeatedPlayersFromOrders(tooMany)).toThrow(
      /At most 6 players are supported/i
    );
  });

  it("throws when more than one player has actualPlayer === true", () => {
    const twoAnchors = [
      mkPlayer({ playerName: "AP1", order: 1, actualPlayer: true }),
      mkPlayer({ playerName: "AP2", order: 2, actualPlayer: true }),
      mkPlayer({ playerName: "N3", order: 3 }),
    ];
    expect(() => buildSeatedPlayersFromOrders(twoAnchors)).toThrow(
      /Exactly one player must have actualPlayer === true.*multiple found/i
    );
  });

  it("throws when two players share the same order value", () => {
    const dupOrders = [
      mkPlayer({ playerName: "AP", order: 1, actualPlayer: true }),
      mkPlayer({ playerName: "B", order: 1 }),
      mkPlayer({ playerName: "C", order: 2 }),
    ];
    expect(() => buildSeatedPlayersFromOrders(dupOrders)).toThrow(
      /Order values must be unique/i
    );
  });

  it("maps input playerName -> output name and preserves numCards & secrets", () => {
    const players = [
      mkPlayer({
        playerName: "AP",
        order: 1,
        actualPlayer: true,
        turnStatus: "playing",
        numCards: 4,
        secrets: [{ secretName: "You are the murderer", revealed: true }],
      }),
      mkPlayer({ playerName: "B", order: 2, numCards: 2, secrets: [] }),
    ];

    const seated = buildSeatedPlayersFromOrders(players);

    expect(seated[0].name).toBe("AP");
    expect(seated[0].numCards).toBe(4);
    expect(Array.isArray(seated[0].secrets)).toBe(true);
    expect(seated[0].secrets[0]).toEqual({
      secretName: "You are the murderer",
      revealed: true,
    });

    expect(seated[1].name).toBe("B");
    expect(seated[1].numCards).toBe(2);
    expect(seated[1].secrets).toEqual([]);
  });
});
