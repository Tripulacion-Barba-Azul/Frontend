// RegularDeck.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegularDeck from "./RegularDeck";
import { vi } from "vitest";
import * as router from "react-router-dom";

// Mock useParams and useSearchParams
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: vi.fn(),
    useSearchParams: vi.fn(),
  };
});

describe("RegularDeck Component", () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn(() => Promise.resolve({ ok: true }));
    global.fetch = fetchMock;
    router.useParams.mockReturnValue({ gameId: "42" });
    router.useSearchParams.mockReturnValue([{ get: () => "7" }]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("renders with full deck image when number >= 31", () => {
    render(<RegularDeck number={40} turnStatus="waiting" />);
    const img = screen.getByAltText(/Deck \(40 cards left\)/);
    expect(img).toBeInTheDocument();
    expect(screen.getByTestId("deck-container")).toHaveClass("full");
  });

  it("renders with half deck image when 11 <= number < 31", () => {
    render(<RegularDeck number={15} />);
    expect(screen.getByTestId("deck-container")).toHaveClass("half");
    const img = screen.getByAltText(/Deck \(15 cards left\)/);
    expect(img).toBeInTheDocument();
  });

  it("renders with thin deck image when 1 <= number < 11", () => {
    render(<RegularDeck number={5} />);
    expect(screen.getByTestId("deck-container")).toHaveClass("thin");
    const img = screen.getByAltText(/Deck \(5 cards left\)/);
    expect(img).toBeInTheDocument();
  });

  it("renders murdererEscapes image when number <= 0", () => {
    render(<RegularDeck number={0} />);
    expect(screen.getByTestId("deck-container")).toHaveClass("murderer");
    const img = screen.getByAltText(/Deck \(0 cards left\)/);
    expect(img).toBeInTheDocument();
  });

  it("displays the correct count", () => {
    render(<RegularDeck number={12} />);
    const count = screen.getByText("12");
    expect(count).toBeInTheDocument();
  });

  it("handles click when enabled (drawing phase)", async () => {
    render(<RegularDeck number={10} turnStatus="drawing" />);
    const img = screen.getByAltText(/Deck \(10 cards left\)/);
    fireEvent.click(img);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/play/42/actions/draw-card",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: 7, deck: "regular" }),
      })
    );
  });

  it("does not call fetch when disabled", () => {
    render(<RegularDeck number={0} turnStatus="drawing" />);
    const img = screen.getByAltText(/Deck \(0 cards left\)/);
    fireEvent.click(img);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows error when fetch fails", async () => {
    fetchMock.mockImplementationOnce(() => Promise.resolve({ ok: false }));
    render(<RegularDeck number={5} turnStatus="drawing" />);
    const img = screen.getByAltText(/Deck \(5 cards left\)/);
    fireEvent.click(img);

    await waitFor(() =>
      expect(screen.getByText("Failed to draw")).toBeInTheDocument()
    );
  });

  it("applies correct enabled/disabled class based on turnStatus", () => {
    const { rerender } = render(<RegularDeck number={10} turnStatus="waiting" />);
    expect(screen.getByTestId("deck-container")).toHaveClass("deck--disabled");

    rerender(<RegularDeck number={10} turnStatus="drawing" />);
    expect(screen.getByTestId("deck-container")).toHaveClass("deck--enabled");
  });
});
