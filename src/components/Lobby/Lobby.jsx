import './Lobby.css';
import { useState, useEffect } from 'react';
import StartGameButton from '../StartGameButton/StartGameButton';

// Props esperados: { id, playerId, playerName? }
function Lobby(props){
    
    const wsEndpoint = `ws://localhost:8000/ws/${props.id}`;

    const [currentGame, setCurrentGame] = useState(null);
    const [players, setPlayers] = useState([]);
    const [ws, setWs] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [playerNotInGame, setPlayerNotInGame] = useState(false);
    
    const fetchMatches = async () => {
        try {
         const response = await fetch(`http://localhost:8000/games/${props.id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });

          if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
          }

          const data = await response.json();

          const playersArray = data.players || [];
          const ownerPlayer = playersArray.find(player => player.playerId === data.ownerId);
          const ownerName = ownerPlayer ? ownerPlayer.playerName : 'Unknown Owner';
          
          const gameData = {
            id: data.gameId,
            name: data.gameName,
            creator: ownerName,
            ownerId: data.ownerId,
            minPlayers: data.minPlayers,
            maxPlayers: data.maxPlayers,
            currentPlayers: playersArray
          };
          
          // Verificar si el jugador actual es el owner
          const isCurrentPlayerOwner = props.playerId === data.ownerId;
          setIsOwner(isCurrentPlayerOwner);
          
          if (isCurrentPlayerOwner) {
            // Si es owner, cargar todos los jugadores actuales
            setPlayers(gameData.currentPlayers);
          } else {
            // Si no es owner, verificar si está en la lista de jugadores
            const currentPlayerInList = gameData.currentPlayers.find(player => player.playerId === props.playerId);
            
            if (currentPlayerInList) {
              // El jugador está en la lista, cargar todos los jugadores
              setPlayers(gameData.currentPlayers);
            } else {
              // El jugador NO está en la lista - esto es un ERROR
              console.error(`Player ID ${props.playerId} not found in game ${props.id}. This indicates the player is not part of this game.`);
              // NO agregamos al jugador, solo cargamos los jugadores válidos
              setPlayers(gameData.currentPlayers);
              // Marcar que el jugador no está en el juego
              setPlayerNotInGame(true);
            }
          }
          
          setCurrentGame(gameData);
        } catch (error) {
          console.error('Error fetching matches:', error);
        }
    };

    const connectWebSocket = () => {
        if (ws) {
            ws.close();
        }

        const websocket = new WebSocket(wsEndpoint); //con esto el owner ya esta metido en el ws
        
        websocket.onopen = () => {
            console.log('WebSocket conectado');
            setIsConnected(true);
        };

        websocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('Mensaje recibido del WebSocket:', data);
                
                if (data.event === 'player_joined') {
                    console.log('Jugador se unió:', data.player, 'ID:', data.player_id);
                    
                    // Actualizar la lista de jugadores con el nuevo player
                    setPlayers(prev => {
                        const playerExists = prev.find(p => p.playerName === data.player);
                        if (!playerExists) {
                            const newPlayer = {
                                playerId: data.player_id || Math.random(), // Usar ID del WebSocket si está disponible
                                playerName: data.player
                            };
                            const newPlayers = [...prev, newPlayer];
                            console.log('Nueva lista de jugadores:', newPlayers);
                            return newPlayers;
                        }
                        return prev;
                    });
                }
            } catch (error) {
                console.log('Mensaje del servidor (no JSON):', event.data);
            }
        };

        websocket.onclose = () => {
            console.log('WebSocket desconectado');
            setIsConnected(false);
        };

        websocket.onerror = (error) => {
            console.error('Error en WebSocket:', error);
            setIsConnected(false);
        };

        setWs(websocket);
    };

    useEffect(() => {
        fetchMatches();
        if (props.id) {
            connectWebSocket();
        }

        return () => {
            if (ws) {
                ws.close();
            }
        };
    }, [props.id]);

    if (!currentGame) {
        return <div className='Lobby'>Cargando información del juego...</div>;
    }

    // Si el jugador no está en la partida, mostrar solo el mensaje de error
    if (playerNotInGame) {
        return (
            <div className='Lobby' style={{ padding: '20px', textAlign: 'center' }}>
                <h2 style={{color: 'red'}}>No tienes acceso a esta partida</h2>
            </div>
        );
    }

    const hasMinimumPlayers = players.length >= currentGame.minPlayers;
    const hasMaximumPlayers = players.length >= currentGame.maxPlayers;

    return(
        <div className='Lobby'>
            <h2>Partida: {currentGame.name} {isConnected && <span style={{color: 'green'}}>Connected</span>}</h2>
            <h2>Creador de la partida: {currentGame.creator}</h2>
            <h2>Min: {currentGame.minPlayers}, Max: {currentGame.maxPlayers}</h2>

            <div className='players-section'>
                <h3>
                    Jugadores en espera ({players.length})
                    {hasMaximumPlayers && <span className='full-lobby-badge'> - PARTIDA LLENA</span>}
                    :
                </h3>
                <ul className='players-list'>
                    {players.length > 0 ? (
                        players.map((player, index) => (
                            <li key={index} className='player-item'>
                                {player.playerName}
                                {player.playerName === currentGame.creator && <span className='creator-badge'> (Creador)</span>}
                                {player.playerId === props.playerId && <span className='current-player-badge'> (Tú)</span>}
                            </li>
                        ))
                    ) : (
                        <li className='no-players'>No hay jugadores en la partida</li>
                    )}
                </ul>
                {isOwner && (
                    <StartGameButton 
                        disabled={!hasMinimumPlayers}
                        gameId={props.id}
                        actualPlayerId={props.playerId}
                    />
                )}
            </div>
        </div>
    )
}

export default Lobby;