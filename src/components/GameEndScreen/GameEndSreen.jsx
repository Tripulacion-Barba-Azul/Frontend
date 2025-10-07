import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './GameEndSreen.css';

export default function GameEndScreen({ websocket }) {
  const [gameEnded, setGameEnded] = useState(false);
  const [gameEndData, setGameEndData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!websocket) return;

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "Match Ended") {
          console.log("🏁 Fin de partida detectado");
          setGameEndData({
            winners: data.winners,
            role: data.rol
          });
          setGameEnded(true);
        }
      } catch (error) {
        console.error("❌ Error parsing WebSocket message:", error);
      }
    };

    websocket.addEventListener('message', handleMessage);

    return () => {
      websocket.removeEventListener('message', handleMessage);
    };
  }, [websocket]);

  const handleBackToHome = () => {
    setGameEnded(false);
    setGameEndData(null);
    navigate('/');
  };

  if (!gameEnded || !gameEndData || !gameEndData.winners || !gameEndData.role) return null;

  // Determinar el título según el rol y cantidad de ganadores
  const winnersCount = gameEndData.winners.length;
  const isDetective = gameEndData.role.toLowerCase() === 'detective';

  let title = '';
  if (isDetective) {
    title = winnersCount > 1 ? 'Ganan los detectives' : 'Gana el detective';
  } else {
    title = 'Gana el asesino';
  }

  return (
    <div className="game-end-overlay">
      <div className="game-end-popup">
        <div className="game-end-header">
          <h2>{title}</h2>
        </div>
        
        <div className="game-end-content">
          <div className="winners-section">
            <ul className="winners-list">
              {gameEndData.winners.map((winner, index) => (
                <li key={index} className="winner-name">{winner}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="game-end-actions">
          <button 
            className="btn-back-home" 
            onClick={handleBackToHome}
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}
