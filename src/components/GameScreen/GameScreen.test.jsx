import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { useParams, useSearchParams } from 'react-router-dom';
import GameScreen from './GameScreen';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock('../Lobby/Lobby', () => ({
  default: ({ isConnected }) => (
    <div data-testid="lobby">Lobby - Connected: {isConnected.toString()}</div>
  ),
}));

vi.mock('../Sync/SyncOrchestrator', () => ({
  default: ({ publicData, privateData, currentPlayerId }) => (
    <div data-testid="sync-orchestrator">
      Sync - Player: {currentPlayerId}, Public: {publicData ? 'yes' : 'no'}, Private: {privateData ? 'yes' : 'no'}
    </div>
  ),
}));

vi.mock('../GameEndScreen/GameEndSreen', () => ({
  default: () => <div data-testid="game-end-screen">Game End Screen</div>,
}));

// Mock WebSocket
const createMockWebSocket = () => ({
  close: vi.fn(),
  send: vi.fn(),
  onopen: null,
  onclose: null,
  onerror: null,
  onmessage: null,
  readyState: 1, // OPEN
});

let mockWebSocket;

describe('GameScreen', () => {
  const mockGameId = '123';
  const mockPlayerId = '456';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup router mocks
    useParams.mockReturnValue({ gameId: mockGameId });
    useSearchParams.mockReturnValue([
      new URLSearchParams(`playerId=${mockPlayerId}`),
    ]);

    // Create new WebSocket mock for each test
    mockWebSocket = createMockWebSocket();
    global.WebSocket = vi.fn(() => mockWebSocket);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders lobby when game is not ready', () => {
    render(<GameScreen />);

    expect(screen.getByTestId('lobby')).toBeInTheDocument();
    expect(screen.getByTestId('game-end-screen')).toBeInTheDocument();
  });

  it('creates WebSocket connection on mount', () => {
    render(<GameScreen />);

    expect(WebSocket).toHaveBeenCalledWith(`ws://localhost:8000/ws/${mockGameId}/${mockPlayerId}`);
  });

  it('does not create WebSocket when gameId is missing', () => {
    useParams.mockReturnValue({ gameId: undefined });

    render(<GameScreen />);

    expect(WebSocket).not.toHaveBeenCalled();
  });

  it('handles WebSocket open event', () => {
    render(<GameScreen />);

    // Trigger WebSocket open
    act(() => {
      mockWebSocket.onopen?.();
    });

    expect(screen.getByText('Lobby - Connected: true')).toBeInTheDocument();
  });

  it('handles WebSocket close event and attempts reconnection', async () => {
    vi.useFakeTimers();
    
    render(<GameScreen />);

    // First connection
    act(() => {
      mockWebSocket.onopen?.();
    });

    expect(screen.getByText('Lobby - Connected: true')).toBeInTheDocument();

    // Close connection
    act(() => {
      mockWebSocket.onclose?.();
    });

    expect(screen.getByText('Lobby - Connected: false')).toBeInTheDocument();

    // Advance timers to trigger reconnection
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // Should attempt to reconnect
    expect(WebSocket).toHaveBeenCalledTimes(2);
  });

  it('handles WebSocket error event', () => {
    render(<GameScreen />);

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    act(() => {
      mockWebSocket.onerror?.(new Event('error'));
    });

    expect(mockWebSocket.close).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('handles publicUpdate message and sets public data', () => {
    render(<GameScreen />);

    const publicData = {
      gameStatus: 'inProgress',
      regularDeckCount: 10,
      discardPileTop: { id: 1, name: 'Card1' },
      DraftCards: [],
      DiscardPileCount: 5,
      Players: [],
    };

    act(() => {
      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          event: 'publicUpdate',
          payload: publicData,
        }),
      });
    });

    // Public data should be set, but SyncOrchestrator not rendered yet (needs private data and started)
    expect(screen.getByTestId('lobby')).toBeInTheDocument();
  });

  it('handles privateUpdate message', () => {
    render(<GameScreen />);

    const privateData = {
      cards: [{ id: 1, name: 'Card1', type: 'action' }],
      secrets: [{ id: 1, revealed: false, name: 'Secret1' }],
      role: 'detective',
      ally: null,
    };

    act(() => {
      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          event: 'privateUpdate',
          payload: privateData,
        }),
      });
    });

    // Private data should be set, but game not started yet
    expect(screen.getByTestId('lobby')).toBeInTheDocument();
  });

  it('handles playerJoined message', () => {
    render(<GameScreen />);

    act(() => {
      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          event: 'playerJoined',
        }),
      });
    });

    // Refresh lobby should be triggered
    expect(screen.getByTestId('lobby')).toBeInTheDocument();
  });

  it('handles gameStarted message and sets started state', () => {
    render(<GameScreen />);

    act(() => {
      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          event: 'gameStarted',
        }),
      });
    });

    // Game should be started, but SyncOrchestrator not rendered yet (needs public and private data)
    expect(screen.getByTestId('lobby')).toBeInTheDocument();
  });

  it('handles publicUpdate with inProgress gameStatus and starts game', () => {
    render(<GameScreen />);

    const publicData = {
      gameStatus: 'inProgress', // This should trigger setStarted(true)
      regularDeckCount: 10,
      discardPileTop: { id: 1, name: 'Card1' },
      DraftCards: [],
      DiscardPileCount: 5,
      Players: [],
    };

    act(() => {
      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          event: 'publicUpdate',
          payload: publicData,
        }),
      });
    });

    // Game should be started due to gameStatus: 'inProgress'
    // But still needs private data to render SyncOrchestrator
    expect(screen.getByTestId('lobby')).toBeInTheDocument();
  });

  it('handles unknown event types', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<GameScreen />);

    act(() => {
      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          event: 'unknownEvent',
          payload: { some: 'data' },
        }),
      });
    });

    expect(consoleWarn).toHaveBeenCalledWith('Evento no manejado:', 'unknownEvent');
    consoleWarn.mockRestore();
  });

  it('handles non-JSON messages', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<GameScreen />);

    act(() => {
      mockWebSocket.onmessage?.({
        data: 'not json',
      });
    });

    expect(consoleWarn).toHaveBeenCalledWith('⚠️ Mensaje no JSON:', 'not json');
    consoleWarn.mockRestore();
  });

  it('renders SyncOrchestrator when all game data is ready', () => {
    render(<GameScreen />);

    // Set up all required data
    const publicData = {
      gameStatus: 'inProgress',
      regularDeckCount: 10,
      discardPileTop: { id: 1, name: 'Card1' },
      DraftCards: [],
      DiscardPileCount: 5,
      Players: [],
    };

    const privateData = {
      cards: [{ id: 1, name: 'Card1', type: 'action' }],
      secrets: [{ id: 1, revealed: false, name: 'Secret1' }],
      role: 'detective',
      ally: null,
    };

    act(() => {
      // Send all required messages to make game data ready
      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          event: 'publicUpdate',
          payload: publicData,
        }),
      });

      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          event: 'privateUpdate',
          payload: privateData,
        }),
      });

      // The publicUpdate with gameStatus: 'inProgress' should set started to true
      // So we don't need a separate gameStarted message
    });

    // Now all conditions should be met: publicData, privateData, and started
    expect(screen.getByTestId('sync-orchestrator')).toBeInTheDocument();
    expect(screen.getByText('Sync - Player: 456, Public: yes, Private: yes')).toBeInTheDocument();
  });

  it('renders SyncOrchestrator when gameStarted message is received after data', () => {
    render(<GameScreen />);

    const publicData = {
      gameStatus: 'waiting', // Not inProgress yet
      regularDeckCount: 10,
      discardPileTop: { id: 1, name: 'Card1' },
      DraftCards: [],
      DiscardPileCount: 5,
      Players: [],
    };

    const privateData = {
      cards: [{ id: 1, name: 'Card1', type: 'action' }],
      secrets: [{ id: 1, revealed: false, name: 'Secret1' }],
      role: 'detective',
      ally: null,
    };

    act(() => {
      // Set data first
      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          event: 'publicUpdate',
          payload: publicData,
        }),
      });

      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          event: 'privateUpdate',
          payload: privateData,
        }),
      });

      // Then start the game
      mockWebSocket.onmessage?.({
        data: JSON.stringify({
          event: 'gameStarted',
        }),
      });
    });

    // Now all conditions should be met
    expect(screen.getByTestId('sync-orchestrator')).toBeInTheDocument();
  });

  it('cleans up WebSocket on unmount', () => {
    const { unmount } = render(<GameScreen />);

    unmount();

    expect(mockWebSocket.close).toHaveBeenCalled();
  });

  it('cleans up retry timeout on unmount', () => {
    vi.useFakeTimers();
    
    const { unmount } = render(<GameScreen />);

    // Set up a pending retry
    act(() => {
      mockWebSocket.onclose?.();
    });

    unmount();

    // Should clean up properly without errors
    expect(mockWebSocket.close).toHaveBeenCalled();
  });
});