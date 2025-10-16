import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
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

  it("renders core scaffolding (Lobby, EndScreen, Notifier, EffectManager)", () => {
    render(<GameScreen />);
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

  it("handles onclose by marking Lobby as disconnected (no reconnect in this version)", () => {
    render(<GameScreen />);
    act(() => {
      mockWebSocket.onopen?.();
    });
    expect(screen.getByText("Lobby - Connected: true")).toBeInTheDocument();

    act(() => {
      mockWebSocket.onclose?.();
    });
    expect(screen.getByText("Lobby - Connected: false")).toBeInTheDocument();
    // No retry logic: only one WebSocket constructor call
    expect(WebSocket).toHaveBeenCalledTimes(1);
  });

  it("handles onerror by logging and setting disconnected (does not close explicitly)", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<GameScreen />);
    act(() => {
      mockWebSocket.onerror?.(new Event("error"));
    });
    expect(screen.getByText("Lobby - Connected: false")).toBeInTheDocument();
    expect(mockWebSocket.close).not.toHaveBeenCalled(); // current code does not close on error
    spy.mockRestore();
  });

  it("handles publicUpdate and sets publicData (no Sync yet if private/started missing)", () => {
    render(<GameScreen />);
    act(() => {
      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          event: "publicUpdate",
          payload: {
            gameStatus: "waiting", // does not start the board
            regularDeckCount: 10,
            discardPileTop: { id: 1, name: "Card1" },
            draftCards: [],
            discardPileCount: 5,
            players: [],
          },
        }),
      });
    });
    // Still Lobby because private/started not ready
    expect(screen.getByTestId("lobby")).toBeInTheDocument();
  });

  it("handles privateUpdate and sets privateData (no Sync yet if public/started missing)", () => {
    render(<GameScreen />);
    act(() => {
      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          event: "privateUpdate",
          payload: {
            cards: [{ id: 1, name: "Card1", type: "action" }],
            secrets: [{ id: 1, revealed: false, name: "Secret1" }],
            role: "detective",
            ally: null,
          },
        }),
      });
    });
    expect(screen.getByTestId("lobby")).toBeInTheDocument();
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
  });

  it("logs unknown events without crashing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<GameScreen />);
    const unknown = { event: "unknownEvent", payload: { x: 1 } };
    act(() => {
      mockWebSocket.onmessage?.({ data: JSON.stringify(unknown) });
    });
    expect(warn).toHaveBeenCalled();
    const [msg, obj] = warn.mock.calls[0];
    expect(String(msg)).toMatch(/Evento no manejado/);
    expect(obj).toMatchObject(unknown);
    warn.mockRestore();
  });

  it("handles non-JSON messages gracefully", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<GameScreen />);
    act(() => {
      mockWebSocket.onmessage?.({ data: "not json" });
    });
    expect(warn).toHaveBeenCalledWith("⚠️ Mensaje no JSON:", "not json");
    warn.mockRestore();
  });

  it("renders SyncOrchestrator when publicUpdate(in_progress) + privateUpdate are received", async () => {
    render(<GameScreen />);

    act(() => {
      // public with in_progress should flip started=true
      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          event: "publicUpdate",
          payload: {
            gameStatus: "in_progress",
            regularDeckCount: 10,
            discardPileTop: { id: 1, name: "Card1" },
            draftCards: [],
            discardPileCount: 5,
            players: [],
          },
        }),
      });
      // private ready
      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          event: "privateUpdate",
          payload: {
            cards: [{ id: 1, name: "Card1", type: "action" }],
            secrets: [{ id: 1, revealed: false, name: "Secret1" }],
            role: "detective",
            ally: null,
          },
        }),
      });
    });

    await waitFor(() =>
      expect(screen.getByTestId("sync-orchestrator")).toBeInTheDocument()
    );
    expect(
      screen.getByText("Sync - Player: 456, Public: yes, Private: yes")
    ).toBeInTheDocument();
  });

  it("renders SyncOrchestrator when gameStarted follows public(waiting) + private", async () => {
    render(<GameScreen />);

    act(() => {
      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          event: "publicUpdate",
          payload: {
            gameStatus: "waiting",
            regularDeckCount: 10,
            discardPileTop: { id: 1, name: "Card1" },
            draftCards: [],
            discardPileCount: 5,
            players: [],
          },
        }),
      });
      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          event: "privateUpdate",
          payload: {
            cards: [{ id: 1, name: "Card1", type: "action" }],
            secrets: [{ id: 1, revealed: false, name: "Secret1" }],
            role: "detective",
            ally: null,
          },
        }),
      });
      mockWebSocket.onmessage?.({
        data: JSON.stringify({ event: "gameStarted" }),
      });
    });

    await waitFor(() =>
      expect(screen.getByTestId("sync-orchestrator")).toBeInTheDocument()
    );
  });

  it("closes the WebSocket on unmount", () => {
    const { unmount } = render(<GameScreen />);
    unmount();
    expect(mockWebSocket.close).toHaveBeenCalled();
  });
});
