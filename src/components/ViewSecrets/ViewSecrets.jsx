import { useState } from "react";
import './ViewSecrets.css'

import secret_front from '../../assets/cards/05-secret_front.png'
import secret_back from '../../assets/cards/06-secret_back.png'
import secret_accompice from '../../assets/cards/04-secret_accomplice.png'
import secret_murderer from '../../assets/cards/03-secret_murderer.png'
import shh_icon from '../../assets/icons/shh.png'

const imageMap = {
  1:  secret_murderer,
  2:  secret_accompice,
  3:  secret_back,
  4:  secret_back,
  5:  secret_back,
  6:  secret_back,
  7:  secret_back,
  8:  secret_back,
  9:  secret_back,
  10: secret_back,
  11: secret_back,
  12: secret_back,
  13: secret_back,
  14: secret_back,
  15: secret_back,
  16: secret_back,
  17: secret_back,
  18: secret_back,
}


export default function ViewSecrets({ secrets }) {
  const [ViewSecrets, setViewSecrets] = useState(false);

  const toggleViewSecrets = () => {
    setViewSecrets(!ViewSecrets);
  };

  const revealedCount = secrets.filter(secret => secret.revealed).length;
  const hiddenCount = secrets.length - revealedCount;

  if (ViewSecrets) {
    document.body.classList.add('active-viewsecrets')
  } else {
    document.body.classList.remove('active-viewsecrets')
  }

  return (
    <>
      <button onClick={toggleViewSecrets} className="btn-viewsecrets">
        <div className="light-dots">
          {secrets.map(secret => (
            <div 
              key={secret.id}
              className={`light-dot ${secret.revealed ? 'revealed' : 'hidden'}`}
              title={secret.revealed ? `Secret ${secret.id} revealed` : `Secret ${secret.id} hidden`}
            />
          ))}
        </div>
        
        <img src={shh_icon} alt="shh" />

      </button>

      {ViewSecrets && (
        <div className="viewsecrets">
          <div onClick={toggleViewSecrets} className="overlay"></div>
          <div className="secrets-grid">
            {secrets.map(secret => (
              <div key={secret.id} className="secret-card">
                {secret.revealed ? (
                  <img src={imageMap[secret.id]} alt={`Secret ${secret.id}`} />
                ) : (
                  <img src={secret_front} alt={`Secret hidden`} />
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
