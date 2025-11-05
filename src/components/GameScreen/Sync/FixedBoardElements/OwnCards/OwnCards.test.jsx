// OwnCards.test.jsx
// Vitest + Testing Library exhaustive tests for OwnCards + Play integration

import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import OwnCards from "./OwnCards.jsx";

/* ----------------------------- Mocks ---------------------------------- */
/* Mock CARDS_MAP using the exact import path used by OwnCards */
vi.mock("../../../../../utils/generalMaps", () => ({
  CARDS_MAP: {
    // detectives
    "Hercule Poirot": "/Cards/poirot.png",
    "Miss Marple": "/Cards/marple.png",
    "Tommy Beresford": "/Cards/tommy.png",
    "Tuppence Beresford": "/Cards/tuppence.png",
    "Harley Quin": "/Cards/harley.png",
    "Ariadne Oliver": "/Cards/ariadne.png",
    "Mr Satterthwaite": "/Cards/satterthwaite.png",
    // events
    "Event A": "/Cards/eventA.png",
    "Event B": "/Cards/eventB.png",
    // other types
    "Sneak Attack": "/Cards/devious.png",
    "Quick Counter": "/Cards/instant.png",
  },
}));

/* Mock framer-motion to avoid animation/drag complexities */
vi.mock("framer-motion", () => {
  return {
    motion: {
      div: ({ children, ...props }) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }) => <>{children}</>,
    Reorder: {
      Group: ({ children, as: Component = "div", ...props }) => (
        <Component {...props}>{children}</Component>
      ),
      Item: ({ children, ...props }) => <div {...props}>{children}</div>,
    },
  };
});

/* Mock NoActionButton (simple text) */
vi.mock("./NoActionButton/NoActionButton", () => ({
  default: () => <button aria-label="no-action">Play nothing</button>,
}));

/* Mock DiscardButton: reflect flags + labelWhenZero UX */
vi.mock("./DiscardButton/DiscardButton", () => ({
  default: ({
    selectedCards = [],
    handSize = 0,
    onDiscardSuccess,
    requireAtLeastOne = false,
    requireExactlyOne = false,
    labelWhenZero,
  }) => {
    const k = selectedCards.length;
    const label =
      k === 0 && labelWhenZero
        ? labelWhenZero
        : `Discard (${k}) / Hand ${handSize}`;
    return (
      <button
        data-testid="discard-button"
        data-exact={String(requireExactlyOne)}
        data-atleast={String(requireAtLeastOne)}
        onClick={() => onDiscardSuccess?.()}
        className="owncards-action"
      >
        {label}
      </button>
    );
  },
}));

/* ---------------------------- Test helpers ---------------------------- */
function pointerClick(node, { x = 100, y = 100, dx = 0, dy = 0 } = {}) {
  fireEvent.pointerDown(node, { clientX: x, clientY: y });
  fireEvent.pointerUp(node, { clientX: x + dx, clientY: y + dy });
}

function renderOwnCards(uiProps = {}, { withRouter = false } = {}) {
  const element = <OwnCards {...uiProps} />;
  if (!withRouter) return render(element);
  return render(
    <MemoryRouter initialEntries={["/play/42?playerId=7"]}>
      <Routes>
        {/* Route path must provide :gameId for PlayCardsButton */}
        <Route path="/play/:gameId" element={<OwnCards {...uiProps} />} />
      </Routes>
    </MemoryRouter>
  );
}

/* ------------------------------ Fixtures ------------------------------ */
const DET = (id, name) => ({ id, name, type: "detective" });
const EVT = (id, name) => ({ id, name, type: "event" });
const DEV = (id, name) => ({ id, name, type: "devious" });
const INS = (id, name) => ({ id, name, type: "instant" });

const CARDS = {
  poirot1: DET("d1", "Hercule Poirot"),
  poirot2: DET("d2", "Hercule Poirot"),
  poirot3: DET("d3", "Hercule Poirot"),
  marple1: DET("d4", "Miss Marple"),
  harley1: DET("d5", "Harley Quin"),
  harley2: DET("d6", "Harley Quin"),
  ariadne: DET("d7", "Ariadne Oliver"),
  satter: DET("d8", "Mr Satterthwaite"),
  tommy: DET("d9", "Tommy Beresford"),
  tuppence: DET("d10", "Tuppence Beresford"),
  eventA: EVT("e1", "Event A"),
  eventB: EVT("e2", "Event B"),
  devious: DEV("x1", "Sneak Attack"),
  instant: INS("x2", "Quick Counter"),
};

