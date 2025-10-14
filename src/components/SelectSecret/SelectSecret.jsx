import React, { useState } from "react";
import { createPortal } from "react-dom";
import "./SelectSecret.css";

export default function SelectSecret({ 
  actualPlayerId, 
  secrets, 
  revealed, 
  playerId, 
  text, 
  selectedSecretId, 
  goBack 
}) {
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [isFlipping, setIsFlipping] = useState({});

  const filteredsecrets = secrets ? secrets.filter(secret => secret.revealed === revealed) : [];

  const handleCardClick = (secretId) => {
    setIsFlipping(prev => ({ ...prev, [secretId]: true }));
    setSelectedCardId(secretId);
    
    setTimeout(() => {
      selectedSecretId(secretId);
      goBack();
    }, 600);
  };

  const handleOverlayClick = () => {
    goBack();
  };

  const getCardImage = (secret) => {
    if (secret.revealed) {
      if (secret.name === "You are the murderer") {
        return "/Cards/03-secret_murderer.png";
      } else if (secret.name === "You are the acomplice") {
        return "/Cards/04-secret_accomplice.png";
      } else {
        return "/Cards/06-secret_back.png";
      }
    } else {
      return "/Cards/05-secret_front.png";
    }
  };

  return createPortal(
    <div className="select-secret">
      <div onClick={handleOverlayClick} className="overlay"></div>
      <div className="select-secret-content">
        <div className="select-secret-header">
          <h2>{text}</h2>
          <button className="close-select-secret" onClick={goBack}>
            X
          </button>
        </div>
        
        <div className="secrets-selection-grid">
          {filteredsecrets.length > 0 ? (
            filteredsecrets.map((secret) => (
              <div 
                key={secret.id} 
                className={`selectable-secret-card ${selectedCardId === secret.id ? 'selected' : ''}`}
                onClick={() => handleCardClick(secret.id)}
              >
                <div className={`card-flip-container ${isFlipping[secret.id] ? 'flipping' : ''}`}>
                  <div className="card-face card-front">
                    {!secret.revealed && actualPlayerId === playerId && secret.name ? (
                      <>
                        <img
                          className="secret-front-image"
                          src={secret.name === "You are the murderer" ? "/Cards/03-secret_murderer.png" :
                               secret.name === "You are the acomplice" ? "/Cards/04-secret_accomplice.png" :
                               "/Cards/06-secret_back.png"}
                          alt={`Secret ${secret.name}`}
                        />
                        <img
                          className="secret-back-overlay"
                          src="/Cards/05-secret_front.png"
                          alt="Card back"
                        />
                      </>
                    ) : (
                      <img
                        src={getCardImage(secret)}
                        alt={secret.revealed && secret.name ? `Secret ${secret.name}` : "Secret hidden"}
                      />
                    )}
                  </div>
                  <div className="card-face card-back">
                    <img
                      src={secret.revealed ? "/Cards/05-secret_front.png" : 
                           (secret.name === "You are the murderer" ? "/Cards/03-secret_murderer.png" :
                            secret.name === "You are the acomplice" ? "/Cards/04-secret_accomplice.png" :
                            "/Cards/06-secret_back.png")}
                      alt={secret.revealed ? "Secret hidden" : (secret.name ? `Secret ${secret.name}` : "Secret revealed")}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-secrets-message">
              <p>No secrets available to {revealed ? 'hide' : 'reveal'}!</p>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
