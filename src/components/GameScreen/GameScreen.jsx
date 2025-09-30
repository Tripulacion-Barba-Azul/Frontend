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
  
    const [refreshLobby, setRefreshLobby] = useState(0);

  // Callback para cuando un jugador se une en el lobby
  const handlePlayerJoined = () => {
    // Triggear actualización del lobby
    setRefreshLobby(prev => prev + 1);
    console.log('🎯 Player joined event handled in GameScreen');
  };

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
  // log crudo
  console.log("📨 RAW WS message:", event.data);

  try {
    const data = JSON.parse(event.data);
    console.log("📩 Parsed message:", data);

    switch (data.event) {
      case "game_started":
        console.log("🚀 Partida empezó");
        console.log("👉 Secrets recibidos:", data.secrets);
        console.log("👉 Cards recibidas:", data.cards);
        console.log("👉 Players recibidos:", data.players);
        console.log("👉 playerTurn recibidos:", data.playerTurnId);

        setStarted(true);

        if (typeof data.playerTurnId === "number") {
          setTurn(data.playerTurnId);
        }

        if (Array.isArray(data.players)) {
          console.log("🛠️ Players construidos:", data.players);
          const builtPlayers = buildUiPlayers(data.players, data.playerTurnId, Number(playerId));
          setPlayers(builtPlayers);
          console.log("🛠️ Players construidos after:", players);
        }

        if (Array.isArray(buildCardsState(remainingOnDeck, data.cards))) {
          console.log("🃏 Cards construidas:", data.cards);
          const builtCards = buildCardsState(remainingOnDeck, data.cards);
          console.log("🃏 Cards construidas after:", builtCards);
          setCards(data.cards);

        }

        if (Array.isArray(data.secrets)) {
          console.log("🕵️‍♂️ Secrets construidos:", data.secrets);
          const builtSecrets = buildSecretsState(data.secrets);
          console.log("🕵️‍♂️ Secrets construidos after:", builtSecrets);
          setSecrets(builtSecrets);
        }

        if (typeof data.numberOfRemainingCards === "number") {
          console.log("📦 Remaining deck:", data.remainingOnDeck);
          setRemainingOnDeck(data.remainingOnDeck);
          console.log("📦 Remaining deck after:", remainingOnDeck);
        }

        break;

      case "player_joined":
        console.log("👤 Jugador se unió:", data.player);
        handlePlayerJoined();
        break;

      default:
        console.log("❓ Evento no manejado:", data.event);
    }
  } catch (err) {
    console.warn("⚠️ Mensaje (no JSON):", event.data);
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
          ws={wsRef.current}
          isConnected={isConnected}
          refreshTrigger={refreshLobby}
        />
      )}
    </>
  );
}