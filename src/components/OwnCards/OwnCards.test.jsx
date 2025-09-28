import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import OwnCards from "./OwnCards.jsx";
import { CARD_SRC } from "./ownCardsConstants.js";

// Small helper to render the component
const setup = (ids = []) => render(<OwnCards cardIds={ids} />);

describe("OwnCards.jsx (static, non-interactive)", () => {
  beforeEach(() => {
    // ensure clean DOM between tests
    document.body.innerHTML = "";
  });

  it("renders the absolute overlay container with aria-label", () => {
    setup([]);
    const overlay = screen.getByLabelText("cards-row");
    // Container exists and is absolute overlay (pointer-events disabled)
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass("owncards-overlay");
  });

  it("renders no images when cardIds is empty", () => {
    setup([]);
    // No card images should be present
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

    // One <img> per id, with alt "Card <id>"
    ids.forEach((id) => {
      const img = screen.getByAltText(`Card ${id}`);
      expect(img).toBeInTheDocument();

      // jsdom turns relative paths into absolute; assert it contains the mapped suffix
      expect(img.getAttribute("src")).toContain(CARD_SRC[id]);

      // Total count check
      const imgs = screen.getAllByRole("img", { name: /Card \d+/i });
      expect(imgs).toHaveLength(ids.length);
    });
  });

  it("accepts up to 6 cards and renders exactly that many images", () => {
    const six = [7, 8, 9, 10, 11, 12];
    setup(six);
    const imgs = screen.getAllByRole("img", { name: /Card \d+/i });
    expect(imgs).toHaveLength(6);
  });
});
