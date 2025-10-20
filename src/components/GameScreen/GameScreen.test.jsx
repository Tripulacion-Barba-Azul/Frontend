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
vi.mock("../Lobby/Lobby", () => ({
  default: ({ isConnected }) => (
    <div data-testid="lobby">Lobby - Connected: {String(isConnected)}</div>
  ),
}));

vi.mock("../Sync/SyncOrchestrator", () => ({
  default: ({ publicData, privateData, currentPlayerId }) => (
    <div data-testid="sync-orchestrator">
      Sync - Player: {currentPlayerId}, Public: {publicData ? "yes" : "no"},
      Private: {privateData ? "yes" : "no"}
    </div>
  ),
}));

vi.mock("../GameEndScreen/GameEndSreen", () => ({
  default: () => <div data-testid="game-end-screen">Game End Screen</div>,
}));

vi.mock("../Notifier/Notifier", () => ({
  default: () => <div data-testid="notifier">Notifier</div>,
}));

vi.mock("../EffectManager/EffectManager", () => ({
  default: () => <div data-testid="effect-manager">EffectManager</div>,
}));

// PresentationScreen with a button that triggers close(true)
vi.mock("../PresentationScreen/PresentationScreen", () => ({
  default: ({ close }) => (
    <div data-testid="presentation-screen">
      Presentation
      <button onClick={() => close?.(true)} aria-label="finish-presentation">
        finish
      </button>
    </div>
  ),
}));

// NEW: BackgroundMusicPlayer mocked as a simple marker
vi.mock("../BackgroundMusicPlayer/BackgroundMusicPlayer", () => ({
  default: () => <div data-testid="bgm">BGM</div>,
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

describe("GameScreen", () => {
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

    // BGM should not render until gameDataReady is true
    expect(screen.queryByTestId("bgm")).not.toBeInTheDocument();
  });

  it("renders WS-dependent components after WebSocket onopen (isConnected=true)", () => {
    render(<GameScreen />);
    act(() => {
      mockWebSocket.onopen?.();
    });

    expect(screen.getByTestId("lobby")).toBeInTheDocument();
    expect(screen.getByTestId("game-end-screen")).toBeInTheDocument();
    expect(screen.getByTestId("notifier")).toBeInTheDocument();
    expect(screen.getByTestId("effect-manager")).toBeInTheDocument();
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
    expect(screen.getByText("Lobby - Connected: true")).toBeInTheDocument();
  });

  it("handles onclose by marking disconnected and hides WS-dependent components", () => {
    render(<GameScreen />);

    act(() => {
      mockWebSocket.onopen?.();
    });
    expect(screen.getByTestId("game-end-screen")).toBeInTheDocument();

    act(() => {
      mockWebSocket.onclose?.();
    });
    expect(screen.getByText("Lobby - Connected: false")).toBeInTheDocument();
    expect(screen.queryByTestId("game-end-screen")).not.toBeInTheDocument();
    expect(screen.queryByTestId("notifier")).not.toBeInTheDocument();
    expect(screen.queryByTestId("effect-manager")).not.toBeInTheDocument();
    expect(WebSocket).toHaveBeenCalledTimes(1);
  });

  it("handles onerror by logging and setting disconnected (does not close explicitly)", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<GameScreen />);

    act(() => {
      mockWebSocket.onopen?.();
    });
    expect(screen.getByText("Lobby - Connected: true")).toBeInTheDocument();

    act(() => {
      mockWebSocket.onerror?.(new Event("error"));
    });
    expect(screen.getByText("Lobby - Connected: false")).toBeInTheDocument();
    expect(mockWebSocket.close).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("handles publicUpdate and sets publicData (still Lobby if private/started missing)", () => {
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
    expect(screen.queryByTestId("sync-orchestrator")).not.toBeInTheDocument();
    expect(screen.queryByTestId("presentation-screen")).not.toBeInTheDocument();
    expect(screen.queryByTestId("bgm")).not.toBeInTheDocument();
  });

  it("handles privateUpdate and sets privateData (still Lobby if public/started missing)", () => {
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

  it("handles player_joined safely (no crash, still Lobby)", () => {
    render(<GameScreen />);
    act(() => {
      mockWebSocket.onmessage?.({
        data: JSON.stringify({ event: "player_joined" }),
      });
    });
    expect(screen.getByTestId("lobby")).toBeInTheDocument();
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
    const unknown = { event: "unknownEvent", payload: { x: 1 } };
    act(() => {
      mockWebSocket.onmessage?.({ data: JSON.stringify(unknown) });
    });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("with public(in_progress) + private -> shows Presentation, mounts BGM, then Sync after close()", async () => {
    render(<GameScreen />);

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

    // BGM should be mounted along with Presentation
    await waitFor(() => {
      expect(screen.getByTestId("presentation-screen")).toBeInTheDocument();
      expect(screen.getByTestId("bgm")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("sync-orchestrator")).not.toBeInTheDocument();

    // Close presentation -> Sync appears; BGM stays mounted
    fireEvent.click(screen.getByLabelText("finish-presentation"));
    await waitFor(() =>
      expect(screen.getByTestId("sync-orchestrator")).toBeInTheDocument()
    );
    expect(screen.getByTestId("bgm")).toBeInTheDocument();

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
            gameStatus: "inProgress", // camelCase variant
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

  it("with public(waiting) + private + gameStarted -> shows Presentation then Sync after close(), with BGM mounted", async () => {
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
