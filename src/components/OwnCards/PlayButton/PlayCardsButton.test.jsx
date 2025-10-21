import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import PlayCardsButton from "./PlayCardsButton.jsx";
import React from "react";
import { MemoryRouter, useParams, useSearchParams } from "react-router-dom";

// --- Mock router hooks ---
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useParams: vi.fn(),
    useSearchParams: vi.fn(),
  };
});

describe("<PlayCardsButton />", () => {
  let mockFetch;
  let mockSetSearchParams;
  let mockGetSearchParams;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Mock router params
    useParams.mockReturnValue({ gameId: "123" });

    mockGetSearchParams = vi.fn(() => "42");
    mockSetSearchParams = vi.fn();
    useSearchParams.mockReturnValue([
      { get: mockGetSearchParams },
      mockSetSearchParams,
    ]);
  });

  it("renders the button with correct count", () => {
    render(
      <MemoryRouter>
        <PlayCardsButton selectedCards={[1, 2]} />
      </MemoryRouter>
    );
    expect(screen.getByText("Play (2)")).toBeInTheDocument();
  });

  it("shows error when selecting more than 6 cards", async () => {
    render(
      <MemoryRouter>
        <PlayCardsButton selectedCards={[1, 2, 3, 4, 5, 6, 7]} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button"));
    expect(
      await screen.findByText(/something went wrong/i)
    ).toBeInTheDocument();
  });

  it("sends correct request and calls onPlaySuccess on success", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    const onPlaySuccess = vi.fn();

    render(
      <MemoryRouter>
        <PlayCardsButton
          selectedCards={[10, 20]}
          onPlaySuccess={onPlaySuccess}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "https://dotc-production.up.railway.app/play/123/actions/play-card",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: 42,
            cards: [10, 20],
          }),
        })
      );
    });

    expect(onPlaySuccess).toHaveBeenCalledTimes(1);
  });

  it("handles failed fetch and still calls onPlaySuccess", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    const onPlaySuccess = vi.fn();

    render(
      <MemoryRouter>
        <PlayCardsButton selectedCards={[5]} onPlaySuccess={onPlaySuccess} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText(/failed to play cards/i)).toBeInTheDocument();
    });

    expect(onPlaySuccess).toHaveBeenCalledTimes(1);
  });

  it("disables button while loading", async () => {
    let resolveFetch;
    mockFetch.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    render(
      <MemoryRouter>
        <PlayCardsButton selectedCards={[1]} />
      </MemoryRouter>
    );

    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    expect(btn).toBeDisabled();
    expect(btn.textContent).toMatch(/playing/i);

    // Finish fetch
    resolveFetch({ ok: true });
    await waitFor(() => expect(btn).not.toBeDisabled());
  });

  it("renders error message and clears it on next click", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network"));
    render(
      <MemoryRouter>
        <PlayCardsButton selectedCards={[3]} />
      </MemoryRouter>
    );

    const btn = screen.getByRole("button");
    fireEvent.click(btn);

    await waitFor(() =>
      expect(screen.getByText(/failed to play cards/i)).toBeInTheDocument()
    );

    // clicking again should clear error immediately
    fireEvent.click(btn);
    expect(screen.queryByText(/failed to play cards/i)).not.toBeInTheDocument();
  });
});
