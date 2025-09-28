import { BrowserRouter as Router, Routes, Route, useParams, useSearchParams } from 'react-router-dom';
import Lobby from '../../components/Lobby/Lobby';

function LobbyPage() {
    const { gameId } = useParams();
    const [searchParams] = useSearchParams();
    const playerId = searchParams.get('playerId');
    const playerName = searchParams.get('playerName');
    
    if (!gameId) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>Error: No se especificó el ID del juego</h2>
            </div>
        );
    }
    
    if (!playerId) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>Error: No se especificó el ID del jugador</h2>
                <p>Usa: /lobby/{gameId}?playerId=[TU_PLAYER_ID]</p>
            </div>
        );
    }
    
    return <Lobby 
        id={parseInt(gameId)} 
        playerId={parseInt(playerId)} 
        playerName={playerName}
    />;
}



function App() {
    return (
        <Router>
            <Routes>
                <Route path="/lobby/:gameId" element={<LobbyPage />} />
            </Routes>
        </Router>
    );
}

export default App
