import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Lobby from "../Lobby/Lobby";

export default function GameScreen() {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const playerId = searchParams.get("playerId");

  const [started, setStarted] = useState(false);
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const [cards, setCards] = useState([]);
  const [secrets, setSecrets] = useState([]);
  const [players, setPlayers] = useState([]);

  const wsEndpoint = `ws://localhost:8000/ws/${gameId}`;

  const connectWebSocket = () => {
    if (ws) {
      ws.close();
    }

    const websocket = new WebSocket(wsEndpoint);

    websocket.onopen = () => {
      console.log("WebSocket conectado");
      setIsConnected(true);
    };

    websocket.onclose = () => {
      console.log("WebSocket desconectado");
      setIsConnected(false);
    };

    websocket.onerror = (error) => {
      console.error("Error en WebSocket:", error);
      setIsConnected(false);
    };

    setWs(websocket);
  };

  useEffect(() => {
    if (gameId) {
      connectWebSocket();
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [gameId]);

  useEffect(() => {
    if (ws) {
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Mensaje recibido del WebSocket:", data);

          switch (data.event) {
            case "game_started":
              console.log("partida empezó");

              setStarted(true);

              if (Array.isArray(data.players)) {
                setPlayers(data.players);
              }

              if (Array.isArray(data.cards)) {
                setCards(data.cards);
              }

              if (Array.isArray(data.secrets)) {
                setSecrets(data.secrets);
              }

              break;

            //acá se agregan casos nuevos

            default:
              console.log("Evento no manejado:", data.event);
          }
        } catch (err) {
          console.warn("Mensaje del servidor (no JSON):", event.data);
        }
      };
    }
  }, ws);

  return (
    <>
      {started ? (
        <h1> In Game Page </h1>
      ) : (
        <Lobby
          id={parseInt(gameId)}
          playerId={parseInt(playerId)}
          onStartGame={() => setStarted(true)}
          ws={ws}
          isConnected={isConnected}
        />
      )}
    </>
  );
}
