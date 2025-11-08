import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PlayNsfButton from "./PlayNsfButton";

// 🔧 Helper para renderizar con router y query params
function renderWithRouter(ui, { route = "/game/123?playerId=42" } = {}) {
  window.history.pushState({}, "Test page", route);
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/game/:gameId" element={ui} />
      </Routes>
    </MemoryRouter>
  );
}

describe("PlayNsfButton", () => {
  const mockOnPlaySuccess = vi.fn();
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = mockFetch;
  });

  it("renders Skip button when no cards selected", () => {
    renderWithRouter(<PlayNsfButton onPlaySuccess={mockOnPlaySuccess} />);
    const btn = screen.getByRole("button", { name: /skip/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it("renders 'Not so fast!' when one instant card is selected", () => {
    renderWithRouter(
      <PlayNsfButton
        selectedCards={[99]}
        selectedCardsMeta={[{ id: 99, name: "Not so Fast!", type: "instant" }]}
        onPlaySuccess={mockOnPlaySuccess}
      />
    );
    const btn = screen.getByRole("button", { name: /not so fast!/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it("disables button and shows error if more than one card selected", async () => {
    renderWithRouter(
      <PlayNsfButton
        selectedCards={[1, 2]}
        selectedCardsMeta={[
          { id: 1, name: "Card A", type: "instant" },
          { id: 2, name: "Card B", type: "instant" },
        ]}
      />
    );
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn.className).toMatch(/invalid/);
  });

  it("disables and shows error if selected card is not instant", async () => {
    renderWithRouter(
      <PlayNsfButton
        selectedCards={[10]}
        selectedCardsMeta={[{ id: 10, name: "Poirot", type: "detective" }]}
      />
    );
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn.className).toMatch(/invalid/);
  });

  it("sends POST to backend when skipping (0 cards)", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    renderWithRouter(<PlayNsfButton onPlaySuccess={mockOnPlaySuccess} />);
    const btn = screen.getByRole("button", { name: /skip/i });

    fireEvent.click(btn);

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("http://localhost:8000/play/123/actions/play-nsf");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({
      cardId: null,
      playerId: 42,
    }); // no cardId

    expect(mockOnPlaySuccess).toHaveBeenCalled();
  });

  it("sends POST with cardId when instant card selected", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    renderWithRouter(
      <PlayNsfButton
        selectedCards={[5]}
        selectedCardsMeta={[{ id: 5, name: "Not so Fast!", type: "instant" }]}
        onPlaySuccess={mockOnPlaySuccess}
      />
    );
    const btn = screen.getByRole("button", { name: /not so fast!/i });

    fireEvent.click(btn);
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body).toMatchObject({ cardId: 5, playerId: 42 });
    expect(mockOnPlaySuccess).toHaveBeenCalled();
  });

  it("shows error message if fetch fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    renderWithRouter(
      <PlayNsfButton
        selectedCards={[99]}
        selectedCardsMeta={[{ id: 99, name: "Not so Fast!", type: "instant" }]}
        onPlaySuccess={mockOnPlaySuccess}
      />
    );

    fireEvent.click(screen.getByRole("button"));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Failed to send");
    expect(mockOnPlaySuccess).toHaveBeenCalled(); // still called on error
  });

  it("shows loading state while sending", async () => {
    let resolveFetch;
    mockFetch.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    renderWithRouter(<PlayNsfButton />);
    const btn = screen.getByRole("button", { name: /skip/i });
    fireEvent.click(btn);

    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();

    resolveFetch({ ok: true });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /skip/i })).not.toBeDisabled()
    );
  });
});
