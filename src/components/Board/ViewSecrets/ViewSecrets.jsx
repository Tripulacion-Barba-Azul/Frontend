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

export default function ViewSecrets({ secrets = [] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (modalOpen) document.body.classList.add("active-viewsecrets");
    else document.body.classList.remove("active-viewsecrets");
    return () => document.body.classList.remove("active-viewsecrets");
  }, [modalOpen]);

  const toggleModal = () => setModalOpen((v) => !v);

  // modal content to port into body
  const modalContent = (
    <div className="viewsecrets" role="dialog" aria-modal="true">
      <div className="overlay" onClick={toggleModal} />
      <div className="secrets-grid">
        {secrets && secrets.length > 0 ? (
          secrets.map((secret) => (
            <div key={secret.secretID} className="secret-card">
              <img
                src={
                  secret.revealed
                    ? imageMap[secret.secretName]
                    : imageMap.secretFront
                }
                alt={
                  secret.revealed
                    ? `Secret ${secret.secretName}`
                    : "Secret hidden"
                }
              />
            </div>
          ))
        ) : (
          <div className="no-secrets-message">Out of secrets!</div>
        )}
      </div>

      <button
        className="close-viewsecrets"
        onClick={toggleModal}
        aria-label="Close"
      >
        X
      </button>
    </div>
  );

  return (
    <>
      <button
        onClick={toggleModal}
        className="btn-viewsecrets"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={modalOpen}
      >
        <div className="light-dots" aria-hidden="true">
          {secrets.map((secret) => (
            <div
              key={secret.secretID}
              className={`light-dot ${secret.revealed ? "revealed" : "hidden"}`}
              title={
                secret.revealed
                  ? `Secret ${secret.secretName}`
                  : "Secret hidden"
              }
            />
          ))}
        </div>
        <img src={imageMap.shhIcon} alt="secrets" />
      </button>

      {/* mount modal into body to avoid stacking/clip issues */}
      {mounted && modalOpen && createPortal(modalContent, document.body)}
    </>
  );
}
