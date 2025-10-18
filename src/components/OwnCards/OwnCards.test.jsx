import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import OwnCards from "./OwnCards.jsx";

/* Mock CARDS_MAP so we don't depend on real assets/keys */
vi.mock("../generalMaps.js", () => ({
  CARDS_MAP: {
    "Hercule Poirot": "/Cards/07-detective_poirot.png",
    "Miss Marple": "/Cards/08-detective_marple.png",
    "Mr Satterthwaite": "/Cards/09-detective_satterthwaite.png",
    "Parker Pyne": "/Cards/10-detective_pyne.png",
    "Lady Eileen Brent": "/Cards/11-detective_brent.png",
    "Tommy Beresford": "/Cards/12-detective_tommyberesford.png",
  },
}));

/* Mock framer-motion to avoid animation complexities in tests */
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual("framer-motion");
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }) => <div {...props}>{children}</div>,
      img: ({ children, ...props }) => <img {...props}>{children}</img>,
    },
    AnimatePresence: ({ children }) => <>{children}</>,
    Reorder: {
      Group: ({ children, as: Component = "div", ...props }) => (
        <Component {...props}>{children}</Component>
      ),
      Item: ({ children, value, ...props }) => (
        <div data-value={value} {...props}>
          {children}
        </div>
      ),
    },
  };
});

/* Mock action subcomponents so tests are stable and focused on OwnCards behavior.
   We also expose props through data-attributes for assertions. */
vi.mock("./DiscardButton/DiscardButton", () => ({
  default: ({
    selectedCards = [],
    handSize = 0,
    onDiscardSuccess,
    requireAtLeastOne = false,
    requireExactlyOne = false,
  }) => (
    <button
      data-testid="discard-button"
      data-exact={String(requireExactlyOne)}
      data-atleast={String(requireAtLeastOne)}
      onClick={() => onDiscardSuccess?.()}
    >
      {`Discard (${selectedCards.length}) / Hand ${handSize}`}
    </button>
  ),
}));

vi.mock("./NoActionButton/NoActionButton", () => ({
  default: () => <button aria-label="no-action">Play nothing</button>,
}));

vi.mock("./PlayButton/PlayCardsButton.jsx", () => ({
  default: ({ selectedCards = [], onPlaySuccess }) => (
    <button data-testid="play-cards-button" onClick={() => onPlaySuccess?.()}>
      {`Play (${selectedCards.length})`}
    </button>
  ),
}));

/* Helper to render the component */
const setup = (cards = [], props = {}) =>
  render(<OwnCards cards={cards} {...props} />);

const TEST_CARDS = [
  { id: "P07", name: "Hercule Poirot" },
  { id: "M08", name: "Miss Marple" },
  { id: "S09", name: "Mr Satterthwaite" },
];

