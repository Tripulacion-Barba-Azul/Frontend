import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import GameScreen from './GameScreen';

// Mock del componente Lobby
vi.mock('../Lobby/Lobby', () => ({
  default: function MockLobby({ id, playerId, onStartGame, ws, isConnected }) {
    return (
      <div data-testid="lobby-component">
        <span data-testid="lobby-game-id">{id}</span>
        <span data-testid="lobby-player-id">{playerId}</span>
        <span data-testid="lobby-connection-status">
          {isConnected ? 'connected' : 'disconnected'}
        </span>
        <button
          data-testid="start-game-button"
          onClick={() => onStartGame()}
        >
          Start Game
        </button>
      </div>
    );
  },
}));

// Mock de WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;

    // Simular conexión asíncrona con setTimeout
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) {
        this.onopen();
      }
    }, 10);
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose();
    }
  }

  send() {}

  simulateError() {
    if (this.onerror) {
      this.onerror(new Error('WebSocket error'));
    }
  }
}

// Guardar instancias
let websocketInstances = [];

// Spy de WebSocket
const MockWebSocketSpy = vi.fn().mockImplementation((url) => {
  const instance = new MockWebSocket(url);
  websocketInstances.push(instance);
  return instance;
});

global.WebSocket = MockWebSocketSpy;

// Helper
const renderGameScreen = (gameId = '123', playerId = '456') => {
  const initialEntries = [`/game/${gameId}?playerId=${playerId}`];

  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/game/:gameId" element={<GameScreen />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('GameScreen Component', () => {
  let consoleSpy;

  beforeEach(() => {
    vi.useFakeTimers(); // 🔥 use fake timers
    vi.clearAllMocks();
    websocketInstances = [];
    MockWebSocketSpy.mockClear();
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.runOnlyPendingTimers(); // flush anything left
    vi.useRealTimers(); // restore timers
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe('Gestión de estados - Lobby/Game', () => {
    test('inicialmente muestra Lobby cuando started es false', async () => {
      renderGameScreen();

      // 🔥 Flush WebSocket open
      await act(async () => {
        vi.runAllTimers();
      });

      expect(screen.getByTestId('lobby-component')).toBeInTheDocument();
      expect(screen.queryByText('In Game Page')).not.toBeInTheDocument();
    });

    test('cambia a mostrar "In Game Page" cuando started cambia a true', async () => {
      renderGameScreen();

      await act(async () => {
        vi.runAllTimers(); // ensure ws connects
      });

      const startButton = screen.getByTestId('start-game-button');
      await act(async () => {
        startButton.click();
      });

      expect(screen.getByText('In Game Page')).toBeInTheDocument();
      expect(screen.queryByTestId('lobby-component')).not.toBeInTheDocument();
    });
  });

  describe('Gestión de WebSocket', () => {
    test('crea WebSocket con la URL correcta basada en gameId', async () => {
      const gameId = '123';
      renderGameScreen(gameId);

      await act(async () => {
        vi.runAllTimers();
      });

      expect(MockWebSocketSpy).toHaveBeenCalledWith(
        `ws://localhost:8000/ws/${gameId}`
      );
    });

    test('onopen: establece isConnected a true', async () => {
      renderGameScreen();

      await act(async () => {
        vi.runAllTimers(); // 🔥 flush open event
      });

      expect(screen.getByTestId('lobby-connection-status')).toHaveTextContent(
        'connected'
      );
      expect(consoleSpy.log).toHaveBeenCalledWith('WebSocket conectado');
    });

    test('onclose: establece isConnected a false', async () => {
      renderGameScreen();

      await act(async () => {
        vi.runAllTimers(); // connect
      });

      const wsInstance = websocketInstances[0];
      await act(async () => {
        wsInstance.close();
      });

      expect(screen.getByTestId('lobby-connection-status')).toHaveTextContent(
        'disconnected'
      );
      expect(consoleSpy.log).toHaveBeenCalledWith('WebSocket desconectado');
    });

    test('onerror: establece isConnected a false cuando ocurre un error', async () => {
      renderGameScreen();

      await act(async () => {
        vi.runAllTimers(); // connect
      });

      const wsInstance = websocketInstances[0];
      await act(async () => {
        wsInstance.simulateError();
      });

      expect(screen.getByTestId('lobby-connection-status')).toHaveTextContent(
        'disconnected'
      );
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Error en WebSocket:',
        expect.any(Error)
      );
    });
  });
});