import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Lobby from "../Lobby/Lobby";
import SyncOrchestrator from "../Sync/SyncOrchestrator";
import GameEndScreen from "../GameEndScreen/GameEndSreen";

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
  
    let retryTimeout = null;
    let websocket = null;
  
    const connect = () => {
      websocket = new WebSocket(wsEndpoint);

      websocket.onopen = () => {
        console.log("✅ WebSocket conectado");
        setIsConnected(true);
      };

  
      websocket.onclose = () => {
        console.warn("🔌 WebSocket desconectado, intentando reconectar...");
        setIsConnected(false);
  
        retryTimeout = setTimeout(connect, 1500); // 🔁 Reintenta en 3s
      };
  

      websocket.onerror = (error) => {
        console.error("⚠️ Error en WebSocket:", error);
        websocket.close(); // fuerza cierre → disparará onclose → reconecta
      };

  
      wsRef.current = websocket;
    };
  
    connect();
  

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      if (websocket) websocket.close();
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
            if (data.payload?.gameStatus === "inProgress") setStarted(true);
            break;

          case "privateUpdate":
            setPrivateData(data.payload);
            break;

          case "playerJoined":
            handlePlayerJoined();
            break;

          case "gameStarted":
            setStarted(true);
            break;

          default:
            console.warn("Evento no manejado:", data.event);
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

      <GameEndScreen websocket={wsRef.current} />
    </>
  );
}

// event: "privateUpdate"
// payload:  {
// 	        cards: [{
//           		id: int
//           		name: string
//           		type: enum(string)
//           }]
// 	        secrets: [{
// 		          id: int
// 		          reveled: bool
// 		          name: String <NOT NULL>
//           }]
// 	        role: enum(string) # "murderer" | "accomplice" | "detective"
// 	        ally: {
// 		          id: int
// 		          role: enum(String) # "murderer" | "accomplice"
//               } | null
// }

// event: "publicUpdate"
// payload:	{
//         	actionStatus: enum(string) # ”blocked” | “unblocked”
//         	gameStatus: enum(string) # “waiting” | “inProgress” | “finished”
//         	regularDeckCount: int
//         	discardPileTop: {
//         			id: int
//         			name: String
//           }
//         	draftCards: [{
//         			id: int
//         			name: String
//           }]
//         	discardPileCount: int
//           players: [{
//         	    id: int
//         	    name: String
//         	    avatar: int
//         	    turnOrder: int
//         	    turnStatus: enum(string) # “waiting” | “playing” | “discarding” | “discardingOpt” | “Drawing”
//         	    cardCount: int
//         	    secrets: [{
//         		      id: int
//         		      revealed: bool
//         		      name: String #default null
//               }]
//         	    sets: [{
//         			    setName: enum(string)
//         			    cards: [{
//         			        id: int
//         			        name: enum(string)
//                   }]
//               }]
//           }]
//       }

