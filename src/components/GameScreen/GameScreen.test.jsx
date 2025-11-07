import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import {
  render,
  screen,
  act,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import { useParams, useSearchParams } from "react-router-dom";
import GameScreen from "./GameScreen";

/* ---------------------- Router mocks ---------------------- */
vi.mock("react-router-dom", () => ({
  useParams: vi.fn(),
  useSearchParams: vi.fn(),
}));

/* ---------------------- Child component mocks ---------------------- */
// Expose refreshTrigger so we can assert player_joined bumps it
vi.mock("../Lobby/Lobby", () => ({
  default: ({ isConnected, refreshTrigger }) => (
    <div data-testid="lobby">
      Lobby - Connected: {String(isConnected)} - Refresh:{" "}
      {String(refreshTrigger)}
    </div>
  ),
}));

vi.mock("./Sync/SyncOrchestrator", () => ({
  default: ({ publicData, privateData, currentPlayerId }) => (
    <div data-testid="sync-orchestrator">
      Sync - Player: {currentPlayerId}, Public: {publicData ? "yes" : "no"},
      Private: {privateData ? "yes" : "no"}
    </div>
  ),
}));

vi.mock("./GameEndScreen/GameEndSreen", () => ({
  default: () => <div data-testid="game-end-screen">Game End Screen</div>,
}));

vi.mock("./Events/Notifier/Notifier", () => ({
  default: () => <div data-testid="notifier">Notifier</div>,
}));

vi.mock("./Events/EffectManager/EffectManager", () => ({
  default: () => <div data-testid="effect-manager">EffectManager</div>,
}));

// Presentation with a button that triggers close(true)
vi.mock("./PresentationScreen/PresentationScreen", () => ({
  default: ({ close }) => (
    <div data-testid="presentation-screen">
      Presentation
      <button onClick={() => close?.(true)} aria-label="finish-presentation">
        finish
      </button>
    </div>
  ),
}));

// Background music mounted whenever gameDataReady=true
vi.mock("./BackgroundMusicPlayer/BackgroundMusicPlayer", () => ({
  default: () => <div data-testid="bgm">BGM</div>,
}));

// NEW: Chat is global when connected + data ready
vi.mock("./Chat/Chat", () => ({
  default: () => <div data-testid="chat">Chat</div>,
}));

// NEW: Clock appears only after gamePresented=true
vi.mock("./Clock/Clock", () => ({
  default: () => <div data-testid="clock">Clock</div>,
}));

/* ---------------------- Minimal WebSocket mock ---------------------- */
const createMockWebSocket = () => ({
  close: vi.fn(),
  send: vi.fn(),
  onopen: null,
  onclose: null,
  onerror: null,
  onmessage: null,
  readyState: 1,
});

let mockWebSocket;

describe("GameScreen (updated)", () => {
  const mockGameId = "123";
  const mockPlayerId = "456";

  beforeEach(() => {
    vi.clearAllMocks();

    // Router stubs
    useParams.mockReturnValue({ gameId: mockGameId });
    useSearchParams.mockReturnValue([
      new URLSearchParams(`playerId=${mockPlayerId}`),
    ]);

    // WebSocket stub per test
    mockWebSocket = createMockWebSocket();
    global.WebSocket = vi.fn(() => mockWebSocket);
  });

  it("initially renders Lobby and NOT the WS-dependent components", () => {
    render(<GameScreen />);

    expect(screen.getByTestId("lobby")).toBeInTheDocument();
    expect(screen.queryByTestId("game-end-screen")).not.toBeInTheDocument();
    expect(screen.queryByTestId("notifier")).not.toBeInTheDocument();
    expect(screen.queryByTestId("effect-manager")).not.toBeInTheDocument();
    expect(screen.queryByTestId("chat")).not.toBeInTheDocument();
    expect(screen.queryByTestId("clock")).not.toBeInTheDocument();
    // BGM should not render until gameDataReady is true
    expect(screen.queryByTestId("bgm")).not.toBeInTheDocument();
  });

  it("creates a WebSocket connection on mount", () => {
    render(<GameScreen />);
    expect(WebSocket).toHaveBeenCalledWith(
      `ws://localhost:8000/ws/${mockGameId}/${mockPlayerId}`
    );
  });

  it("does not create a WebSocket when gameId is missing", () => {
    useParams.mockReturnValue({ gameId: undefined });
    render(<GameScreen />);
    expect(WebSocket).not.toHaveBeenCalled();
  });

  it("handles onopen by marking Lobby as connected", () => {
    render(<GameScreen />);
    act(() => {
      mockWebSocket.onopen?.();
    });
    expect(screen.getByText(/Lobby - Connected: true/i)).toBeInTheDocument();
  });

  it("handles onclose by marking disconnected and hides WS-dependent components", async () => {
    render(<GameScreen />);
    act(() => {
      mockWebSocket.onopen?.();
    });

    // Feed game data to reach gameDataReady
    act(() => {
      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          event: "publicUpdate",
          payload: {
            gameStatus: "in_progress",
            players: [{ id: Number(mockPlayerId), name: "Me", avatar: 1 }],
          },
        }),
      });
      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          event: "privateUpdate",
          payload: { role: "detective", ally: null },
        }),
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("presentation-screen")).toBeInTheDocument();
      expect(screen.getByTestId("bgm")).toBeInTheDocument();
      expect(screen.getByTestId("notifier")).toBeInTheDocument();
      expect(screen.getByTestId("effect-manager")).toBeInTheDocument();
      expect(screen.getByTestId("chat")).toBeInTheDocument();
    });

    // Close the connection
    act(() => {
      mockWebSocket.onclose?.();
    });

    await waitFor(() => {
      expect(screen.queryByTestId("notifier")).not.toBeInTheDocument();
      expect(screen.queryByTestId("effect-manager")).not.toBeInTheDocument();
      expect(screen.queryByTestId("chat")).not.toBeInTheDocument();
      // Presentation and BGM are tied to data readiness, but global systems are connection-bound
    });
  });

  it("handles onerror by logging and setting disconnected (does not close explicitly)", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<GameScreen />);

    act(() => {
      mockWebSocket.onopen?.();
    });
    expect(screen.getByText(/Lobby - Connected: true/i)).toBeInTheDocument();

    act(() => {
      mockWebSocket.onerror?.(new Event("error"));
    });
    expect(screen.getByText(/Lobby - Connected: false/i)).toBeInTheDocument();
    expect(mockWebSocket.close).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("handles publicUpdate and stays in Lobby if private/started are missing", () => {
    render(<GameScreen />);
    act(() => {
      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          event: "publicUpdate",
          payload: { gameStatus: "waiting", players: [] },
        }),
      });
    });
    expect(screen.getByTestId("lobby")).toBeInTheDocument();
    expect(screen.queryByTestId("presentation-screen")).not.toBeInTheDocument();
    expect(screen.queryByTestId("bgm")).not.toBeInTheDocument();
  });

  it("handles privateUpdate and stays in Lobby if public/started are missing", () => {
    render(<GameScreen />);
    act(() => {
      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          event: "privateUpdate",
          payload: { role: "detective", ally: null },
        }),
      });
    });
    expect(screen.getByTestId("lobby")).toBeInTheDocument();
    expect(screen.queryByTestId("bgm")).not.toBeInTheDocument();
  });

  it("bumps Lobby refreshTrigger when player_joined arrives", () => {
    render(<GameScreen />);
    // First render should show Refresh: 0
    expect(screen.getByText(/Refresh: 0/i)).toBeInTheDocument();

    act(() => {
      mockWebSocket.onmessage?.({
        data: JSON.stringify({ event: "player_joined" }),
      });
    });

    // After bump, it should re-render with Refresh: 1
    expect(screen.getByText(/Refresh: 1/i)).toBeInTheDocument();
  });

  it("handles gameStarted alone and keeps Lobby until public/private exist", () => {
    render(<GameScreen />);
    act(() => {
      mockWebSocket.onmessage?.({
        data: JSON.stringify({ event: "gameStarted" }),
      });
    });
    expect(screen.getByTestId("lobby")).toBeInTheDocument();
    expect(screen.queryByTestId("bgm")).not.toBeInTheDocument();
  });

  it("logs unknown events without crashing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<GameScreen />);
    act(() => {
      mockWebSocket.onmessage?.({
        data: JSON.stringify({ event: "unknownEvent", payload: { x: 1 } }),
      });
    });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("with public(in_progress) + private -> shows Presentation + BGM + global systems; then Sync + Clock after close()", async () => {
    render(<GameScreen />);

    act(() => {
      mockWebSocket.onopen?.();
    });

    // Provide both snapshots and in-progress status
    act(() => {
      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          event: "publicUpdate",
          payload: {
            gameStatus: "in_progress",
            players: [
              {
                id: Number(mockPlayerId),
                name: "Me",
                avatar: 1,
                turnStatus: "playing",
              },
              { id: 999, name: "Ally", avatar: 2, turnStatus: "waiting" },
            ],
          },
        }),
      });
      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          event: "privateUpdate",
          payload: { role: "detective", ally: null },
        }),
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("presentation-screen")).toBeInTheDocument();
      expect(screen.getByTestId("bgm")).toBeInTheDocument();
      expect(screen.getByTestId("notifier")).toBeInTheDocument();
      expect(screen.getByTestId("effect-manager")).toBeInTheDocument();
      expect(screen.getByTestId("chat")).toBeInTheDocument();
      // Clock must NOT be visible before closing the presentation
      expect(screen.queryByTestId("clock")).not.toBeInTheDocument();
    });

    // Close presentation -> Sync appears; BGM stays; Clock now mounts
    fireEvent.click(screen.getByLabelText("finish-presentation"));

    await waitFor(() => {
      expect(screen.getByTestId("sync-orchestrator")).toBeInTheDocument();
      expect(screen.getByTestId("bgm")).toBeInTheDocument();
      expect(screen.getByTestId("clock")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Sync - Player: 456, Public: yes, Private: yes")
    ).toBeInTheDocument();
  });

  it('also sets started when publicUpdate has gameStatus "inProgress" (camelCase)', async () => {
    render(<GameScreen />);

    act(() => {
      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          event: "publicUpdate",
          payload: {
            gameStatus: "inProgress",
            players: [
              {
                id: Number(mockPlayerId),
                name: "Me",
                avatar: 1,
                turnStatus: "playing",
              },
            ],
          },
        }),
      });
      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          event: "privateUpdate",
          payload: { role: "detective", ally: null },
        }),
      });
    });

    await waitFor(() =>
      expect(screen.getByTestId("presentation-screen")).toBeInTheDocument()
    );
    expect(screen.getByTestId("bgm")).toBeInTheDocument();
  });

  it("with public(waiting) + private + gameStarted -> shows Presentation; after close -> Sync; BGM stays mounted", async () => {
    render(<GameScreen />);

    act(() => {
      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          event: "publicUpdate",
          payload: {
            gameStatus: "waiting",
            players: [
              {
                id: Number(mockPlayerId),
                name: "Me",
                avatar: 1,
                turnStatus: "playing",
              },
              { id: 999, name: "Ally", avatar: 2, turnStatus: "waiting" },
            ],
          },
        }),
      });
      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          event: "privateUpdate",
          payload: { role: "detective", ally: null },
        }),
      });
      mockWebSocket.onmessage?.({
        data: JSON.stringify({ event: "gameStarted" }),
      });
    });

    await waitFor(() =>
      expect(screen.getByTestId("presentation-screen")).toBeInTheDocument()
    );
    expect(screen.getByTestId("bgm")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("finish-presentation"));

    await waitFor(() =>
      expect(screen.getByTestId("sync-orchestrator")).toBeInTheDocument()
    );
    expect(screen.getByTestId("bgm")).toBeInTheDocument();
  });

  it("closes the WebSocket on unmount", () => {
    const { unmount } = render(<GameScreen />);
    unmount();
    expect(mockWebSocket.close).toHaveBeenCalled();
  });
});
