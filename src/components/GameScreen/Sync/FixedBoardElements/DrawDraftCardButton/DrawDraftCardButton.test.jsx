// src/components/GameScreen/Sync/FixedBoardElements/DrawDraftCardButton/DrawDraftCardButton.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import "@testing-library/jest-dom";
import DrawDraftCardButton from "./DrawDraftCardButton";

/* ------------------------------------------------------------------ */
/* Router hooks mocks                                                  */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/* Motion mocks (disable animations to avoid rAF & teardown issues)    */
/* ------------------------------------------------------------------ */
vi.mock("framer-motion", () => {
  const React = require("react");
  const Noop = React.forwardRef(({ children, ...rest }, ref) => (
    <div ref={ref} {...rest}>
      {children}
    </div>
  ));
  return {
    // Any motion.* component becomes a plain <div>
    motion: new Proxy({}, { get: () => Noop }),
    // AnimatePresence just renders children
    AnimatePresence: ({ children }) => <>{children}</>,
  };
});

/* ------------------------------------------------------------------ */
/* Maps mock: MUST match the import path used by the component         */
/* ------------------------------------------------------------------ */
vi.mock("../../../../../utils/generalMaps", () => ({
  CARDS_MAP: {
    "Hercule Poirot": "/Cards/07-detective_poirot.png",
    "Miss Marple": "/Cards/08-detective_marple.png",
    "Parker Pyne": "/Cards/10-detective_pyne.png",
    "Test Card": "/Cards/test-card.png",
  },
}));

/* ------------------------------------------------------------------ */
/* Globals                                                             */
/* ------------------------------------------------------------------ */
describe("DrawDraftCardButton", () => {
  beforeEach(() => {
    // Fresh fetch mock for each test
    global.fetch = vi.fn();
    mockUseParams.mockReturnValue({ gameId: "123" });
    mockUseSearchParams.mockReturnValue([new URLSearchParams("playerId=1")]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const defaultCards = [
    { id: 1, name: "Hercule Poirot" },
    { id: 2, name: "Miss Marple" },
    { id: 3, name: "Parker Pyne" },
  ];

  /* ------------------------------ Rendering ------------------------------ */

  test("returns null when no cards are provided", () => {
    const { container } = render(
      <DrawDraftCardButton cards={[]} turnStatus="drawing" />
    );
    expect(container.firstChild).toBeNull();
  });

  test("returns null when cards is undefined", () => {
    const { container } = render(
      <DrawDraftCardButton cards={undefined} turnStatus="drawing" />
    );
    expect(container.firstChild).toBeNull();
  });

  test("renders cards when cards array is provided", () => {
    render(<DrawDraftCardButton cards={defaultCards} turnStatus="drawing" />);
    expect(
      screen.getByAltText("Draft Card Hercule Poirot")
    ).toBeInTheDocument();
    expect(screen.getByAltText("Draft Card Miss Marple")).toBeInTheDocument();
    expect(screen.getByAltText("Draft Card Parker Pyne")).toBeInTheDocument();
  });

  /* ------------------------------ State flags ---------------------------- */

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

  /* ------------------------------ API flow ------------------------------- */

  test("makes API call when enabled card is clicked", async () => {
    // resolve immediately; component sets loading false in finally
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(<DrawDraftCardButton cards={defaultCards} turnStatus="drawing" />);
    const card = screen.getByAltText("Draft Card Hercule Poirot");
    fireEvent.click(card);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8000/play/123/actions/draw-card",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId: 1, deck: "draft", order: 1 }),
        }
      );
    });

    // Wait until the component settles back to enabled (avoids teardown races)
    await waitFor(() => {
      expect(card).toHaveClass("draft-card--enabled");
    });
  });

  test("does not make API call when disabled card is clicked", async () => {
    render(<DrawDraftCardButton cards={defaultCards} turnStatus="waiting" />);
    const card = screen.getByAltText("Draft Card Hercule Poirot");
    fireEvent.click(card);
    // Tiny wait to ensure no side-effect occurs
    await new Promise((r) => setTimeout(r, 20));
    expect(fetch).not.toHaveBeenCalled();
  });

  test("handles API error gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    fetch.mockResolvedValueOnce({ ok: false, status: 400 });

    render(<DrawDraftCardButton cards={defaultCards} turnStatus="drawing" />);
    const card = screen.getByAltText("Draft Card Hercule Poirot");
    fireEvent.click(card);

    // Error is logged and message is shown
    await waitFor(() => expect(consoleSpy).toHaveBeenCalled());
    await waitFor(() => {
      expect(screen.getByText("Failed to draw")).toBeInTheDocument();
    });

    // Also wait for final settle back to enabled state
    await waitFor(() => {
      expect(card).toHaveClass("draft-card--enabled");
    });

    consoleSpy.mockRestore();
  });

  test("prevents multiple clicks while loading", async () => {
    // Simulate a slow network: resolves after 100ms
    fetch.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100)
        )
    );

    render(<DrawDraftCardButton cards={defaultCards} turnStatus="drawing" />);
    const card = screen.getByAltText("Draft Card Hercule Poirot");

    // Multiple clicks quickly; only one request should be sent
    fireEvent.click(card);
    fireEvent.click(card);
    fireEvent.click(card);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    // Ensure the component fully settles (loading=false → enabled)
    await waitFor(() => {
      expect(card).toHaveClass("draft-card--enabled");
    });
  });

  test("renders error message when API fails", async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 500 });

    render(<DrawDraftCardButton cards={defaultCards} turnStatus="drawing" />);
    const card = screen.getByAltText("Draft Card Hercule Poirot");
    fireEvent.click(card);

    const err = await screen.findByText("Failed to draw");
    expect(err).toHaveClass("draft-card-error");

    // Settle back to enabled to avoid async updates after teardown
    await waitFor(() => {
      expect(card).toHaveClass("draft-card--enabled");
    });
  });

  test("clears error when making a new request", async () => {
    // First: failure
    fetch.mockResolvedValueOnce({ ok: false, status: 500 });

    render(<DrawDraftCardButton cards={defaultCards} turnStatus="drawing" />);
    const card = screen.getByAltText("Draft Card Hercule Poirot");
    fireEvent.click(card);

    await screen.findByText("Failed to draw");

    // Second: success
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    fireEvent.click(card);

    await waitFor(() => {
      expect(screen.queryByText("Failed to draw")).not.toBeInTheDocument();
    });

    // Fully settle
    await waitFor(() => {
      expect(card).toHaveClass("draft-card--enabled");
    });
  });

  test("handles empty src gracefully for unknown cards", () => {
    const cardsWithUnknown = [{ id: 1, name: "Unknown Card" }];
    render(
      <DrawDraftCardButton cards={cardsWithUnknown} turnStatus="drawing" />
    );
    const card = screen.getByAltText("Draft Card Unknown Card");
    expect(card).toBeInTheDocument();
    expect(card.getAttribute("src")).toBe("");
  });
});
