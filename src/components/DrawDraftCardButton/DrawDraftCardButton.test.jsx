import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import DrawDraftCardButton from "./DrawDraftCardButton";

// Mock fetch
global.fetch = vi.fn();

// Mock router hooks
const mockUseParams = vi.fn();
const mockUseSearchParams = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => mockUseParams(),
    useSearchParams: () => mockUseSearchParams(),
  };
});

// Mock generalMaps
vi.mock("../generalMaps.js", () => ({
  CARDS_MAP: {
    "Hercule Poirot": "/Cards/07-detective_poirot.png",
    "Miss Marple": "/Cards/08-detective_marple.png",
    "Parker Pyne": "/Cards/10-detective_pyne.png",
    "Test Card": "/Cards/test-card.png",
  },
}));

describe("DrawDraftCardButton", () => {
  beforeEach(() => {
    fetch.mockClear();
    mockUseParams.mockReturnValue({ gameId: "123" });
    mockUseSearchParams.mockReturnValue([new URLSearchParams("playerId=1")]);
  });

  const defaultCards = [
    { id: 1, name: "Hercule Poirot" },
    { id: 2, name: "Miss Marple" },
    { id: 3, name: "Parker Pyne" },
  ];

  test("returns null when no cards are provided", () => {
    const { container } = render(<DrawDraftCardButton cards={[]} turnStatus="drawing" />);
    expect(container.firstChild).toBeNull();
  });

  test("returns null when cards is undefined", () => {
    const { container } = render(<DrawDraftCardButton cards={undefined} turnStatus="drawing" />);
    expect(container.firstChild).toBeNull();
  });

  test("renders cards when cards array is provided", () => {
    render(<DrawDraftCardButton cards={defaultCards} turnStatus="drawing" />);
    
    expect(screen.getByAltText("Draft Card Hercule Poirot")).toBeInTheDocument();
    expect(screen.getByAltText("Draft Card Miss Marple")).toBeInTheDocument();
    expect(screen.getByAltText("Draft Card Parker Pyne")).toBeInTheDocument();
  });

  test("cards are enabled when turnStatus is 'drawing'", () => {
    render(<DrawDraftCardButton cards={defaultCards} turnStatus="drawing" />);
    
    const card = screen.getByAltText("Draft Card Hercule Poirot");
    expect(card).toHaveClass("draft-card--enabled");
    expect(card).not.toHaveClass("draft-card--disabled");
  });

  test("cards are disabled when turnStatus is not 'drawing'", () => {
    render(<DrawDraftCardButton cards={defaultCards} turnStatus="waiting" />);
    
    const card = screen.getByAltText("Draft Card Hercule Poirot");
    expect(card).toHaveClass("draft-card--disabled");
    expect(card).not.toHaveClass("draft-card--enabled");
  });

  test("makes API call when enabled card is clicked", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<DrawDraftCardButton cards={defaultCards} turnStatus="drawing" />);
    
    const card = screen.getByAltText("Draft Card Hercule Poirot");
    fireEvent.click(card);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "https://dotc-production.up.railway.app/play/123/actions/draw-card",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId: 1, deck: "draft", order: 1 }),
        }
      );
    });
  });

  test("does not make API call when disabled card is clicked", async () => {
    render(<DrawDraftCardButton cards={defaultCards} turnStatus="waiting" />);
    
    const card = screen.getByAltText("Draft Card Hercule Poirot");
    fireEvent.click(card);

    // Wait a bit to ensure no fetch call is made
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(fetch).not.toHaveBeenCalled();
  });

  test("handles API error gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
    });

    render(<DrawDraftCardButton cards={defaultCards} turnStatus="drawing" />);
    
    const card = screen.getByAltText("Draft Card Hercule Poirot");
    fireEvent.click(card);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText("Failed to draw")).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  test("prevents multiple clicks while loading", async () => {
    fetch.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve({
        ok: true,
        json: async () => ({})
      }), 100);
    }));

    render(<DrawDraftCardButton cards={defaultCards} turnStatus="drawing" />);
    
    const card = screen.getByAltText("Draft Card Hercule Poirot");
    
    // Click multiple times quickly
    fireEvent.click(card);
    fireEvent.click(card);
    fireEvent.click(card);

    await waitFor(() => {
      // Should only have been called once due to loading state
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  test("renders error message when API fails", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<DrawDraftCardButton cards={defaultCards} turnStatus="drawing" />);
    
    const card = screen.getByAltText("Draft Card Hercule Poirot");
    fireEvent.click(card);

    await waitFor(() => {
      expect(screen.getByText("Failed to draw")).toBeInTheDocument();
    });

    // Error message should have correct styling class
    const errorMessage = screen.getByText("Failed to draw");
    expect(errorMessage).toHaveClass("draft-card-error");
  });

  test("clears error when making a new request", async () => {
    // First, cause an error
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<DrawDraftCardButton cards={defaultCards} turnStatus="drawing" />);
    
    const card = screen.getByAltText("Draft Card Hercule Poirot");
    fireEvent.click(card);

    await waitFor(() => {
      expect(screen.getByText("Failed to draw")).toBeInTheDocument();
    });

    // Then make a successful request
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    fireEvent.click(card);

    await waitFor(() => {
      expect(screen.queryByText("Failed to draw")).not.toBeInTheDocument();
    });
  });

  test("handles empty src gracefully for unknown cards", () => {
    const cardsWithUnknown = [
      { id: 1, name: "Unknown Card" }
    ];

    render(<DrawDraftCardButton cards={cardsWithUnknown} turnStatus="drawing" />);
    
    const card = screen.getByAltText("Draft Card Unknown Card");
    expect(card).toBeInTheDocument();
    expect(card.getAttribute("src")).toBe("");
  });
});