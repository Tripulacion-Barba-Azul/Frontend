import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./Chat.css";

/**
 * Chat component
 * - Renders badge + window as siblings (no outer wrapper).
 * - Opens/closes window by clicking the badge.
 * - Uses VW units in CSS.
 *
 * Props (ONLY):
 * - websocket: WebSocket instance (required)
 * - currentPlayerId: number (required)
 * - player: either
 *     a) Array<{ id:number, name:string }>
 *     b) Record<number,string>
 *     c) (id:number) => string
 * - theme: "gold" | "blue" (default "gold")
 */
export default function Chat({
  websocket,
  currentPlayerId,
  player,
  theme = "gold",
}) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [messages, setMessages] = useState([]); // {playerId:number,msg:string,ts:number}[]
  const [input, setInput] = useState("");
  const listRef = useRef(null);

  // Ensure WebSocket.OPEN is defined across environments
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!("WebSocket" in window)) window.WebSocket = { OPEN: 1 };
      else if (typeof window.WebSocket.OPEN !== "number")
        window.WebSocket.OPEN = 1;
    }
  }, []);

  // Connection status
  const isConnected = useMemo(() => {
    try {
      return (
        websocket && websocket.readyState === (window.WebSocket?.OPEN ?? 1)
      );
    } catch {
      return false;
    }
  }, [websocket]);

  // Resolve display name for a given id using the flexible `player` prop
  const nameOf = useCallback(
    (id) => {
      if (typeof player === "function") return player(id) ?? `Player ${id}`;
      if (Array.isArray(player))
        return player.find((p) => p?.id === id)?.name ?? `Player ${id}`;
      if (player && typeof player === "object")
        return player[id] ?? `Player ${id}`;
      return `Player ${id}`;
    },
    [player]
  );

  // Toggle window; reset unread when opening
  const toggleOpen = useCallback(() => {
    setOpen((v) => {
      const n = !v;
      if (n) setUnread(0);
      return n;
    });
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  // Handle incoming WS messages
  useEffect(() => {
    if (!websocket) return;
    const onMessage = (evt) => {
      let data = evt?.data;
      try {
        if (typeof data === "string") data = JSON.parse(data);
      } catch {
        return; // ignore non-JSON frames
      }
      if (!data || data.event !== "chatMessage" || !data.payload) return;
      const { playerId, msg } = data.payload;
      if (typeof msg !== "string") return;

      setMessages((prev) => [...prev, { playerId, msg, ts: Date.now() }]);
      if (!open && playerId !== currentPlayerId) setUnread((u) => u + 1);
    };

    websocket.addEventListener("message", onMessage);
    return () => {
      try {
        websocket.removeEventListener("message", onMessage);
      } catch {
        /* noop */
      }
    };
  }, [websocket, open, currentPlayerId]);

  // Send a message to server
  const sendMessage = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || !isConnected) return;
    try {
      websocket.send(
        JSON.stringify({
          event: "chatMessage",
          payload: { playerId: currentPlayerId, msg: trimmed },
        })
      );
      setInput(""); // will re-appear through broadcast to all players
    } catch (err) {
      console.warn("Failed to send chat message:", err);
    }
  }, [input, isConnected, websocket, currentPlayerId]);

  const onEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Badge (position this with your own global CSS) */}
      <button
        type="button"
        className={`chatBadge chatTheme--${theme}`}
        aria-label={open ? "Close chat" : "Open chat"}
        onClick={toggleOpen}
      >
        <ChatIcon />
        {unread > 0 && (
          <span className="chatBadge__count" aria-label={`${unread} unread`}>
            {unread}
          </span>
        )}
      </button>

      {/* Window (position this with your own global CSS) */}
      {open && (
        <div
          className={`chatWindow chatTheme--${theme}`}
          role="dialog"
          aria-label="Game chat"
        >
          <div className="chatWindow__header">
            <div className="chatWindow__title">Chat</div>
            <button
              type="button"
              className="chatWindow__close"
              aria-label="Close chat"
              onClick={toggleOpen}
            >
              ×
            </button>
          </div>

          <div
            className="chatWindow__messages"
            ref={listRef}
            aria-live="polite"
          >
            {messages.map((m, i) => {
              const mine = m.playerId === currentPlayerId;
              return (
                <div
                  key={`${m.ts}-${i}`}
                  className={`chatMessage ${mine ? "isMine" : "isTheirs"}`}
                >
                  <div className="chatMessage__name">
                    {mine ? "You" : nameOf(m.playerId)}
                  </div>
                  <div className="chatMessage__bubble">{m.msg}</div>
                </div>
              );
            })}
          </div>

          <div className="chatWindow__inputRow">
            <input
              className="chatInput"
              type="text"
              placeholder={isConnected ? "Type a message..." : "Connecting..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onEnter}
              disabled={!isConnected}
              aria-disabled={!isConnected}
            />
            <button
              type="button"
              className="chatSend"
              onClick={sendMessage}
              disabled={!isConnected || input.trim() === ""}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** Minimal icon for the badge */
function ChatIcon() {
  return (
    <svg width="1.6vw" height="1.6vw" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z"
        fill="currentColor"
        opacity="0.12"
      />
      <path
        d="M19 5H5a2 2 0 0 0-2 2v12l4-2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm-2 6H7v-2h10v2Zm-6 4H7v-2h4v2Z"
        fill="currentColor"
      />
    </svg>
  );
}
