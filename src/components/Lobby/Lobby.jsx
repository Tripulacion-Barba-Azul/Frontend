import "./Lobby.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StartGameButton from "./StartGameButton/StartGameButton";
import AbandonGameButton from "./AbandonGameButton/AbandonGameButton";
import CancelGameButton from "./CancelGameButton/CancelGameButton";

function Lobby(props) {
  const navigate = useNavigate();
  const [currentGame, setCurrentGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [playerNotInGame, setPlayerNotInGame] = useState(false);
  const [showCancelNotification, setShowCancelNotification] = useState(false);
  const [cancelNotificationData, setCancelNotificationData] = useState(null);

  const fetchMatches = async () => {
    try {
      const response = await fetch(`http://localhost:8000/games/${props.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      const playersArray = data.players || [];
      const ownerPlayer = playersArray.find(
        (player) => player.playerId === data.ownerId
      );
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

      
      const isCurrentPlayerOwner = props.playerId === data.ownerId;
      setIsOwner(isCurrentPlayerOwner);

      if (isCurrentPlayerOwner) {
        
        setPlayers(gameData.currentPlayers);
      } else {
        
        const currentPlayerInList = gameData.currentPlayers.find(
          (player) => player.playerId === props.playerId
        );

        if (currentPlayerInList) {
          
          setPlayers(gameData.currentPlayers);
        } else {
          
          console.error(
            `Player ID ${props.playerId} not found in game ${props.id}. This indicates the player is not part of this game.`
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

  // Manejar mensajes del WebSocket
  useEffect(() => {
    if (!props.ws) return;

    const handleWebSocketMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.event === "playerExit") {
          // Update player list when someone leaves
          fetchMatches();
        } else if (data.event === 'gameDeleted') {
          const { gameName, ownerName } = data.payload;
          setCancelNotificationData({
            ownerName: ownerName,
            gameName: gameName
          });
          setShowCancelNotification(true);
        }
      } catch (error) {
        console.error("Error processing WebSocket message in Lobby:", error);
      }
    };

    props.ws.addEventListener("message", handleWebSocketMessage);

    return () => {
      props.ws.removeEventListener("message", handleWebSocketMessage);
    };
  }, [props.ws]);

  useEffect(() => {
    if (props.refreshTrigger > 0) {
      fetchMatches();
    }
  }, [props.refreshTrigger]);

  useEffect(() => {
    fetchMatches();
  }, [props.id]);

  if (!currentGame) {
    return <div className="Lobby">Loading game info...</div>;
  }

  
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

  const CancelNotificationModal = () => {
    if (!showCancelNotification || !cancelNotificationData) return null;

    return (
      <div className="cancel-notification-overlay">
        <div className="cancel-notification-modal">
          <h3>Game canceled</h3>
          <p>
            The game "{cancelNotificationData.gameName}" has been canceled 
            by {cancelNotificationData.ownerName}
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
      <h2>
        {currentGame.name}{" "}
      </h2>
      <div className="progress-section">
      <div className="progress-bar">
          <div
            className={`progress-fill ${
              players.length >= currentGame.maxPlayers
                ? 'progress-red'
                : players.length >= currentGame.minPlayers
                ? 'progress-yellow'
                : 'progress-green'
            }`}
            style={{
              width: `${(players.length / currentGame.maxPlayers) * 100}%`,
            }}
          ></div>
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
            <span className="full-lobby-badge"> - GAME FULL</span>
          )}
        </h3>
        <ul className="players-list">
          {players.length > 0 ? (
            players.map((player, index) => (
              <li key={index} className="player-item">
                {player.playerName}
                {player.playerName === currentGame.creator && (
                  <span className="creator-badge"> (Creator)</span>
                )}
                {player.playerId === props.playerId && (
                  <span className="current-player-badge"> (You)</span>
                )}
              </li>
            ))
          ) : (
            <li className="no-players">No players in sight</li>
          )}
        </ul>
        {isOwner && (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', marginTop: 25,}}>
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
        
        {/* Leave game button - only for players who are NOT owner */}
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