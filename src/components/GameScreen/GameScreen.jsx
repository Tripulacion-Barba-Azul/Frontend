import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Lobby from "../Lobby/Lobby";
import SyncOrchestrator from "../Sync/SyncOrchestrator";
import GameEndScreen from "../GameEndScreen/GameEndSreen";
import Notifier from "../Notifier/Notifier";
import EffectManager from "../EffectManager/EffectManager";

export default function GameScreen() {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const playerId = searchParams.get("playerId");

  const [isConnected, setIsConnected] = useState(false);
  const [started, setStarted] = useState(false);
  const [refreshLobby, setRefreshLobby] = useState(0);

  const [publicData, setPublicData] = useState(null);
  const [privateData, setPrivateData] = useState(null);

  const wsRef = useRef(null);
  const wsEndpoint = `ws://localhost:8000/ws/${gameId}/${playerId}`;

  const handlePlayerJoined = () => setRefreshLobby((prev) => prev + 1);

  useEffect(() => {
    if (!gameId) return;

    const websocket = new WebSocket(wsEndpoint);

    websocket.onopen = () => {
      console.log("✅ WebSocket conectado");
      setIsConnected(true);
    };

    websocket.onclose = () => {
      console.log("❌ WebSocket desconectado");
      setIsConnected(false);
    };

    websocket.onerror = (error) => {
      console.error("⚠️ Error en WebSocket:", error);
      setIsConnected(false);
    };

    wsRef.current = websocket;

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [gameId]);

  // Manejar mensajes entrantes
  useEffect(() => {
    const websocket = wsRef.current;
    if (!websocket) return;

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.event) {
          case "publicUpdate":
            setPublicData(data.payload);
            if (data.payload?.gameStatus === "in_progress") setStarted(true);
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
            console.warn("Evento no manejado:", data);
        }
      } catch (err) {
        console.warn("⚠️ Mensaje no JSON:", event.data);
      }
    };
  }, [wsRef.current]);

  // El juego está listo si tenemos datos públicos y privados
  const gameDataReady = publicData && privateData && started;

  return (
    <>
      {gameDataReady ? (
        <SyncOrchestrator
          publicData={publicData}
          privateData={privateData}
          currentPlayerId={parseInt(playerId)}
        />
      ) : (
        <Lobby
          id={parseInt(gameId)}
          playerId={parseInt(playerId)}
          onStartGame={() => setStarted(true)}
          ws={wsRef.current}
          isConnected={isConnected}
          refreshTrigger={refreshLobby}
        />
      )}

      <Notifier
        publicData={publicData}
        actualPlayerId={parseInt(playerId)}
        wsRef={wsRef.current}
      />

      <EffectManager
        publicData={publicData}
        privateData={privateData}
        actualPlayerId={parseInt(playerId)}
        wsRef={wsRef.current}
      />

      <GameEndScreen websocket={wsRef.current} />
    </>
  );
}

// event: "privateUpdate"
// payload:  {
//          cards: [{
//              id: int
//              name: string
//              type: enum(string)
//           }]
//          secrets: [{
//              id: int
//              reveled: bool
//              name: String <NOT NULL>
//           }]
//          role: enum(string) # "murderer" | "accomplice" | "detective"
//          ally: {
//              id: int
//              role: enum(String) # "murderer" | "accomplice"
//               } | null
// }

// event: "publicUpdate"
// payload: {
//          actionStatus: enum(string) # ”blocked” | “unblocked”
//          gameStatus: enum(string) # “waiting” | “inProgress” | “finished”
//          regularDeckCount: int
//          discardPileTop: {
//              id: int
//              name: String
//           }
//          draftCards: [{
//              id: int
//              name: String
//           }]
//          discardPileCount: int
//           players: [{
//              id: int
//              name: String
//              avatar: int
//              socialDisgrace: bool
//              turnOrder: int
//              turnStatus: enum(string) # “waiting” | “playing” | “discarding” | “discardingOpt”						“drawing”
//              cardCount: int
//              secrets: [{
//                  id: int
//                  revealed: bool
//                  name: String #default null
//               }]
//              sets: [{
//			   setId: int
//                  setName: enum(string)
//                  cards: [{
//                      id: int
//                      name: enum(string)
//                   }]
//               }]
//           }]
//       }
