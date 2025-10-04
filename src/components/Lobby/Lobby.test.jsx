import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import "@testing-library/jest-dom";
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
    onmessage: null,
    close: vi.fn(),
    send: vi.fn(),
  };

  const defaultProps = {
    ws: mockWs,
    isConnected: true,
    refreshTrigger: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockGameData),
    });
    mockWs.onmessage = null;
  });

  describe("Renderizado básico", () => {
    test("renderiza correctamente como owner", async () => {
      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      render(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(screen.getByText("Partida: Partida Test")).toBeInTheDocument();
        expect(
          screen.getByText("Creador de la partida: Owner_test_2")
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

      render(<Lobby {...playerProps} />);

      await waitFor(() => {
        expect(screen.getByText("Partida: Partida Test")).toBeInTheDocument();
        expect(
          screen.getByText("Creador de la partida: Owner_test_2")
        ).toBeInTheDocument();

        expect(
          screen.queryByTestId("start-game-button")
        ).not.toBeInTheDocument();
      });
    });

    test("muestra mensaje de carga inicial", () => {
      render(<Lobby id={1} playerId={5} {...defaultProps} />);

      expect(
        screen.getByText("Cargando información del juego...")
      ).toBeInTheDocument();
    });

    test("diferencia correctamente entre owner y player por la presencia del botón Start Game", async () => {
      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };
      const { unmount } = render(<Lobby {...ownerProps} />);

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
      render(<Lobby {...playerProps} />);

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

      render(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(screen.getByText("Owner_test_2")).toBeInTheDocument();
        expect(screen.getByText("Player_test_1")).toBeInTheDocument();
        expect(
          screen.getByText(/Jugadores en espera \(2\)/)
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

      render(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(screen.getByText("(Creador)")).toBeInTheDocument();
        expect(screen.getByText("(Tú)")).toBeInTheDocument();
      });
    });

    test("muestra badge correcto para player normal", async () => {
      const playerProps = {
        id: 1,
        playerId: 3,
        playerName: "Player_test_1",
        ...defaultProps,
      };

      render(<Lobby {...playerProps} />);

      await waitFor(() => {
        expect(screen.getByText("(Creador)")).toBeInTheDocument();
        expect(screen.getByText("(Tú)")).toBeInTheDocument();
      });
    });

    test("maneja correctamente cuando el jugador no está en la partida", async () => {
      const invalidPlayerProps = {
        id: 1,
        playerId: 999,
        playerName: "InvalidPlayer",
        ...defaultProps,
      };

      render(<Lobby {...invalidPlayerProps} />);

      await waitFor(() => {
        expect(
          screen.getByText("No tienes acceso a esta partida")
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

      render(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(
          screen.getByText(/Jugadores en espera \(3\)/)
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

      render(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(screen.getByText("- PARTIDA LLENA")).toBeInTheDocument();
      });
    });

    test("no muestra badge de partida llena cuando no se alcanza el máximo", async () => {
      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      render(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(screen.queryByText("- PARTIDA LLENA")).not.toBeInTheDocument();
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

      render(<Lobby {...ownerProps} />);

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

      render(<Lobby {...playerProps} />);

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

      render(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(
          screen.getByText(/Jugadores en espera \(2\)/)
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

      render(<Lobby {...ownerProps} />);

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

      render(<Lobby {...ownerProps} />);

      expect(
        screen.getByText("Cargando información del juego...")
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

      render(<Lobby {...ownerProps} />);

      expect(
        screen.getByText("Cargando información del juego...")
      ).toBeInTheDocument();
    });

    test("maneja correctamente cuando el owner y player actual son la misma persona", async () => {
      const ownerProps = {
        id: 1,
        playerId: 5,
        playerName: "Owner_test_2",
        ...defaultProps,
      };

      render(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(screen.getByText("Owner_test_2")).toBeInTheDocument();
        expect(screen.getByText("(Creador)")).toBeInTheDocument();
        expect(screen.getByText("(Tú)")).toBeInTheDocument();

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

      render(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(
          screen.getByText("No hay jugadores en la partida")
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

      render(<Lobby {...propsWithTrigger} />);

      await waitFor(() => {
        expect(screen.getByText("Partida: Partida Test")).toBeInTheDocument();
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

      render(<Lobby {...connectedProps} />);

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

      render(<Lobby {...disconnectedProps} />);

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

      render(<Lobby {...ownerProps} />);

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

      render(<Lobby {...ownerProps} />);

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

      render(<Lobby {...ownerProps} />);

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

      render(<Lobby {...ownerProps} />);

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
      const { rerender } = render(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(
          screen.getByText(/Jugadores en espera \(2\)/)
        ).toBeInTheDocument();
      });

      // Mock para la nueva llamada
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGameDataWithNewPlayer),
      });

      // Simular cambio en refreshTrigger (como si hubiera llegado player_joined)
      rerender(<Lobby {...ownerProps} refreshTrigger={1} />);

      await waitFor(() => {
        expect(screen.getByText("NuevoJugador")).toBeInTheDocument();
        expect(
          screen.getByText(/Jugadores en espera \(3\)/)
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

      render(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(screen.getByText("Partida: Partida Test")).toBeInTheDocument();
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
      const { rerender } = render(<Lobby {...ownerProps} />);

      await waitFor(() => {
        expect(screen.getByText("Partida: Partida Test")).toBeInTheDocument();
      });

      // Mock para llamadas adicionales
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockGameData),
      });

      // Cambiar refreshTrigger varias veces
      rerender(<Lobby {...ownerProps} refreshTrigger={1} />);
      rerender(<Lobby {...ownerProps} refreshTrigger={2} />);
      rerender(<Lobby {...ownerProps} refreshTrigger={3} />);

      await waitFor(() => {
        // Debería haber llamado fetch 4 veces (1 inicial + 3 por refreshTrigger)
        expect(fetch).toHaveBeenCalledTimes(4);
      });
    });
  });
});
