import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
} from "@testing-library/react";
import "@testing-library/jest-dom";

import GameOwnMatchesList from "./GameOwnMatchesList";

// ---- Mocks ----
const navigateMock = vi.fn();

// Mock only what component uses: useNavigate
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

// Mock cookie util: component imports from "../../utils/cookies"
vi.mock("../../utils/cookies", () => ({
  getCookie: vi.fn(),
}));
import { getCookie } from "../../utils/cookies";

beforeEach(() => {
  vi.clearAllMocks();
  cleanup();
  // default fetch mock
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => [
      // Only id 1 is in progress; id 2 waiting
      {
        gameId: 1,
        gameName: "Room A",
        ownerName: "Ana",
        minPlayers: 3,
        maxPlayers: 6,
        actualPlayers: 4,
        gameStatus: "inProgress",
      },
      {
        gameId: 2,
        gameName: "Room B",
        ownerName: "Bob",
        minPlayers: 3,
        maxPlayers: 6,
        actualPlayers: 5,
        gameStatus: "waiting",
      },
    ],
  });
});

describe("GameOwnMatchesList", () => {
  it("renders filtered games (only own + inProgress) and navigates with playerId", async () => {
    // Cookie says: own games are (1 -> player 5) and (99 -> player 7)
    getCookie.mockReturnValue(
      JSON.stringify([
        { gameId: 1, playerId: 5 },
        { gameId: 99, playerId: 7 },
      ])
    );

    render(<GameOwnMatchesList />);

    // Wait until not loading and card is rendered
    await waitFor(() => {
      expect(screen.getByText("My active games")).toBeInTheDocument();
      expect(screen.getByText("Room A")).toBeInTheDocument();
    });

    // Should not show Room B (waiting)
    expect(screen.queryByText("Room B")).toBeNull();

    // Button present and enabled
    const btn = screen.getByRole("button", { name: /resume game/i });
    expect(btn).toBeInTheDocument();

    // Click => navigate with pid from cookie
    fireEvent.click(btn);
    expect(navigateMock).toHaveBeenCalledWith("/game/1?playerId=5");
  });

  it("shows empty state when cookie doesn't match any in-progress game", async () => {
    // Cookie includes id 99 only; API returns 1 & 2
    getCookie.mockReturnValue(JSON.stringify([{ gameId: 99, playerId: 1 }]));

    render(<GameOwnMatchesList />);

    await waitFor(() => {
      expect(screen.getByText(/you have no active games/i)).toBeInTheDocument();
    });
  });

  it("Refresh button triggers another fetch", async () => {
    getCookie.mockReturnValue(JSON.stringify([{ gameId: 1, playerId: 5 }]));

    render(<GameOwnMatchesList />);

    // Initial load
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    // Click refresh
    const refresh = screen.getByRole("button", { name: /refresh/i });
    fireEvent.click(refresh);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });
});