/* ------------------------------- Tests -------------------------------- */
describe("OwnCards.jsx — exhaustive behaviors", () => {
  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
    // Provide a default fetch mock (individual tests override expectations)
    global.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  it("shows color variant and disabled action in 'drawing' and 'waiting'", () => {
    // drawing
    renderOwnCards({ cards: [], turnStatus: "drawing" });
    const actions1 = document.querySelector(".owncards-actions");
    expect(actions1).toHaveAttribute("data-variant", "red");
    expect(screen.getByTestId("OwnCardsDisabledAction")).toBeDisabled();

    cleanup();
    // waiting
    renderOwnCards({ cards: [], turnStatus: "waiting" });
    const actions2 = document.querySelector(".owncards-actions");
    expect(actions2).toHaveAttribute("data-variant", "gray");
    expect(screen.getByTestId("OwnCardsDisabledAction")).toBeDisabled();
  });

  it("maps 'takingAction' (case-insensitive) to lime variant", () => {
    renderOwnCards({ cards: [], turnStatus: "takingAction" });
    const actions = document.querySelector(".owncards-actions");
    expect(actions).toHaveAttribute("data-variant", "lime");
  });

  it("in 'playing': no selection -> NoActionButton ('Play nothing')", () => {
    renderOwnCards(
      { cards: [CARDS.eventA], turnStatus: "playing", socialDisgrace: false },
      { withRouter: false }
    );
    expect(screen.getByLabelText(/no-action/i)).toBeInTheDocument();
  });

  it("in 'playing': selecting a single 'event' shows 'Play (event)' via PlayCardsButton label", async () => {
    renderOwnCards(
      {
        cards: [CARDS.eventA],
        turnStatus: "playing",
        socialDisgrace: false,
      },
      { withRouter: true }
    );
    const img = screen.getByAltText("Card Event A");
    pointerClick(img);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Play event/i })
      ).toBeInTheDocument()
    );
  });

  it("in 'playing': selecting multiple 'event' cards shows disabled 'Invalid play' button", async () => {
    renderOwnCards(
      { cards: [CARDS.eventA, CARDS.eventB], turnStatus: "playing" },
      { withRouter: true } // needs Router because first click mounts PlayCardsButton
    );
    const a = screen.getByAltText("Card Event A");
    const b = screen.getByAltText("Card Event B");
    pointerClick(a);
    pointerClick(b);
    await waitFor(() =>
      expect(screen.getByTestId("OwnCardsInvalidPlay")).toBeInTheDocument()
    );
    expect(screen.getByTestId("OwnCardsInvalidPlay")).toBeDisabled();
  });

  it("in 'playing': selecting 'devious' or 'instant' yields 'Invalid play'", async () => {
    renderOwnCards(
      { cards: [CARDS.devious, CARDS.instant], turnStatus: "playing" },
      { withRouter: false }
    );
    const d = screen.getByAltText("Card Sneak Attack");
    const i = screen.getByAltText("Card Quick Counter");

    // Any selection containing prohibited type is invalid; test single + mixed
    pointerClick(d);
    await waitFor(() =>
      expect(screen.getByTestId("OwnCardsInvalidPlay")).toBeInTheDocument()
    );
    // clear and try instant
    // (click devious again to unselect)
    pointerClick(d);
    pointerClick(i);
    await waitFor(() =>
      expect(screen.getByTestId("OwnCardsInvalidPlay")).toBeInTheDocument()
    );
  });

  it("in 'playing': mixed types (event + detective) -> Invalid play", async () => {
    renderOwnCards(
      { cards: [CARDS.eventA, CARDS.satter], turnStatus: "playing" },
      { withRouter: true } // needs Router because first click may mount PlayCardsButton
    );
    const e = screen.getByAltText("Card Event A");
    const d = screen.getByAltText("Card Mr Satterthwaite");
    pointerClick(e);
    pointerClick(d);
    await waitFor(() =>
      expect(screen.getByTestId("OwnCardsInvalidPlay")).toBeInTheDocument()
    );
  });

  it("in 'playing': one detective -> 'Add detective to any existing set'", async () => {
    renderOwnCards(
      { cards: [CARDS.satter], turnStatus: "playing" },
      { withRouter: true }
    );
    const img = screen.getByAltText("Card Mr Satterthwaite");
    pointerClick(img);
    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: /Add to any set/i,
        })
      ).toBeInTheDocument()
    );
  });

  it("in 'playing': multiple detectives (same name) -> 'Play detective's set'", async () => {
    renderOwnCards(
      {
        cards: [CARDS.satter, { ...CARDS.satter, id: "d8b" }],
        turnStatus: "playing",
      },
      { withRouter: true }
    );
    // FIX: there are two images with the same alt, use getAllByAltText
    const [a, b] = screen.getAllByAltText("Card Mr Satterthwaite");
    pointerClick(a);
    pointerClick(b);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /play detective's set/i })
      ).toBeInTheDocument()
    );
  });

  it("in 'playing': detectives Tommy + Tuppence (any mix) -> valid 'Play detective's set'", async () => {
    renderOwnCards(
      { cards: [CARDS.tommy, CARDS.tuppence], turnStatus: "playing" },
      { withRouter: true }
    );
    const t = screen.getByAltText("Card Tommy Beresford");
    const u = screen.getByAltText("Card Tuppence Beresford");
    pointerClick(t);
    pointerClick(u);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /play detective's set/i })
      ).toBeInTheDocument()
    );
  });

  it("detective set containing Ariadne Oliver -> error below button and NO fetch", async () => {
    // Use real PlayCardsButton; click should set error text and not fetch
    const spy = vi.spyOn(global, "fetch");
    renderOwnCards(
      { cards: [CARDS.satter, CARDS.ariadne], turnStatus: "playing" },
      { withRouter: true }
    );
    const s = screen.getByAltText("Card Mr Satterthwaite");
    const a = screen.getByAltText("Card Ariadne Oliver");
    pointerClick(s);
    pointerClick(a);
    const play = await screen.findByRole("button", {
      name: /play detective's set/i,
    });
    fireEvent.click(play);

    await waitFor(() =>
      expect(screen.getByRole("alert", { name: "" })).toBeInTheDocument()
    );
    expect(
      screen.getByText(/cannot include "Ariadne Oliver"/i)
    ).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it('detective set with ALL "Harley Quin" -> error below button and NO fetch', async () => {
    const spy = vi.spyOn(global, "fetch");
    renderOwnCards(
      {
        cards: [CARDS.harley1, { ...CARDS.harley1, id: "d6b" }],
        turnStatus: "playing",
      },
      { withRouter: true }
    );
    const h1 = screen.getAllByAltText("Card Harley Quin")[0];
    const h2 = screen.getAllByAltText("Card Harley Quin")[1];
    pointerClick(h1);
    pointerClick(h2);
    const play = await screen.findByRole("button", {
      name: /play detective's set/i,
    });
    fireEvent.click(play);

    await waitFor(() =>
      expect(
        screen.getByText(/cannot be composed only of "Harley Quin"/i)
      ).toBeInTheDocument()
    );
    expect(spy).not.toHaveBeenCalled();
  });

  it('Poirot set with 2 cards -> error: "Hercule Poirot"s sets must have at least 3 cards', async () => {
    const spy = vi.spyOn(global, "fetch");
    renderOwnCards(
      { cards: [CARDS.poirot1, CARDS.poirot2], turnStatus: "playing" },
      { withRouter: true }
    );
    const p1 = screen.getAllByAltText("Card Hercule Poirot")[0];
    const p2 = screen.getAllByAltText("Card Hercule Poirot")[1];
    pointerClick(p1);
    pointerClick(p2);

    const play = await screen.findByRole("button", {
      name: /play detective's set/i,
    });
    fireEvent.click(play);

    await waitFor(() =>
      expect(
        screen.getByText(/"Hercule Poirot"s set must have at least 3 cards/i)
      ).toBeInTheDocument()
    );
    expect(spy).not.toHaveBeenCalled();
  });

  it('Marple set with 2 cards -> error: "Miss Marple"\'s sets must have at least 3 cards', async () => {
    const spy = vi.spyOn(global, "fetch");
    renderOwnCards(
      {
        cards: [CARDS.marple1, { ...CARDS.marple1, id: "d4b" }],
        turnStatus: "playing",
      },
      { withRouter: true }
    );
    const m1 = screen.getAllByAltText("Card Miss Marple")[0];
    const m2 = screen.getAllByAltText("Card Miss Marple")[1];
    pointerClick(m1);
    pointerClick(m2);

    const play = await screen.findByRole("button", {
      name: /play detective's set/i,
    });
    fireEvent.click(play);

    await waitFor(() =>
      expect(
        screen.getByText(/"Miss Marple"s set must have at least 3 cards/i)
      ).toBeInTheDocument()
    );
    expect(spy).not.toHaveBeenCalled();
  });

  it("Poirot set with 3 cards -> valid: fetch is called and selection clears on success", async () => {
    const spy = vi.spyOn(global, "fetch").mockResolvedValue({ ok: true });
    renderOwnCards(
      {
        cards: [CARDS.poirot1, CARDS.poirot2, CARDS.poirot3],
        turnStatus: "playing",
      },
      { withRouter: true }
    );
    const imgs = screen.getAllByAltText("Card Hercule Poirot");
    imgs.forEach((img) => pointerClick(img));

    const play = await screen.findByRole("button", {
      name: /play detective's set/i,
    });
    fireEvent.click(play);

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));

    // After onPlaySuccess, OwnCards should clear selection -> "Play nothing"
    await waitFor(() =>
      expect(screen.getByLabelText(/no-action/i)).toBeInTheDocument()
    );
  });

  it('single "Harley Quin" selection -> error below button (rule from PlayCardsButton)', async () => {
    const spy = vi.spyOn(global, "fetch");
    renderOwnCards(
      { cards: [CARDS.harley1], turnStatus: "playing" },
      { withRouter: true }
    );
    const h = screen.getByAltText("Card Harley Quin");
    pointerClick(h);

    const play = await screen.findByRole("button", {
      name: /Add to any set/i,
    });
    fireEvent.click(play);

    await waitFor(() =>
      expect(
        screen.getByText(/Can't add "Harley Quin" to an existing set/i)
      ).toBeInTheDocument()
    );
    expect(spy).not.toHaveBeenCalled();
  });

  it("discarding vs discardingOpt flags and 'Discard nothing' label when 0 selected", () => {
    const cards = [CARDS.eventA, CARDS.eventB];

    // discarding -> requireAtLeastOne=true, no special labelWhenZero
    const { rerender } = renderOwnCards({ cards, turnStatus: "discarding" });
    let discard = screen.getByTestId("discard-button");
    expect(discard).toHaveAttribute("data-atleast", "true");
    expect(discard).toHaveTextContent(/Discard \(0\) \/ Hand 2/i);

    // discardingOpt -> requireAtLeastOne=false, labelWhenZero applied
    rerender(
      <OwnCards
        cards={cards}
        turnStatus="discardingOpt"
        socialDisgrace={false}
      />
    );
    discard = screen.getByTestId("discard-button");
    expect(discard).toHaveAttribute("data-atleast", "false");
    expect(discard).toHaveTextContent(/Discard nothing/i);
  });

  it("keeps initial visual order and pointer threshold works as click (<8px) vs drag", async () => {
    const cards = [CARDS.eventA, CARDS.eventB, CARDS.satter];

    renderOwnCards({ cards, turnStatus: "playing" }, { withRouter: true });
    const images = screen.getAllByRole("img");
    expect(images[0]).toHaveAttribute("alt", "Card Event A");
    expect(images[1]).toHaveAttribute("alt", "Card Event B");
    expect(images[2]).toHaveAttribute("alt", "Card Mr Satterthwaite");

    // Small move => select (this would mount PlayCardsButton)
    pointerClick(images[0], { dx: 2, dy: 2 });
    await waitFor(() =>
      expect(images[0]).toHaveClass("owncards-card--selected")
    );

    // Toggle back
    pointerClick(images[0], { dx: 2, dy: 2 });
    await waitFor(() =>
      expect(images[0]).not.toHaveClass("owncards-card--selected")
    );

    // Large move => drag-like (no toggle)
    pointerClick(images[1], { dx: 20, dy: 0 });
    expect(images[1]).not.toHaveClass("owncards-card--selected");
  });

  /** ---------------- socialDisgrace behavior unchanged ---------------- */
  it("does not force discard in 'waiting' even if socialDisgrace=true; cards disabled", async () => {
    const cards = [CARDS.eventA, CARDS.eventB];
    renderOwnCards({ cards, turnStatus: "waiting", socialDisgrace: true });
    expect(screen.queryByTestId("discard-button")).toBeNull();

    const img = screen.getByAltText("Card Event A");
    expect(img).toHaveClass("owncards-card--disabled");
    pointerClick(img);
    await waitFor(() => expect(img).not.toHaveClass("owncards-card--selected"));
  });

  it("forces discard exactly one when socialDisgrace=true across interactive phases", () => {
    const cards = [CARDS.eventA, CARDS.eventB];

    const { rerender } = renderOwnCards({
      cards,
      turnStatus: "playing",
      socialDisgrace: true,
    });
    let discard = screen.getByTestId("discard-button");
    expect(discard).toHaveAttribute("data-exact", "true");

    rerender(
      <OwnCards cards={cards} turnStatus="takingAction" socialDisgrace={true} />
    );
    discard = screen.getByTestId("discard-button");
    expect(discard).toHaveAttribute("data-exact", "true");

    rerender(
      <OwnCards cards={cards} turnStatus="discarding" socialDisgrace={true} />
    );
    discard = screen.getByTestId("discard-button");
    expect(discard).toHaveAttribute("data-exact", "true");

    rerender(
      <OwnCards
        cards={cards}
        turnStatus="discardingOpt"
        socialDisgrace={true}
      />
    );
    discard = screen.getByTestId("discard-button");
    expect(discard).toHaveAttribute("data-exact", "true");
  });
});
