// ClockTestApp.jsx
import React, { useEffect, useRef, useState } from "react";
import Clock from "./Clock.jsx";

/**
 * Fake WS implemented with EventTarget. Dispatches messages asynchronously
 * (setTimeout 0) to avoid setState during render of the test component.
 */
export default function ClockTestApp() {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [turnStatus, setTurnStatus] = useState("waiting");
  const eventTime = 10;
  const fakeWs = useRef(null);

  // create fakeWs once
  useEffect(() => {
    fakeWs.current = new EventTarget();
    return () => {
      fakeWs.current = null;
    };
  }, []);

  // when running, send messages every 100ms (async dispatch)
  useEffect(() => {
    if (!fakeWs.current) return;
    let id;
    if (isRunning) {
      id = setInterval(() => {
        setTimeLeft((prev) => {
          const next = Math.max(prev - 0.1, 0);
          const message = {
            event: "timer",
            payload: { eventTime, timeLeft: Number(next.toFixed(1)) },
          };
          // dispatch asynchronously to avoid setState during render of other components
          setTimeout(() => {
            if (fakeWs.current)
              fakeWs.current.dispatchEvent(
                new MessageEvent("message", { data: JSON.stringify(message) })
              );
          }, 0);
          return next;
        });
      }, 100);
    }
    return () => clearInterval(id);
  }, [isRunning, eventTime]);

  const sendManual = (value) => {
    setTimeLeft(value);
    const msg = { event: "timer", payload: { eventTime, timeLeft: value } };
    // async dispatch
    setTimeout(() => {
      if (fakeWs.current)
        fakeWs.current.dispatchEvent(
          new MessageEvent("message", { data: JSON.stringify(msg) })
        );
    }, 0);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "#f4e1a3",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
      }}
    >
      <h2>Clock Test App</h2>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => {
            setIsRunning((r) => !r);
            // toggle playing/waiting for convenience
            setTurnStatus((s) => (s === "waiting" ? "playing" : "waiting"));
          }}
        >
          {isRunning ? "Pause" : "Start"}
        </button>

        <button onClick={() => sendManual(eventTime)}>Reset (full)</button>
        <button onClick={() => sendManual(6)}>Send 3s</button>
        <button onClick={() => sendManual(1)}>Send 1s</button>
        <button onClick={() => sendManual(0)}>Send 0s</button>

        <button onClick={() => setTurnStatus("waiting")}>Set waiting</button>
        <button onClick={() => setTurnStatus("playing")}>Set playing</button>
      </div>

      <div>
        <div>timeLeft (local): {timeLeft.toFixed(1)}s</div>
        <div>turnStatus: {turnStatus}</div>
      </div>

      {fakeWs.current && <Clock websocket={fakeWs.current} turnStatus={turnStatus} />}
    </div>
  );
}
