// SelectSecret.jsx

/**
 * @file SelectSecret.jsx
 * @description Modal grid to select **one** secret card. The `revealed` prop controls which secrets are selectable.
 *
 * === Canonical shapes (from API DOCUMENT) ===
 * @typedef {{ id:number, revealed:boolean, name:(string|null) }} PublicSecret
 *
 * === Props ===
 * @typedef {Object} SelectSecretProps
 * @property {number|string} actualPlayerId - Current user's id (used to show own-front overlay).
 * @property {PublicSecret[]} secrets - Secrets to render for the target player.
 * @property {number|string} playerId - Target player whose secrets are shown.
 * @property {boolean} revealed - Selection rule: `true` → only revealed; `false` → only hidden.
 * @property {string} text - Prompt shown at the top.
 * @property {(id:number)=>void} selectedSecretId - Called after confirm animation with chosen secret id.
 * @property {(() => void)|null} [goBack] - Optional “back” handler; if omitted, back button is hidden.
 */

import React, { useState, useMemo, useCallback } from "react";
import { SECRETS_MAP } from "../../../../../utils/generalMaps";
import "./SelectSecret.css";

/** @param {SelectSecretProps} props */
export default function SelectSecret({
  actualPlayerId,
  secrets,
  playerId,
  revealed, // boolean: controls which secrets are selectable
  text,
  selectedSecretId,
  goBack,
}) {
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [isFlipping, setIsFlipping] = useState({});
  const [localSecrets, setLocalSecrets] = useState(secrets);
  const [isConfirming, setIsConfirming] = useState(false);

  // Sync local secrets when props change; clear transient UI state
  React.useEffect(() => {
    setLocalSecrets(secrets);
    setSelectedCardId(null);
    setIsConfirming(false);
    setIsFlipping({});
  }, [secrets]);

  // Only allow selection that matches the `revealed` rule
  const canSelectSecret = useCallback(
    (secret) => {
      if (typeof revealed !== "boolean") return true; // backward compatible
      return revealed ? !!secret?.revealed : !secret?.revealed;
    },
    [revealed]
  );

  const handleCardClick = (secretId) => {
    const s = localSecrets?.find((x) => x.id === secretId);
    if (!s || !canSelectSecret(s)) return;
    setSelectedCardId(secretId);
  };

  const selectedSecret = useMemo(
    () => localSecrets?.find((s) => s.id === selectedCardId) || null,
    [localSecrets, selectedCardId]
  );
  const selectionInvalid =
    !selectedSecret || !canSelectSecret(selectedSecret) || isConfirming;

  const handleConfirm = () => {
    if (!selectionInvalid && selectedCardId && !isConfirming) {
      setIsConfirming(true);
      setIsFlipping((prev) => ({ ...prev, [selectedCardId]: true }));

      setTimeout(() => {
        // Local flip for user feedback
        setLocalSecrets((prevSecrets) =>
          prevSecrets.map((secret) =>
            secret.id === selectedCardId
              ? { ...secret, revealed: !secret.revealed }
              : secret
          )
        );

        setTimeout(() => {
          setIsFlipping((prev) => ({ ...prev, [selectedCardId]: false }));
        }, 50);

        // Notify parent
        selectedSecretId(selectedCardId);
      }, 600);
    }
  };

  return (
    <div className="select-secret">
      <div className="select-secret-content">
        <div className="select-secret-header">
          <h2>{text}</h2>
        </div>

        <div className="secrets-selection-grid">
          {localSecrets && localSecrets.length > 0 ? (
            localSecrets.map((secret) => {
              const isSelectable = canSelectSecret(secret);
              const isSelected = selectedCardId === secret.id;

              return (
                <div
                  key={secret.id}
                  className={[
                    "selectable-secret-card",
                    isSelected ? "selected" : "",
                    !isSelectable ? "not-selectable" : "",
                  ].join(" ")}
                  onClick={() => handleCardClick(secret.id)}
                  role="button"
                  aria-disabled={!isSelectable}
                  title={
                    !isSelectable ? "Not selectable for this step" : undefined
                  }
                >
                  <div
                    className={[
                      "card-flip-container",
                      isFlipping[secret.id] && secret.revealed
                        ? "flipping"
                        : "",
                    ].join(" ")}
                  >
                    <div className="card-face card-front">
                      {!secret.revealed &&
                      actualPlayerId === playerId &&
                      secret.name ? (
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
                        SECRETS_MAP[secret.name] && (
                          <img
                            src={SECRETS_MAP[secret.name]}
                            alt={`Secret ${secret.name}`}
                          />
                        )
                      ) : (
                        <img
                          src="/Cards/05-secret_front.png"
                          alt="Secret hidden"
                        />
                      )}
                    </div>

                    <div className="card-face card-back">
                      {!secret.revealed &&
                      actualPlayerId === playerId &&
                      secret.name ? (
                        SECRETS_MAP[secret.name] && (
                          <img
                            src={SECRETS_MAP[secret.name]}
                            alt={`Secret ${secret.name}`}
                          />
                        )
                      ) : secret.revealed ? (
                        <img
                          src="/Cards/05-secret_front.png"
                          alt="Secret hidden"
                        />
                      ) : (
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
              );
            })
          ) : (
            <div className="no-secrets-message">
              <p>No secrets available!</p>
            </div>
          )}
        </div>

        {/* Bottom buttons */}
        <div className="select-secret-actions">
          {goBack ? (
            <button className="select-secret-back" onClick={() => goBack?.()}>
              Go Back
            </button>
          ) : (
            <></>
          )}
          <button
            className="select-secret-confirm"
            onClick={handleConfirm}
            disabled={selectionInvalid}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
