import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

vi.mock("../generalMaps.js", () => ({
  CARDS_MAP: {
    "Hercule Poirot": "/Cards/07-detective_poirot.png",
    "Miss Marple": "/Cards/08-detective_marple.png",
    "Mr Sattertwhaite": "/Cards/09-detective_satterhwaite.png",
    "Parker Pyne": "/Cards/10-detective_pyne.png",
    "Lady Eileen Brent": "/Cards/11-detective_brent.png",
    "Tommy Beresford": "/Cards/12-detective_tommyberesford.png",
  },
}));

import ViewMyCards from "./ViewMyCards.jsx";

afterEach(() => {
  cleanup();
  document.body.classList.remove("active-viewmycards");
});

const EXPECTED_SRC = {
  "Hercule Poirot": "/Cards/07-detective_poirot.png",
  "Miss Marple": "/Cards/08-detective_marple.png",
  "Mr Sattertwhaite": "/Cards/09-detective_satterhwaite.png",
  "Parker Pyne": "/Cards/10-detective_pyne.png",
  "Lady Eileen Brent": "/Cards/11-detective_brent.png",
  "Tommy Beresford": "/Cards/12-detective_tommyberesford.png",
};

const sixCards = [
  { id: "P07", name: "Hercule Poirot" },
  { id: "M08", name: "Miss Marple" },
  { id: "S09", name: "Mr Sattertwhaite" },
  { id: "P10", name: "Parker Pyne" },
  { id: "B11", name: "Lady Eileen Brent" },
  { id: "T12", name: "Tommy Beresford" },
];

describe("ViewMyCards.jsx", () => {
  it("renders the trigger button (named by inner <img> alt)", () => {
    render(<ViewMyCards cards={sixCards} />);
    const trigger = screen.getByRole("button", { name: /zoomviewicon/i });
    expect(trigger).toBeInTheDocument();
  });

  it("opens the modal and renders all 6 cards with correct src and alt", () => {
    render(<ViewMyCards cards={sixCards} />);

    fireEvent.click(screen.getByRole("button", { name: /zoomviewicon/i }));

    sixCards.forEach(({ id, name }) => {
      const img = screen.getByAltText(`card ${id}`);
      expect(img).toBeInTheDocument();
      expect(img.getAttribute("src")).toBe(EXPECTED_SRC[name]);
    });

    expect(document.body.classList.contains("active-viewmycards")).toBe(true);
  });

  it("closes the modal via the 'X' button", () => {
    render(<ViewMyCards cards={sixCards} />);
    fireEvent.click(screen.getByRole("button", { name: /zoomviewicon/i }));

    expect(screen.getByAltText("card P07")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "X" }));
    expect(screen.queryByAltText("card P07")).not.toBeInTheDocument();
    expect(document.body.classList.contains("active-viewmycards")).toBe(false);
  });

  it("closes the modal by clicking the overlay", () => {
    render(<ViewMyCards cards={sixCards} />);
    fireEvent.click(screen.getByRole("button", { name: /zoomviewicon/i }));

    const overlay = document.querySelector(".overlay");
    expect(overlay).toBeTruthy();

    fireEvent.click(overlay);
    expect(screen.queryByAltText("card P07")).not.toBeInTheDocument();
    expect(document.body.classList.contains("active-viewmycards")).toBe(false);
  });

  it("shows the 'Out of cards!' message when cards is an empty array", () => {
    render(<ViewMyCards cards={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /zoomviewicon/i }));
    expect(screen.getByText(/Out of cards!/i)).toBeInTheDocument();
  });

  it("throws when there are 7 or more cards", () => {
    const seven = [...sixCards, { id: "X13", name: "Hercule Poirot" }];
    expect(() => render(<ViewMyCards cards={seven} />)).toThrow();
  });

  it("throws when cards is not an array", () => {
    expect(() => render(<ViewMyCards cards={"nope"} />)).toThrow();
  });

  it("throws when an item is missing 'name'", () => {
    const bad = [{ id: "P07" }];
    expect(() => render(<ViewMyCards cards={bad} />)).toThrow();
  });

  it("throws when 'name' is not present in CARDS_MAP", () => {
    const bad = [{ id: "X00", name: "Unknown Card" }];
    expect(() => render(<ViewMyCards cards={bad} />)).toThrow();
  });

  it("throws when cards is undefined (no prop passed)", () => {
    expect(() => render(<ViewMyCards />)).toThrow();
  });

  it("does not require 'id' to validate; still renders image (alt will contain 'undefined')", () => {
    const oneNoId = [{ name: "Hercule Poirot" }];
    render(<ViewMyCards cards={oneNoId} />);
    fireEvent.click(screen.getByRole("button", { name: /zoomviewicon/i }));
    const img = screen.getByRole("img", { name: /card/i });
    expect(img).toHaveAttribute("src", EXPECTED_SRC["Hercule Poirot"]);
  });

  it("toggles body class on open/close using the trigger button", () => {
    render(<ViewMyCards cards={sixCards} />);
    const trigger = screen.getByRole("button", { name: /zoomviewicon/i });

    fireEvent.click(trigger);
    expect(document.body.classList.contains("active-viewmycards")).toBe(true);

    fireEvent.click(trigger);
    expect(document.body.classList.contains("active-viewmycards")).toBe(false);
  });
});
