import { describe, it, expect } from "vitest";
import {
  parseOwnPairsCookie,
  parseOwnPairsMap,
  getPlayerIdForGame,
  filterOwnInProgress,
  isInProgress,
} from "./ownGamesLogic";

describe("ownGamesLogic parsing & filtering", () => {
  it("parses array of objects cookie", () => {
    const raw = JSON.stringify([
      { gameId: 1, playerId: 5 },
      { gameId: 42, playerId: 12 },
    ]);
    const set = parseOwnPairsCookie(raw);
    const map = parseOwnPairsMap(raw);
    expect(Array.from(set)).toEqual([1, 42]);
    expect(Array.from(map.entries())).toEqual([
      [1, 5],
      [42, 12],
    ]);
    expect(getPlayerIdForGame(raw, 1)).toBe(5);
  });

  it("parses array of tuples cookie", () => {
    const raw = JSON.stringify([
      ["1", "5"],
      ["42", "12"],
    ]);
    const set = parseOwnPairsCookie(raw);
    const map = parseOwnPairsMap(raw);
    expect(Array.from(set)).toEqual([1, 42]);
    expect(Array.from(map.entries())).toEqual([
      [1, 5],
      [42, 12],
    ]);
  });

  it("parses object with playersGames key", () => {
    const raw = JSON.stringify({
      playersGames: [
        { gameId: 1, playerId: 5 },
        { gameId: 7, playerId: 9 },
      ],
    });
    const set = parseOwnPairsCookie(raw);
    expect(Array.from(set)).toEqual([1, 7]);
  });

  it("parses nested string and octal-escaped commas", () => {
    const inner = JSON.stringify([
      { gameId: 1, playerId: 5 },
      { gameId: 42, playerId: 12 },
    ]);
    // Replace commas with octal \054 and wrap in quotes to simulate odd backend
    const withOctal = inner.replace(/,/g, "\\054");
    const raw = JSON.stringify(withOctal); // nested JSON-as-string
    const map = parseOwnPairsMap(raw);
    expect(map.get(1)).toBe(5);
    expect(map.get(42)).toBe(12);
  });

  it("filters only own + inProgress", () => {
    const cookie = JSON.stringify([
      { gameId: 1, playerId: 5 },
      { gameId: 2, playerId: 9 },
    ]);
    const all = [
      { id: 1, gameStatus: "inProgress" },
      { id: 1, gameStatus: "waiting" },
      { id: 2, gameStatus: "in_progress" },
      { id: 3, gameStatus: "inProgress" },
    ];
    const filtered = filterOwnInProgress(all, cookie);
    expect(filtered.map((g) => g.id)).toEqual([1, 2]);
  });

  it("isInProgress normalizes variants", () => {
    expect(isInProgress("inProgress")).toBe(true);
    expect(isInProgress("in_progress")).toBe(true);
    expect(isInProgress("in-progress")).toBe(true);
    expect(isInProgress("in progress")).toBe(true);
    expect(isInProgress("waiting")).toBe(false);
  });
});
