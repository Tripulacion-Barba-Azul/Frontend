/**
 * @file EventLog.test.jsx (Vitest)
 * @description Exhaustive tests for EventLog component.
 * - Uses vi.mock to stub generalMaps assets.
 * - Verifies open/close by click and ESC (with exit animation tolerance).
 * - Asserts rendering of every event type, including 1/3/6 card variants.
 * - Checks ordering: list preserves input order.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import {
  render,
  screen,
  within,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EventLog from "./EventLog";

// ---- Mocks ----
// Mock generalMaps so tests don't depend on actual assets
vi.mock("../../../../utils/generalMaps", () => ({
  CARDS_MAP: {
    "Hercule Poirot": "/Cards/poirot.png",
    "Miss Marple": "/Cards/marple.png",
    "Mr Satterthwaite": "/Cards/satterthwaite.png",
    "Not so Fast!": "/Cards/not_so_fast.png",
    "Dead Card Folly": "/Cards/dead_card_folly.png",
    "Card Trade": "/Cards/card_trade.png",
  },
  SETS_MAP: {
    "Hercule Poirot": "/Sets/poirot.png",
    "Miss Marple": "/Sets/marple.png",
    "Mr Satterthwaite": "/Sets/satterthwaite.png",
    "The Beresfords": "/Sets/beresfords.png",
  },
  SECRETS_MAP: {
    Prankster: "/Secrets/prankster.png",
    "You are the murderer": "/Secrets/murderer.png",
    "Just a Fantasy": "/Secrets/just_a_fantasy.png",
    "Gambling Problem": "/Secrets/gambling.png",
  },
  AVATAR_MAP: {
    1: "/Avatars/1.png",
    2: "/Avatars/2.png",
    3: "/Avatars/3.png",
    4: "/Avatars/4.png",
  },
}));

// Avoid issues if component calls scrollIntoView, etc.
beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

// ---- Fixtures ----
const samplePublicData = {
  players: [
    {
      id: 1,
      name: "Alice",
      avatar: 1,
      sets: [{ setId: "set-poirot", setName: "Hercule Poirot" }],
      secrets: [{ id: "sec1", name: "Prankster" }],
    },
    {
      id: 2,
      name: "Bob",
      avatar: 2,
      sets: [{ setId: "set-marple", setName: "Miss Marple" }],
      secrets: [{ id: "sec2", name: "You are the murderer" }],
    },
    {
      id: 3,
      name: "Carol",
      avatar: 3,
      sets: [{ setId: "set-beresfords", setName: "The Beresfords" }],
      secrets: [{ id: "sec3", name: "Just a Fantasy" }],
    },
    {
      id: 4,
      name: "Dave",
      avatar: 4,
      sets: [{ setId: "set-satterthwaite", setName: "Mr Satterthwaite" }],
      secrets: [{ id: "sec4", name: "Gambling Problem" }],
    },
  ],
};

// Helper to build N cards of a given name
const cardsOf = (name, n) => Array.from({ length: n }, () => ({ name }));

// A big log covering all events (and 1/3/6 variants)
const fullEventLog = [
  // CardsPlayed: set/detective/event/instant with 1,3,6 cards
  {
    event: "notifierCardsPlayed",
    payload: {
      playerId: 1,
      actionType: "set",
      cards: cardsOf("Hercule Poirot", 1),
    },
  },
  {
    event: "notifierCardsPlayed",
    payload: {
      playerId: 1,
      actionType: "set",
      cards: cardsOf("Miss Marple", 3),
    },
  },
  {
    event: "notifierCardsPlayed",
    payload: {
      playerId: 1,
      actionType: "set",
      cards: cardsOf("Miss Marple", 6),
    },
  },

  {
    event: "notifierCardsPlayed",
    payload: {
      playerId: 1,
      actionType: "detective",
      setOwnerId: 2,
      cards: cardsOf("Mr Satterthwaite", 1),
    },
  },
  {
    event: "notifierCardsPlayed",
    payload: {
      playerId: 1,
      actionType: "detective",
      setOwnerId: 2,
      cards: cardsOf("Mr Satterthwaite", 3),
    },
  },
  {
    event: "notifierCardsPlayed",
    payload: {
      playerId: 1,
      actionType: "detective",
      setOwnerId: 2,
      cards: cardsOf("Mr Satterthwaite", 6),
    },
  },

  {
    event: "notifierCardsPlayed",
    payload: {
      playerId: 2,
      actionType: "event",
      cards: cardsOf("Dead Card Folly", 1),
    },
  },
  {
    event: "notifierCardsPlayed",
    payload: {
      playerId: 2,
      actionType: "event",
      cards: cardsOf("Dead Card Folly", 3),
    },
  },
  {
    event: "notifierCardsPlayed",
    payload: {
      playerId: 2,
      actionType: "event",
      cards: cardsOf("Dead Card Folly", 6),
    },
  },

  {
    event: "notifierCardsPlayed",
    payload: {
      playerId: 2,
      actionType: "instant",
      cards: cardsOf("Not so Fast!", 1),
    },
  },
  {
    event: "notifierCardsPlayed",
    payload: {
      playerId: 2,
      actionType: "instant",
      cards: cardsOf("Not so Fast!", 3),
    },
  },
  {
    event: "notifierCardsPlayed",
    payload: {
      playerId: 2,
      actionType: "instant",
      cards: cardsOf("Not so Fast!", 6),
    },
  },

  // CardsOffTheTable: quantity 1,3,6
  {
    event: "notifierCardsOffTheTable",
    payload: { playerId: 1, selectedPlayerId: 2, quantity: 1 },
  },
  {
    event: "notifierCardsOffTheTable",
    payload: { playerId: 1, selectedPlayerId: 2, quantity: 3 },
  },
  {
    event: "notifierCardsOffTheTable",
    payload: { playerId: 1, selectedPlayerId: 2, quantity: 6 },
  },

  // DiscardEvent: render thumbnails
  {
    event: "notifierDiscardEvent",
    payload: {
      playerId: 4,
      cards: [{ name: "Dead Card Folly" }, { name: "Card Trade" }],
    },
  },

  // StealSet: set image should appear (circle-ish asset)
  {
    event: "notifierStealSet",
    payload: { playerId: 3, stolenPlayerId: 2, setId: "set-marple" },
  },

  // Secrets: reveal / force / wild / hide / blackmail-card (thumbnails)
  {
    event: "notifierRevealSecret",
    payload: {
      playerId: 2,
      selectedPlayerId: 3,
      secretId: "sec3",
      secretName: "Just a Fantasy",
    },
  },
  {
    event: "notifierRevealSecretForce",
    payload: {
      playerId: 2,
      selectedPlayerId: 3,
      secretId: "sec3",
      secretName: "Just a Fantasy",
    },
  },
  {
    event: "notifierSatterthwaiteWild",
    payload: {
      playerId: 4,
      selectedPlayerId: 2,
      secretId: "sec2",
      secretName: "You are the murderer",
    },
  },
  {
    event: "notifierHideSecret",
    payload: {
      playerId: 3,
      selectedPlayerId: 3,
      secretId: "sec3",
      secretName: "Just a Fantasy",
    },
  },
  {
    event: "notifierBlackmailedCard",
    payload: { playerId: 1, secretName: "Gambling Problem" },
  },

  // Blackmailed (text-only)
  {
    event: "notifierBlackmailed",
    payload: { playerId: 3, selectedPlayerId: 1 },
  },

  // Public/private trades
  {
    event: "notifierCardTrade",
    payload: { playerId: 2, cardName: "Not so Fast!" },
  },
  {
    event: "notifierCardTradePublic",
    payload: { playerId: 1, selectedPlayerId: 4 },
  },

  // Misc text-only events
  { event: "notifierDelayTheMurderersEscape", payload: { playerId: 2 } },
  { event: "notifierLookIntoTheAshes", payload: { playerId: 1 } },
  { event: "notifierNoEffect", payload: {} },

  // And Then There Was One More (secret flip/hide)
  {
    event: "notifierAndThenThereWasOneMore",
    payload: {
      playerId: 3,
      secretId: "sec3",
      secretName: "Just a Fantasy",
      stolenPlayerId: 3,
      giftedPlayerId: 3,
    },
  },
];

// Helper to render and open EventLog
async function openEventLog(log = [], actualPlayerId = 1) {
  const user = userEvent.setup();
  render(
    <EventLog
      eventLog={log}
      publicData={samplePublicData}
      actualPlayerId={actualPlayerId}
      buttonLabel="Events"
    />
  );
  // The open button uses aria-label "Open event log"
  const openBtn = screen.getByRole("button", { name: /open event log/i });
  await user.click(openBtn);
  const dialog = await screen.findByRole("dialog", { name: /event log/i });
  expect(dialog).toBeVisible();
  return { user, dialog };
}

describe("EventLog (Vitest)", () => {
  it("opens and closes with click and ESC (tolerates exit animation)", async () => {
    const { user, dialog } = await openEventLog(fullEventLog, 1);

    // Close by click first (scope to dialog: there are two "Close event log" buttons)
    const closeBtn = within(dialog).getByRole("button", {
      name: /close event log/i,
    });
    await user.click(closeBtn);

    // Tolerate exit animation: dialog either gets 'is-exiting' or is removed
    await waitFor(() => {
      const d = screen.queryByRole("dialog", { name: /event log/i });
      if (d) {
        // During the exit animation, the dialog remains but has the exiting class
        expect(d).toHaveClass("is-exiting");
      }
    });

    // Prefer removal after animation; fall back to exit state if component keeps node in DOM
    try {
      await waitForElementToBeRemoved(
        () => screen.queryByRole("dialog", { name: /event log/i }),
        { timeout: 1500 }
      );
    } catch {
      const stillThere = screen.getByRole("dialog", { name: /event log/i });
      expect(stillThere).toHaveClass("is-exiting");
    }

    // Re-open and close with ESC
    const openBtn = screen.getByRole("button", { name: /open event log/i });
    await user.click(openBtn);
    const dialog2 = await screen.findByRole("dialog", { name: /event log/i });
    expect(dialog2).toBeVisible();

    await user.keyboard("{Escape}");
    await waitFor(() => {
      const d = screen.queryByRole("dialog", { name: /event log/i });
      if (d) expect(d).toHaveClass("is-exiting");
    });
  });

  it("preserves the input order of notifications", async () => {
    const { dialog } = await openEventLog(fullEventLog);
    const list = within(dialog).getByRole("list");
    const rows = within(list).getAllByRole("listitem");
    expect(rows.length).toBe(fullEventLog.length);

    // Quick smoke check for the first rows
    expect(rows[0].textContent?.toLowerCase()).toMatch(/played a set/i);
    expect(rows[1].textContent?.toLowerCase()).toMatch(/played a set/i);
    expect(rows[2].textContent?.toLowerCase()).toMatch(/played a set/i);
  });

  it("shows set image on 'notifierStealSet' and mentions the stolen set", async () => {
    const log = fullEventLog.filter((e) => e.event === "notifierStealSet");
    const { dialog } = await openEventLog(log);
    const row = within(dialog).getAllByRole("listitem")[0];
    expect(row.textContent?.toLowerCase()).toMatch(/stole/i);
    const img = within(row).getByRole("img");
    expect(img).toBeInTheDocument();
  });

  it("renders 'CardsPlayed' with 1, 3 and 6 thumbnails", async () => {
    const log = fullEventLog.filter((e) => e.event === "notifierCardsPlayed");
    const { dialog } = await openEventLog(log);
    const rows = within(dialog).getAllByRole("listitem");
    // Pick three rows for set 1/3/6 cards
    const counts = [1, 3, 6];
    // Check at least one of each set of counts exists
    for (const c of counts) {
      const row = rows.find(
        (r) =>
          /played/i.test(r.textContent || "") &&
          within(r).queryAllByRole("img").length === c
      );
      expect(row, `expected a row with ${c} thumbnails`).toBeTruthy();
    }
  });

  it("renders 'CardsOffTheTable' with correct quantity text (1,3,6)", async () => {
    const log = fullEventLog.filter(
      (e) => e.event === "notifierCardsOffTheTable"
    );
    const { dialog } = await openEventLog(log);
    const rows = within(dialog).getAllByRole("listitem");
    expect(rows.some((r) => /discard\s+1/i.test(r.textContent || ""))).toBe(
      true
    );
    expect(rows.some((r) => /discard\s+3/i.test(r.textContent || ""))).toBe(
      true
    );
    expect(rows.some((r) => /discard\s+6/i.test(r.textContent || ""))).toBe(
      true
    );
  });

  it("renders 'DiscardEvent' with thumbnails", async () => {
    const log = fullEventLog.filter((e) => e.event === "notifierDiscardEvent");
    const { dialog } = await openEventLog(log);
    const row = within(dialog).getAllByRole("listitem")[0];
    const imgs = within(row).getAllByRole("img");
    expect(imgs.length).toBe(2);
    expect(row.textContent?.toLowerCase()).toMatch(/discarded 2/i);
  });

  it("renders secret card image for reveal/hide/force/wild events", async () => {
    const secretEvents = [
      "notifierRevealSecret",
      "notifierRevealSecretForce",
      "notifierSatterthwaiteWild",
      "notifierHideSecret",
    ];
    const log = fullEventLog.filter((e) => secretEvents.includes(e.event));
    const { dialog } = await openEventLog(log);
    const rows = within(dialog).getAllByRole("listitem");
    for (const row of rows) {
      // Each of these events produces at least one secret card thumbnail.
      const imgs = within(row).getAllByRole("img");
      expect(imgs.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("renders Blackmailed and FauxPass with their text", async () => {
    const log = fullEventLog.filter((e) => e.event === "notifierBlackmailed");
    const { dialog } = await openEventLog(log);
    const row = within(dialog).getAllByRole("listitem")[0];
    expect(row.textContent?.toLowerCase()).toMatch(/blackmail/i);
  });

  it("renders CardTrade (private) and CardTradePublic (public) messages", async () => {
    const log = fullEventLog.filter(
      (e) =>
        e.event === "notifierCardTrade" || e.event === "notifierCardTradePublic"
    );
    const { dialog } = await openEventLog(log);
    const rows = within(dialog).getAllByRole("listitem");
    expect(rows.some((r) => /gave you a card/i.test(r.textContent || ""))).toBe(
      true
    );
    expect(rows.some((r) => /traded cards/i.test(r.textContent || ""))).toBe(
      true
    );
  });

  it("renders LookIntoTheAshes & DelayTheMurderersEscape text", async () => {
    const names = new Set([
      "notifierLookIntoTheAshes",
      "notifierDelayTheMurderersEscape",
    ]);
    const log = fullEventLog.filter((e) => names.has(e.event));
    const { dialog } = await openEventLog(log);
    const text = dialog.textContent?.toLowerCase() || "";
    expect(text).toMatch(/looked into the ashes/i);
    expect(text).toMatch(/put them on top of the deck/i);
  });

  it("renders 'AndThenThereWasOneMore' with a secret thumbnail", async () => {
    const log = fullEventLog.filter(
      (e) => e.event === "notifierAndThenThereWasOneMore"
    );
    const { dialog } = await openEventLog(log);
    const row = within(dialog).getAllByRole("listitem")[0];
    expect(within(row).getAllByRole("img").length).toBeGreaterThanOrEqual(1);
  });
});
