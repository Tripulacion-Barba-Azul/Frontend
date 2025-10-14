import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import ViewSet from "./ViewSet.jsx";
import * as maps from "../../../generalMaps.js";

// Mock createPortal to render children normally in the DOM for testing
vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom");
  return {
    ...actual,
    createPortal: (node) => node,
  };
});

describe("ViewSet component", () => {
  const validCards = [
    { id: 1, name: "Hercule Poirot" },
    { id: 2, name: "Not so Fast!" },
  ];
  const validSetName = "Hercule Poirot";

  // Backup original console.error
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    document.body.className = "";
  });

  it("renders button with correct image from SETS_MAP", () => {
    render(<ViewSet cards={validCards} setName={validSetName} />);
    const button = screen.getByRole("button", { Name: /set hercule poirot/i });
    expect(button).toBeInTheDocument();

    const img = button.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img.src).toContain(maps.SETS_MAP[validSetName]);
  });

  it("does not render modal initially", () => {
    render(<ViewSet cards={validCards} setName={validSetName} />);
    expect(screen.queryByText("X")).toBeNull();
  });

  it("opens modal and renders cards when button clicked", () => {
    render(<ViewSet cards={validCards} setName={validSetName} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Close button
    const closeBtn = screen.getByText("X");
    expect(closeBtn).toBeInTheDocument();

    // Cards images
    validCards.forEach((card) => {
      const cardImg = screen.getByAltText(`card ${card.name}`);
      expect(cardImg).toBeInTheDocument();
      expect(cardImg.src).toContain(maps.CARDS_MAP[card.name]);
    });

    // Body class applied
    expect(document.body.classList.contains("active-viewset")).toBe(true);
  });

  it("closes modal when overlay clicked or close button clicked", () => {
    render(<ViewSet cards={validCards} setName={validSetName} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);

    const overlay = document.querySelector(".overlay");
    fireEvent.click(overlay);
    expect(document.body.classList.contains("active-viewset")).toBe(false);

    // Open again
    fireEvent.click(button);
    const closeBtn = screen.getByText("X");
    fireEvent.click(closeBtn);
    expect(document.body.classList.contains("active-viewset")).toBe(false);
  });

  it("toggles modal state when button clicked multiple times", () => {
    render(<ViewSet cards={validCards} setName={validSetName} />);
    const button = screen.getByRole("button");

    fireEvent.click(button);
    expect(document.body.classList.contains("active-viewset")).toBe(true);

    fireEvent.click(button);
    expect(document.body.classList.contains("active-viewset")).toBe(false);
  });

  it("throws error and logs console.error when invalid cards", () => {
    const invalidCards = [{ id: 1, name: "Unknown Card" }];

    expect(() =>
      render(<ViewSet cards={invalidCards} setName={validSetName} />)
    ).toThrow("Invalid props for ViewSet");
    expect(console.error).toHaveBeenCalled();
  });

  it("throws error when invalid setName", () => {
    expect(() =>
      render(<ViewSet cards={validCards} setName="Unknown Set" />)
    ).toThrow("Invalid props for ViewSet");
    expect(console.error).toHaveBeenCalled();
  });

  it("throws error when cards array is empty", () => {
    expect(() =>
      render(<ViewSet cards={[]} setName={validSetName} />)
    ).toThrow("Invalid props for ViewSet");
    expect(console.error).toHaveBeenCalled();
  });

  it("throws error when cards array length exceeds 10", () => {
    const manyCards = Array.from({ length: 11 }, (_, i) => ({
      id: i + 1,
      name: "Hercule Poirot",
    }));
    expect(() =>
      render(<ViewSet cards={manyCards} setName={validSetName} />)
    ).toThrow("Invalid props for ViewSet");
    expect(console.error).toHaveBeenCalled();
  });
});
