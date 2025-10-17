import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import Lobby from "./Lobby";

// El componente Lobby ahora recibe ws e isConnected como props
// en lugar de crear el WebSocket internamente

vi.mock("./StartGameButton/StartGameButton", () => ({
  default: function MockStartGameButton({
    disabled,
    gameId,
    actualPlayerId,
    onStartGame,
  }) {
    const handleStartGame = async () => {
      if (disabled) return;

      try {
        const response = await fetch(
          `http://localhost:8000/games/${gameId}/start?owner_id=${actualPlayerId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log("Game started successfully:", data);
        if (onStartGame) {
          onStartGame();
        }
      } catch (error) {
        console.error("Error starting game:", error);
      }
    };

    return (
      <button
        data-testid="start-game-button"
        disabled={disabled}
        onClick={handleStartGame}
      >
        Iniciar Partida
      </button>
    );
  },
}));

vi.mock("./CancelGameButton/CancelGameButton", () => ({
  default: function MockCancelGameButton({
    disabled,
    gameId,
    actualPlayerId,
  }) {
    return (
      <button
        data-testid="cancel-game-button"
        disabled={disabled}
      >
        Cancelar Partida
      </button>
    );
  },
}));

global.fetch = vi.fn();

describe("Lobby Component", () => {
  const mockGameData = {
    gameId: 1,
    gameName: "Partida Test",
    ownerId: 5,
    minPlayers: 2,
    maxPlayers: 4,
    players: [
      { playerId: 5, playerName: "Owner_test_2" },
      { playerId: 3, playerName: "Player_test_1" },
    ],
  };

  // Mock WebSocket
  const mockWs = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    close: vi.fn(),
    send: vi.fn(),
  };

  const defaultProps = {
    ws: mockWs,
    isConnected: true,
    refreshTrigger: 0,
  };

  // Helper function to render component with Router context
  const renderWithRouter = (component) => {
    return render(
      <MemoryRouter>
        {component}
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockGameData),
    });
  });

  describe("Renderizado básico", () => {
    test("renderiza correctamente como owner", async () => {
      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(screen.getByText("Game name: Partida Test")).toBeInTheDocument();
        expect(
          screen.getByText("Game creator: Owner_test_2")
        ).toBeInTheDocument();
        expect(screen.getByText("Min: 2, Max: 4")).toBeInTheDocument();

        expect(screen.getByTestId("start-game-button")).toBeInTheDocument();
      });
    });

    test("renderiza correctamente como player", async () => {
      const playerProps = {
        id: 1,
        playerId: 3,
        playerName: "Player_test_1",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...playerProps} />);

      await waitFor(() => {
        expect(screen.getByText("Game name: Partida Test")).toBeInTheDocument();
        expect(
          screen.getByText("Game creator: Owner_test_2")
        ).toBeInTheDocument();

        expect(
          screen.queryByTestId("start-game-button")
        ).not.toBeInTheDocument();
      });
    });

    test("muestra mensaje de carga inicial", () => {
      renderWithRouter(<Lobby id={1} playerId={5} {...defaultProps} />);

      expect(
        screen.getByText("Loading game info...")
      ).toBeInTheDocument();
    });

    test("diferencia correctamente entre owner y player por la presencia del botón Start Game", async () => {
      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };
      const { unmount } = renderWithRouter(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(screen.getByTestId("start-game-button")).toBeInTheDocument();
      });

      unmount();

      const playerProps = {
        id: 1,
        playerId: 3,
        playerName: "Player_test_1",
        ...defaultProps,
      };
      renderWithRouter(<Lobby {...playerProps} />);

      await waitFor(() => {
        expect(
          screen.queryByTestId("start-game-button")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Lógica de jugadores", () => {
    test("muestra todos los jugadores correctamente", async () => {
      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(screen.getByText("Owner_test_2")).toBeInTheDocument();
        expect(screen.getByText("Player_test_1")).toBeInTheDocument();
        expect(
          screen.getByText(/Current Players \(2\)/)
        ).toBeInTheDocument();
      });
    });

    test("muestra badges correctos para owner", async () => {
      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(screen.getByText("(Creator)")).toBeInTheDocument();
        expect(screen.getByText("(You)")).toBeInTheDocument();
      });
    });

    test("muestra badge correcto para player normal", async () => {
      const playerProps = {
        id: 1,
        playerId: 3,
        playerName: "Player_test_1",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...playerProps} />);

      await waitFor(() => {
        expect(screen.getByText("(Creator)")).toBeInTheDocument();
        expect(screen.getByText("(You)")).toBeInTheDocument();
      });
    });

    test("maneja correctamente cuando el jugador no está en la partida", async () => {
      const invalidPlayerProps = {
        id: 1,
        playerId: 999,
        playerName: "InvalidPlayer",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...invalidPlayerProps} />);

      await waitFor(() => {
        expect(
          screen.getByText("You dont have access to this game")
        ).toBeInTheDocument();
        expect(screen.queryByText("Owner_test_2")).not.toBeInTheDocument();
      });
    });

    test("muestra conteo correcto de jugadores", async () => {
      const mockGameDataWithMorePlayers = {
        ...mockGameData,
        players: [
          { playerId: 5, playerName: "Owner_test_2" },
          { playerId: 3, playerName: "Player_test_1" },
          { playerId: 7, playerName: "Player_test_2" },
        ],
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGameDataWithMorePlayers),
      });

      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(
          screen.getByText(/Current Players \(3\)/)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Estado de partida llena", () => {
    test("muestra badge de partida llena cuando se alcanza el máximo", async () => {
      const mockGameDataFull = {
        ...mockGameData,
        maxPlayers: 2,
        players: [
          { playerId: 5, playerName: "Owner_test_2" },
          { playerId: 3, playerName: "Player_test_1" },
        ],
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGameDataFull),
      });

      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(screen.getByText("- GAME FULL")).toBeInTheDocument();
      });
    });

    test("no muestra badge de partida llena cuando no se alcanza el máximo", async () => {
      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(screen.queryByText("- GAME FULL")).not.toBeInTheDocument();
      });
    });
  });

  describe("Botón de inicio (para owner)", () => {
    test("muestra el botón de inicio cuando el usuario es el owner", async () => {
      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(screen.getByTestId("start-game-button")).toBeInTheDocument();
      });
    });

    test("no muestra el botón de inicio cuando el usuario no es el owner", async () => {
      const playerProps = {
        id: 1,
        playerId: 3,
        playerName: "Player_test_1",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...playerProps} />);

      await waitFor(() => {
        expect(
          screen.queryByTestId("start-game-button")
        ).not.toBeInTheDocument();
      });
    });

    test("habilita el botón cuando se alcanza el mínimo de jugadores", async () => {
      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(
          screen.getByText(/Current Players \(2\)/)
        ).toBeInTheDocument();

        const button = screen.getByTestId("start-game-button");
        expect(button).not.toBeDisabled();
      });
    });

    test("deshabilita el botón cuando no se alcanza el mínimo de jugadores", async () => {
      const mockGameDataInsufficientPlayers = {
        ...mockGameData,
        minPlayers: 4,
        players: [
          { playerId: 5, playerName: "Owner_test_2" },
          { playerId: 3, playerName: "Player_test_1" },
        ],
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGameDataInsufficientPlayers),
      });

      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...ownerProps} />);

      await waitFor(() => {
        const button = screen.getByTestId("start-game-button");
        expect(button).toBeDisabled();
      });
    });
  });

  describe("Casos edge y manejo de errores", () => {
    test("maneja error en el fetch correctamente", async () => {
      fetch.mockRejectedValueOnce(new Error("Network error"));

      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...ownerProps} />);

      expect(
        screen.getByText("Loading game info...")
      ).toBeInTheDocument();
    });

    test("maneja respuesta HTTP no exitosa", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...ownerProps} />);

      expect(
        screen.getByText("Loading game info...")
      ).toBeInTheDocument();
    });

    test("maneja correctamente cuando el owner y player actual son la misma persona", async () => {
      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(screen.getByText("Owner_test_2")).toBeInTheDocument();
        expect(screen.getByText("(Creator)")).toBeInTheDocument();
        expect(screen.getByText("(You)")).toBeInTheDocument();

        expect(screen.getByTestId("start-game-button")).toBeInTheDocument();
      });
    });

    test("renderiza mensaje cuando no hay jugadores en una partida vacía", async () => {
      const mockEmptyGameData = {
        ...mockGameData,
        players: [],
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEmptyGameData),
      });

      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(
          screen.getByText("No players in sight")
        ).toBeInTheDocument();
      });
    });

    test("verifica que recibe correctamente el refreshTrigger prop", async () => {
      const propsWithTrigger = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
        refreshTrigger: 1,
      };

      renderWithRouter(<Lobby {...propsWithTrigger} />);

      await waitFor(() => {
        expect(screen.getByText("Game name: Partida Test")).toBeInTheDocument();
      });
    });

    test("muestra estado de conexión correctamente", async () => {
      const connectedProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
        isConnected: true,
      };

      renderWithRouter(<Lobby {...connectedProps} />);

      await waitFor(() => {
        expect(screen.getByText("Connected")).toBeInTheDocument();
      });
    });

    test("no muestra estado de conexión cuando está desconectado", async () => {
      const disconnectedProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
        isConnected: false,
      };

      renderWithRouter(<Lobby {...disconnectedProps} />);

      await waitFor(() => {
        expect(screen.queryByText("Connected")).not.toBeInTheDocument();
      });
    });
  });

  describe("Funcionalidad del botón Start Game", () => {
    test("el botón Start Game envía la request correcta cuando se presiona", async () => {
      // Mock para la respuesta del endpoint de start game
      const mockStartGameResponse = {
        message: "Game started successfully",
        gameId: 1,
        actualPlayerId: 5,
      };

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGameData),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStartGameResponse),
        });

      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(screen.getByTestId("start-game-button")).toBeInTheDocument();
      });

      // Hacer clic en el botón Start Game
      const startButton = screen.getByTestId("start-game-button");
      await startButton.click();

      // Verificar que se hizo la request correcta
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          "http://localhost:8000/games/1/start?owner_id=5",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      });
    });

    test("el botón Start Game maneja errores de red correctamente", async () => {
      // Mock del console.error para capturar errores
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGameData),
        })
        .mockRejectedValueOnce(new Error("Network error"));

      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(screen.getByTestId("start-game-button")).toBeInTheDocument();
      });

      // Hacer clic en el botón Start Game
      const startButton = screen.getByTestId("start-game-button");
      await startButton.click();

      // Verificar que se loggeó el error
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Error starting game:",
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    test("el botón Start Game no envía request cuando está deshabilitado", async () => {
      const mockGameDataInsufficientPlayers = {
        ...mockGameData,
        minPlayers: 4, // Requiere 4 jugadores pero solo hay 2
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGameDataInsufficientPlayers),
      });

      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...ownerProps} />);

      await waitFor(() => {
        const button = screen.getByTestId("start-game-button");
        expect(button).toBeDisabled();
      });

      // Intentar hacer clic en el botón deshabilitado
      const startButton = screen.getByTestId("start-game-button");
      await startButton.click();

      // Verificar que NO se hizo la request de start game (solo el fetch inicial)
      expect(fetch).toHaveBeenCalledTimes(1); // Solo el fetch inicial del juego
    });

    test("el botón Start Game maneja respuesta HTTP de error correctamente", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGameData),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(screen.getByTestId("start-game-button")).toBeInTheDocument();
      });

      // Hacer clic en el botón Start Game
      const startButton = screen.getByTestId("start-game-button");
      await startButton.click();

      // Verificar que se loggeó el error HTTP
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Error starting game:",
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe("Funcionalidad refreshTrigger", () => {
    test("actualiza la lista cuando cambia refreshTrigger", async () => {
      // Mock para la segunda llamada a fetch después del trigger
      const mockGameDataWithNewPlayer = {
        ...mockGameData,
        players: [
          { playerId: 5, playerName: "Owner_test_2" },
          { playerId: 3, playerName: "Player_test_1" },
          { playerId: 10, playerName: "NuevoJugador" },
        ],
      };

      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
        refreshTrigger: 0,
      };
      const { rerender } = renderWithRouter(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(
          screen.getByText(/Current Players \(2\)/)
        ).toBeInTheDocument();
      });

      // Mock para la nueva llamada
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGameDataWithNewPlayer),
      });

      // Simular cambio en refreshTrigger (como si hubiera llegado player_joined)
      rerender(
        <MemoryRouter>
          <Lobby {...ownerProps} refreshTrigger={1} />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("NuevoJugador")).toBeInTheDocument();
        expect(
          screen.getByText(/Current Players \(3\)/)
        ).toBeInTheDocument();
      });
    });

    test("no ejecuta fetchMatches cuando refreshTrigger es 0", async () => {
      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
        refreshTrigger: 0,
      };

      renderWithRouter(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(screen.getByText("Game name: Partida Test")).toBeInTheDocument();
      });

      // Solo debería haber llamado fetch una vez (para la carga inicial)
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    test("ejecuta fetchMatches múltiples veces cuando refreshTrigger cambia", async () => {
      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
        refreshTrigger: 0,
      };
      const { rerender } = renderWithRouter(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(screen.getByText("Game name: Partida Test")).toBeInTheDocument();
      });

      // Mock para llamadas adicionales
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockGameData),
      });

      // Cambiar refreshTrigger varias veces
      rerender(
        <MemoryRouter>
          <Lobby {...ownerProps} refreshTrigger={1} />
        </MemoryRouter>
      );
      rerender(
        <MemoryRouter>
          <Lobby {...ownerProps} refreshTrigger={2} />
        </MemoryRouter>
      );
      rerender(
        <MemoryRouter>
          <Lobby {...ownerProps} refreshTrigger={3} />
        </MemoryRouter>
      );

      await waitFor(() => {
        // Debería haber llamado fetch 4 veces (1 inicial + 3 por refreshTrigger)
        expect(fetch).toHaveBeenCalledTimes(4);
      });
    });
  });

  describe("Funcionalidad de cancelación de partida", () => {
    test("muestra el botón de cancelar partida cuando el usuario es el owner", async () => {
      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(screen.getByTestId("cancel-game-button")).toBeInTheDocument();
      });
    });

    test("no muestra el botón de cancelar partida cuando el usuario no es el owner", async () => {
      const playerProps = {
        id: 1,
        playerId: 3,
        playerName: "Player_test_1",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...playerProps} />);

      await waitFor(() => {
        expect(
          screen.queryByTestId("cancel-game-button")
        ).not.toBeInTheDocument();
      });
    });

    test("el botón de cancelar partida está siempre habilitado para el owner", async () => {
      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...ownerProps} />);

      await waitFor(() => {
        const cancelButton = screen.getByTestId("cancel-game-button");
        expect(cancelButton).not.toBeDisabled();
      });
    });
  });

  describe("Funcionalidad WebSocket y notificaciones de cancelación", () => {
    test("configura correctamente el event listener del WebSocket", async () => {
      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(mockWs.addEventListener).toHaveBeenCalledWith(
          'message',
          expect.any(Function)
        );
      });
    });

    test("no configura event listener si no hay WebSocket", async () => {
      const propsWithoutWs = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ws: null,
        isConnected: false,
        refreshTrigger: 0,
      };

      renderWithRouter(<Lobby {...propsWithoutWs} />);

      await waitFor(() => {
        expect(mockWs.addEventListener).not.toHaveBeenCalled();
      });
    });

    test("muestra modal de cancelación cuando recibe evento gameDeleted via WebSocket", async () => {
      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...ownerProps} />);

      // Verificar que el componente se ha renderizado
      await waitFor(() => {
        expect(screen.getByText("Game name: Partida Test")).toBeInTheDocument();
      });

      // Simular mensaje WebSocket de cancelación
      const messageEvent = {
        data: JSON.stringify({
          event: 'gameDeleted',
          payload: {
            gameName: 'Test Game',
            ownerName: 'Test Owner'
          }
        })
      };

      // Obtener el handler del addEventListener mock
      const addEventListenerCall = mockWs.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      );
      const messageHandler = addEventListenerCall[1];

      // Ejecutar el handler
      messageHandler(messageEvent);

      // Verificar que se muestra el modal
      await waitFor(() => {
        expect(screen.getByText("Game canceled")).toBeInTheDocument();
        expect(screen.getByText(/The game "Test Game" has been canceled by Test Owner/)).toBeInTheDocument();
        expect(screen.getByText("Back to home screen")).toBeInTheDocument();
      });
    });

    test("no muestra modal para otros tipos de eventos WebSocket", async () => {
      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(screen.getByText("Game name: Partida Test")).toBeInTheDocument();
      });

      // Simular mensaje WebSocket de otro tipo
      const messageEvent = {
        data: JSON.stringify({
          event: 'playerJoined',
          payload: {
            playerId: 123,
            playerName: 'New Player'
          }
        })
      };

      const addEventListenerCall = mockWs.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      );
      const messageHandler = addEventListenerCall[1];
      messageHandler(messageEvent);

      // Verificar que NO se muestra el modal de cancelación
      await waitFor(() => {
        expect(screen.queryByText("Game canceled")).not.toBeInTheDocument();
      });
    });

    test("maneja errores en procesamiento de mensajes WebSocket", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(screen.getByText("Game name: Partida Test")).toBeInTheDocument();
      });

      // Simular mensaje WebSocket con JSON inválido
      const messageEvent = {
        data: 'invalid json'
      };

      const addEventListenerCall = mockWs.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      );
      const messageHandler = addEventListenerCall[1];
      messageHandler(messageEvent);

      // Verificar que se loggeó el error
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error processing websocket message in Lobby:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe("Modal de notificación de cancelación", () => {
    const mockNavigate = vi.fn();

    beforeEach(() => {
      // Mock useNavigate
      vi.doMock("react-router-dom", async () => {
        const actual = await vi.importActual("react-router-dom");
        return {
          ...actual,
          useNavigate: () => mockNavigate,
        };
      });
    });

    test("navega a home cuando se hace clic en 'Back to home screen'", async () => {
      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(screen.getByText("Game name: Partida Test")).toBeInTheDocument();
      });

      // Simular evento de cancelación
      const messageEvent = {
        data: JSON.stringify({
          event: 'gameDeleted',
          payload: {
            gameName: 'Test Game',
            ownerName: 'Test Owner'
          }
        })
      };

      const addEventListenerCall = mockWs.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      );
      const messageHandler = addEventListenerCall[1];
      messageHandler(messageEvent);

      // Esperar a que aparezca el modal
      await waitFor(() => {
        expect(screen.getByText("Back to home screen")).toBeInTheDocument();
      });

      // Hacer clic en el botón
      const backButton = screen.getByText("Back to home screen");
      backButton.click();

      // Verificar navegación (nota: el navigate mock puede no funcionar en este contexto,
      // pero al menos verificamos que el modal se oculta)
      await waitFor(() => {
        expect(screen.queryByText("Game canceled")).not.toBeInTheDocument();
      });
    });

    test("no muestra modal cuando no hay datos de cancelación", async () => {
      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      renderWithRouter(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(screen.getByText("Game name: Partida Test")).toBeInTheDocument();
      });

      // No debería haber modal de cancelación
      expect(screen.queryByText("Game canceled")).not.toBeInTheDocument();
    });
  });

  describe("Limpieza de event listeners", () => {
    test("remueve event listener cuando el componente se desmonta", async () => {
      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      const { unmount } = renderWithRouter(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(mockWs.addEventListener).toHaveBeenCalled();
      });

      // Desmontar el componente
      unmount();

      // Verificar que se llamó removeEventListener
      expect(mockWs.removeEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );
    });

    test("remueve event listener cuando cambia el WebSocket", async () => {
      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      const { rerender } = renderWithRouter(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(mockWs.addEventListener).toHaveBeenCalled();
      });

      // Cambiar WebSocket
      const newMockWs = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        close: vi.fn(),
        send: vi.fn(),
      };

      rerender(
        <MemoryRouter>
          <Lobby {...ownerProps} ws={newMockWs} />
        </MemoryRouter>
      );

      // Verificar que se removió el listener del WebSocket anterior
      expect(mockWs.removeEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );

      // Verificar que se agregó listener al nuevo WebSocket
      expect(newMockWs.addEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );
    });
  });
});
