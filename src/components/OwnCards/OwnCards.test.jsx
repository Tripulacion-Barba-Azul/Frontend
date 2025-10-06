import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

vi.mock("../generalMaps.js", () => ({
  CARDS_MAP: {
    "Hercule Poirot": "/Cards/07-detective_poirot.png",
    "Miss Marple": "/Cards/08-detective_marple.png",
    "Mr Sattertwhaite": "/Cards/09-detective_satterhwaite.png",
  },
}));

import OwnCards from "./OwnCards.jsx";

const renderOwn = (cards = []) => render(<OwnCards cards={cards} />);

describe("OwnCards.jsx (static, non-interactive)", () => {
  it("renders the absolute overlay with the correct aria-label", () => {
    renderOwn([]);
    const overlay = screen.getByLabelText("cards-row");
    expect(overlay).toBeInTheDocument();
    expect(overlay.className).toMatch(/owncards-overlay/);
  });

  it("renders no <img> when cards is an empty array", () => {
    renderOwn([]);
    const imgs = screen.queryAllByRole("img", { name: /Card /i });
    expect(imgs).toHaveLength(0);
  });

  it("throws when input is not an array", () => {
    expect(() => render(<OwnCards cards={"not-an-array"} />)).toThrow();
  });

  it("throws when more than 6 cards are provided", () => {
    const seven = Array.from({ length: 7 }, (_, i) => ({
      cardID: `X${i}`,
      cardName: "Hercule Poirot",
    }));
    expect(() => renderOwn(seven)).toThrow();
  });

  it("throws when an item is missing cardID", () => {
    const bad = [{ cardName: "Hercule Poirot" }];
    expect(() => renderOwn(bad)).toThrow();
  });

  it("throws when an item is missing cardName", () => {
    const bad = [{ cardID: "P07" }];
    expect(() => renderOwn(bad)).toThrow();
  });

  it("throws when cardName is not present in CARDS_MAP (new rule)", () => {
    const bad = [{ cardID: "X00", cardName: "Unknown Card" }];
    expect(() => renderOwn(bad)).toThrow();
  });

  it("throws when cardName has wrong casing (case-sensitive map)", () => {
    const bad = [{ cardID: "P07", cardName: "hercule poirot" }];
    expect(() => renderOwn(bad)).toThrow();
  });

  it("renders one <img> per valid card and uses CARDS_MAP as src", () => {
    const cards = [
      { cardID: "P07", cardName: "Hercule Poirot" },
      { cardID: "M08", cardName: "Miss Marple" },
      { cardID: "S09", cardName: "Mr Sattertwhaite" },
    ];
    renderOwn(cards);

    const imgP = screen.getByAltText("Card P07");
    const imgM = screen.getByAltText("Card M08");
    const imgS = screen.getByAltText("Card S09");

    expect(imgP).toBeInTheDocument();
    expect(imgM).toBeInTheDocument();
    expect(imgS).toBeInTheDocument();

    expect(imgP.getAttribute("src")).toBe("/Cards/07-detective_poirot.png");
    expect(imgM.getAttribute("src")).toBe("/Cards/08-detective_marple.png");
    expect(imgS.getAttribute("src")).toBe(
      "/Cards/09-detective_satterhwaite.png"
    );

    const all = screen.getAllByRole("img", { name: /Card /i });
    expect(all).toHaveLength(cards.length);
  });

  it("accepts exactly 6 cards and renders 6 images", () => {
    const six = [
      { cardID: "C1", cardName: "Hercule Poirot" },
      { cardID: "C2", cardName: "Miss Marple" },
      { cardID: "C3", cardName: "Mr Sattertwhaite" },
      { cardID: "C4", cardName: "Hercule Poirot" },
      { cardID: "C5", cardName: "Miss Marple" },
      { cardID: "C6", cardName: "Mr Sattertwhaite" },
    ];
    renderOwn(six);
    const imgs = screen.getAllByRole("img", { name: /Card /i });
    expect(imgs).toHaveLength(6);
  });

  it("marks card images as non-draggable", () => {
    const cards = [{ cardID: "P07", cardName: "Hercule Poirot" }];
    renderOwn(cards);
    const img = screen.getByAltText("Card P07");
    expect(img).toHaveAttribute("draggable", "false");
  });

  it("preserves the order of cards as provided", () => {
    const cards = [
      { cardID: "A", cardName: "Hercule Poirot" },
      { cardID: "B", cardName: "Miss Marple" },
      { cardID: "C", cardName: "Mr Sattertwhaite" },
    ];
    renderOwn(cards);
    const imgs = screen.getAllByRole("img", { name: /Card /i });
    const alts = imgs.map((img) => img.getAttribute("alt"));
    expect(alts).toEqual(["Card A", "Card B", "Card C"]);
  });
});
