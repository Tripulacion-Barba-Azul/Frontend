// Chat.test.jsx
import React from "react";
import {
  render,
  screen,
  fireEvent,
  act,
  waitForElementToBeRemoved,
} from "@testing-library/react";

/* ---------- Runner-agnostic mocking (Jest or Vitest) ---------- */
const T = globalThis.vi ?? globalThis.jest;

/* Mock de avatares. Debe ir ANTES de importar Chat. */
(T?.mock ?? (() => {}))("../../../utils/generalMaps.js", () => ({
  AVATAR_MAP: {
    1: "avatar1.png",
    2: "avatar2.png",
    3: "avatar3.png",
    4: "avatar4.png",
    5: "avatar5.png",
    6: "avatar6.png",
  },
}));

/* Import del componente ya con el mock activo */
import Chat from "./Chat";

/* ---------- Spy util si no hay jest.fn/vi.fn ---------- */
function createSpy() {
  const fn = (...args) => {
    fn.mock.calls.push(args);
  };
  fn.mock = { calls: [] };
  return fn;
}

/* ---------- WebSocket mock ---------- */
class MockSocket {
  constructor() {
    this.readyState = 1; // OPEN
    this._messageHandlers = new Set();
    this.send = T?.fn ? T.fn() : createSpy();
  }
  addEventListener(type, cb) {
    if (type === "message") this._messageHandlers.add(cb);
  }
  removeEventListener(type, cb) {
    if (type === "message") this._messageHandlers.delete(cb);
  }
  emitChat(playerId, msg) {
    const payload = { event: "chatMessage", payload: { playerId, msg } };
    const evt = { data: JSON.stringify(payload) };
    this._messageHandlers.forEach((cb) => cb(evt));
  }
}

/* ---------- Setup helper ---------- */
function setup({ currentPlayerId = 1 } = {}) {
  globalThis.window ??= {};
  globalThis.window.WebSocket = { OPEN: 1 };

  const socket = new MockSocket();
  const players = [
    { id: 1, name: "You", avatar: 1 },
    { id: 2, name: "Alice", avatar: 2 },
    { id: 3, name: "Bob", avatar: 3 },
  ];

  render(
    <Chat
      websocket={socket}
      currentPlayerId={currentPlayerId}
      players={players}
    />
  );
  return { socket, players };
}

/* ===================== TESTS ===================== */
describe("Chat component (gold, final)", () => {
  test("badge shows unread counter when messages arrive while closed", () => {
    const { socket } = setup();

    expect(screen.queryByText(/^\d+\+?$/)).toBeNull();

    // 1 mensaje => "1"
    act(() => socket.emitChat(2, "Hello!"));
    expect(screen.getByText("1")).toBeInTheDocument();

    // 120 mensajes => "99+"
    act(() => {
      for (let i = 0; i < 120; i++) socket.emitChat(3, `m${i}`);
    });
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  test("opens on badge click, clears unread and renders message", () => {
    const { socket } = setup();

    act(() => socket.emitChat(2, "Nice set!"));
    fireEvent.click(screen.getByRole("button", { name: /open chat/i }));

    expect(screen.queryByText("1")).toBeNull();
    expect(
      screen.getByRole("dialog", { name: /game chat/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Nice set!")).toBeInTheDocument();
  });

  test("sends a message via websocket and clears input", () => {
    const { socket } = setup();
    fireEvent.click(screen.getByRole("button", { name: /open chat/i }));

    const input = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(input, { target: { value: "Hi all" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    const calls = socket.send.mock?.calls ?? [];
    expect(calls.length).toBeGreaterThan(0);
    const sent = JSON.parse(calls[0][0]);
    expect(sent.event).toBe("chatMessage");
    expect(sent.payload.msg).toBe("Hi all");
    expect(sent.payload.playerId).toBe(1);
    expect(input).toHaveValue("");
  });

  test("closes the chat on Escape (handles exit animation)", async () => {
    setup();
    // Abrir
    fireEvent.click(screen.getByRole("button", { name: /open chat/i }));
    const dlg = screen.getByRole("dialog", { name: /game chat/i });
    expect(dlg).toBeInTheDocument();

    // Cerrar con Esc (activa .is-exiting por ~220ms)
    const useFake = !!T?.useFakeTimers;
    if (useFake) T.useFakeTimers();

    fireEvent.keyDown(window, { key: "Escape", code: "Escape", keyCode: 27 });

    // Mientras anima, existe con clase is-exiting
    expect(screen.getByRole("dialog", { name: /game chat/i })).toHaveClass(
      "is-exiting"
    );

    if (useFake) {
      // Avanzar timers de la animación y forzar re-render
      act(() => {
        T.advanceTimersByTime(300);
      });
      expect(screen.queryByRole("dialog", { name: /game chat/i })).toBeNull();
      T.useRealTimers?.();
    } else {
      // Fallback con timers reales: esperar a que se desmonte
      await waitForElementToBeRemoved(() =>
        screen.queryByRole("dialog", { name: /game chat/i })
      );
    }
  });

  test("renders other player's avatar next to their message", () => {
    const { socket } = setup();
    fireEvent.click(screen.getByRole("button", { name: /open chat/i }));

    act(() => socket.emitChat(2, "Avatar test"));
    expect(screen.getByAltText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Avatar test")).toBeInTheDocument();
  });

  test("sends message on Enter key", () => {
    const { socket } = setup();
    fireEvent.click(screen.getByRole("button", { name: /open chat/i }));

    const input = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(input, { target: { value: "Enter send" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    const calls = socket.send.mock?.calls ?? [];
    expect(calls.length).toBeGreaterThan(0);
  });
});
