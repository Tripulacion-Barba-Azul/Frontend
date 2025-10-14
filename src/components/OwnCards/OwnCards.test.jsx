// OwnCards.test.jsx
import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import OwnCards from "./OwnCards.jsx";

// Mock CARDS_MAP so we don't depend on real assets/keys
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

// Mock router hooks because children use useParams/useSearchParams
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useSearchParams: () => [new URLSearchParams("playerId=1")],
    useParams: () => ({ gameId: "123" }),
  };
});

// Helper to render the component
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

  it("toggles selection when turnStatus is 'playing' (and also allows selection in 'discarding')", () => {
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

  it("keeps remaining selected cards and trims removed ones when cards array changes", () => {
    const cards = TEST_CARDS.slice(0, 2); // A, B
    const { rerender } = setup(cards, { turnStatus: "playing" });

    const imgA = screen.getByAltText(`Card ${cards[0].name}`); // select A & B
    const imgB = screen.getByAltText(`Card ${cards[1].name}`);
    fireEvent.click(imgA);
    fireEvent.click(imgB);
    expect(imgA).toHaveClass("owncards-card--selected");
    expect(imgB).toHaveClass("owncards-card--selected");

    // remove B; selection must keep A selected and drop B
    rerender(<OwnCards cards={[cards[0]]} turnStatus="playing" />);
    const imgAafter = screen.getByAltText(`Card ${cards[0].name}`);
    expect(imgAafter).toHaveClass("owncards-card--selected");
    expect(screen.queryByAltText(`Card ${cards[1].name}`)).toBeNull();
  });

  it("does NOT clear selection when turnStatus changes; it only disables interaction", () => {
    const cards = TEST_CARDS.slice(0, 1);
    const { rerender } = setup(cards, { turnStatus: "playing" });

    const img = screen.getByAltText(`Card ${cards[0].name}`);
    fireEvent.click(img);
    expect(img).toHaveClass("owncards-card--selected");

    rerender(<OwnCards cards={cards} turnStatus="waiting" />);
    const sameImg = screen.getByAltText(`Card ${cards[0].name}`);
    expect(sameImg).toHaveClass("owncards-card--selected");
    expect(sameImg).toHaveClass("owncards-card--disabled");
  });

  it("renders DiscardButton in 'discarding' and DrawRegularCardButton in 'drawing'", () => {
    const cards = TEST_CARDS.slice(0, 2);

    // discarding -> DiscardButton visible (button text includes count)
    const { rerender } = setup(cards, { turnStatus: "discarding" });
    expect(
      screen.getByRole("button", { name: /Discard \(\d+\)/i })
    ).toBeInTheDocument();

    // drawing -> DrawRegularCardButton visible (has data-testid)
    rerender(<OwnCards cards={cards} turnStatus="drawing" />);
    expect(screen.getByTestId("draw-card-button")).toBeInTheDocument();
  });

  it("in 'playing' shows NoActionButton when nothing is selected and 'Play (n)' when there is a selection", () => {
    const cards = TEST_CARDS.slice(0, 2);

    // With no selection -> NoActionButton ("Play nothing")
    const { rerender } = setup(cards, { turnStatus: "playing" });
    expect(
      screen.getByRole("button", { name: /Play nothing/i })
    ).toBeInTheDocument();

    // Select one -> OwnCards renders "Play (1)" button
    const img1 = screen.getByAltText(`Card ${cards[0].name}`);
    fireEvent.click(img1);
    expect(
      screen.getByRole("button", { name: /Play \(1\)/i })
    ).toBeInTheDocument();

    // Select second -> "Play (2)"
    const img2 = screen.getByAltText(`Card ${cards[1].name}`);
    fireEvent.click(img2);
    expect(
      screen.getByRole("button", { name: /Play \(2\)/i })
    ).toBeInTheDocument();

    // Switch to 'waiting' -> action buttons disappear from 'playing' branch
    rerender(<OwnCards cards={cards} turnStatus="waiting" />);
    expect(screen.queryByRole("button", { name: /Play nothing/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Play \(\d+\)/i })).toBeNull();
  });
});
