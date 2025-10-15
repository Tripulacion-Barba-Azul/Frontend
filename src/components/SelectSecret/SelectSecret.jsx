import React, { useState } from "react";
import { createPortal } from "react-dom";
import { SECRETS_MAP } from "../generalMaps.js";
import "./SelectSecret.css";
// arreglar cruz
// que no se permita tocar por fuera
// que sea mas grande las cartas(?)
export default function SelectSecret({ 
  actualPlayerId, 
  secrets, 
  playerId, 
  text, 
  selectedSecretId, 
  goBack 
}) {
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [isFlipping, setIsFlipping] = useState({});
  const [localSecrets, setLocalSecrets] = useState(secrets);
  const [isConfirming, setIsConfirming] = useState(false);

  // Sincronizar con props cuando cambien
  React.useEffect(() => {
    setLocalSecrets(secrets);
    // Resetear estados cuando se recarga el modal
    setSelectedCardId(null);
    setIsConfirming(false);
    setIsFlipping({});
  }, [secrets]);

  const handleCardClick = (secretId) => {
    setSelectedCardId(secretId);
  };

  const handleConfirm = () => {
    if (selectedCardId && !isConfirming) {
      setIsConfirming(true);
      setIsFlipping(prev => ({ ...prev, [selectedCardId]: true }));
      
      setTimeout(() => {
        // Actualizar el estado local de la carta
        setLocalSecrets(prevSecrets => 
          prevSecrets.map(secret => 
            secret.id === selectedCardId 
              ? { ...secret, revealed: !secret.revealed }
              : secret
          )
        );
        
        // Importante: quitar el flipping DESPUÉS de actualizar el estado
        setTimeout(() => {
          setIsFlipping(prev => ({ ...prev, [selectedCardId]: false }));
        }, 50);
        
        // Enviar callback
        selectedSecretId(selectedCardId);
      }, 600);
    }
  };

  const getCardImage = (secret) => {
    if (secret.revealed) {
      return SECRETS_MAP[secret.name] || null;
    } else {
      return "/Cards/05-secret_front.png";
    }
  };

  return (
    <div>
    <div className="select-secret">
      <div className="select-secret-content">
        <div className="select-secret-header">
          <h2>{text}</h2>
        </div>
        
        <div className="secrets-selection-grid">
          {localSecrets && localSecrets.length > 0 ? (
            localSecrets.map((secret) => (
              <div 
                key={secret.id} 
                className={`selectable-secret-card ${selectedCardId === secret.id ? 'selected' : ''}`}
                onClick={() => handleCardClick(secret.id)}
              >
                <div className={`card-flip-container ${isFlipping[secret.id] ? 'flipping' : ''}`}>
                  <div className="card-face card-front">
                    {!secret.revealed && actualPlayerId === playerId && secret.name ? (
                      // Caso especial: carta no revelada pero es del jugador actual (se ve "apenitas")
                      <>
                        {SECRETS_MAP[secret.name] && (
                          <img
                            className="secret-front-image"
                            src={SECRETS_MAP[secret.name]}
                            alt={`Secret ${secret.name}`}
                          />
                        )}
                        <img
                          className="secret-back-overlay"
                          src="/Cards/05-secret_front.png"
                          alt="Card back"
                        />
                      </>
                    ) : secret.revealed ? (
                      // Carta revelada: mostrar la imagen específica
                      SECRETS_MAP[secret.name] && (
                        <img
                          src={SECRETS_MAP[secret.name]}
                          alt={`Secret ${secret.name}`}
                        />
                      )
                    ) : (
                      // Carta no revelada: mostrar dorso genérico
                      <img
                        src="/Cards/05-secret_front.png"
                        alt="Secret hidden"
                      />
                    )}
                  </div>
                  <div className="card-face card-back">
                    {!secret.revealed && actualPlayerId === playerId && secret.name ? (
                      // Caso especial: al hacer flip, mostrar completamente la carta sin overlay
                      SECRETS_MAP[secret.name] && (
                        <img
                          src={SECRETS_MAP[secret.name]}
                          alt={`Secret ${secret.name}`}
                        />
                      )
                    ) : secret.revealed ? (
                      // Carta revelada: al hacer flip, ocultar (mostrar dorso)
                      <img
                        src="/Cards/05-secret_front.png"
                        alt="Secret hidden"
                      />
                    ) : (
                      // Carta no revelada: al hacer flip, revelar la imagen específica
                      SECRETS_MAP[secret.name] && (
                        <img
                          src={SECRETS_MAP[secret.name]}
                          alt={`Secret ${secret.name}`}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-secrets-message">
              <p>No secrets available!</p>
            </div>
          )}
        </div>
        
        {/* Bottom buttons */}
        <div className="select-secret-actions">
          <button className="select-secret-back" onClick={goBack}>
            Go Back
          </button>
          <button 
            className="select-secret-confirm" 
            onClick={handleConfirm}
            disabled={!selectedCardId || isConfirming}
          >
            Confirm
          </button>
        </div>
        
      </div>
    </div>
  </div>
  )
}
