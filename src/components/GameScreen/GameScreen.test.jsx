
// GameScreenLogic.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";

// ✅ Mock constants so tests are self-contained
vi.mock("./GameScreenConstants.js", () => ({
  cardMapping: {
    "Hercule Poirot": "detective_poirot",
    "Miss Marple": "detective_marple",
    "Not so Fast!": "instant_notsofast",
  },
  secretMapping: {
    "Secret Hate": "secret_hate",
    "You are the murderer": "murderer",
    "Gambling Problem": "gambling_problem",
  },
}));

// Import after mocks
import {
  buildUiPlayers,
  toCanonicalCardName,
  buildCardsState,
  buildSecretsState,
} from "./GameScreenLogic.js";

describe("GameScreenLogic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("buildUiPlayers()", () => {
    it("places the turn player first (order=1), sets flags, and preserves direction with deterministic RNG", () => {
      const players = [
        { id: 4, name: "Joaquin", rol: "PlayerRol.DETECTIVE" },
        { id: 5, name: "Eliseo", rol: "PlayerRol.MURDERER" },
      ];
      const playerTurnId = 5;
      const playerId = 4;
      const rng = () => 0; // no rotation of the remainder

      const out = buildUiPlayers({ players, playerTurnId, playerId, rng });

      expect(out).toHaveLength(2);

      // First is the turn player
      expect(out[0]).toMatchObject({
        name: "Eliseo",
        avatar: "default",
        order: 1,
        actualPlayer: false, // playerId=4
        role: "murderer", // mapping from PlayerRol.MURDERER
        turn: true,
      });

      // Second is the other player
      expect(out[1]).toMatchObject({
        name: "Joaquin",
        avatar: "default",
        order: 2,
        actualPlayer: true, // id=4 is the local player
        role: "detective",
        turn: false,
      });
    });
  });

  describe("toCanonicalCardName()", () => {
    it("maps known card names to canonical keys", () => {
      expect(toCanonicalCardName("Hercule Poirot")).toBe("detective_poirot");
      expect(toCanonicalCardName("Not so Fast!")).toBe("instant_notsofast");
    });

    it("returns empty string for unknown names", () => {
      expect(toCanonicalCardName("Unknown Card")).toBe("");
      expect(toCanonicalCardName("")).toBe("");
    });
  });

  describe("buildCardsState()", () => {
    it("normalizes existing cards to hand flags and appends deck cards (unique IDs)", () => {
      const existing = [
        { cardOwnerID: 4, cardID: 62, cardName: "Hercule Poirot" },
        { cardOwnerID: 5, cardID: 113, cardName: "Not so Fast!" },
      ];
      const remainingOnDeck = 3;

      const out = buildCardsState({ remainingOnDeck, cards: existing });

      // total = existing + deck
      expect(out).toHaveLength(existing.length + remainingOnDeck);

      // existing normalized
      const e0 = out.find((c) => c.cardID === 62);
      const e1 = out.find((c) => c.cardID === 113);
      expect(e0).toMatchObject({
        cardName: "detective_poirot",
        cardOwnerID: 4,
        isInDeck: false,
        isInDiscard: false,
        isInDiscardTop: false,
      });
      expect(e1).toMatchObject({
        cardName: "instant_notsofast",
        cardOwnerID: 5,
        isInDeck: false,
        isInDiscard: false,
        isInDiscardTop: false,
      });

      // deck cards appended: in-deck=true, unique IDs not colliding with existing
      const deckCards = out.filter((c) => c.isInDeck === true);
      expect(deckCards).toHaveLength(remainingOnDeck);
      const deckIds = new Set(deckCards.map((c) => c.cardID));
      expect(deckIds.size).toBe(remainingOnDeck);
      // flags on deck entries
      for (const d of deckCards) {
        expect(d.isInDiscard).toBe(false);
        expect(d.isInDiscardTop).toBe(false);
        // (owner policy depends on your implementation; this test doesn't assert it)
      }
    });
  });

  describe("buildSecretsState()", () => {
    it("maps names via secretMapping, assigns unique integer IDs starting at 1000, and copies flags/owners", () => {
      const input = [
        { secretOwnerID: 4, secretName: "Secret Hate", revealed: false },
        {
          secretOwnerID: 5,
          secretName: "You are the murderer",
          revealed: true,
        },
        { secretOwnerID: 5, secretName: "Gambling Problem", revealed: false },
      ];

      const out = buildSecretsState(input);

      expect(out).toHaveLength(3);

      // names mapped
      expect(out.map((s) => s.secretName)).toEqual([
        "secret_hate",
        "murderer",
        "gambling_problem",
      ]);

      // IDs unique and integers, starting from 1000 by current implementation
      const ids = out.map((s) => s.secretID);
      expect(new Set(ids).size).toBe(3);
      for (const id of ids) expect(Number.isInteger(id)).toBe(true);
      expect(ids[0]).toBe(1000);

      // copy of flags/owner
      expect(out[0]).toMatchObject({ revealed: false, secretOwnerID: 4 });
      expect(out[1]).toMatchObject({ revealed: true, secretOwnerID: 5 });
    });
  });
});
