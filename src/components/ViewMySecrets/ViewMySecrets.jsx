import { useState } from "react";
import "./ViewMySecrets.css";
import { createPortal } from "react-dom";

const imageMap = {
  murderer: "/Cards/03-secret_murderer.png",
  accomplice: "/Cards/04-secret_accomplice.png",
  regular: "/Cards/06-secret_back.png",
  secretFront: "/Cards/05-secret_front.png",
  shhIcon: "/Icons/shhIcon.png",
};

export default function ViewSecrets({ secrets }) {
  const [ViewSecrets, setViewSecrets] = useState(false);
  const [mounted, setMounted] = useState(false);

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
              key={secret.class}
              className={`my-light-dot ${
                secret.revealed ? "revealed" : "unrevealed"
              }`}
              title={
                secret.revealed ? `Secret ${secret.class}` : `Secret hidden`
              }
            />
          ))}
        </div>

        <img src={imageMap["shhIcon"]} alt="shhIcon" />
      </button>

      {ViewSecrets && createPortal(
        <div className="my-viewsecrets">
          <div onClick={toggleViewSecrets} className="overlay"></div>
          <div className="my-secrets-grid">
            {hasSecrets ? (
              secrets.map((secret) => (
                <div key={secret.class} className="my-secret-card">
                  {secret.revealed ? (
                    <img
                      src={imageMap[secret.class]}
                      alt={`Secret ${secret.class}`}
                    />
                  ) : (
                    <>
                      <img
                        className="front"
                        src={imageMap[secret.class]}
                        alt={`Secret ${secret.class}`}
                      />
                      <img
                        className="back"
                        src={imageMap["secretFront"]}
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
          <button className="my-close-viewsecrets" onClick={toggleViewSecrets}>
            X
          </button>
        </div>,
        document.body
      )}
    </>
  );
}
