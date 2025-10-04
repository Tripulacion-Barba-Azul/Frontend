import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "./ViewSecrets.css";

const imageMap = {
  murderer: "/Cards/03-secret_murderer.png",
  accomplice: "/Cards/04-secret_accomplice.png",
  regular: "/Cards/06-secret_back.png",
  secretFront: "/Cards/05-secret_front.png",
  shhIcon: "/Icons/shhIcon.png",
};

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
              key={secret.class}
              className={`light-dot ${secret.revealed ? "revealed" : "unrevealed"}`}
              title={
                secret.revealed ? `Secret ${secret.class}` : `Secret hidden`
              }
            />
          ))}
        </div>

        <img src={imageMap["shhIcon"]} alt="shhIcon" />
      </button>

      {ViewSecrets &&
        createPortal(
          <div className="viewsecrets">
            <div onClick={toggleViewSecrets} className="overlay"></div>
            <div className="secrets-grid">
              {hasSecrets ? (
                secrets.map((secret) => (
                  <div key={secret.class} className="secret-card">
                    {secret.revealed ? (
                      <img
                        src={imageMap[secret.class]}
                        alt={`Secret ${secret.class}`}
                      />
                    ) : (
                      <img src={imageMap["secretFront"]} alt={`Secret hidden`} />
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