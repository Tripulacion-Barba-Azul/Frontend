import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";

vi.mock("../generalMaps.js", () => ({
  CARDS_MAP: {
    "Hercule Poirot": "/Cards/07-detective_poirot.png",
    "Miss Marple": "/Cards/08-detective_marple.png",
  },
}));

import DiscardPile from "./DiscardPile";

const getDiscardImg = () => screen.getByRole("img", { name: /discard pile/i });

describe("DiscardPile", () => {
  it("renders nothing when number = 0", () => {
    const { container } = render(<DiscardPile number={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows 'thin' variant when 1 <= number <= 6", () => {
    render(<DiscardPile number={5} />);
    const img = getDiscardImg();
    expect(img.getAttribute("src")).toContain("discardicon-thin.png");
    expect(screen.getByTestId("discard-container")).toHaveClass("thin");
  });

  it("shows 'half' variant when 6 <= number <= 26", () => {
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
});
