import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import DiscardButton from "./DiscardButton.jsx";

// Helper to render with routing and props
const setup = ({
  selectedCards = [],
  handSize = 0,
  onDiscardSuccess = vi.fn(),
  route = "/game/123?playerId=7",
  requireAtLeastOne = false,
  requireExactlyOne = false,
} = {}) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route
          path="/game/:gameId"
          element={
            <DiscardButton
              selectedCards={selectedCards}
              handSize={handSize}
              onDiscardSuccess={onDiscardSuccess}
              requireAtLeastOne={requireAtLeastOne}
              requireExactlyOne={requireExactlyOne}
            />
          }
        />
      </Routes>
    </MemoryRouter>
  );
};

describe("DiscardButton.jsx (updated)", () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("renders the button with the current selection count", () => {
    setup({ selectedCards: [8, 9] });
    const btn = screen.getByRole("button", { name: /Discard \(2\)/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it("shows validation error when requireAtLeastOne=true and no cards selected", async () => {
    global.fetch = vi.fn(); // should NOT be called
    setup({ selectedCards: [], requireAtLeastOne: true });

    const btn = screen.getByRole("button", { name: /Discard \(0\)/i });
    fireEvent.click(btn);

    const error = await screen.findByText(
      "You must discard at least one card!"
    );
    expect(error).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error when requireExactlyOne=true and zero selected", async () => {
    global.fetch = vi.fn(); // should NOT be called
    setup({ selectedCards: [], requireExactlyOne: true });

    const btn = screen.getByRole("button", { name: /Discard \(0\)/i });
    fireEvent.click(btn);

    const error = await screen.findByText("You must discard exactly one card!");
    expect(error).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error when requireExactlyOne=true and more than one selected", async () => {
    global.fetch = vi.fn(); // should NOT be called
    setup({ selectedCards: [1, 2], requireExactlyOne: true });

    const btn = screen.getByRole("button", { name: /Discard \(2\)/i });
    fireEvent.click(btn);

    const error = await screen.findByText("You must discard exactly one card!");
    expect(error).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("allows optional discard with zero selected when no requirements are set", async () => {
    const onSuccess = vi.fn();
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    );

    setup({
      selectedCards: [],
      handSize: 6,
      onDiscardSuccess: onSuccess,
      requireAtLeastOne: false,
      requireExactlyOne: false,
    });

    const btn = screen.getByRole("button", { name: /Discard \(0\)/i });
    fireEvent.click(btn);

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/play/123/actions/discard",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: 7, cards: [] }),
      })
    );
  });

  it("sends request and calls onDiscardSuccess on success (requireExactlyOne=true, 1 selected)", async () => {
    const onSuccess = vi.fn();
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    );

    setup({
      selectedCards: [10],
      handSize: 6,
      onDiscardSuccess: onSuccess,
      requireExactlyOne: true,
    });

    const btn = screen.getByRole("button", { name: /Discard \(1\)/i });
    fireEvent.click(btn);

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/play/123/actions/discard",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: 7, cards: [10] }),
      })
    );
  });

  it("shows error if fetch fails (non-OK response)", async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 500 }));
    setup({ selectedCards: [10], handSize: 6, requireAtLeastOne: true });

    const btn = screen.getByRole("button", { name: /Discard \(1\)/i });
    fireEvent.click(btn);

    const error = await screen.findByText("Failed to discard");
    expect(error).toBeInTheDocument();
  });

  it("disables the button and shows loading text while request is pending", async () => {
    let resolveFetch;
    global.fetch = vi.fn(
      () =>
        new Promise((res) => {
          resolveFetch = res;
        })
    );

    setup({ selectedCards: [11], handSize: 6, requireAtLeastOne: true });
    const btn = screen.getByRole("button", { name: /Discard \(1\)/i });

    fireEvent.click(btn);
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent("Discarding...");

    // Finish the request
    resolveFetch({ ok: true, json: () => Promise.resolve({}) });
    await waitFor(() => expect(btn).not.toBeDisabled());
    expect(btn).toHaveTextContent("Discard (1)");
  });
});
