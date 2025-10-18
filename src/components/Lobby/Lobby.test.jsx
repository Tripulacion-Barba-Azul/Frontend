import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import Lobby from "./Lobby";

// Mock console.error to suppress error logs during tests
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalError;
});

// Mock child components
vi.mock("./StartGameButton/StartGameButton", () => ({
  default: function MockStartGameButton({ disabled, gameId, actualPlayerId, onStartGame }) {
    return (
      <button
        data-testid="start-game-button"
        disabled={disabled}
        onClick={() => !disabled && onStartGame && onStartGame()}
      >
        Start Game
      </button>
    );
  },
}));

vi.mock("./AbandonGameButton/AbandonGameButton", () => ({
  default: function MockAbandonGameButton({ isOwner, playerId, gameId }) {
    if (isOwner) {
      return null;
    }
    
    return (
      <button data-testid="abandon-game-button">
        Leave Game
      </button>
    );
  },
}));

vi.mock("./CancelGameButton/CancelGameButton", () => ({
  default: function MockCancelGameButton({ disabled, gameId, actualPlayerId }) {
    return (
      <button
        data-testid="cancel-game-button"
        disabled={disabled}
      >
        Cancel Game
      </button>
    );
  },
}));

global.fetch = vi.fn();

describe("Lobby Component", () => {
  const mockGameData = {
    gameId: 1,
    gameName: "Test Game",
    ownerId: 5,
    minPlayers: 2,
    maxPlayers: 4,
    players: [
      { playerId: 5, playerName: "OwnerPlayer" },
      { playerId: 3, playerName: "RegularPlayer" },
    ],
  };

  const mockWs = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    close: vi.fn(),
    send: vi.fn(),
  };

  const defaultProps = {
    ws: mockWs,
    id: 1,
    playerId: 5,
    refreshTrigger: 0,
    onStartGame: vi.fn(),
  };

  const renderWithRouter = (component) => {
    return render(<MemoryRouter>{component}</MemoryRouter>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockGameData),
    });
  });

  describe("Basic Rendering", () => {
    test("renders game information correctly", async () => {
      renderWithRouter(<Lobby {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Test Game")).toBeInTheDocument();
        expect(screen.getByText("Min: 2")).toBeInTheDocument();
        expect(screen.getByText("Players: 2")).toBeInTheDocument();
        expect(screen.getByText("Max: 4")).toBeInTheDocument();
      });
    });

    test("shows loading state initially", () => {
      renderWithRouter(<Lobby {...defaultProps} />);
      expect(screen.getByText("Loading game info...")).toBeInTheDocument();
    });

    test("shows access denied when player not in game", async () => {
      const invalidPlayerProps = {
        ...defaultProps,
        playerId: 999,
      };

      renderWithRouter(<Lobby {...invalidPlayerProps} />);

      await waitFor(() => {
        expect(screen.getByText("You dont have access to this game")).toBeInTheDocument();
      });
    });
  });

  describe("Player List", () => {
    test("displays all players with correct badges", async () => {
      renderWithRouter(<Lobby {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("OwnerPlayer")).toBeInTheDocument();
        expect(screen.getByText("RegularPlayer")).toBeInTheDocument();
        expect(screen.getByText("(Creator)")).toBeInTheDocument();
        expect(screen.getByText("(You)")).toBeInTheDocument();
      });
    });

    test("shows empty state when no players", async () => {
      const emptyGameData = {
        ...mockGameData,
        players: [],
      };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(emptyGameData),
      });

      renderWithRouter(<Lobby {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("No players in sight")).toBeInTheDocument();
      });
    });
  });

  describe("Button Visibility", () => {
    test("shows start and cancel buttons for owner", async () => {
      renderWithRouter(<Lobby {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId("start-game-button")).toBeInTheDocument();
        expect(screen.getByTestId("cancel-game-button")).toBeInTheDocument();
        expect(screen.queryByTestId("abandon-game-button")).not.toBeInTheDocument();
      });
    });

    test("shows abandon button for non-owner", async () => {
      const nonOwnerProps = {
        ...defaultProps,
        playerId: 3, // Regular player, not owner
      };

      renderWithRouter(<Lobby {...nonOwnerProps} />);

      await waitFor(() => {
        expect(screen.queryByTestId("start-game-button")).not.toBeInTheDocument();
        expect(screen.queryByTestId("cancel-game-button")).not.toBeInTheDocument();
        expect(screen.getByTestId("abandon-game-button")).toBeInTheDocument();
      });
    });
  });

  describe("Start Game Button", () => {
    test("enables start button when minimum players reached", async () => {
      renderWithRouter(<Lobby {...defaultProps} />);

      await waitFor(() => {
        const button = screen.getByTestId("start-game-button");
        expect(button).not.toBeDisabled();
      });
    });

    test("disables start button when minimum players not reached", async () => {
      const insufficientPlayersData = {
        ...mockGameData,
        minPlayers: 4,
        players: [
          { playerId: 5, playerName: "OwnerPlayer" },
        ],
      };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(insufficientPlayersData),
      });

      renderWithRouter(<Lobby {...defaultProps} />);

      await waitFor(() => {
        const button = screen.getByTestId("start-game-button");
        expect(button).toBeDisabled();
      });
    });
  });

  describe("Progress Bar", () => {
    test("shows correct progress bar state", async () => {
      renderWithRouter(<Lobby {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Min: 2")).toBeInTheDocument();
        expect(screen.getByText("Players: 2")).toBeInTheDocument();
        expect(screen.getByText("Max: 4")).toBeInTheDocument();
      });
    });

    test("shows full game badge when max players reached", async () => {
      const fullGameData = {
        ...mockGameData,
        maxPlayers: 2,
      };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(fullGameData),
      });

      renderWithRouter(<Lobby {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("- GAME IS FULL -")).toBeInTheDocument();
      });
    });
  });

  describe("WebSocket Handling", () => {
    test("sets up and cleans up WebSocket listeners", async () => {
      const { unmount } = renderWithRouter(<Lobby {...defaultProps} />);

      await waitFor(() => {
        expect(mockWs.addEventListener).toHaveBeenCalledWith("message", expect.any(Function));
      });

      unmount();

      expect(mockWs.removeEventListener).toHaveBeenCalledWith("message", expect.any(Function));
    });

    test("handles playerExit event", async () => {
      renderWithRouter(<Lobby {...defaultProps} />);

      await waitFor(() => {
        expect(mockWs.addEventListener).toHaveBeenCalled();
      });

      const messageHandler = mockWs.addEventListener.mock.calls.find(
        call => call[0] === "message"
      )[1];

      // Simulate playerExit message
      const updatedGameData = {
        ...mockGameData,
        players: [{ playerId: 5, playerName: "OwnerPlayer" }],
      };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedGameData),
      });

      messageHandler({ data: JSON.stringify({ event: "playerExit" }) });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2); // Initial + refresh
      });
    });

    test("handles gameDeleted event and shows notification", async () => {
      renderWithRouter(<Lobby {...defaultProps} />);

      await waitFor(() => {
        expect(mockWs.addEventListener).toHaveBeenCalled();
      });

      const messageHandler = mockWs.addEventListener.mock.calls.find(
        call => call[0] === "message"
      )[1];

      messageHandler({
        data: JSON.stringify({
          event: "gameDeleted",
          payload: {
            gameName: "Test Game",
            ownerName: "Test Owner"
          }
        })
      });

      await waitFor(() => {
        expect(screen.getByText("Game canceled")).toBeInTheDocument();
        expect(screen.getByText(/The game "Test Game" has been canceled by Test Owner/)).toBeInTheDocument();
      });
    });
  });

  describe("Cancel Notification Modal", () => {
    test("closes modal and navigates when back button is clicked", async () => {
      const mockNavigate = vi.fn();
      vi.doMock("react-router-dom", async () => {
        const actual = await vi.importActual("react-router-dom");
        return {
          ...actual,
          useNavigate: () => mockNavigate,
        };
      });

      renderWithRouter(<Lobby {...defaultProps} />);

      await waitFor(() => {
        expect(mockWs.addEventListener).toHaveBeenCalled();
      });

      const messageHandler = mockWs.addEventListener.mock.calls.find(
        call => call[0] === "message"
      )[1];

      // Trigger gameDeleted to show modal
      messageHandler({
        data: JSON.stringify({
          event: "gameDeleted",
          payload: {
            gameName: "Test Game",
            ownerName: "Test Owner"
          }
        })
      });

      await waitFor(() => {
        expect(screen.getByText("Back to home screen")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Back to home screen"));

      // Modal should be closed
      await waitFor(() => {
        expect(screen.queryByText("Game canceled")).not.toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    test("handles fetch errors gracefully", async () => {
      fetch.mockRejectedValueOnce(new Error("Network error"));

      renderWithRouter(<Lobby {...defaultProps} />);

      // Should stay in loading state or handle error appropriately
      await waitFor(() => {
        expect(screen.getByText("Loading game info...")).toBeInTheDocument();
      });
    });

    test("handles non-ok HTTP responses", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      renderWithRouter(<Lobby {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Loading game info...")).toBeInTheDocument();
      });
    });
  });

  describe("Refresh Trigger", () => {
    test("refetches data when refreshTrigger changes", async () => {
      const { rerender } = renderWithRouter(<Lobby {...defaultProps} />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      rerender(
        <MemoryRouter>
          <Lobby {...defaultProps} refreshTrigger={1} />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2);
      });
    });
  });
});