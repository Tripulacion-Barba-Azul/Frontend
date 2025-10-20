import { useState } from "react";
import { createPortal } from "react-dom";
import "./ViewMyCards.css";
import { CARDS_MAP } from "../generalMaps.js";

function validateCards(cards) {
  const isArray = Array.isArray(cards);
  const hasValidLength = isArray && cards.length <= 6;
  const hasKnownNames = cards.every(
    ({ name }) => CARDS_MAP[name] !== undefined
  );

  return isArray && hasValidLength && hasKnownNames;
}

export default function ViewMyCards({ cards }) {
  if (!validateCards(cards)) {
    console.error("Invalid array of cards" + JSON.stringify(cards));
    throw new Error("Invalid array of cards");
  }

  const [ViewMyCards, setViewMyCards] = useState(false);
  const [mounted, setMounted] = useState(false);

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
        <img src={"/Icons/zoomviewicon.png"} alt="zoomviewicon" />
      </button>

      {ViewMyCards &&
        createPortal(
          <div className="viewmycards">
            <div onClick={toggleViewMyCards} className="overlay"></div>
            <div className="cards-grid">
              {hasCards ? (
                cards.map((card) => (
                  <div key={card.id} className="card">
                    <img src={CARDS_MAP[card.name]} alt={`card ${card.id}`} />
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
          </div>,
          document.body
        )}
    </>
  );
}
