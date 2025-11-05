import React, { useEffect, useMemo, useRef, useState } from "react";
import { MemoryRouter } from "react-router-dom";
import SyncOrchestrator from "../Sync/SyncOrchestrator.jsx";
import Chat from "./Chat";
import "./ExampleChat.css";

/**
 * Minimal in-memory WebSocket mock:
 * - Broadcasts any `send()` payload to all listeners after a small delay.
 * - You can simulate remote incoming messages via `simulateIncoming(...)`.
 */
class MockSocket {
  constructor({ echoDelayMs = 120 } = {}) {
    this.readyState = 1; // OPEN
    this._listeners = new Set();
    this._echoDelayMs = echoDelayMs;
  }
  addEventListener(type, cb) {
    if (type === "message" && typeof cb === "function") this._listeners.add(cb);
  }
  removeEventListener(type, cb) {
    if (type === "message") this._listeners.delete(cb);
  }
  send(raw) {
    const payload = typeof raw === "string" ? safeParse(raw) : raw;
    if (!payload) return;
    setTimeout(() => this._broadcast(payload), this._echoDelayMs);
  }
  simulateIncoming(playerId, msg) {
    this._broadcast({ event: "chatMessage", payload: { playerId, msg } });
  }
  _broadcast(data) {
    const evt = {
      data: typeof data === "string" ? data : JSON.stringify(data),
    };
    this._listeners.forEach((cb) => cb(evt));
  }
  open() {
    this.readyState = 1;
  }
  close() {
    this.readyState = 3;
  }
}
function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/** Build a deterministic initial snapshot for a 6-player board. */
function buildInitialSnapshots() {
  const players = [
    { id: 1, name: "You", avatar: 1 },
    { id: 2, name: "Alice", avatar: 2 },
    { id: 3, name: "Bob", avatar: 3 },
    { id: 4, name: "Carol", avatar: 4 },
    { id: 5, name: "Dave", avatar: 5 },
    { id: 6, name: "Eve", avatar: 6 },
  ];

  let gid = 1;

  const mkSet = (setName, cardNames) => ({
    setId: gid++,
    setName,
    cards: cardNames.map((n) => ({ id: gid++, name: n })),
  });

  const mkPublicSecrets = (count = 2) =>
    Array.from({ length: count }, () => ({
      id: gid++,
      revealed: false,
      name: null,
    }));

  const publicPlayers = players.map((p, idx) => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    socialDisgrace: false,
    turnOrder: idx + 1,
    turnStatus: idx === 0 ? "playing" : "waiting",
    cardCount: 3,
    secrets: mkPublicSecrets(2),
    sets:
      idx % 3 === 0
        ? [mkSet("Hercule Poirot", ["Hercule Poirot"])]
        : idx % 3 === 1
        ? [mkSet("Miss Marple", ["Miss Marple"])]
        : [mkSet("Tommy Beresford", ["Tommy Beresford"])],
  }));

  const publicData = {
    actionStatus: "blocked",
    gameStatus: "inProgress",
    regularDeckCount: 40,
    discardPileTop: { id: gid++, name: "Not so Fast!" },
    draftCards: [
      { id: gid++, name: "Another Victim" },
      { id: gid++, name: "Cards off the table" },
      { id: gid++, name: "Dead Card Folly" },
    ],
    discardPileCount: 2,
    players: publicPlayers,
  };

  const privateData = {
    role: "detective",
    ally: null,
    secrets: [
      { id: gid++, revealed: false, name: "Prankster" },
      { id: gid++, revealed: false, name: "Untouched" },
    ],
    cards: [
      { id: gid++, name: "Hercule Poirot", type: "detective" },
      { id: gid++, name: "Point Your Suspicions", type: "event" },
      { id: gid++, name: "Blackmailed!", type: "devious" },
    ],
  };

  return { publicData, privateData, players };
}

export default function ExampleChat() {
  // Ensure WebSocket.OPEN constant exists
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!("WebSocket" in window)) window.WebSocket = { OPEN: 1 };
      else if (typeof window.WebSocket.OPEN !== "number")
        window.WebSocket.OPEN = 1;
    }
  }, []);

  // Initial board snapshot
  const { publicData, privateData, players } = useMemo(
    buildInitialSnapshots,
    []
  );

  // Mock socket for chat
  const socketRef = useRef(null);
  if (!socketRef.current)
    socketRef.current = new MockSocket({ echoDelayMs: 120 });
  const socket = socketRef.current;

  // Optional: auto-simulate incoming chat
  const [autoSim, setAutoSim] = useState(false);
  useEffect(() => {
    if (!autoSim) return;
    const pool = [
      "Hello!",
      "Your move?",
      "Well played.",
      "Nice set!",
      "Thinking...",
    ];
    const id = setInterval(() => {
      const who = 2 + Math.floor(Math.random() * 5);
      socket.simulateIncoming(
        who,
        pool[Math.floor(Math.random() * pool.length)]
      );
    }, 1800);
    return () => clearInterval(id);
  }, [autoSim, socket]);

  const currentPlayerId = 1;

  return (
    // Wrap everything in a Router so subcomponents can use useLocation/useNavigate
    <MemoryRouter initialEntries={["/game?playerId=1"]}>
      <div className="exampleRoot">
        {/* Background board */}
        <SyncOrchestrator
          publicData={publicData}
          privateData={privateData}
          currentPlayerId={currentPlayerId}
        />

        {/* Debug bar (optional) */}
        <div className="exampleBar">
          <button onClick={() => socket.simulateIncoming(2, "Hi from Alice")}>
            Msg from Alice
          </button>
          <button onClick={() => socket.simulateIncoming(3, "Hey from Bob")}>
            Msg from Bob
          </button>
          <label
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <input
              type="checkbox"
              checked={autoSim}
              onChange={(e) => setAutoSim(e.target.checked)}
            />
            Auto simulate
          </label>
        </div>

        {/* Chat overlay */}
        <Chat
          websocket={socket}
          currentPlayerId={currentPlayerId}
          player={players} // accepts array or mapper
          theme="gold" // "gold" or "blue"
        />
      </div>
    </MemoryRouter>
  );
}
