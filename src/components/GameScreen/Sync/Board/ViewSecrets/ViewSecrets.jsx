// ViewSecrets.jsx

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "./ViewSecrets.css";
import { SECRETS_MAP } from "../../../../../utils/generalMaps";

/**
 * @file ViewSecrets.jsx
 * @description Button + portal modal that previews a player's **public secrets**.
 * If a secret is not revealed, displays the back image instead of the front.
 *
 * === Canonical shapes (from API DOCUMENT) ===
 * @typedef {{ id:number, revealed:boolean, name:(string|null) }} PublicSecret
 *
 * === Props ===
 * @typedef {Object} ViewSecretsProps
 * @property {PublicSecret[]} secrets
 */

/** @param {ViewSecretsProps} props */
export default function ViewSecrets({ secrets }) {
  const [ViewSecrets, setViewSecrets] = useState(false);

  const toggleViewSecrets = () => {
    setViewSecrets(!ViewSecrets);
  };

  const hasSecrets = secrets && secrets.length > 0;

  // Toggle body class (used by CSS for backdrop/scroll lock)
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
              key={secret.id}
              className={`light-dot ${
                secret.revealed ? "revealed" : "unrevealed"
              }`}
              title={
                secret.revealed ? `Secret ${secret.name}` : `Secret hidden`
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
                  <div key={secret.id} className="secret-card">
                    {secret.revealed ? (
                      <img
                        src={SECRETS_MAP[secret.name]}
                        alt={`Secret ${secret.name}`}
                      />
                    ) : (
                      <img
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
