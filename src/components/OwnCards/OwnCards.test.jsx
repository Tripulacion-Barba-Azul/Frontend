import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import OwnCards from "./OwnCards.jsx";
import { CARD_SRC } from "./ownCardsConstants.js";

// Mock the DiscardButton so tests don't need react-router or fetch behavior.
// We return null to avoid rendering any button/UI from that module here.
vi.mock("./DiscardButton/DiscardButton", () => {
  return {
    default: () => null,
  };
});

// Small helper to render the component and return render utils when needed
const setup = (ids = [], props = {}) => render(<OwnCards cardIds={ids} {...props} />);

describe("OwnCards.jsx (static + selection behavior)", () => {
  beforeEach(() => {
    // ensure clean DOM between tests
    document.body.innerHTML = "";
  });

  it("renders the absolute overlay container with aria-label", () => {
    setup([]);
    const overlay = screen.getByLabelText("cards-row");
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass("owncards-overlay");
  });

  it("renders no images when cardIds is empty", () => {
    setup([]);
    const imgs = screen.queryAllByRole("img", { name: /Card \d+/i });
    expect(imgs).toHaveLength(0);
  });

  it("throws on invalid inputs: non-array, too many items, or out-of-range ids", () => {
    // Non-array
    expect(() => render(<OwnCards cardIds={"not-an-array"} />)).toThrow();

    // > 6 elements
    expect(() =>
      render(<OwnCards cardIds={[7, 8, 9, 10, 11, 12, 13]} />)
    ).toThrow();

    // Out-of-range (below 7)
    expect(() => render(<OwnCards cardIds={[6]} />)).toThrow();

    // Out-of-range (above 27)
    expect(() => render(<OwnCards cardIds={[28]} />)).toThrow();
  });

  it("renders an <img> for each valid id and uses CARD_SRC mapping as its src", () => {
    const ids = [7, 16, 27]; // valid range [7..27]
    setup(ids);

    ids.forEach((id) => {
      const img = screen.getByAltText(`Card ${id}`);
      expect(img).toBeInTheDocument();

      // jsdom turns relative paths into absolute; assert it contains the mapped suffix
      expect(img.getAttribute("src")).toContain(CARD_SRC[id]);
    });

    const imgs = screen.getAllByRole("img", { name: /Card \d+/i });
    expect(imgs).toHaveLength(ids.length);
  });

  it("accepts up to 6 cards and renders exactly that many images", () => {
    const six = [7, 8, 9, 10, 11, 12];
    setup(six);
    const imgs = screen.getAllByRole("img", { name: /Card \d+/i });
    expect(imgs).toHaveLength(6);
  });

  it("does NOT allow selecting cards when turnStatus is 'waiting' or 'drawing'", () => {
    const ids = [7, 8];
    const { rerender } = setup(ids, { turnStatus: "waiting" });
    const img7 = screen.getByAltText("Card 7");
    fireEvent.click(img7);
    expect(img7).not.toHaveClass("owncards-card--selected");

    // switch to drawing: still cannot select
    rerender(<OwnCards cardIds={ids} turnStatus="drawing" />);
    const img8 = screen.getByAltText("Card 8");
    fireEvent.click(img8);
    expect(img8).not.toHaveClass("owncards-card--selected");
  });

  it("toggles selection when turnStatus is 'playing' (click to select and click again to deselect)", () => {
    const ids = [9, 10];
    const { rerender } = setup(ids, { turnStatus: "playing" });

    const img9 = screen.getByAltText("Card 9");
    // select
    fireEvent.click(img9);
    expect(img9).toHaveClass("owncards-card--selected");

    // deselect
    fireEvent.click(img9);
    expect(img9).not.toHaveClass("owncards-card--selected");

    // also ensure another card can be selected
    const img10 = screen.getByAltText("Card 10");
    fireEvent.click(img10);
    expect(img10).toHaveClass("owncards-card--selected");

    // switching to 'discarding' still allows selection toggling
    rerender(<OwnCards cardIds={ids} turnStatus="discarding" />);
    const nowImg9 = screen.getByAltText("Card 9");
    fireEvent.click(nowImg9);
    expect(nowImg9).toHaveClass("owncards-card--selected");
  });

  it("keeps selection only for cards that remain in cardIds when prop changes (trims selection)", () => {
    const ids = [11, 12];
    const { rerender } = setup(ids, { turnStatus: "playing" });

    const img11 = screen.getByAltText("Card 11");
    const img12 = screen.getByAltText("Card 12");

    // select both
    fireEvent.click(img11);
    fireEvent.click(img12);
    expect(img11).toHaveClass("owncards-card--selected");
    expect(img12).toHaveClass("owncards-card--selected");

    // now rerender with card 12 removed -> selection must be trimmed so only 11 remains selected
    rerender(<OwnCards cardIds={[11]} turnStatus="playing" />);
    const remaining = screen.getByAltText("Card 11");
    expect(remaining).toHaveClass("owncards-card--selected");
    expect(screen.queryByAltText("Card 12")).toBeNull();
  });
});