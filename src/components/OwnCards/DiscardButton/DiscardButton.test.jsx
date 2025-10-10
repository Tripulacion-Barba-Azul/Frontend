import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import DiscardButton from "./DiscardButton.jsx";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// Helper to render with routing
const setup = ({ selectedCards = [], handSize = 0, onDiscardSuccess = vi.fn(), route = "/game/123?playerId=7" } = {}) => {
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
            />
          }
        />
      </Routes>
    </MemoryRouter>
  );
};

describe("DiscardButton.jsx", () => {
  let originalFetch;

  beforeEach(() => {
    document.body.innerHTML = "";
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("renders the button with correct initial text", () => {
    setup({ selectedCards: [8, 9] });
    const btn = screen.getByRole("button", { name: /Discard \(2\)/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it("shows validation error if handSize is 6 and no cards selected", async () => {
    setup({ selectedCards: [], handSize: 6 });
    const btn = screen.getByRole("button", { name: /Discard \(0\)/i });
    fireEvent.click(btn);

    const error = await screen.findByText("You must discard at least one card!");
    expect(error).toBeInTheDocument();
  });

  it("calls onDiscardSuccess after a successful fetch", async () => {
    const mockSuccess = vi.fn();
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    );

    setup({ selectedCards: [10], handSize: 6, onDiscardSuccess: mockSuccess });
    const btn = screen.getByRole("button", { name: /Discard \(1\)/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalled();
    });

    expect(global.fetch).toHaveBeenCalledWith("http://localhost:8000/play/123/actions/discard", expect.objectContaining({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({playerId: 7, cards: [10]}),
    }));
  });

  it("shows error if fetch fails", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: false, status: 500 })
    );

    setup({ selectedCards: [10], handSize: 6 });
    const btn = screen.getByRole("button", { name: /Discard \(1\)/i });
    fireEvent.click(btn);

    const error = await screen.findByText("Failed to discard");
    expect(error).toBeInTheDocument();
  });

  it("disables button and shows loading text during request", async () => {
    let resolveFetch;
    global.fetch = vi.fn(() =>
      new Promise((res) => { resolveFetch = res; })
    );

    setup({ selectedCards: [11], handSize: 6 });
    const btn = screen.getByRole("button", { name: /Discard \(1\)/i });
    fireEvent.click(btn);

    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent("Discarding...");

    // resolve fetch to finish loading
    resolveFetch({ ok: true, json: () => Promise.resolve({}) });
    await waitFor(() => expect(btn).not.toBeDisabled());
  });
});
