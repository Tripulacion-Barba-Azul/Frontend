// src/components/GameScreen/GameScreen.test.jsx
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

/* ------------------------------------------------------------------ */
/* Router mocks                                                        */
/* ------------------------------------------------------------------ */
vi.mock("react-router-dom", () => ({
  useParams: vi.fn(),
  useSearchParams: vi.fn(),
}));

/* ------------------------------------------------------------------ */
/* Child component mocks                                               */
/* Keep UI surface minimal and stable: assert mount/unmount semantics  */
/* ------------------------------------------------------------------ */
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

vi.mock("./PresentationScreen/PresentationScreen", () => ({
  // Expose a control to simulate closing the one-time presentation
  default: ({ close }) => (
    <div data-testid="presentation-screen">
      Presentation
      <button onClick={() => close?.(true)} aria-label="finish-presentation">
        finish
      </button>
    </div>
  ),
}));

// Music/Chat/Clock appear only when the presentation has been closed (gamePresented=true)
vi.mock("./BackgroundMusicPlayer/BackgroundMusicPlayer", () => ({
  default: () => <div data-testid="bgm">BGM</div>,
}));
vi.mock("./Chat/Chat", () => ({
  default: () => <div data-testid="chat">Chat</div>,
}));
vi.mock("./Clock/Clock", () => ({
  default: () => <div data-testid="clock">Clock</div>,
}));

// Keep EventLog isolated so its internals don't affect GameScreen tests
vi.mock("./EventLog/EventLog", () => ({
  default: () => <div data-testid="event-log">EventLog</div>,
}));

/* ------------------------------------------------------------------ */
/* Minimal WebSocket mock                                              */
/* ------------------------------------------------------------------ */
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