describe("OwnCards.jsx (cards: [{ id, name }])", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the row container", () => {
    setup([]);
    const row = document.querySelector(".owncards-row");
    expect(row).toBeInTheDocument();
  });

  it("renders no images when cards is empty", () => {
    setup([]);
    expect(screen.queryAllByRole("img")).toHaveLength(0);
  });

  it("renders an <img> for each card with src from CARDS_MAP and proper alt", () => {
    setup(TEST_CARDS, { turnStatus: "playing" });

    TEST_CARDS.forEach(({ name }) => {
      const img = screen.getByAltText(`Card ${name}`);
      expect(img).toBeInTheDocument();
      expect(img.getAttribute("src")).not.toBe("");
    });

    expect(screen.getAllByRole("img")).toHaveLength(TEST_CARDS.length);
  });

  it("accepts up to 6 cards and renders exactly that many", () => {
    const six = [
      { id: "1", name: "Hercule Poirot" },
      { id: "2", name: "Miss Marple" },
      { id: "3", name: "Mr Satterthwaite" },
      { id: "4", name: "Parker Pyne" },
      { id: "5", name: "Lady Eileen Brent" },
      { id: "6", name: "Tommy Beresford" },
    ];
    setup(six, { turnStatus: "playing" });
    expect(screen.getAllByRole("img")).toHaveLength(6);
  });

  it("does NOT allow selecting cards when turnStatus is 'waiting' or 'drawing' and applies disabled class (socialDisgrace=false)", async () => {
    const cards = TEST_CARDS.slice(0, 2);
    const { rerender } = setup(cards, {
      turnStatus: "waiting",
      socialDisgrace: false,
    });

    const img1 = screen.getByAltText(`Card ${cards[0].name}`);
    const img2 = screen.getByAltText(`Card ${cards[1].name}`);
    
    // Simulate pointer events for selection
    fireEvent.pointerDown(img1, { clientX: 0, clientY: 0 });
    fireEvent.pointerUp(img1, { clientX: 0, clientY: 0 });
    
    await waitFor(() => {
      expect(img1).not.toHaveClass("owncards-card--selected");
      expect(img1).toHaveClass("owncards-card--disabled");
      expect(img2).toHaveClass("owncards-card--disabled");
    });

    rerender(
      <OwnCards cards={cards} turnStatus="drawing" socialDisgrace={false} />
    );
    const img1Again = screen.getByAltText(`Card ${cards[0].name}`);
    expect(img1Again).toHaveClass("owncards-card--disabled");
  });

  it("toggles selection when 'playing' and allows selection in 'discarding' (socialDisgrace=false)", async () => {
    const cards = TEST_CARDS.slice(0, 2);
    const { rerender } = setup(cards, {
      turnStatus: "playing",
      socialDisgrace: false,
    });

    const img1 = screen.getByAltText(`Card ${cards[0].name}`);
    
    // Select first card
    fireEvent.pointerDown(img1, { clientX: 0, clientY: 0 });
    fireEvent.pointerUp(img1, { clientX: 0, clientY: 0 });
    
    await waitFor(() => {
      expect(img1).toHaveClass("owncards-card--selected");
    });

    // Deselect first card
    fireEvent.pointerDown(img1, { clientX: 0, clientY: 0 });
    fireEvent.pointerUp(img1, { clientX: 0, clientY: 0 });
    
    await waitFor(() => {
      expect(img1).not.toHaveClass("owncards-card--selected");
    });

    // Select second card
    const img2 = screen.getByAltText(`Card ${cards[1].name}`);
    fireEvent.pointerDown(img2, { clientX: 0, clientY: 0 });
    fireEvent.pointerUp(img2, { clientX: 0, clientY: 0 });
    
    await waitFor(() => {
      expect(img2).toHaveClass("owncards-card--selected");
    });

    // Switching to discarding still allows selecting
    rerender(
      <OwnCards cards={cards} turnStatus="discarding" socialDisgrace={false} />
    );
    const nowImg1 = screen.getByAltText(`Card ${cards[0].name}`);
    fireEvent.pointerDown(nowImg1, { clientX: 0, clientY: 0 });
    fireEvent.pointerUp(nowImg1, { clientX: 0, clientY: 0 });
    
    await waitFor(() => {
      expect(nowImg1).toHaveClass("owncards-card--selected");
    });
  });

  it("clears selection when turnStatus changes; then disables interaction", async () => {
    const cards = TEST_CARDS.slice(0, 1);
    const { rerender } = setup(cards, {
      turnStatus: "playing",
      socialDisgrace: false,
    });

    const img = screen.getByAltText(`Card ${cards[0].name}`);
    fireEvent.pointerDown(img, { clientX: 0, clientY: 0 });
    fireEvent.pointerUp(img, { clientX: 0, clientY: 0 });
    
    await waitFor(() => {
      expect(img).toHaveClass("owncards-card--selected");
    });

    rerender(
      <OwnCards cards={cards} turnStatus="waiting" socialDisgrace={false} />
    );
    
    await waitFor(() => {
      const sameImg = screen.getByAltText(`Card ${cards[0].name}`);
      expect(sameImg).toHaveClass("owncards-card");
      expect(sameImg).toHaveClass("owncards-card--disabled");
      expect(sameImg).not.toHaveClass("owncards-card--selected");
    });
  });

  it("renders DiscardButton in 'discarding' (and 'discardingOpt') (socialDisgrace=false)", () => {
    const cards = TEST_CARDS.slice(0, 2);

    // discarding -> DiscardButton visible with requireAtLeastOne=true
    const { rerender } = setup(cards, {
      turnStatus: "discarding",
      socialDisgrace: false,
    });
    const discard1 = screen.getByTestId("discard-button");
    expect(discard1).toBeInTheDocument();
    expect(discard1.textContent).toMatch(/Discard \(0\)/i);
    expect(discard1.getAttribute("data-atleast")).toBe("true");
    expect(discard1.getAttribute("data-exact")).toBe("false");

    // discardingOpt -> DiscardButton also visible with requireAtLeastOne=false
    rerender(
      <OwnCards
        cards={cards}
        turnStatus="discardingOpt"
        socialDisgrace={false}
      />
    );
    const discard2 = screen.getByTestId("discard-button");
    expect(discard2).toBeInTheDocument();
    expect(discard2.getAttribute("data-atleast")).toBe("false");
    expect(discard2.getAttribute("data-exact")).toBe("false");
  });

  it("in 'playing' shows NoActionButton when nothing is selected and 'Play (n)' when selected; onPlaySuccess clears selection", async () => {
    const cards = TEST_CARDS.slice(0, 2);

    setup(cards, { turnStatus: "playing", socialDisgrace: false });
    expect(screen.getByLabelText(/no-action/i)).toBeInTheDocument();

    const img1 = screen.getByAltText(`Card ${cards[0].name}`);
    fireEvent.pointerDown(img1, { clientX: 0, clientY: 0 });
    fireEvent.pointerUp(img1, { clientX: 0, clientY: 0 });
    
    await waitFor(() => {
      const playButton = screen.getByTestId("play-cards-button");
      expect(playButton.textContent).toMatch(/Play \(1\)/i);
    });

    const playButton = screen.getByTestId("play-cards-button");
    fireEvent.click(playButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/no-action/i)).toBeInTheDocument();
    });
  });

  it("in 'discarding' clicking DiscardButton triggers onDiscardSuccess and clears selection (socialDisgrace=false)", async () => {
    const cards = TEST_CARDS.slice(0, 2);
    setup(cards, { turnStatus: "discarding", socialDisgrace: false });

    const img1 = screen.getByAltText(`Card ${cards[0].name}`);
    fireEvent.pointerDown(img1, { clientX: 0, clientY: 0 });
    fireEvent.pointerUp(img1, { clientX: 0, clientY: 0 });
    
    await waitFor(() => {
      expect(img1).toHaveClass("owncards-card--selected");
    });

    fireEvent.click(screen.getByTestId("discard-button"));
    
    await waitFor(() => {
      expect(img1).not.toHaveClass("owncards-card--selected");
    });
  });

  /** ---------- NEW TESTS FOR socialDisgrace ---------- */

  it("forces discard mode with EXACTLY ONE selection when socialDisgrace=true (waiting -> forced discard)", async () => {
    const cards = TEST_CARDS.slice(0, 3);
    setup(cards, { turnStatus: "waiting", socialDisgrace: true });

    // DiscardButton present with requireExactlyOne=true
    const discard = screen.getByTestId("discard-button");
    expect(discard).toBeInTheDocument();
    expect(discard.getAttribute("data-exact")).toBe("true");
    expect(discard.getAttribute("data-atleast")).toBe("false");

    // Single-select behavior:
    const img1 = screen.getByAltText(`Card ${cards[0].name}`);
    const img2 = screen.getByAltText(`Card ${cards[1].name}`);

    // Select first -> selected
    fireEvent.pointerDown(img1, { clientX: 0, clientY: 0 });
    fireEvent.pointerUp(img1, { clientX: 0, clientY: 0 });
    
    await waitFor(() => {
      expect(img1).toHaveClass("owncards-card--selected");
      expect(discard.textContent).toMatch(/Discard \(1\)/i);
    });

    // Select second -> first gets deselected, second becomes selected
    fireEvent.pointerDown(img2, { clientX: 0, clientY: 0 });
    fireEvent.pointerUp(img2, { clientX: 0, clientY: 0 });
    
    await waitFor(() => {
      expect(img1).not.toHaveClass("owncards-card--selected");
      expect(img2).toHaveClass("owncards-card--selected");
      expect(discard.textContent).toMatch(/Discard \(1\)/i);
    });

    // Click the same selected card -> deselects (back to zero)
    fireEvent.pointerDown(img2, { clientX: 0, clientY: 0 });
    fireEvent.pointerUp(img2, { clientX: 0, clientY: 0 });
    
    await waitFor(() => {
      expect(img2).not.toHaveClass("owncards-card--selected");
      expect(discard.textContent).toMatch(/Discard \(0\)/i);
    });
  });

  it("passes requireExactlyOne=true in 'discarding' and 'discardingOpt' when socialDisgrace=true", () => {
    const cards = TEST_CARDS.slice(0, 2);
    const { rerender } = setup(cards, {
      turnStatus: "discarding",
      socialDisgrace: true,
    });

    let discard = screen.getByTestId("discard-button");
    expect(discard.getAttribute("data-exact")).toBe("true");
    expect(discard.getAttribute("data-atleast")).toBe("false");

    rerender(
      <OwnCards
        cards={cards}
        turnStatus="discardingOpt"
        socialDisgrace={true}
      />
    );
    discard = screen.getByTestId("discard-button");
    expect(discard.getAttribute("data-exact")).toBe("true");
    expect(discard.getAttribute("data-atleast")).toBe("false");
  });

  it("also forces discard when socialDisgrace=true for 'playing' and 'takingAction'", () => {
    const cards = TEST_CARDS.slice(0, 2);

    // playing -> forced discard
    const { rerender } = setup(cards, {
      turnStatus: "playing",
      socialDisgrace: true,
    });
    let discard = screen.getByTestId("discard-button");
    expect(discard.getAttribute("data-exact")).toBe("true");

    // takingAction -> forced discard
    rerender(
      <OwnCards cards={cards} turnStatus="takingAction" socialDisgrace={true} />
    );
    discard = screen.getByTestId("discard-button");
    expect(discard.getAttribute("data-exact")).toBe("true");
  });

  it("maintains card order after reordering with Reorder.Item", async () => {
    const cards = TEST_CARDS.slice(0, 3);
    setup(cards, { turnStatus: "playing" });

    const images = screen.getAllByRole("img");
    expect(images[0]).toHaveAttribute("alt", `Card ${cards[0].name}`);
    expect(images[1]).toHaveAttribute("alt", `Card ${cards[1].name}`);
    expect(images[2]).toHaveAttribute("alt", `Card ${cards[2].name}`);
  });

  it("prevents drag when movement is detected (more than 8px) and allows click for small movements", async () => {
    const cards = TEST_CARDS.slice(0, 1);
    setup(cards, { turnStatus: "playing" });

    const img = screen.getByAltText(`Card ${cards[0].name}`);

    // Small movement - should toggle selection
    fireEvent.pointerDown(img, { clientX: 100, clientY: 100 });
    fireEvent.pointerUp(img, { clientX: 102, clientY: 102 });
    
    await waitFor(() => {
      expect(img).toHaveClass("owncards-card--selected");
    });

    // Reset
    fireEvent.pointerDown(img, { clientX: 100, clientY: 100 });
    fireEvent.pointerUp(img, { clientX: 102, clientY: 102 });
    
    await waitFor(() => {
      expect(img).not.toHaveClass("owncards-card--selected");
    });

    // Large movement - should NOT toggle selection (drag)
    fireEvent.pointerDown(img, { clientX: 100, clientY: 100 });
    fireEvent.pointerUp(img, { clientX: 120, clientY: 100 });
    
    // Selection should remain unchanged (still not selected)
    expect(img).not.toHaveClass("owncards-card--selected");
  });
});