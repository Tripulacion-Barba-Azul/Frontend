import { useState } from "react";
import "./ViewSecrets.css";

const imageMap = {
  murderer: "../../../public/Cards/03-secret_murderer.png",
  accomplice: "../../../public/Cards/04-secret_accomplice.png",
  regular: "../../../public/Cards/06-secret_back.png",
  secretFront: "../../../public/Cards/05-secret_front.png",
  shhIcon: "../../../public//Icons/shhIcon.png",
};

export default function ViewSecrets({ secrets }) {
  const [ViewSecrets, setViewSecrets] = useState(false);

  const toggleViewSecrets = () => {
    setViewSecrets(!ViewSecrets);
  };

  const revealedCount = secrets.filter((secret) => secret.revealed).length;
  const hiddenCount = secrets.length - revealedCount;

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
              className={`light-dot ${secret.revealed ? "revealed" : "hidden"}`}
              title={
                secret.revealed ? `Secret ${secret.class}` : `Secret hidden`
              }
            />
          ))}
        </div>

        <img src={imageMap["shhIcon"]} alt="secretIcon" />
      </button>

      {ViewSecrets && (
        <div className="viewsecrets">
          <div onClick={toggleViewSecrets} className="overlay"></div>
          <div className="secrets-grid">
            {secrets.map((secret) => (
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
            ))}
          </div>
          <button className="close-viewsecrets" onClick={toggleViewSecrets}>
            X
          </button>
        </div>
      )}
    </>
  );
}