describe("GameScreen (current behavior)", () => {
  const mockGameId = "123";
  const mockPlayerId = "456";

  beforeEach(() => {
    vi.clearAllMocks();

    // Router stubs
    useParams.mockReturnValue({ gameId: mockGameId });
    useSearchParams.mockReturnValue([
      new URLSearchParams(`playerId=${mockPlayerId}`),
    ]);

    // WebSocket factory
    mockWebSocket = createMockWebSocket();
    global.WebSocket = vi.fn(() => mockWebSocket);
  });

  /* ------------------------------ Smoke ------------------------------ */

  it("initially renders Lobby; nothing WS-dependent is mounted", () => {
    render(<GameScreen />);

    expect(screen.getByTestId("lobby")).toBeInTheDocument();
    expect(screen.queryByTestId("game-end-screen")).not.toBeInTheDocument();
    expect(screen.queryByTestId("notifier")).not.toBeInTheDocument();
    expect(screen.queryByTestId("effect-manager")).not.toBeInTheDocument();
    expect(screen.queryByTestId("chat")).not.toBeInTheDocument();
    expect(screen.queryByTestId("clock")).not.toBeInTheDocument();
    expect(screen.queryByTestId("bgm")).not.toBeInTheDocument();
    expect(screen.queryByTestId("event-log")).not.toBeInTheDocument();
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

  /* ------------------------- Connection flags ------------------------ */

  it("handles onopen by marking Lobby as connected", () => {
    render(<GameScreen />);
    act(() => {
      mockWebSocket.onopen?.();
    });
    expect(screen.getByText(/Lobby - Connected: true/i)).toBeInTheDocument();
  });

  it("handles onerror by logging and flipping connected=false (without closing explicitly)", () => {
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

  /* --------------------------- Message flow -------------------------- */

  it("handles publicUpdate alone and stays in Lobby", () => {
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

  it("handles privateUpdate alone and stays in Lobby", () => {
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
    // Initial render
    expect(screen.getByText(/Refresh: 0/i)).toBeInTheDocument();

    act(() => {
      mockWebSocket.onmessage?.({
        data: JSON.stringify({ event: "player_joined" }),
      });
    });
    expect(screen.getByText(/Refresh: 1/i)).toBeInTheDocument();
  });

  it("handles gameStarted alone but keeps Lobby until public & private exist", () => {
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

  /* ----------------------- Game data + presentation ------------------ */

  it("with public(in_progress)+private and connected -> shows Presentation + global systems; after close -> Sync + BGM/Clock/Chat/EventLog", async () => {
    render(<GameScreen />);

    // Connected is required for global systems (Notifier/Effect/Clock/Chat/BGM/EventLog)
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

    // Presentation first: only connection-bound global systems outside the gate
    await waitFor(() => {
      expect(screen.getByTestId("presentation-screen")).toBeInTheDocument();
      expect(screen.getByTestId("notifier")).toBeInTheDocument();
      expect(screen.getByTestId("effect-manager")).toBeInTheDocument();
      // Gated UI must NOT be visible before closing the presentation
      expect(screen.queryByTestId("clock")).not.toBeInTheDocument();
      expect(screen.queryByTestId("chat")).not.toBeInTheDocument();
      expect(screen.queryByTestId("bgm")).not.toBeInTheDocument();
      expect(screen.queryByTestId("event-log")).not.toBeInTheDocument();
    });

    // Close presentation -> live game surface appears
    fireEvent.click(screen.getByLabelText("finish-presentation"));

    await waitFor(() => {
      expect(screen.getByTestId("sync-orchestrator")).toBeInTheDocument();
      expect(screen.getByTestId("bgm")).toBeInTheDocument();
      expect(screen.getByTestId("clock")).toBeInTheDocument();
      expect(screen.getByTestId("chat")).toBeInTheDocument();
      expect(screen.getByTestId("event-log")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Sync - Player: 456, Public: yes, Private: yes")
    ).toBeInTheDocument();
  });

  it('also sets started when publicUpdate has gameStatus "inProgress" (camelCase)', async () => {
    render(<GameScreen />);

    // Feed camelCase status + private snapshot
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

    // Being connected is not required to show the presentation once the data is ready
    await waitFor(() =>
      expect(screen.getByTestId("presentation-screen")).toBeInTheDocument()
    );
    // BGM/Chat/Clock are gated by "gamePresented" and connection -> do NOT expect them here
    expect(screen.queryByTestId("bgm")).not.toBeInTheDocument();
  });

  it("with public(waiting)+private+gameStarted and connected -> shows Presentation; after close -> Sync + BGM/Clock/Chat mount", async () => {
    render(<GameScreen />);

    act(() => {
      mockWebSocket.onopen?.();
    });

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
    // Still gated: nothing of the live game UI should be visible yet
    expect(screen.queryByTestId("bgm")).not.toBeInTheDocument();
    expect(screen.queryByTestId("clock")).not.toBeInTheDocument();
    expect(screen.queryByTestId("chat")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("finish-presentation"));

    await waitFor(() =>
      expect(screen.getByTestId("sync-orchestrator")).toBeInTheDocument()
    );
    expect(screen.getByTestId("bgm")).toBeInTheDocument();
    expect(screen.getByTestId("clock")).toBeInTheDocument();
    expect(screen.getByTestId("chat")).toBeInTheDocument();
  });

  it("handles onclose by marking disconnected and unmounting connection-bound systems", async () => {
    render(<GameScreen />);

    // Connect + provide data + close presentation to mount all gated modules
    act(() => {
      mockWebSocket.onopen?.();
    });
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

    await screen.findByTestId("presentation-screen");
    fireEvent.click(screen.getByLabelText("finish-presentation"));

    await waitFor(() => {
      expect(screen.getByTestId("sync-orchestrator")).toBeInTheDocument();
      expect(screen.getByTestId("bgm")).toBeInTheDocument();
      expect(screen.getByTestId("clock")).toBeInTheDocument();
      expect(screen.getByTestId("chat")).toBeInTheDocument();
      expect(screen.getByTestId("notifier")).toBeInTheDocument();
      expect(screen.getByTestId("effect-manager")).toBeInTheDocument();
    });

    // Close socket -> all connection-bound systems should go away
    act(() => {
      mockWebSocket.onclose?.();
    });

    await waitFor(() => {
      expect(screen.queryByTestId("notifier")).not.toBeInTheDocument();
      expect(screen.queryByTestId("effect-manager")).not.toBeInTheDocument();
      expect(screen.queryByTestId("chat")).not.toBeInTheDocument();
      expect(screen.queryByTestId("clock")).not.toBeInTheDocument();
      expect(screen.queryByTestId("bgm")).not.toBeInTheDocument();
      expect(screen.queryByTestId("event-log")).not.toBeInTheDocument();
    });
  });

  /* ------------------------------ Cleanup ---------------------------- */

  it("closes the WebSocket on unmount", () => {
    const { unmount } = render(<GameScreen />);
    unmount();
    expect(mockWebSocket.close).toHaveBeenCalled();
  });
});
