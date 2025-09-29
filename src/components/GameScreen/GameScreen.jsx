import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Lobby from '../Lobby/Lobby'

export default function GameScreen() {

    const { gameId } = useParams();
    const [searchParams] = useSearchParams();
    const playerId = searchParams.get('playerId');

    const [started, setStarted] = useState(false);
    const [ws, setWs] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    const wsEndpoint = `ws://localhost:8000/ws/${gameId}`;

    const connectWebSocket = () => {
        if (ws) {
            ws.close();
        }

        const websocket = new WebSocket(wsEndpoint); 
        
        websocket.onopen = () => {
            console.log('WebSocket conectado');
            setIsConnected(true);
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
        if (gameId) {
            connectWebSocket();
        }

        return () => {
            if (ws) {
                ws.close();
            }
        };
    }, [gameId]);    

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
    )
}