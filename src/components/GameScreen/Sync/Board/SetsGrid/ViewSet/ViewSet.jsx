// ViewSet.jsx

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "./ViewSet.css";
import { CARDS_MAP, SETS_MAP } from "../../../../../../utils/generalMaps";

/**
 * @file ViewSet.jsx
 * @description Button that shows a modal with all the cards of a detective set.
 *
 * === Canonical shapes (from API DOCUMENT) ===
 * @typedef {{ id:number, name:string }} DetectiveCard
 *
 * === Props ===
 * @typedef {Object} ViewSetProps
 * @property {DetectiveCard[]} cards - Cards of the detective set (1..10), all with valid names in CARDS_MAP.
 * @property {string} setName - Name of the detective set; must exist in SETS_MAP.
 */

/** Basic defensive prop validation to prevent rendering invalid assets. */
function validateProps(cards, setName) {
  const isArray = Array.isArray(cards);
  const hasCards = isArray && cards.length > 0 && cards.length <= 10;
  const allNamesKnown =
    hasCards && cards.every(({ name }) => CARDS_MAP[name] !== undefined);
  const validSet =
    typeof setName === "string" && SETS_MAP[setName] !== undefined;

  return isArray && hasCards && allNamesKnown && validSet;
}

/** @param {ViewSetProps} props */
export default function ViewSet({ cards, setName }) {
  if (!validateProps(cards, setName)) {
    console.error("Invalid props for ViewSet:", { cards, setName });
    throw new Error("Invalid props for ViewSet");
  }

  const [ViewSet, setViewSet] = useState(false);
  const toggleViewSet = () => setViewSet((prev) => !prev);

  // Add/remove a body class while the modal is open (scroll lock + backdrop)
  useEffect(() => {
    const bodyClass = "active-viewset";
    if (ViewSet) document.body.classList.add(bodyClass);
    else document.body.classList.remove(bodyClass);
    return () => document.body.classList.remove(bodyClass);
  }, [ViewSet]);

  return (
    <>
      <button onClick={toggleViewSet} className="btn-viewset" title={setName}>
        <img src={SETS_MAP[setName]} alt={`set ${setName}`} />
      </button>

      {ViewSet &&
        createPortal(
          <div className="viewset">
            <div onClick={toggleViewSet} className="overlay"></div>

            <div className="cards-container">
              {cards.map((card) => (
                <div key={card.id} className="card">
                  <img src={CARDS_MAP[card.name]} alt={`card ${card.name}`} />
                </div>
              ))}
            </div>

            <button className="close-viewset" onClick={toggleViewSet}>
              X
            </button>
          </div>,
          document.body
        )}
    </>
  );
}
