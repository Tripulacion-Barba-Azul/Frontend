import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

// Mock CARDS_MAP so we have stable assets
vi.mock("../generalMaps.js", () => ({
  CARDS_MAP: {
    "Hercule Poirot": "/Cards/07-detective_poirot.png",
    "Miss Marple": "/Cards/08-detective_marple.png",
    "Parker Pyne": "/Cards/10-detective_pyne.png",
  },
}));

import SelectDiscardPileCards from "./SelectDiscardPileCards.jsx";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const CARDS = [
  { id: "C-1", name: "Hercule Poirot" },
  { id: "C-2", name: "Miss Marple" },
  { id: "C-3", name: "Parker Pyne" },
];

describe("SelectDiscardPileCards", () => {
  it("renders the always-open modal and the header text", () => {
    render(
      <SelectDiscardPileCards
        cards={CARDS}
        selectedCardId={() => {}}
        text="Select from discard"
      />
    );
    expect(screen.getByTestId("sdp-root")).toBeInTheDocument();
    expect(screen.getByText("Select from discard")).toBeInTheDocument();
  });

  it("renders one button per valid card and filters out unknown names", () => {
    const withUnknown = [...CARDS, { id: "X-9", name: "Unknown Card" }];
    render(
      <SelectDiscardPileCards cards={withUnknown} selectedCardId={() => {}} />
    );
    // 3 known card buttons + 1 confirm button
    expect(screen.getAllByRole("button")).toHaveLength(4);
  });

  it("when there are 5 or fewer cards, uses a single row with repeat(N, ...)", () => {
    const five = [
      { id: "C-1", name: "Hercule Poirot" },
      { id: "C-2", name: "Miss Marple" },
      { id: "C-3", name: "Parker Pyne" },
      { id: "C-4", name: "Hercule Poirot" },
      { id: "C-5", name: "Miss Marple" },
    ];
    render(<SelectDiscardPileCards cards={five} selectedCardId={() => {}} />);
    const grid = screen.getByTestId("sdp-grid");
    expect(grid.style.gridTemplateColumns).toMatch(/^repeat\(5, /);
  });

  it("selects a card on click, enables Confirm, calls callback with id and disables again", () => {
    const onPick = vi.fn();
    render(<SelectDiscardPileCards cards={CARDS} selectedCardId={onPick} />);

    const grid = screen.getByTestId("sdp-grid");
    const cardButtons = Array.from(grid.querySelectorAll("button")); // only card buttons
    const confirm = screen.getByTestId("sdp-confirm");

    expect(confirm).toBeDisabled();

    fireEvent.click(cardButtons[1]); // pick C-2
    expect(cardButtons[1]).toHaveClass("selected");
    expect(confirm).not.toBeDisabled();

    fireEvent.click(confirm);
    expect(onPick).toHaveBeenCalledWith("C-2");

    // After confirm, selection is cleared so Confirm disables again
    expect(cardButtons[1]).not.toHaveClass("selected");
    expect(confirm).toBeDisabled();
  });

  it("does not set selection if clicking Confirm without a picked card", () => {
    const onPick = vi.fn();
    render(<SelectDiscardPileCards cards={CARDS} selectedCardId={onPick} />);

    const confirm = screen.getByTestId("sdp-confirm");
    expect(confirm).toBeDisabled();

    fireEvent.click(confirm);
    expect(onPick).not.toHaveBeenCalled();
  });

  it("honors alt text format 'Card <id>' for the images", () => {
    render(<SelectDiscardPileCards cards={CARDS} selectedCardId={() => {}} />);
    expect(screen.getByAltText("Card C-1")).toBeInTheDocument();
    expect(screen.getByAltText("Card C-2")).toBeInTheDocument();
    expect(screen.getByAltText("Card C-3")).toBeInTheDocument();
  });

  it("for more than 5 cards, the inline gridTemplateColumns is not forced", () => {
    const six = [
      ...CARDS,
      { id: "C-4", name: "Hercule Poirot" },
      { id: "C-5", name: "Miss Marple" },
      { id: "C-6", name: "Parker Pyne" },
    ];
    render(<SelectDiscardPileCards cards={six} selectedCardId={() => {}} />);
    const grid = screen.getByTestId("sdp-grid");
    expect(grid.style.gridTemplateColumns).toBe("");
  });
});
