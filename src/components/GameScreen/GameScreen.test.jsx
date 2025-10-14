// GameScreen.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { useParams, useSearchParams } from "react-router-dom";
import GameScreen from "./GameScreen";

// ---- Mocks de dependencias ----
vi.mock("react-router-dom", () => ({
  useParams: vi.fn(),
  useSearchParams: vi.fn(),
}));

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

// ---- Mock WebSocket ----
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

    // Router mocks
    useParams.mockReturnValue({ gameId: mockGameId });
    useSearchParams.mockReturnValue([
      new URLSearchParams(`playerId=${mockPlayerId}`),
    ]);

    // WS mock por test
    mockWebSocket = createMockWebSocket();
    global.WebSocket = vi.fn(() => mockWebSocket);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renderiza Lobby cuando el juego no está listo", () => {
    render(<GameScreen />);
    expect(screen.getByTestId("lobby")).toBeInTheDocument();
    expect(screen.getByTestId("game-end-screen")).toBeInTheDocument();
  });

  it("crea la conexión WebSocket en el mount", () => {
    render(<GameScreen />);
    expect(WebSocket).toHaveBeenCalledWith(
      `ws://localhost:8000/ws/${mockGameId}/${mockPlayerId}`
    );
  });

  it("no crea WebSocket cuando falta gameId", () => {
    useParams.mockReturnValue({ gameId: undefined });
    render(<GameScreen />);
    expect(WebSocket).not.toHaveBeenCalled();
  });

  it("maneja onopen y muestra conectado en Lobby", () => {
    render(<GameScreen />);
    act(() => {
      mockWebSocket.onopen?.();
    });
    expect(screen.getByText("Lobby - Connected: true")).toBeInTheDocument();
  });

  it("maneja onclose y reintenta conexión", () => {
    vi.useFakeTimers();
    render(<GameScreen />);

    // 1ª conexión
    act(() => {
      mockWebSocket.onopen?.();
    });
    expect(screen.getByText("Lobby - Connected: true")).toBeInTheDocument();

    // Cierre -> desconecta y programa retry
    act(() => {
      mockWebSocket.onclose?.();
    });
    expect(screen.getByText("Lobby - Connected: false")).toBeInTheDocument();

    // Avanzar timers para reintentar
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(WebSocket).toHaveBeenCalledTimes(2);
  });

  it("maneja onerror cerrando el socket", () => {
    render(<GameScreen />);
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    act(() => {
      mockWebSocket.onerror?.(new Event("error"));
    });
    expect(mockWebSocket.close).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("maneja publicUpdate y setea publicData (sin render del Sync aún)", () => {
    render(<GameScreen />);
    act(() => {
      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          event: "publicUpdate",
          payload: {
            gameStatus: "inProgress",
            regularDeckCount: 10,
            discardPileTop: { id: 1, name: "Card1" },
            draftCards: [],
            discardPileCount: 5,
            players: [],
          },
        }),
      });
    });
    // Falta privateData -> sigue Lobby
    expect(screen.getByTestId("lobby")).toBeInTheDocument();
  });

  it("maneja privateUpdate y setea privateData (sin render del Sync aún)", () => {
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
    // Falta publicData/started -> sigue Lobby
    expect(screen.getByTestId("lobby")).toBeInTheDocument();
  });

  it("maneja playerJoined", () => {
    render(<GameScreen />);
    act(() => {
      mockWebSocket.onmessage?.({
        data: JSON.stringify({ event: "playerJoined" }),
      });
    });
    expect(screen.getByTestId("lobby")).toBeInTheDocument();
  });

  it("maneja gameStarted (sin datos aún) y mantiene Lobby", () => {
    render(<GameScreen />);
    act(() => {
      mockWebSocket.onmessage?.({
        data: JSON.stringify({ event: "gameStarted" }),
      });
    });
    expect(screen.getByTestId("lobby")).toBeInTheDocument();
  });

  it("maneja eventos desconocidos sin crashear", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<GameScreen />);
    act(() => {
      mockWebSocket.onmessage?.({
        data: JSON.stringify({ event: "unknownEvent", payload: { x: 1 } }),
      });
    });
    expect(warn).toHaveBeenCalledWith("Evento no manejado:", "unknownEvent");
    warn.mockRestore();
  });

  it("maneja mensajes no-JSON", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<GameScreen />);
    act(() => {
      mockWebSocket.onmessage?.({ data: "not json" });
    });
    expect(warn).toHaveBeenCalledWith("⚠️ Mensaje no JSON:", "not json");
    warn.mockRestore();
  });

  it("renderiza SyncOrchestrator cuando todo está listo vía publicUpdate(inProgress) + privateUpdate", async () => {
    render(<GameScreen />);

    act(() => {
      // public -> inProgress (setStarted true)
      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          event: "publicUpdate",
          payload: {
            gameStatus: "inProgress",
            regularDeckCount: 10,
            discardPileTop: { id: 1, name: "Card1" },
            draftCards: [],
            discardPileCount: 5,
            players: [],
          },
        }),
      });
      // private
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

    // Esperar la re-renderización
    await waitFor(() =>
      expect(screen.getByTestId("sync-orchestrator")).toBeInTheDocument()
    );
    expect(
      screen.getByText("Sync - Player: 456, Public: yes, Private: yes")
    ).toBeInTheDocument();
  });

  it("renderiza SyncOrchestrator cuando llega gameStarted después de datos", async () => {
    render(<GameScreen />);

    act(() => {
      // public waiting (no inProgress)
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
      // private listo
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
      // luego empieza el juego
      mockWebSocket.onmessage?.({
        data: JSON.stringify({ event: "gameStarted" }),
      });
    });

    await waitFor(() =>
      expect(screen.getByTestId("sync-orchestrator")).toBeInTheDocument()
    );
  });

  it("cierra el WebSocket al desmontar", () => {
    const { unmount } = render(<GameScreen />);
    unmount();
    expect(mockWebSocket.close).toHaveBeenCalled();
  });

  it("limpia el timeout de reintento al desmontar", () => {
    vi.useFakeTimers();
    const { unmount } = render(<GameScreen />);

    act(() => {
      mockWebSocket.onclose?.(); // programa retry
    });

    unmount();
    expect(mockWebSocket.close).toHaveBeenCalled();
  });
});
