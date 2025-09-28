import { useState } from "react";
import "./ViewMyCards.css";

const zoomviewicon = "/Icons/zoomviewicon.png"

const imageMap = {
    7: "/Cards/07-detective_poirot.png",
    8: "/Cards/08-detective_marple.png",
    9: "/Cards/09-detective_satterthwaite.png",
    10: "/Cards/10-detective_pyne.png",
    11: "/Cards/11-detective_brent.png",
    12: "/Cards/12-detective_tommyberesford.png",
    13: "/Cards/13-detective_tuppenceberesford.png",
    14: "/Cards/14-detective_quin.png",
    15: "/Cards/15-detective_oliver.png",
    16: "/Cards/16-Instant_notsofast.png",
    17: "/Cards/17-event_cardsonthetable.png",
    18: "/Cards/18-event_anothervictim.png",
    19: "/Cards/19-event_deadcardfolly.png",
    20: "/Cards/20-event_lookashes.png",
    21: "/Cards/21-event_cardtrade.png",
    22: "/Cards/22-event_onemore.png",
    23: "/Cards/23-event_delayescape.png",
    24: "/Cards/24-event_earlytrain.png",
    25: "/Cards/25-event_pointsuspicions.png",
    26: "/Cards/26-devious_blackmailed.png",
    27: "/Cards/27-devious_fauxpas.png",
};

//Ejemplo de uso:
//const cartuchas = [7, 8, 9, 10, 11, 20];
//<ViewMyCards cards={cartuchas}/>

export default function ViewMyCards({ cards }) {
  const [ViewMyCards, setViewMyCards] = useState(false);

  const toggleViewMyCards = () => {
    setViewMyCards(!ViewMyCards);
  };

  const hasCards = cards && cards.length > 0 && cards.length < 7;

  if (ViewMyCards) {
    document.body.classList.add("active-viewmycards");
  } else {
    document.body.classList.remove("active-viewmycards");
  }

  return (
    <>
      <button onClick={toggleViewMyCards} className="btn-viewmycards">

        <img src={zoomviewicon} alt="zoomviewicon" />

      </button>

      {ViewMyCards && (
        <div className="viewmycards">
          <div onClick={toggleViewMyCards} className="overlay"></div>
          <div className="cards-grid">
          {hasCards ? (
              cards.map((card) => (
                <div key={card} className="card">
                    <img
                      src={imageMap[Number(card)]}
                      alt={`card ${card}`}
                    />
                </div>
              ))
            ) : (
              <div className="no-cards-message">
                <p>Out of cards!</p>
              </div>
            )}
          </div>
          <button className="close-viewmycards" onClick={toggleViewMyCards}>
            X
          </button>
        </div>
      )}
    </>
  );
}