import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Lobby from '../Lobby/Lobby'

export default function GameScreen() {

    const { gameId } = useParams();
    const [searchParams] = useSearchParams();
    const playerId = searchParams.get('playerId');

    const [started, setStarted] = useState(false);    

    return (
        <>
        {started ? (
            <h1> Hola </h1>            
        ) : (
            <Lobby 
            id={parseInt(gameId)} 
            playerId={parseInt(playerId)} 
            onStartGame={() => setStarted(true)}
            />
        )}
        </>
    )
}