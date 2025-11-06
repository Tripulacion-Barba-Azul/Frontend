import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./Chat.css";
import { AVATAR_MAP } from "../../../utils/generalMaps.js";

/**
 * Final "gold" chat component with close animation and capped unread badge.
 * Props:
 * - websocket: WebSocket ({event:"chatMessage", payload:{playerId,msg}})
 * - currentPlayerId: number
 * - players: Array<{id,name,avatar?}> | Record<number,string|{name,avatar?}>
 */
export default function Chat({ websocket, currentPlayerId, players }) {
  const [open, setOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [unread, setUnread] = useState(0);
  const [messages, setMessages] = useState([]); // {playerId,msg,ts}
  const [input, setInput] = useState("");
  const listRef = useRef(null);

  // Ensure WebSocket.OPEN is defined (defensive for mocks)
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!("WebSocket" in window)) window.WebSocket = { OPEN: 1 };
      else if (typeof window.WebSocket.OPEN !== "number")
        window.WebSocket.OPEN = 1;
    }
  }, []);

  const isConnected = useMemo(() => {
    try {
      return (
        websocket && websocket.readyState === (window.WebSocket?.OPEN ?? 1)
      );
    } catch {
      return false;
    }
  }, [websocket]);

  // Resolve name
  const nameOf = useCallback(
    (id) => {
      if (Array.isArray(players)) {
        const p = players.find((p) => p?.id === id);
        if (p?.name) return p.name;
      } else if (players && typeof players === "object") {
        const v = players[id];
        if (typeof v === "string") return v;
        if (v && typeof v === "object" && v.name) return v.name;
      }
      return `Player ${id}`;
    },
    [players]
  );

  // Resolve avatar src
  const avatarSrcOf = useCallback(
    (id) => {
      if (Array.isArray(players)) {
        const p = players.find((p) => p?.id === id);
        if (p?.avatar && AVATAR_MAP[p.avatar]) return AVATAR_MAP[p.avatar];
      } else if (players && typeof players === "object") {
        const v = players[id];
        if (v && typeof v === "object" && v.avatar && AVATAR_MAP[v.avatar])
          return AVATAR_MAP[v.avatar];
      }
      return AVATAR_MAP[id];
    },
    [players]
  );

  // Open/close with exit animation
  const CLOSE_MS = 220;

  const openChat = useCallback(() => {
    setUnread(0);
    setIsExiting(false);
    setOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsExiting(true);
    const t = setTimeout(() => {
      setOpen(false);
      setIsExiting(false);
      clearTimeout(t);
    }, CLOSE_MS);
  }, []);

  const onBadgeClick = useCallback(() => {
    if (!open) openChat();
    else if (!isExiting) closeChat();
  }, [open, isExiting, openChat, closeChat]);

  // Auto-scroll
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  // Listen websocket
  useEffect(() => {
    if (!websocket) return;
    const onMessage = (evt) => {
      let data = evt?.data;
      try {
        if (typeof data === "string") data = JSON.parse(data);
      } catch {
        return;
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
      } catch {}
    };
  }, [websocket, open, currentPlayerId]);

  // Send message
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
      setInput("");
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

  // Close on Escape (uses same close animation)
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      const isEsc = e.key === "Escape" || e.key === "Esc" || e.keyCode === 27;
      if (isEsc) {
        e.preventDefault();
        if (!isExiting) closeChat();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, isExiting, closeChat]);

  // NEW: cap unread display at 99+
  const displayUnread = unread > 99 ? "99+" : String(unread);

  return (
    <>
      {/* Badge */}
      <button
        type="button"
        className="chatBadge"
        aria-label={open ? "Close chat" : "Open chat"}
        onClick={onBadgeClick}
      >
        <ChatIcon />
        {unread > 0 && (
          <span
            className="chatBadge__count"
            aria-label={`${displayUnread} unread`}
          >
            {displayUnread}
          </span>
        )}
      </button>

      {/* Window */}
      {open && (
        <div
          className={`chatWindow${isExiting ? " is-exiting" : ""}`}
          role="dialog"
          aria-label="Game chat"
        >
          <div className="chatWindow__header">
            <div className="chatWindow__title">Chat</div>
            <button
              type="button"
              className="chatWindow__close"
              aria-label="Close chat"
              onClick={closeChat}
            >
              <span className="chatCloseIcon" aria-hidden="true" />
            </button>
          </div>

          <div
            className="chatWindow__messages"
            ref={listRef}
            aria-live="polite"
          >
            {messages.map((m, i) => {
              const mine = m.playerId === currentPlayerId;
              const avatarSrc = !mine ? avatarSrcOf(m.playerId) : undefined;
              return (
                <div
                  key={`${m.ts}-${i}`}
                  className={`chatMessage ${mine ? "isMine" : "isTheirs"}`}
                >
                  <div className="chatMessage__name">
                    {mine ? "You" : nameOf(m.playerId)}
                  </div>
                  <div className="chatMessage__row">
                    {!mine && avatarSrc && (
                      <img
                        className="chatAvatar"
                        src={avatarSrc}
                        alt={nameOf(m.playerId)}
                        draggable="false"
                      />
                    )}
                    <div className="chatMessage__bubble">{m.msg}</div>
                  </div>
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

/** Minimal badge icon (vw units) */
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
