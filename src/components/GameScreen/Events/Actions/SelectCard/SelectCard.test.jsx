// SelectCard.test.jsx
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  within,
} from "@testing-library/react";

// Mock CARDS_MAP to provide stable image URLs used by the component
vi.mock("../../../../../utils/generalMaps", () => ({
  CARDS_MAP: {
    "Hercule Poirot": "/Cards/07-detective_poirot.png",
    "Miss Marple": "/Cards/08-detective_marple.png",
    "Parker Pyne": "/Cards/10-detective_pyne.png",
  },
}));

import SelectCard from "./SelectCard.jsx";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const BASE = [
  { id: "C-1", name: "Hercule Poirot" },
  { id: "C-2", name: "Miss Marple" },
  { id: "C-3", name: "Parker Pyne" },
];

describe("SelectCard (single-row, up to 6)", () => {
  it("renders the modal root and header text", () => {
    render(
      <SelectCard
        cards={BASE}
        selectedCardId={() => {}}
        text="Select from discard"
      />
    );
    expect(screen.getByTestId("sdp-root")).toBeInTheDocument();
    expect(screen.getByText("Select from discard")).toBeInTheDocument();
  });

  it("renders one option per valid card and filters out unknown names", () => {
    const withUnknown = [...BASE, { id: "X-9", name: "Unknown Card" }];
    render(<SelectCard cards={withUnknown} selectedCardId={() => {}} />);

    // Row contains only valid card *options*; Confirm is a separate button
    const row = screen.getByRole("listbox", { name: /cards/i });
    const cardOptions = within(row).getAllByRole("option");
    expect(cardOptions).toHaveLength(3);

    // Confirm is the only 'button' outside the row
    const confirm = screen.getByRole("button", { name: /confirm/i });
    expect(confirm).toBeInTheDocument();
  });

  it("keeps a single-row container and reflects the current count in data-count", () => {
    const five = [
      ...BASE,
      { id: "C-4", name: "Hercule Poirot" },
      { id: "C-5", name: "Miss Marple" },
    ];
    render(<SelectCard cards={five} selectedCardId={() => {}} />);
    const row = screen.getByRole("listbox", { name: /cards/i });
    expect(row).toHaveAttribute("data-count", "5");

    const cardOptions = within(row).getAllByRole("option");
    expect(cardOptions).toHaveLength(5);
  });

  it("caps rendering to 6 cards and sets panel CSS var --count accordingly", () => {
    const seven = [
      ...BASE,
      { id: "C-4", name: "Hercule Poirot" },
      { id: "C-5", name: "Miss Marple" },
      { id: "C-6", name: "Parker Pyne" },
      { id: "C-7", name: "Hercule Poirot" }, // exceeds the cap
    ];
    render(<SelectCard cards={seven} selectedCardId={() => {}} />);

    const row = screen.getByRole("listbox", { name: /cards/i });
    const cardOptions = within(row).getAllByRole("option");
    expect(cardOptions).toHaveLength(6);

    // The panel exposes the count via CSS custom property
    const panel = document.querySelector(".sdp-panel");
    expect(panel).toBeInTheDocument();
    expect(panel.style.getPropertyValue("--count").trim()).toBe("6");
  });

  it("selects a card on click, enables Confirm, calls callback, then clears selection", () => {
    const onPick = vi.fn();
    render(<SelectCard cards={BASE} selectedCardId={onPick} />);

    const row = screen.getByRole("listbox", { name: /cards/i });
    const cardOptions = within(row).getAllByRole("option");
    const confirm = screen.getByTestId("sdp-confirm");

    expect(confirm).toBeDisabled();

    // Pick the second option
    fireEvent.click(cardOptions[1]);
    expect(cardOptions[1]).toHaveAttribute("aria-selected", "true");
    expect(confirm).not.toBeDisabled();

    // Confirm selection
    fireEvent.click(confirm);
    expect(onPick).toHaveBeenCalledWith("C-2");

    // After confirming, selection should be cleared
    const refreshedOptions = within(row).getAllByRole("option");
    refreshedOptions.forEach((opt) =>
      expect(opt).toHaveAttribute("aria-selected", "false")
    );
    expect(confirm).toBeDisabled();
  });

  it("does not call callback if Confirm is clicked without a selection", () => {
    const onPick = vi.fn();
    render(<SelectCard cards={BASE} selectedCardId={onPick} />);
    const confirm = screen.getByTestId("sdp-confirm");

    expect(confirm).toBeDisabled();
    fireEvent.click(confirm);
    expect(onPick).not.toHaveBeenCalled();
  });

  it("honors alt text format 'Card <id>' for images", () => {
    render(<SelectCard cards={BASE} selectedCardId={() => {}} />);
    expect(screen.getByAltText("Card C-1")).toBeInTheDocument();
    expect(screen.getByAltText("Card C-2")).toBeInTheDocument();
    expect(screen.getByAltText("Card C-3")).toBeInTheDocument();
  });

  it("renders the empty state and keeps Confirm disabled when there are no valid cards", () => {
    render(<SelectCard cards={[]} selectedCardId={() => {}} />);
    expect(screen.getByText(/No cards available/i)).toBeInTheDocument();
    expect(screen.getByTestId("sdp-confirm")).toBeDisabled();
  });
});
