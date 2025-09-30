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
  
  // Estados para verificar si tenemos datos válidos
  const [validPlayers, setValidPlayers] = useState([]);
  const [validCards, setValidCards] = useState([]);
  const [validSecrets, setValidSecrets] = useState([]);
  const [gameDataReady, setGameDataReady] = useState(false);
  
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
          console.log("🛠️ Players recibidos:", data.players);
          
          const builtPlayers = buildUiPlayers({
            players: data.players,
            playerTurnId: data.playerTurnId,
            playerId: Number(playerId)
          });
          
          console.log("🛠️ Players construidos:", builtPlayers);
          setPlayers(builtPlayers);
          setValidPlayers(builtPlayers);
        }

        if (Array.isArray(data.cards)) {
          console.log("🃏 Cards recibidas:", data.cards);
          const builtCards = buildCardsState({
            remainingOnDeck: data.remainingOnDeck,
            cards: data.cards
          });
          console.log("🃏 Cards construidas:", builtCards);
          setCards(builtCards);
          setValidCards(builtCards);
        }

        if (Array.isArray(data.secrets)) {
          console.log("🕵️‍♂️ Secrets construidos:", data.secrets);
          const builtSecrets = buildSecretsState(data.secrets);
          console.log("🕵️‍♂️ Secrets construidos after:", builtSecrets);
          setSecrets(builtSecrets);
          setValidSecrets(builtSecrets);
        }

        if (typeof data.remainingOnDeck === "number") {
          console.log("📦 Remaining deck:", data.remainingOnDeck);
          setRemainingOnDeck(data.remainingOnDeck);
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

  // Effect para verificar cuando todos los datos están listos
  useEffect(() => {
    if (started && validPlayers.length >= 2 && validCards.length > 0 && validSecrets.length > 0) {
      console.log("🎯 Game data is ready, setting gameDataReady to true");
      console.log("🎯 validPlayers:", validPlayers.length);
      console.log("🎯 validCards:", validCards.length); 
      console.log("🎯 validSecrets:", validSecrets.length);
      setGameDataReady(true);
    } else {
      setGameDataReady(false);
    }
  }, [started, validPlayers, validCards, validSecrets]);

  // Verificar que tenemos todos los datos necesarios antes de renderizar el juego
  const hasValidGameData = gameDataReady;

  return (
    <>
      {hasValidGameData ? (
        <SyncOrchestrator
          serverPlayers={validPlayers}
          serverCards={validCards}
          serverSecrets={validSecrets}
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