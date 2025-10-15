// EffectScenarioRunnerAuto.jsx
import React, { useEffect, useMemo, useState } from "react";
import EffectManager from "./EffectManager";

/** ─────────────────────────────────────────────────────────────────────────────
 * EDIT BELOW: Hardcoded example data you can freely change
 * These follow the exact schemas you provided for publicData and privateData
 * ────────────────────────────────────────────────────────────────────────────*/

/** Hardcoded publicData (server-public state) */
const PUBLIC_DATA = {
  actionStatus: "unblocked", // "blocked" | "unblocked"
  gameStatus: "inProgress", // "waiting" | "inProgress" | "finished"
  regularDeckCount: 28,
  discardPileTop: { id: 901, name: "Hercule Poirot" },
  draftCards: [
    { id: 1001, name: "Blackmail" },
    { id: 1002, name: "Faux Pas" },
    { id: 1003, name: "Devious Plan" },
  ],
  discardPileCount: 12,
  players: [
    {
      id: 1,
      name: "You",
      avatar: 1,
      socialDisgrace: false,
      turnOrder: 1,
      turnStatus: "playing", // "waiting" | "playing" | "discarding" | "discardingOpt" | "drawing"
      cardCount: 4,
      // In PUBLIC data: hidden secrets must have name = null
      secrets: [
        { id: 10, revealed: true, name: "You are the murderer" },
        { id: 11, revealed: false, name: "You are the murderer" },
      ],
      sets: [
        {
          setId: 201,
          setName: "Hercule Poirot",
          cards: [
            { id: 3001, name: "Ariadne Oliver" },
            { id: 3002, name: "Ariadne Oliver" },
            { id: 3003, name: "Ariadne Oliver" },
          ],
        },
      ],
    },
    {
      id: 2,
      name: "Alice",
      avatar: 2,
      socialDisgrace: false,
      turnOrder: 2,
      turnStatus: "waiting",
      cardCount: 3,
      secrets: [
        { id: 20, revealed: true, name: "You are the murderer" },
        { id: 21, revealed: false, name: null },
      ],
      sets: [
        {
          setId: 202,
          setName: "Miss Marple",
          cards: [
            { id: 3101, name: "Ariadne Oliver" },
            { id: 3102, name: "Ariadne Oliver" },
            { id: 3103, name: "Ariadne Oliver" },
          ],
        },
      ],
    },
    {
      id: 3,
      name: "Bob",
      avatar: 3,
      socialDisgrace: false,
      turnOrder: 3,
      turnStatus: "drawing",
      cardCount: 5,
      secrets: [
        { id: 30, revealed: true, name: "Prankster" },
        { id: 31, revealed: false, name: null },
      ],
      sets: [
        {
          setId: 203,
          setName: "Hercule Poirot",
          cards: [
            { id: 3201, name: "Ariadne Oliver" },
            { id: 3202, name: "Ariadne Oliver" },
            { id: 3203, name: "Ariadne Oliver" },
          ],
        },
      ],
    },
    {
      id: 4,
      name: "Eve",
      avatar: 4,
      socialDisgrace: true,
      turnOrder: 4,
      turnStatus: "discardingOpt",
      cardCount: 2,
      secrets: [
        { id: 40, revealed: true, name: "Prankster" },
        { id: 41, revealed: false, name: null },
      ],
      sets: [],
    },
  ],
};

/** Hardcoded privateData (your private state) */
const PRIVATE_DATA = {
  cards: [
    { id: 401, name: "Hercule Poirot", type: "detective" },
    { id: 402, name: "Hercule Poirot", type: "event" },
    { id: 403, name: "Hercule Poirot", type: "devious" },
    { id: 404, name: "Hercule Poirot", type: "event" },
  ],
  // In PRIVATE data you know names for both hidden/revealed
  secrets: [
    { id: 510, revealed: false, name: "You are the murderer" }, // hidden but known to you
    { id: 511, revealed: true, name: "You are the murderer" },
    { id: 512, revealed: false, name: null },
  ],
  role: "detective", // "murderer" | "accomplice" | "detective"
  ally: null, // e.g., { id: 2, role: "accomplice" } if applicable
};

/** Optional: event-specific payloads. Edit as you need for your effects. */
const EVENT_PAYLOADS = {
  // Example: some flows (e.g., lookIntoTheAshes) expect cards in payload
  lookIntoTheAshes: {
    cards: [
      { id: 8001, name: "Hercule Poirot" },
      { id: 8002, name: "Hercule Poirot" },
      { id: 8003, name: "Hercule Poirot" },
      { id: 8004, name: "Hercule Poirot" },
      { id: 8005, name: "Hercule Poirot" },
    ],
  },
  // Add more event payloads here if your EffectManager expects them
};

/** ────────────────────────────────────────────────────────────────────────────
 * Simple in-file mock WebSocket
 * ────────────────────────────────────────────────────────────────────────────*/
class MockWebSocket {
  constructor() {
    this.listeners = new Map();
    this.onmessage = null;
  }
  addEventListener(type, cb) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(cb);
  }
  removeEventListener(type, cb) {
    this.listeners.get(type)?.delete(cb);
  }
  emitMessage(payload) {
    const data =
      typeof payload === "string" ? payload : JSON.stringify(payload);
    const evt = { data };
    if (typeof this.onmessage === "function") this.onmessage(evt);
    const set = this.listeners.get("message");
    if (set) set.forEach((cb) => cb(evt));
  }
}

/** Helper: send baseline then effect */
function emitScenario(ws, event) {
  if (!ws) return;
  ws.emitMessage({ event: "publicData", payload: PUBLIC_DATA });
  ws.emitMessage({ event: "privateData", payload: PRIVATE_DATA });
  const payload = EVENT_PAYLOADS[event] ?? {};
  ws.emitMessage({ event, payload });
}

/**
 * EffectScenarioRunnerAuto
 * - Single required prop: `event` (string)
 * - publicData/privateData are hardcoded in this file — just edit the constants above
 */
export default function EffectScenarioRunnerAuto({ event }) {
  const [ws, setWs] = useState(null);
  const [runNonce, setRunNonce] = useState(0);

  // Create a WS instance once
  useEffect(() => {
    const socket = new MockWebSocket();
    setWs(socket);
    return () => setWs(null);
  }, []);

  // Emit baseline + event whenever ws ready, event changes, or user re-runs
  useEffect(() => {
    if (!ws || !event) return;
    emitScenario(ws, event);
  }, [ws, event, runNonce]);

  // If you need derived playersAll on consumer side, EffectManager can build it;
  // here we only pass what your EffectManager expects: wsRef, publicData, privateData, actualPlayerId.
  const actualPlayerId = 1;

  return (
    <div className="w-full h-full p-4 space-y-4">
      <div className="flex items-center justify-between rounded-2xl border p-3">
        <div className="text-sm">
          <span className="font-semibold">Effect:</span>{" "}
          <span>{event || "(none)"}</span>
        </div>
        <button
          className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50"
          onClick={() => setRunNonce((n) => n + 1)}
          title="Re-emit publicData/privateData and the selected effect"
        >
          Re-run scenario
        </button>
      </div>

      <div className="rounded-2xl border p-4">
        <EffectManager
          wsRef={ws} // pass raw instance (EffectManager uses .onmessage)
          publicData={PUBLIC_DATA} // hardcoded publicData (edit above)
          privateData={PRIVATE_DATA} // hardcoded privateData (edit above)
          actualPlayerId={actualPlayerId}
        />
      </div>
    </div>
  );
}
