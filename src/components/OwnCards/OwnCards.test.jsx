import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

/* Mock action subcomponents so tests are stable and focused on OwnCards behavior */
vi.mock("./DiscardButton/DiscardButton", () => ({
  default: ({ selectedCards = [], handSize = 0, onDiscardSuccess }) => (
    <button data-testid="discard-button" onClick={() => onDiscardSuccess?.()}>
      {`Discard (${selectedCards.length}) / Hand ${handSize}`}
    </button>
  ),
}));

vi.mock("./NoActionButton/NoActionButton", () => ({
  default: () => <button aria-label="no-action">Play nothing</button>,
}));

vi.mock("./DrawRegularCardButton/DrawRegularCardButton.jsx", () => ({
  default: ({ isDrawCardPhase, playerCardCount }) => (
    <div data-testid="draw-card-button">
      DrawRegularCardButton: {String(isDrawCardPhase)} / {playerCardCount}
    </div>
  ),
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

  it("renders the row container (bottom centered)", () => {
    setup([]);
    const row = document.querySelector(".owncards-row");
    expect(row).toBeInTheDocument();
  });

  it("renders no images when cards is empty", () => {
    setup([]);
    expect(screen.queryAllByRole("img")).toHaveLength(0);
  });

  it("renders an <img> for each card with src from CARDS_MAP and alt='Card <name>'", () => {
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

  it("does NOT allow selecting cards when turnStatus is 'waiting' or 'drawing' and applies disabled class", () => {
    const cards = TEST_CARDS.slice(0, 2);
    const { rerender } = setup(cards, { turnStatus: "waiting" });

    const img1 = screen.getByAltText(`Card ${cards[0].name}`);
    const img2 = screen.getByAltText(`Card ${cards[1].name}`);
    fireEvent.click(img1);
    expect(img1).not.toHaveClass("owncards-card--selected");
    expect(img1).toHaveClass("owncards-card--disabled");
    expect(img2).toHaveClass("owncards-card--disabled");

    rerender(<OwnCards cards={cards} turnStatus="drawing" />);
    const img1Again = screen.getByAltText(`Card ${cards[0].name}`);
    expect(img1Again).toHaveClass("owncards-card--disabled");
  });

  it("toggles selection when turnStatus is 'playing' and also allows selection in 'discarding'", () => {
    const cards = TEST_CARDS.slice(0, 2);
    const { rerender } = setup(cards, { turnStatus: "playing" });

    const img1 = screen.getByAltText(`Card ${cards[0].name}`);
    fireEvent.click(img1);
    expect(img1).toHaveClass("owncards-card--selected");

    fireEvent.click(img1);
    expect(img1).not.toHaveClass("owncards-card--selected");

    const img2 = screen.getByAltText(`Card ${cards[1].name}`);
    fireEvent.click(img2);
    expect(img2).toHaveClass("owncards-card--selected");

    // Switching to discarding still allows selecting
    rerender(<OwnCards cards={cards} turnStatus="discarding" />);
    const nowImg1 = screen.getByAltText(`Card ${cards[0].name}`);
    fireEvent.click(nowImg1);
    expect(nowImg1).toHaveClass("owncards-card--selected");
  });

  it("clears selection when turnStatus changes; it only disables interaction", () => {
    const cards = TEST_CARDS.slice(0, 1);
    const { rerender } = setup(cards, { turnStatus: "playing" });

    const img = screen.getByAltText(`Card ${cards[0].name}`);
    fireEvent.click(img);
    expect(img).toHaveClass("owncards-card--selected");

    rerender(<OwnCards cards={cards} turnStatus="waiting" />);
    const sameImg = screen.getByAltText(`Card ${cards[0].name}`);
    expect(sameImg).toHaveClass("owncards-card");
    expect(sameImg).toHaveClass("owncards-card--disabled");
    expect(sameImg).not.toHaveClass("owncards-card--selected");
  });

  it("renders DiscardButton in 'discarding' (and 'discardingOpt') and DrawRegularCardButton in 'drawing'", () => {
    const cards = TEST_CARDS.slice(0, 2);

    // discarding -> DiscardButton visible
    const { rerender } = setup(cards, { turnStatus: "discarding" });
    expect(screen.getByTestId("discard-button")).toBeInTheDocument();
    expect(screen.getByTestId("discard-button").textContent).toMatch(
      /Discard \(0\)/i
    );

    // discardingOpt -> DiscardButton also visible
    rerender(<OwnCards cards={cards} turnStatus="discardingOpt" />);
    expect(screen.getByTestId("discard-button")).toBeInTheDocument();

    // drawing -> DrawRegularCardButton visible
    rerender(<OwnCards cards={cards} turnStatus="drawing" />);
    expect(screen.getByTestId("draw-card-button")).toBeInTheDocument();
  });

  it("in 'playing' shows NoActionButton when nothing is selected and 'Play (n)' when there is a selection; onPlaySuccess clears selection", () => {
    const cards = TEST_CARDS.slice(0, 2);

    // With no selection -> NoActionButton ("Play nothing")
    setup(cards, { turnStatus: "playing" });
    expect(screen.getByLabelText(/no-action/i)).toBeInTheDocument();

    // Select one -> PlayCardsButton ("Play (1)")
    const img1 = screen.getByAltText(`Card ${cards[0].name}`);
    fireEvent.click(img1);
    const playButton = screen.getByTestId("play-cards-button");
    expect(playButton.textContent).toMatch(/Play \(1\)/i);

    // Simulate play success -> selection should clear and show NoActionButton again
    fireEvent.click(playButton);
    expect(screen.getByLabelText(/no-action/i)).toBeInTheDocument();
  });

  it("in 'discarding' clicking DiscardButton triggers onDiscardSuccess and clears selection", () => {
    const cards = TEST_CARDS.slice(0, 2);
    setup(cards, { turnStatus: "discarding" });

    // Select one
    const img1 = screen.getByAltText(`Card ${cards[0].name}`);
    fireEvent.click(img1);
    expect(img1).toHaveClass("owncards-card--selected");

    // Click discard (mock calls onDiscardSuccess which clears selection)
    fireEvent.click(screen.getByTestId("discard-button"));
    expect(img1).not.toHaveClass("owncards-card--selected");
  });
});
