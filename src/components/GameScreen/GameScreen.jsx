// GameScreen.jsx
import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Lobby from "../Lobby/Lobby";
import SyncOrchestrator from "../Sync/SyncOrchestrator";
import GameEndScreen from "../GameEndScreen/GameEndSreen";
import Notifier from "../Notifier/Notifier";
import EffectManager from "../EffectManager/EffectManager";
import PresentationScreen from "../PresentationScreen/PresentationScreen";
import BackgroundMusicPlayer from "../BackgroundMusicPlayer/BackgroundMusicPlayer";

export default function GameScreen() {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const playerId = searchParams.get("playerId");
  const currentPlayerId = parseInt(playerId);

  const [isConnected, setIsConnected] = useState(false);
  const [started, setStarted] = useState(false);
  const [refreshLobby, setRefreshLobby] = useState(0);

  // NEW: has the presentation been shown/acknowledged?
  const [gamePresented, setGamePresented] = useState(false);

  const [publicData, setPublicData] = useState(null);
  const [privateData, setPrivateData] = useState(null);

  const wsRef = useRef(null);
  const wsEndpoint = `wss://dotc-production.up.railway.app/ws/${gameId}/${playerId}`;

  const handlePlayerJoined = () => setRefreshLobby((prev) => prev + 1);

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

  // Handle incoming messages
  useEffect(() => {
    const websocket = wsRef.current;
    if (!websocket) return;

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.event) {
          case "publicUpdate":
            setPublicData(data.payload);
            // Accept both snake_case and camelCase just in case
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

  // The game is ready once we have public & private data AND it has started
  const gameDataReady = Boolean(publicData && privateData && started);

  // Build props for PresentationScreen when ready
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
        role: privateData.ally.role, // "murderer" | "accomplice"
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
          {/* Mounted once for both PresentationScreen and SyncOrchestrator */}
          <BackgroundMusicPlayer
            src="/Music/BoardMusic.mp3" // put your 30s loop here
            // sources={["/audio/bgm.mp3","/audio/bgm.ogg"]} // optional fallback
            volume={0.4} // tweak if needed
            persistKey="bgm-muted" // shared preference across sessions
          />

          {!gamePresented ? (
            <PresentationScreen
              actualPlayer={presentationActualPlayer}
              ally={presentationAlly}
              close={setGamePresented}
            />
          ) : (
            <SyncOrchestrator
              publicData={publicData}
              privateData={privateData}
              currentPlayerId={currentPlayerId}
            />
          )}
        </>
      ) : (
        <Lobby
          id={parseInt(gameId)}
          playerId={currentPlayerId}
          onStartGame={() => setStarted(true)}
          ws={wsRef.current}
          isConnected={isConnected}
          refreshTrigger={refreshLobby}
        />
      )}

      {isConnected && wsRef.current && (
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
          <GameEndScreen websocket={wsRef.current} />
        </>
      )}
    </>
  );
}

// event: "privateUpdate"
// payload:  {
//   cards: [{ id: int, name: string, type: string }],
//   secrets: [{ id: int, revealed: bool, name: string }],
//   role: "murderer" | "accomplice" | "detective",
//   ally: { id: int, role: "murderer" | "accomplice" } | null
// }

// event: "publicUpdate"
// payload: {
//   actionStatus: "blocked" | "unblocked",
//   gameStatus: "waiting" | "in_progress" | "finished",
//   regularDeckCount: int,
//   discardPileTop: { id: int, name: string },
//   draftCards: [{ id: int, name: string }],
//   discardPileCount: int,
//   players: [{
//     id: int,
//     name: string,
//     avatar: int,
//     socialDisgrace: bool,
//     turnOrder: int,
//     turnStatus: "waiting" | "playing" | "discarding" | "discardingOpt" | "drawing",
//     cardCount: int,
//     secrets: [{ id: int, revealed: bool, name: string }],
//     sets: [{ setId: int, setName: string, cards: [{ id: int, name: string }] }]
//   }]
// }
