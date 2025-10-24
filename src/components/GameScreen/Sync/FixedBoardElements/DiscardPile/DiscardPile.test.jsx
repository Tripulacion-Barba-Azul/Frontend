import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";

vi.mock("../generalMaps.js", () => ({
  CARDS_MAP: {
    "Hercule Poirot": "/Cards/07-detective_poirot.png",
    "Miss Marple": "/Cards/08-detective_marple.png",
  },
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    img: ({ children, ...props }) => <img {...props}>{children}</img>,
  },
  AnimatePresence: ({ children }) => children,
}));

import DiscardPile from "./DiscardPile";

const getDiscardImg = () => screen.getByRole("img", { name: /discard pile/i });

describe("DiscardPile", () => {
  it("renders nothing when number = 0", () => {
    const { container } = render(<DiscardPile number={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows 'thin' variant when 2 <= number <= 5", () => {
    render(<DiscardPile number={3} />);
    const img = getDiscardImg();
    expect(img.getAttribute("src")).toContain("discardicon-thin.png");
    expect(screen.getByTestId("discard-container")).toHaveClass("thin");
  });

  it("shows 'half' variant when 6 <= number <= 25", () => {
    render(<DiscardPile number={20} />);
    const img = getDiscardImg();
    expect(img.getAttribute("src")).toContain("discardicon-half.png");
    expect(screen.getByTestId("discard-container")).toHaveClass("half");
  });

  it("shows 'full' variant when number >= 26", () => {
    render(<DiscardPile number={42} />);
    const img = getDiscardImg();
    expect(img.getAttribute("src")).toContain("discardicon-full.png");
    expect(screen.getByTestId("discard-container")).toHaveClass("full");
  });

  it("shows 'one-card' variant when number = 1", () => {
    render(<DiscardPile number={1} card={{ name: "Hercule Poirot", id: "P07" }} />);
    const container = screen.getByTestId("discard-container");
    expect(container).toHaveClass("one-card");
    // For one-card, no discard pile image should be shown
    expect(screen.queryByRole("img", { name: /discard pile/i })).not.toBeInTheDocument();
  });

  it("clamps out-of-range values and shows 'full' for very large numbers", () => {
    render(<DiscardPile number={999} />);
    const img = getDiscardImg();
    expect(img.getAttribute("src")).toContain("discardicon-full.png");
  });

  it("renders top card when card.name exists in CARDS_MAP and uses card.id in alt", () => {
    render(
      <DiscardPile number={15} card={{ name: "Hercule Poirot", id: "P07" }} />
    );

    const topCard = screen.getByAltText("Top card P07");
    expect(topCard).toBeInTheDocument();
    expect(topCard.getAttribute("src")).toBe("/Cards/07-detective_poirot.png");
  });

  it("renders top card for one-card variant", () => {
    render(
      <DiscardPile number={1} card={{ name: "Hercule Poirot", id: "P07" }} />
    );

    const topCard = screen.getByAltText("Top card P07");
    expect(topCard).toBeInTheDocument();
    expect(screen.getByTestId("discard-container")).toHaveClass("one-card");
  });

  it("does not render top card when card is undefined", () => {
    render(<DiscardPile number={15} />);
    const topCards = screen.queryAllByAltText(/Top card/i);
    expect(topCards.length).toBe(0);
  });

  it("does not render top card when card.name is not in CARDS_MAP", () => {
    render(
      <DiscardPile number={15} card={{ name: "Unknown Card", id: "X00" }} />
    );
    const topCards = screen.queryAllByAltText(/Top card/i);
    expect(topCards.length).toBe(0);
  });

  it("clamps number to minimum 0", () => {
    const { container } = render(<DiscardPile number={-5} />);
    expect(container.firstChild).toBeNull();
  });

  it("clamps number to maximum 61", () => {
    render(<DiscardPile number={100} />);
    // Should still render with full variant (clamped to 61)
    const img = getDiscardImg();
    expect(img.getAttribute("src")).toContain("discardicon-full.png");
  });

  it("handles string number input", () => {
    render(<DiscardPile number="10" />);
    const img = getDiscardImg();
    expect(img.getAttribute("src")).toContain("discardicon-half.png");
    expect(screen.getByTestId("discard-container")).toHaveClass("half");
  });
});