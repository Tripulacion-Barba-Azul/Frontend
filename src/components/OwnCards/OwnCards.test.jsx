import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import OwnCards from "./OwnCards.jsx";
import { CARDS_MAP } from "../generalMaps.js";

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    useSearchParams: () => [
      new URLSearchParams({ playerId: "1" }), // fake param
      vi.fn(),
    ],
    useParams: () => ({ gameId: "123" }), // fake param
  };
});

// Helper to render easily
const setup = (cards = [], props = {}) =>
  render(<OwnCards cardIds={cards} {...props} />);

// Example test cards
const TEST_CARDS = [
  { cardID: 7, cardName: "Hercule Poirot" },
  { cardID: 16, cardName: "Not so Fast!" },
  { cardID: 27, cardName: "Social Faux Pas" },
];

describe("OwnCards.jsx (new card object structure)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the overlay container", () => {
    setup([]);
    const overlay = screen.getByLabelText("cards-row");
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass("owncards-overlay");
  });

  it("renders no images when cardIds is empty", () => {
    setup([]);
    const imgs = screen.queryAllByRole("img");
    expect(imgs).toHaveLength(0);
  });

  it("renders an <img> for each card object and uses CARDS_MAP mapping as src", () => {
    setup(TEST_CARDS);

    TEST_CARDS.forEach((card) => {
      const img = screen.getByAltText(`Card ${card.cardName}`);
      expect(img).toBeInTheDocument();

      // jsdom will normalize the path, just check it contains mapped path
      expect(img.getAttribute("src")).toContain(CARDS_MAP[card.cardName]);
    });

    const imgs = screen.getAllByRole("img");
    expect(imgs).toHaveLength(TEST_CARDS.length);
  });

  it("accepts up to 6 cards and renders exactly that many", () => {
    const six = Array.from({ length: 6 }, (_, i) => ({
      cardID: i + 7,
      cardName: "Hercule Poirot",
    }));
    setup(six);
    const imgs = screen.getAllByRole("img");
    expect(imgs).toHaveLength(6);
  });

  it("does NOT allow selecting cards when turnStatus is 'waiting' or 'drawing'", () => {
    const cards = TEST_CARDS.slice(0, 2);
    const { rerender } = setup(cards, { turnStatus: "waiting" });

    const img = screen.getByAltText(`Card ${cards[0].cardName}`);
    fireEvent.click(img);
    expect(img).not.toHaveClass("owncards-card--selected");

    rerender(<OwnCards cardIds={cards} turnStatus="drawing" />);
    const img2 = screen.getByAltText(`Card ${cards[1].cardName}`);
    fireEvent.click(img2);
    expect(img2).not.toHaveClass("owncards-card--selected");
  });

  it("toggles selection when turnStatus is 'playing'", () => {
    const cards = TEST_CARDS.slice(0, 2);
    const { rerender } = setup(cards, { turnStatus: "playing" });

    const img1 = screen.getByAltText(`Card ${cards[0].cardName}`);
    fireEvent.click(img1);
    expect(img1).toHaveClass("owncards-card--selected");

    fireEvent.click(img1);
    expect(img1).not.toHaveClass("owncards-card--selected");

    const img2 = screen.getByAltText(`Card ${cards[1].cardName}`);
    fireEvent.click(img2);
    expect(img2).toHaveClass("owncards-card--selected");

    rerender(<OwnCards cardIds={cards} turnStatus="discarding" />);
    const nowImg1 = screen.getByAltText(`Card ${cards[0].cardName}`);
    fireEvent.click(nowImg1);
    expect(nowImg1).toHaveClass("owncards-card--selected");
  });

  it("trims selected cards when cardIds prop changes", () => {
    const cards = [
      { cardID: 11, cardName: "Miss Marple" },
      { cardID: 12, cardName: "Mr Satterthwaite" },
    ];
    const { rerender } = setup(cards, { turnStatus: "playing" });

    const img1 = screen.getByAltText("Card Miss Marple");
    const img2 = screen.getByAltText("Card Mr Satterthwaite");

    fireEvent.click(img1);
    fireEvent.click(img2);
    expect(img1).toHaveClass("owncards-card--selected");
    expect(img2).toHaveClass("owncards-card--selected");

    // remove one card
    rerender(<OwnCards cardIds={[cards[0]]} turnStatus="playing" />);
    const remaining = screen.getByAltText("Card Miss Marple");
    expect(remaining).toHaveClass("owncards-card--selected");
    expect(screen.queryByAltText("Card Mr Satterthwaite")).toBeNull();
  });
});