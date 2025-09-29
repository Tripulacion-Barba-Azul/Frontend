
import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Lobby from "../Lobby/Lobby";
import SyncOrchestrator from "../Sync/SyncOrchestrator";
import {
  buildUiPlayers,
  buildCardsState,
  buildSecretsState,
} from "./GameScreenLogic";

export default function GameScreen() {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const playerId = searchParams.get("playerId");

  const [started, setStarted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const [cards, setCards] = useState([]);
  const [secrets, setSecrets] = useState([]);
  const [players, setPlayers] = useState([]);
  const [playerTurnId, setTurn] = useState(null);
  const [remainingOnDeck, setRemainingOnDeck] = useState(null);

  const wsRef = useRef(null);
  const wsEndpoint = `ws://localhost:8000/ws/${gameId}`;

  // Connect / reconnect when gameId changes
  useEffect(() => {
    if (!gameId) return;

    if (wsRef.current) {
      wsRef.current.close();
    }

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

  // Handle incoming messages
  useEffect(() => {
    const websocket = wsRef.current;
    if (!websocket) return;

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📩 Mensaje recibido:", data);

        switch (data.event) {
          case "game_started":
            console.log("🚀 Partida empezó");
            setStarted(true);
            if (typeof data.playerTurnId === "number") {
              setTurn(data.playerTurnId);
            }
            if (Array.isArray(data.players)) {
              setPlayers(buildUiPlayers(data.players, playerTurnId, playerId));
            }
            if (Array.isArray(buildCardsState(remainingOnDeck, data.cards))) {
              setCards(data.cards);
            }
            if (Array.isArray(data.secrets)) {
              setSecrets(buildSecretsState(data.secrets));
            }

            if (typeof data.numberOfRemainingCards === "number") {
              setRemainingOnDeck(data.remainingOnDeck);
            }

            break;

          // Add more cases here
          default:
            console.log("Evento no manejado:", data.event);
        }
      } catch (err) {
        console.warn("Mensaje (no JSON):", event.data);
      }
    };
  }, [wsRef.current]);

  return (
    <>
      {started ? (
        <SyncOrchestrator
          serverPlayers={players}
          serverCards={cards}
          serverSecrets={secrets}
          currentPlayerId={parseInt(playerId)}
        />
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
