import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect } from "vitest";
import DiscardPile from "./DiscardPile";

function getImgSrc() {
  return screen.getByRole("img", { name: /discard pile/i }).getAttribute("src");
}

describe("DiscardPile component", () => {
  it("renders full discard when number >= 31", () => {
    render(<DiscardPile number={40} />);
    expect(getImgSrc()).toContain("discardicon-full.png");
    expect(screen.getByTestId("discard-container")).toHaveClass("full");
  });

  it("renders half discard when 11 <= number <= 30", () => {
    render(<DiscardPile number={20} />);
    expect(getImgSrc()).toContain("discardicon-half.png");
    expect(screen.getByTestId("discard-container")).toHaveClass("half");
  });

  it("renders thin discard when 1 <= number <= 10", () => {
    render(<DiscardPile number={5} />);
    expect(getImgSrc()).toContain("discardicon-thin.png");
    expect(screen.getByTestId("discard-container")).toHaveClass("thin");
  });

  it("renders top card if img_id is provided", () => {
    render(<DiscardPile number={15} img_id={7} />);
    const topCard = screen.getByAltText("Top card 7");
    expect(topCard).toBeInTheDocument();
    expect(topCard.getAttribute("src")).toContain("07-detective_poirot.png");
  });

  it("does not render top card if img_id is not provided", () => {
    render(<DiscardPile number={15} />);
    const topCards = screen.queryAllByAltText(/Top card/i);
    expect(topCards.length).toBe(0);
  });

  it("renders nothing when number = 0", () => {
    const { container } = render(<DiscardPile number={0} />);
    expect(container.firstChild).toBeNull();
  });
});
