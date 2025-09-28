import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import RegularDeck from "./RegularDeck";
import "@testing-library/jest-dom";

// helper para extraer el src del <img>
function getImgSrc() {
  return screen.getByRole("img").getAttribute("src");
}

describe("RegularDeck component", () => {
  it("renders full deck when number >= 31", () => {
    render(<RegularDeck number={40} />);
    expect(getImgSrc()).toContain("deckicon-full.png");
    expect(screen.getByText("40")).toBeInTheDocument();
    expect(screen.getByTestId("deck-container")).toHaveClass("full");
  });

  it("renders half deck when 11 <= number <= 30", () => {
    render(<RegularDeck number={20} />);
    expect(getImgSrc()).toContain("deckicon-half.png");
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByTestId("deck-container")).toHaveClass("half");
  });

  it("renders thin deck when 1 <= number <= 10", () => {
    render(<RegularDeck number={5} />);
    expect(getImgSrc()).toContain("deckicon-thin.png");
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByTestId("deck-container")).toHaveClass("thin");
  });

  it("renders murderer escapes when number = 0", () => {
    render(<RegularDeck number={0} />);
    expect(getImgSrc()).toContain("murder_escapes.png");
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByTestId("deck-container")).toHaveClass("murderer");
  });

  it("clamps number above 61 down to 61", () => {
    render(<RegularDeck number={100} />);
    expect(screen.getByText("61")).toBeInTheDocument();
  });

  it("clamps number below 0 up to 0", () => {
    render(<RegularDeck number={-5} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});