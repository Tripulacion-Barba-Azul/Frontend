import { useState } from "react";
import "./ViewMySecrets.css";
import { createPortal } from "react-dom";
import { SECRETS_MAP } from "../generalMaps";

export default function ViewSecrets({ secrets }) {
  const [ViewSecrets, setViewSecrets] = useState(false);

  const toggleViewSecrets = () => {
    setViewSecrets(!ViewSecrets);
  };

  const hasSecrets = secrets && secrets.length > 0;

  if (ViewSecrets) {
    document.body.classList.add("my-active-viewsecrets");
  } else {
    document.body.classList.remove("my-active-viewsecrets");
  }

  return (
    <>
      <button onClick={toggleViewSecrets} className="my-btn-viewsecrets">
        <div className="my-light-dots">
          {secrets.map((secret) => (
            <div
              key={secret.id}
              className={`my-light-dot ${
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
          <div className="my-viewsecrets">
            <div onClick={toggleViewSecrets} className="overlay"></div>
            <div className="my-secrets-grid">
              {hasSecrets ? (
                secrets.map((secret) => (
                  <div key={secret.id} className="my-secret-card">
                    {secret.revealed ? (
                      <img
                        src={SECRETS_MAP[secret.name]}
                        alt={`Secret ${secret.name}`}
                      />
                    ) : (
                      <>
                        <img
                          className="front"
                          src={SECRETS_MAP[secret.name]}
                          alt={`Secret ${secret.name}`}
                        />
                        <img
                          className="back"
                          src={"/Cards/05-secret_front.png"}
                          alt="Card back"
                        />
                      </>
                    )}
                  </div>
                ))
              ) : (
                <div className="my-no-secrets-message">
                  <p>Out of secrets!</p>
                </div>
              )}
            </div>
            <button
              className="my-close-viewsecrets"
              onClick={toggleViewSecrets}
            >
              X
            </button>
          </div>,
          document.body
        )}
    </>
  );
}
