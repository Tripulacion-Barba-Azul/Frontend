// GameScreen.jsx

/**
 * @file GameScreen.jsx
 * @description Top-level game orchestrator. Handles WebSocket lifecycle,
 * switches between Lobby/Presentation/Live game, and mounts global event systems.
 *
 * Props: none (this component does not accept props).
 *
 * Data flow (high level):
 * - Connects to WS: ws://localhost:8000/ws/:gameId/:playerId
 * - Listens for public/private updates (see "API DOCUMENT" for exact payloads)
 * - Shows <Lobby> until: has both public & private data AND game has started
 * - Shows <PresentationScreen> once, then <SyncOrchestrator> for the live match
 *
 * Notes:
 * - State is intentionally split: connection flags, game start flag, and the
 *   public/private payloads. This reduces unnecessary re-renders in children.
 * - `gamePresented` gates the one-time presentation screen.
 * - Any event shape assumptions must follow the "API DOCUMENT".
 */

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Lobby from "../Lobby/Lobby";
import SyncOrchestrator from "./Sync/SyncOrchestrator";
import GameEndScreen from "./GameEndScreen/GameEndSreen";
import Notifier from "./Events/Notifier/Notifier";
import EffectManager from "./Events/EffectManager/EffectManager";
import PresentationScreen from "./PresentationScreen/PresentationScreen";
import BackgroundMusicPlayer from "./BackgroundMusicPlayer/BackgroundMusicPlayer";
import Clock from "./Clock/Clock";
import Chat from "./Chat/Chat";

export default function GameScreen() {
  // Router params & query: game and the current player id
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const playerId = searchParams.get("playerId");
  const currentPlayerId = parseInt(playerId);

  // Connection and flow flags
  const [isConnected, setIsConnected] = useState(false);
  const [started, setStarted] = useState(false);
  const [refreshLobby, setRefreshLobby] = useState(0);

  // One-time presentation gate (true after user closes it)
  const [gamePresented, setGamePresented] = useState(false);

  // Latest snapshots received from the server
  const [publicData, setPublicData] = useState(null);
  const [privateData, setPrivateData] = useState(null);

  // WS ref so we can attach/detach listeners and pass downstream without re-renders
  const wsRef = useRef(null);
  const wsEndpoint = `ws://localhost:8000/ws/${gameId}/${playerId}`;

  // When the server notifies "player_joined", bump this to re-fetch lobby
  const handlePlayerJoined = () => setRefreshLobby((prev) => prev + 1);

  /**
   * WebSocket connection lifecycle:
   * - Open the socket when we have a gameId
   * - Set basic open/close/error flags
   * - Clean up on unmount or when gameId changes
   *
   * Event messages are attached in a separate effect to avoid reassigning
   * handlers on each render.
   */
  useEffect(() => {
    if (!gameId) return;

    const websocket = new WebSocket(wsEndpoint);

    websocket.onopen = () => {
      console.log("✅ WebSocket connected");
      setIsConnected(true);
    };

    websocket.onclose = () => {
      console.log("❌ WebSocket disconnected");
      setIsConnected(false);
    };

    websocket.onerror = (error) => {
      console.error("⚠️ WebSocket error:", error);
      setIsConnected(false);
    };

    wsRef.current = websocket;

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [gameId]);

  /**
   * Message dispatcher:
   * - Parses JSON and routes by `data.event`
   * - Updates `publicData` / `privateData` and flags accordingly
   *
   * Event names & payloads must follow the "API DOCUMENT".
   * Here we only keep minimal guard logic (e.g., accept both snake/camel case).
   */
  useEffect(() => {
    const websocket = wsRef.current;
    if (!websocket) return;

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.event) {
          case "publicUpdate":
            setPublicData(data.payload);
            // Minimal normalization: accept either "in_progress" or "inProgress"
            if (
              data.payload?.gameStatus === "in_progress" ||
              data.payload?.gameStatus === "inProgress"
            ) {
              setStarted(true);
            }
            break;

          case "privateUpdate":
            setPrivateData(data.payload);
            break;

          case "player_joined":
            handlePlayerJoined();
            break;

          case "gameStarted":
            setStarted(true);
            break;

          default:
            console.warn("GAMESCREEN: Unhandled event:", data);
        }
      } catch (err) {
        console.warn("⚠️ Non-JSON message:", event.data);
      }
    };
  }, [wsRef.current]);

  // Ready = we have both data snapshots and the server says the game started
  const gameDataReady = Boolean(publicData && privateData && started);

  /**
   * Build presentation props once data is ready.
   * This extracts the current player's public info and optional ally descriptor,
   * leaving all semantics about roles to the "API DOCUMENT".
   */
  let presentationActualPlayer = null;
  let presentationAlly = null;

  if (gameDataReady) {
    const findPlayerById = (id) =>
      publicData?.players?.find((p) => Number(p.id) === Number(id));

    const me = findPlayerById(currentPlayerId);
    presentationActualPlayer = {
      name: me?.name ?? "You",
      role: privateData?.role ?? "detective",
      avatar: me?.avatar,
    };

    if (privateData?.ally?.id) {
      const allyPlayer = findPlayerById(privateData.ally.id);
      presentationAlly = {
        name: allyPlayer?.name ?? "Ally",
        role: privateData.ally.role, // see "API DOCUMENT"
        avatar: allyPlayer?.avatar,
      };
    } else {
      presentationAlly = null;
    }
  }

  return (
    <>
      {gameDataReady ? (
        <>
          {/* Global BGM (mounted once for Presentation + Live game) */}
          <BackgroundMusicPlayer
            src="/Music/BoardMusic.mp3" // 30s loop recommended
            // sources={["/audio/bgm.mp3","/audio/bgm.ogg"]} // optional fallbacks
            volume={0.4}
            persistKey="bgm-muted" // shared setting across sessions
          />

          {/* Gate: first show the role/ally presentation, then the live game */}
          {!gamePresented ? (
            <PresentationScreen
              actualPlayer={presentationActualPlayer}
              ally={presentationAlly}
              close={setGamePresented} // parent-controlled "dismiss"
            />
          ) : (
            <>
              <SyncOrchestrator
                publicData={publicData}
                privateData={privateData}
                currentPlayerId={currentPlayerId}
              />
            </>
          )}
        </>
      ) : (
        // Before start (or while waiting for snapshots), show the lobby
        <Lobby
          id={parseInt(gameId)}
          playerId={currentPlayerId}
          onStartGame={() => setStarted(true)}
          ws={wsRef.current}
          isConnected={isConnected}
          refreshTrigger={refreshLobby}
        />
      )}

      {/* Global, connection-bound systems (notifications, effects, end screen) */}
      {isConnected && gameDataReady && wsRef.current && (
        <>
          <Notifier
            publicData={publicData}
            actualPlayerId={currentPlayerId}
            wsRef={wsRef}
          />
          <EffectManager
            publicData={publicData}
            privateData={privateData}
            actualPlayerId={currentPlayerId}
            wsRef={wsRef}
          />
          <Chat
            websocket={wsRef.current}
            currentPlayerId={currentPlayerId}
            gameId={gameId}
            players={publicData.players}
          />
          {gamePresented && (
            <Clock
              websocket={wsRef.current}
              publicPlayers={publicData.players}
              actualPlayerId={currentPlayerId}
              activeEffect={false}
              actionStatus={publicData.actionStatus}
            />
          )}

          <GameEndScreen websocket={wsRef.current} />
        </>
      )}
    </>
  );
}
