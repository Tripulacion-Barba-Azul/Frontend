import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "./ViewSecrets.css";
import { SECRETS_MAP } from "../../generalMaps.js";

export default function ViewSecrets({ secrets }) {
  const [ViewSecrets, setViewSecrets] = useState(false);

  const toggleViewSecrets = () => {
    setViewSecrets(!ViewSecrets);
  };

  const hasSecrets = secrets && secrets.length > 0;

  if (ViewSecrets) {
    document.body.classList.add("active-viewsecrets");
  } else {
    document.body.classList.remove("active-viewsecrets");
  }

  return (
    <>
      <button onClick={toggleViewSecrets} className="btn-viewsecrets">
        <div className="light-dots">
          {secrets.map((secret) => (
            <div
              key={secret.secretID}
              className={`light-dot ${
                secret.revealed ? "revealed" : "unrevealed"
              }`}
              title={
                secret.revealed
                  ? `Secret ${secret.secretName}`
                  : `Secret hidden`
              }
            />
          ))}
        </div>

        <img src={"/Icons/shhIcon.png"} alt="shhIcon" />
      </button>

      {ViewSecrets &&
        createPortal(
          <div className="viewsecrets">
            <div onClick={toggleViewSecrets} className="overlay"></div>
            <div className="secrets-grid">
              {hasSecrets ? (
                secrets.map((secret) => (
                  <div key={secret.secretID} className="secret-card">
                    {secret.revealed ? (
                      <img
                        className="front"
                        src={SECRETS_MAP[secret.secretName]}
                        alt={`Secret ${secret.secretName}`}
                      />
                    ) : (
                      <img
                        className="back"
                        src={"/Cards/05-secret_front.png"}
                        alt={`Secret hidden`}
                      />
                    )}
                  </div>
                ))
              ) : (
                <div className="no-secrets-message">
                  <p>Out of secrets!</p>
                </div>
              )}
            </div>
            <button className="close-viewsecrets" onClick={toggleViewSecrets}>
              X
            </button>
          </div>,
          document.body
        )}
    </>
  );
}
