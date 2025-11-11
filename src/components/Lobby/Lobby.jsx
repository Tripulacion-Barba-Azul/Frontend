// Lobby.jsx

/**
 * @description Pre-game lobby: shows players, capacity progress, and owner actions.
 *
 * @typedef {Object} LobbyProps
 * @property {string} id - Game identifier (server-side gameId).
 * @property {string} playerId - Current player's unique id.
 * @property {WebSocket|null} ws - Open WebSocket connection used to receive lobby events.
 * @property {number} [refreshTrigger=0] - External trigger to refetch lobby state (increments to refresh).
 * @property {(args:{gameId:string, playerId:string})=>void} [onStartGame] - Optional callback fired on start.
 *
 * Props shape: see LobbyProps.
 */

import "./Lobby.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StartGameButton from "./StartGameButton/StartGameButton";
import AbandonGameButton from "./AbandonGameButton/AbandonGameButton";
import CancelGameButton from "./CancelGameButton/CancelGameButton";

function Lobby(/** @type {LobbyProps} */ props) {
  const navigate = useNavigate();
  const [currentGame, setCurrentGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [playerNotInGame, setPlayerNotInGame] = useState(false);
  const [showCancelNotification, setShowCancelNotification] = useState(false);
  const [cancelNotificationData, setCancelNotificationData] = useState(null);

  // Fetch server state for a single game; also validates current player membership/ownership.
  const fetchMatches = async () => {
    try {
      const response = await fetch(`http://localhost:8000/games/${props.id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      const data = await response.json();

      const playersArray = data.players || [];
      const ownerPlayer = playersArray.find((p) => p.playerId === data.ownerId);
      const ownerName = ownerPlayer ? ownerPlayer.playerName : "Unknown Owner";

      const gameData = {
        id: data.gameId,
        name: data.gameName,
        creator: ownerName,
        ownerId: data.ownerId,
        minPlayers: data.minPlayers,
        maxPlayers: data.maxPlayers,
        currentPlayers: playersArray,
      };

      props.setGameName(data.gameName);

      const isCurrentPlayerOwner = props.playerId === data.ownerId;
      setIsOwner(isCurrentPlayerOwner);

      if (isCurrentPlayerOwner) {
        // Owner can always see the full roster
        setPlayers(gameData.currentPlayers);
      } else {
        // Non-owner: ensure the current player actually belongs to this game
        const currentPlayerInList = gameData.currentPlayers.find(
          (p) => p.playerId === props.playerId
        );

        if (currentPlayerInList) {
          setPlayers(gameData.currentPlayers);
        } else {
          // Not in game: still show roster, but gate the UI with an access message
          console.error(
            `Player ID ${props.playerId} not found in game ${props.id}.`
          );
          setPlayers(gameData.currentPlayers);
          setPlayerNotInGame(true);
        }
      }

      setCurrentGame(gameData);
    } catch (error) {
      console.error("Error fetching matches:", error);
    }
  };

  // Listen to lobby-related WebSocket events to keep the roster in sync and handle deletion.
  useEffect(() => {
    if (!props.ws) return;

    const handleWebSocketMessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.event === "playerExit") {
          // Someone left: refresh roster from server
          fetchMatches();
        } else if (data.event === "gameDeleted") {
          // Owner canceled the game: show modal and then navigate away
          const { gameName, ownerName } = data.payload;
          setCancelNotificationData({ ownerName, gameName });
          setShowCancelNotification(true);
        }
      } catch (error) {
        console.error("Error processing WebSocket message in Lobby:", error);
      }
    };

    props.ws.addEventListener("message", handleWebSocketMessage);
    return () =>
      props.ws.removeEventListener("message", handleWebSocketMessage);
  }, [props.ws]);

  // External refresh trigger (parent increments a counter to force refetch)
  useEffect(() => {
    if (props.refreshTrigger > 0) fetchMatches();
  }, [props.refreshTrigger]);

  // Fetch when the game id changes (navigated to a different lobby)
  useEffect(() => {
    fetchMatches();
  }, [props.id]);

  if (!currentGame) {
    return <div className="Lobby">Loading game info...</div>;
  }

  // Access guard: player tried to open a lobby where they don't belong
  if (playerNotInGame) {
    return (
      <div className="Lobby" style={{ padding: "20px", textAlign: "center" }}>
        <h2 style={{ color: "red" }}>You dont have access to this game</h2>
      </div>
    );
  }

  const hasMinimumPlayers = players.length >= currentGame.minPlayers;
  const hasMaximumPlayers = players.length >= currentGame.maxPlayers;

  const handleCloseNotification = () => {
    setShowCancelNotification(false);
    navigate("/");
  };

  // Inline modal component showing a non-blocking cancellation notice.
  const CancelNotificationModal = () => {
    if (!showCancelNotification || !cancelNotificationData) return null;

    return (
      <div className="cancel-notification-overlay">
        <div className="cancel-notification-modal">
          <h3>Game canceled</h3>
          <p>
            The game "{cancelNotificationData.gameName}" has been canceled by{" "}
            {cancelNotificationData.ownerName}
          </p>
          <button
            className="close-notification-btn"
            onClick={handleCloseNotification}
          >
            Back to home screen
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="Lobby">
      <h2>{currentGame.name} </h2>

      {/* Capacity progress: color shifts with occupancy thresholds */}
      <div className="progress-section">
        <div className="progress-bar">
          <div
            className={`progress-fill ${
              players.length >= currentGame.maxPlayers
                ? "progress-red"
                : players.length >= currentGame.minPlayers
                ? "progress-yellow"
                : "progress-green"
            }`}
            style={{
              width: `${(players.length / currentGame.maxPlayers) * 100}%`,
            }}
          />
        </div>
        <div className="progress-labels">
          <span>Min: {currentGame.minPlayers}</span>
          <span>Players: {players.length}</span>
          <span>Max: {currentGame.maxPlayers}</span>
        </div>
      </div>

      <div className="players-section">
        <h3>
          {hasMaximumPlayers && (
            <span className="full-lobby-badge"> - GAME IS FULL -</span>
          )}
        </h3>

        {/* Roster */}
        <ul className="players-list">
          {players.length > 0 ? (
            players.map((player, index) => (
              <li key={index} className="player-item">
                {player.playerName}
                <div className="player-badges">
                  {player.playerId === currentGame.ownerId && (
                    <span className="creator-badge"> (Creator)</span>
                  )}
                  {player.playerId === props.playerId && (
                    <span className="current-player-badge"> (You)</span>
                  )}
                </div>
              </li>
            ))
          ) : (
            <li className="no-players">No players in sight</li>
          )}
        </ul>

        {/* Owner-only actions */}
        {isOwner && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              marginTop: 10,
            }}
          >
            <StartGameButton
              disabled={!hasMinimumPlayers}
              gameId={props.id}
              actualPlayerId={props.playerId}
              onStartGame={props.onStartGame}
            />
            <CancelGameButton
              disabled={false}
              gameId={props.id}
              actualPlayerId={props.playerId}
            />
          </div>
        )}

        {/* Leave game (hidden for owner) */}
        <AbandonGameButton
          isOwner={isOwner}
          playerId={props.playerId}
          gameId={props.id}
        />
      </div>

      <CancelNotificationModal />
    </div>
  );
}

export default Lobby;
