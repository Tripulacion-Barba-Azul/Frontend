import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import OwnCards from "./OwnCards.jsx";
import { CARD_SRC } from "./ownCardsConstants.js";

// Helper: Renders and returns utilities
const setup = (ids = []) => render(<OwnCards cardIds={ids} />);

describe("OwnCards.jsx", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders no buttons when cardIds is empty", () => {
    setup([]);
    // each card is a button; with no ids, we expect none
    const buttons = screen.queryAllByRole("button", { name: /Open card/i });
    expect(buttons).toHaveLength(0);
  });

  it("throws on invalid inputs: non-array, too many items, or out-of-range ids", () => {
    // non-array
    expect(() => render(<OwnCards cardIds={"not-an-array"} />)).toThrow();

    // > 6 elements
    expect(() =>
      render(<OwnCards cardIds={[7, 8, 9, 10, 11, 12, 13]} />)
    ).toThrow();

    // out-of-range (below 7)
    expect(() => render(<OwnCards cardIds={[6]} />)).toThrow();

    // out-of-range (above 27)
    expect(() => render(<OwnCards cardIds={[28]} />)).toThrow();
  });

  it("renders buttons for each valid id and uses CARD_SRC mapping as image src", () => {
    const ids = [7, 16, 27]; // valid ids within [7, 27]
    setup(ids);

    // We expect one button per id
    const buttons = screen.getAllByRole("button", { name: /Open card/i });
    expect(buttons).toHaveLength(ids.length);

    // Each img alt is "Card <id>" and src must match CARD_SRC
    ids.forEach((id) => {
      const img = screen.getByAltText(`Card ${id}`);
      expect(img).toBeInTheDocument();
      // ensure the src ends with the mapped path (JSDOM resolves to absolute)
      expect(img.getAttribute("src")).toContain(CARD_SRC[id]);
    });
  });

  it("closes the modal with Escape key", () => {
    setup([11, 21]);
    fireEvent.click(screen.getByRole("button", { name: "Open card 11" }));

    // Ensure open
    expect(
      screen.getByRole("dialog", { name: /Card 11 viewer/i })
    ).toBeInTheDocument();

    // Press Esc
    fireEvent.keyDown(window, { key: "Escape" });
    // Modal disappears
    expect(
      screen.queryByRole("dialog", { name: /Card 11 viewer/i })
    ).not.toBeInTheDocument();
  });

  it("closes the modal with the ✕ button", () => {
    setup([11, 21]);
    fireEvent.click(screen.getByRole("button", { name: "Open card 21" }));
    const closeBtn = screen.getByRole("button", { name: "Close" });
    fireEvent.click(closeBtn);
    // Modal disappears
    expect(
      screen.queryByRole("dialog", { name: /Card 21 viewer/i })
    ).not.toBeInTheDocument();
  });

  it("disables other cards while modal is open and prevents opening a second one", () => {
    setup([11, 21]);

    // Open card 11
    fireEvent.click(screen.getByRole("button", { name: "Open card 11" }));
    // While open, buttons should be disabled
    const btn11 = screen.getByRole("button", { name: "Open card 11" });
    const btn21 = screen.getByRole("button", { name: "Open card 21" });
    expect(btn11).toBeDisabled();
    expect(btn21).toBeDisabled();

    // Try clicking the second button anyway
    fireEvent.click(btn21);

    // Still showing the first card's modal
    expect(
      screen.getByRole("dialog", { name: /Card 11 viewer/i })
    ).toBeInTheDocument();

    // Close with Esc to clean state
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("accepts up to 6 cards and renders exactly that many", () => {
    const six = [7, 8, 9, 10, 11, 12];
    setup(six);
    const buttons = screen.getAllByRole("button", { name: /Open card/ });
    expect(buttons).toHaveLength(6);
  });
});
