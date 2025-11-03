import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import Clock from "./Clock";

// Mock framer-motion to avoid animation complexity in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className, ...props }) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
    img: ({ children, className, ...props }) => (
      <img className={className} {...props} />
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock CSS import
vi.mock("./Clock.css", () => ({}));

describe("Clock Component", () => {
  let mockWebSocket;
  let messageListeners;

  beforeEach(() => {
    vi.useFakeTimers();
    messageListeners = [];

    // Mock WebSocket
    mockWebSocket = {
      addEventListener: vi.fn((event, handler) => {
        if (event === "message") {
          messageListeners.push(handler);
        }
      }),
      removeEventListener: vi.fn((event, handler) => {
        if (event === "message") {
          const index = messageListeners.indexOf(handler);
          if (index > -1) {
            messageListeners.splice(index, 1);
          }
        }
      }),
    };
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  const sendTimerMessage = (eventTime, timeLeft) => {
    const message = {
      data: JSON.stringify({
        event: "timer",
        payload: { eventTime, timeLeft },
      }),
    };
    messageListeners.forEach((listener) => listener(message));
  };

  it("no muestra el reloj cuando turnStatus es 'waiting' y no hay finish hold activo", () => {
    const publicPlayers = [{ id: "player1", turnStatus: "waiting" }];
    const { container } = render(
      <Clock
        websocket={mockWebSocket}
        publicPlayers={publicPlayers}
        actualPlayerId="player1"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("muestra el reloj cuando turnStatus es 'playing'", () => {
    const publicPlayers = [{ id: "player1", turnStatus: "playing" }];
    render(
      <Clock
        websocket={mockWebSocket}
        publicPlayers={publicPlayers}
        actualPlayerId="player1"
      />
    );

    expect(screen.getByAltText(/Clock CLOCK_0/i)).toBeInTheDocument();
  });

  it("muestra el reloj cuando activeEffect es true, incluso en waiting", () => {
    const publicPlayers = [{ id: "player1", turnStatus: "waiting" }];
    render(
      <Clock
        websocket={mockWebSocket}
        publicPlayers={publicPlayers}
        actualPlayerId="player1"
        activeEffect={true}
      />
    );

    expect(screen.getByAltText(/Clock CLOCK_0/i)).toBeInTheDocument();
  });

  it("actualiza la imagen según el tiempo restante (primeros 5 segundos)", () => {
    const publicPlayers = [{ id: "player1", turnStatus: "playing" }];
    const { rerender } = render(
      <Clock
        websocket={mockWebSocket}
        publicPlayers={publicPlayers}
        actualPlayerId="player1"
      />
    );

    // Enviar mensaje con 8 segundos total, 8 restantes (inicio)
    sendTimerMessage(8, 8);
    expect(screen.getByAltText(/Clock CLOCK_0/i)).toBeInTheDocument();

    // 7 segundos restantes (elapsed = 1, con adjustedTotal = 5, eighth = 0.625)
    // 1 / 0.625 = 1.6, floor = 1 -> CLOCK_1
    sendTimerMessage(8, 7);
    rerender(
      <Clock
        websocket={mockWebSocket}
        publicPlayers={publicPlayers}
        actualPlayerId="player1"
      />
    );
    expect(screen.getByAltText(/Clock CLOCK_1/i)).toBeInTheDocument();

    // 5 segundos restantes (elapsed = 3, 3 / 0.625 = 4.8, floor = 4 -> CLOCK_4)
    sendTimerMessage(8, 5);
    rerender(
      <Clock
        websocket={mockWebSocket}
        publicPlayers={publicPlayers}
        actualPlayerId="player1"
      />
    );
    expect(screen.getByAltText(/Clock CLOCK_4/i)).toBeInTheDocument();
  });


  it("activa finish hold cuando timeLeft llega a 0 y vibra por 2 segundos", () => {
    const publicPlayers = [{ id: "player1", turnStatus: "playing" }];
    const { rerender } = render(
      <Clock
        websocket={mockWebSocket}
        publicPlayers={publicPlayers}
        actualPlayerId="player1"
      />
    );

    // Enviar mensaje con tiempo 0
    sendTimerMessage(8, 0);
    rerender(
      <Clock
        websocket={mockWebSocket}
        publicPlayers={publicPlayers}
        actualPlayerId="player1"
      />
    );

    // Debe mostrar CLOCK_8 (finish hold activo)
    expect(screen.getByAltText(/Clock CLOCK_8/i)).toBeInTheDocument();

    // Avanzar 1 segundo (no debe cambiar aún)
    vi.advanceTimersByTime(1000);
    rerender(
      <Clock
        websocket={mockWebSocket}
        publicPlayers={publicPlayers}
        actualPlayerId="player1"
      />
    );
    expect(screen.getByAltText(/Clock CLOCK_8/i)).toBeInTheDocument();

    // Avanzar otro segundo (total 2 segundos, debe terminar el hold)
    vi.advanceTimersByTime(1000);
    rerender(
      <Clock
        websocket={mockWebSocket}
        publicPlayers={publicPlayers}
        actualPlayerId="player1"
      />
    );

    // Después del hold, si timeLeft sigue en 0, debe volver a CLOCK_0
    expect(screen.getByAltText(/Clock CLOCK_0/i)).toBeInTheDocument();
  });


  it("resetea el hold completed flag cuando llega nuevo tiempo > 0", () => {
    const publicPlayers = [{ id: "player1", turnStatus: "playing" }];
    const { rerender } = render(
      <Clock
        websocket={mockWebSocket}
        publicPlayers={publicPlayers}
        actualPlayerId="player1"
      />
    );

    // Ciclo 1: tiempo 0 y completar hold
    sendTimerMessage(8, 0);
    vi.advanceTimersByTime(2000);
    rerender(
      <Clock
        websocket={mockWebSocket}
        publicPlayers={publicPlayers}
        actualPlayerId="player1"
      />
    );
    expect(screen.getByAltText(/Clock CLOCK_0/i)).toBeInTheDocument();

    // Nuevo ciclo: llega tiempo > 0
    sendTimerMessage(8, 5);
    rerender(
      <Clock
        websocket={mockWebSocket}
        publicPlayers={publicPlayers}
        actualPlayerId="player1"
      />
    );
    expect(screen.getByAltText(/Clock CLOCK_4/i)).toBeInTheDocument();

    // Ahora sí debe poder activar el hold nuevamente
    sendTimerMessage(8, 0);
    rerender(
      <Clock
        websocket={mockWebSocket}
        publicPlayers={publicPlayers}
        actualPlayerId="player1"
      />
    );
    expect(screen.getByAltText(/Clock CLOCK_8/i)).toBeInTheDocument();
  });

  it("limpia los timers al desmontar", () => {
    const publicPlayers = [{ id: "player1", turnStatus: "playing" }];
    const { unmount } = render(
      <Clock
        websocket={mockWebSocket}
        publicPlayers={publicPlayers}
        actualPlayerId="player1"
      />
    );

    sendTimerMessage(8, 0);
    
    // Espiar clearTimeout
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
    
    unmount();

    // Verificar que se llamó clearTimeout
    expect(clearTimeoutSpy).toHaveBeenCalled();
    
    clearTimeoutSpy.mockRestore();
  });

  it("ignora mensajes de websocket que no son 'timer'", () => {
    const publicPlayers = [{ id: "player1", turnStatus: "playing" }];
    render(
      <Clock
        websocket={mockWebSocket}
        publicPlayers={publicPlayers}
        actualPlayerId="player1"
      />
    );

    // Enviar mensaje no-timer
    const message = {
      data: JSON.stringify({
        event: "other",
        payload: { something: "else" },
      }),
    };
    messageListeners.forEach((listener) => listener(message));

    // Debe seguir mostrando CLOCK_0 (imagen inicial)
    expect(screen.getByAltText(/Clock CLOCK_0/i)).toBeInTheDocument();
  });

  it("maneja errores de parsing de JSON sin romper", () => {
    const publicPlayers = [{ id: "player1", turnStatus: "playing" }];
    render(
      <Clock
        websocket={mockWebSocket}
        publicPlayers={publicPlayers}
        actualPlayerId="player1"
      />
    );

    // Enviar mensaje inválido
    const message = { data: "invalid json{" };
    messageListeners.forEach((listener) => listener(message));

    // No debe romper, sigue mostrando la imagen inicial
    expect(screen.getByAltText(/Clock CLOCK_0/i)).toBeInTheDocument();
  });

  it("aplica la clase 'active' cuando activeEffect es true", () => {
    const publicPlayers = [{ id: "player1", turnStatus: "playing" }];
    const { container } = render(
      <Clock
        websocket={mockWebSocket}
        publicPlayers={publicPlayers}
        actualPlayerId="player1"
        activeEffect={true}
      />
    );

    expect(container.querySelector(".clock-root.active")).toBeInTheDocument();
    expect(container.querySelector(".clock-img-area.active")).toBeInTheDocument();
    expect(container.querySelector(".clock-image.active")).toBeInTheDocument();
  });

  it("calcula correctamente los octavos con tiempo ajustado (total - 3)", () => {
    const publicPlayers = [{ id: "player1", turnStatus: "playing" }];
    const { rerender } = render(
      <Clock
        websocket={mockWebSocket}
        publicPlayers={publicPlayers}
        actualPlayerId="player1"
      />
    );

    // Con eventTime=8, adjustedTotal = 5
    // Cada octavo = 5/8 = 0.625 segundos

    // timeLeft=8 -> elapsed=0 -> 0/0.625=0 -> CLOCK_0
    sendTimerMessage(8, 8);
    expect(screen.getByAltText(/Clock CLOCK_0/i)).toBeInTheDocument();

    // timeLeft=7.375 -> elapsed=0.625 -> 0.625/0.625=1 -> CLOCK_1
    sendTimerMessage(8, 7.375);
    rerender(
      <Clock
        websocket={mockWebSocket}
        publicPlayers={publicPlayers}
        actualPlayerId="player1"
      />
    );
    expect(screen.getByAltText(/Clock CLOCK_1/i)).toBeInTheDocument();

    // timeLeft=4 -> elapsed=4 -> 4/0.625=6.4, floor=6 -> CLOCK_6
    sendTimerMessage(8, 4);
    rerender(
      <Clock
        websocket={mockWebSocket}
        publicPlayers={publicPlayers}
        actualPlayerId="player1"
      />
    );
    expect(screen.getByAltText(/Clock CLOCK_6/i)).toBeInTheDocument();

    // timeLeft=3.5 -> elapsed=4.5 -> 4.5/0.625=7.2, floor=7 -> CLOCK_7
    sendTimerMessage(8, 3.5);
    rerender(
      <Clock
        websocket={mockWebSocket}
        publicPlayers={publicPlayers}
        actualPlayerId="player1"
      />
    );
    expect(screen.getByAltText(/Clock CLOCK_7/i)).toBeInTheDocument();

    // timeLeft=3 -> entra en zona especial -> CLOCK_S3
    sendTimerMessage(8, 3);
    rerender(
      <Clock
        websocket={mockWebSocket}
        publicPlayers={publicPlayers}
        actualPlayerId="player1"
      />
    );
    expect(screen.getByAltText(/Clock CLOCK_S3/i)).toBeInTheDocument();
  });
});