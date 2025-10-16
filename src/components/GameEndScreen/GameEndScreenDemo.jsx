import React, { useEffect, useRef } from "react";
import GameEndSreen from "./GameEndSreen";

// A simple fake WebSocket that mimics real behavior
class FakeWebSocket {
  constructor() {
    this.listeners = {};
  }

  addEventListener(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  removeEventListener(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
  }

  // Simulate receiving a message from server
  sendFakeMessage(data) {
    const event = { data: JSON.stringify(data) };
    if (this.listeners["message"]) {
      this.listeners["message"].forEach((cb) => cb(event));
    }
  }
}

export default function GameEndScreenDemo() {
  const fakeWs = useRef(new FakeWebSocket());

  useEffect(() => {
    // Simulate message arrival after 2 seconds
    setTimeout(() => {
      fakeWs.current.sendFakeMessage({
        event: "gameEnded",
        payload: [
          { name: "Alice", role: "Detective" },
          { name: "Bob", role: "Murderer" },
          { name: "Charlie", role: "Accomplice" },
        ],
      });
    }, 2000);
  }, []);

  return (
    <div style={{ background: "#111", height: "100vh", color: "#fff" }}>
      <h1 style={{ textAlign: "center", paddingTop: "40px" }}>
        🔧 GameEndScreen Demo
      </h1>
      <p style={{ textAlign: "center" }}>
        Waiting for fake WebSocket message... (appears after 2 seconds)
      </p>
      <GameEndSreen websocket={fakeWs.current} />
    </div>
  );
}
