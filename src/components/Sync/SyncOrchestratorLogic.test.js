import { describe, it, expect } from "vitest";
import {
  computeDeckCount,
  computeDiscardState,
  computeOwnCards,
  computeOwnSecrets,
  computeBoardPlayers,
} from "./SyncOrchestratorLogic.js";

describe("SyncOrchestratorLogic", () => {
  describe("computeDeckCount", () => {
    it("counts only cards in deck and not in discard pile", () => {
      const cards = [
        { isInDeck: true, isInDiscardPile: false },
        { isInDeck: true, isInDiscardPile: true },
        { isInDeck: false, isInDiscardPile: true },
        { isInDeck: false, isInDiscardPile: false },
      ];
      expect(computeDeckCount(cards)).toBe(1);
    });

    it("returns null for non-array inputs", () => {
      expect(computeDeckCount(null)).toBe(null);
      expect(computeDeckCount(undefined)).toBe(null);
      expect(computeDeckCount("nope")).toBe(null);
    });
  });

  describe("computeDiscardState", () => {
    it("returns discardCount and discardTop using isInDiscardPile / isInDiscardTop", () => {
      const topCard = {
        cardID: "T1",
        isInDiscardPile: true,
        isInDiscardTop: true,
      };
      const cards = [
        { isInDiscardPile: true, isInDiscardTop: false },
        topCard,
        { isInDiscardPile: false, isInDiscardTop: false },
      ];
      const { discardCount, discardTop } = computeDiscardState(cards);
      expect(discardCount).toBe(2);
      expect(discardTop).toBe(topCard);
    });

    it("handles empty and non-array inputs", () => {
      const result = computeDiscardState(null);
      expect(result).toBe(null);
    });
  });

  describe("computeOwnCards", () => {
    it("returns only in-hand cards for the current player", () => {
      const me = 7;
      const cards = [
        {
          cardID: "A",
          cardName: "foo",
          cardOwnerID: me,
          isInDeck: false,
          isInDiscardPile: false,
        },
        {
          cardID: "B",
          cardName: "bar",
          cardOwnerID: me,
          isInDeck: true,
          isInDiscardPile: false,
        },
        {
          cardID: "C",
          cardName: "baz",
          cardOwnerID: me,
          isInDeck: false,
          isInDiscardPile: true,
        },
        {
          cardID: "D",
          cardName: "zzz",
          cardOwnerID: 9,
          isInDeck: false,
          isInDiscardPile: false,
        },
      ];
      const hand = computeOwnCards(cards, me);
      expect(hand.map((c) => c.cardID)).toEqual(["A"]);
    });

    it("returns empty array for non-array inputs", () => {
      expect(computeOwnCards(null, 1)).toEqual(null);
    });
  });

  describe("computeOwnSecrets", () => {
    it("returns secrets that belong to the current player", () => {
      const me = 7;
      const secrets = [
        {
          secretID: 1,
          secretName: "murderer",
          revealed: false,
          secretOwnerID: me,
        },
        {
          secretID: 2,
          secretName: "accomplice",
          revealed: true,
          secretOwnerID: 8,
        },
      ];
      const mine = computeOwnSecrets(secrets, me);
      expect(mine).toHaveLength(1);
      expect(mine[0]).toMatchObject({
        secretID: 1,
        secretName: "murderer",
        revealed: false,
      });
    });

    it("returns empty array for non-array inputs", () => {
      expect(computeOwnSecrets(undefined, 1)).toEqual(null);
    });
  });

  describe("computeBoardPlayers", () => {
    it("maps players to the Board shape and counts only in-hand cards", () => {
      const serverPlayers = [
        {
          playerID: 1,
          playerName: "Alice",
          avatar: "a",
          orderNumber: 2,
          role: "detective",
          turnStatus: "playing",
        },
        {
          playerID: 2,
          playerName: "Bob",
          avatar: "b",
          orderNumber: 1,
          role: "murderer",
          turnStatus: "waiting",
        },
      ];
      const serverCards = [
        { cardOwnerID: 1, isInDeck: false, isInDiscardPile: false },
        { cardOwnerID: 1, isInDeck: true, isInDiscardPile: false },
        { cardOwnerID: 1, isInDeck: false, isInDiscardPile: true },

        { cardOwnerID: 2, isInDeck: false, isInDiscardPile: true },
      ];
      const serverSecrets = [
        {
          secretOwnerID: 2,
          secretID: 42,
          secretName: "murderer",
          revealed: true,
        },
      ];

      const currentPlayerId = 1;
      const players = computeBoardPlayers({
        serverPlayers,
        serverCards,
        serverSecrets,
        currentPlayerId,
      });

      expect(players).toHaveLength(2);

      const pAlice = players.find((p) => p.name === "Alice");
      const pBob = players.find((p) => p.name === "Bob");

      expect(pAlice).toMatchObject({
        name: "Alice",
        avatar: "a",
        order: 2,
        actualPlayer: true,
        role: "detective",
        turnStatus: "playing",
        numCards: null,
        secrets: null,
      });

      expect(pBob).toMatchObject({
        name: "Bob",
        avatar: "b",
        order: 1,
        actualPlayer: false,
        role: "murderer",
        turnStatus: "waiting",
        numCards: 0,
        secrets: [{ secretName: "murderer", revealed: true }],
      });
    });
  });
});
