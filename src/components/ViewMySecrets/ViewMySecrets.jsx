import { useState } from "react";
import "./ViewMySecrets.css";

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
                secret.revealed ? "revealed" : "hidden"
              }`}
              title={
                secret.revealed ? `Secret ${secret.class}` : `Secret hidden`
              }
            />
          ))}
        </div>

        <img src={imageMap["shhIcon"]} alt="shh" />
      </button>

      {ViewSecrets && (
        <div className="my-viewsecrets">
          <div onClick={toggleViewSecrets} className="overlay"></div>
          <div className="my-secrets-grid">
            {secrets.map((secret) => (
              <div key={secret.class} className="my-secret-card">
                {secret.revealed ? (
                  <img
                    className="front"
                    src={imageMap[secret.class]}
                    alt={`Secret ${secret.class}`}
                  />
                ) : (
                  <>
                    {/* front underneath */}
                    <img
                      className="front"
                      src={imageMap[secret.class]}
                      alt={`Secret ${secret.class}`}
                    />
                    {/* back on top, fades out on hover */}
                    <img
                      className="back"
                      src={imageMap["secretFront"]}
                      alt="Card back"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
          <button className="my-close-viewsecrets" onClick={toggleViewSecrets}>
            X
          </button>
        </div>
      )}
    </>
  );
}
