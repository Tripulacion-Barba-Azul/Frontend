// SelectSet.jsx

/**
 * @file SelectSet.jsx
 * @description Modal grid to pick **one** detective set. Includes a “View Cards” modal preview.
 *
 * === Canonical shapes (from API DOCUMENT) ===
 * @typedef {{ id:number, name:string }} DetectiveCard
 *
 * @typedef {{ setId:number, setName:string, cards:DetectiveCard[] }} DetectiveSet
 *
 * === Props ===
 * @typedef {Object} SelectSetProps
 * @property {DetectiveSet[]} [sets=[]] - Sets to choose from (usually from a target player).
 * @property {(setId:number)=>void} selectedSetId - Called on confirm with the chosen setId.
 * @property {(() => void)|null} [goBack] - Optional “back” handler; if omitted, back button is hidden.
 * @property {string} [text="Choose a Set"] - Prompt text.
 */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CARDS_MAP, SETS_MAP } from "../../../../../utils/generalMaps";
import { createPortal } from "react-dom";
import "./SelectSet.css";

// Modal-only version of ViewSet: previews the set's cards
function ViewSetModal({ cards, onClose }) {
  useEffect(() => {
    document.body.classList.add("active-viewset");
    return () => {
      document.body.classList.remove("active-viewset");
    };
  }, []);

  return createPortal(
    <div className="viewset-modal-overlay" onClick={onClose}>
      <div className="cards-container" onClick={(e) => e.stopPropagation()}>
        {cards.map((card) => (
          <div key={card.id} className="card">
            <img src={CARDS_MAP[card.name]} alt={`card ${card.name}`} />
          </div>
        ))}
      </div>

      <button className="close-viewset" onClick={onClose}>
        X
      </button>
    </div>,
    document.body
  );
}

/** Normalizes the Beresfords variants to a single label */
export function nameMap({ name }) {
  if (
    name === "Tommy Beresford" ||
    name === "Tuppence Beresford" ||
    name === "Siblings Beresford"
  ) {
    return "The Beresfords";
  }
  return name;
}

/** @param {SelectSetProps} props */
export default function SelectSet({
  sets = [],
  selectedSetId,
  goBack,
  text = "Choose a Set",
}) {
  const [selectedSet, setSelectedSet] = useState(null);
  const [viewingSet, setViewingSet] = useState(false);

  // Lock page scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleSetSelect = (set) => {
    setSelectedSet(set);
  };

  const handleConfirm = () => {
    if (selectedSet) {
      selectedSetId(selectedSet.setId);
    }
  };

  const handleViewSet = (set) => {
    setSelectedSet(set);
    setViewingSet(true);
  };

  const handleCloseViewSet = () => {
    setViewingSet(false);
  };

  return (
    <div className="selectset-overlay">
      <motion.div
        className="selectset-content"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <h2 className="selectset-text">{text}</h2>

        <div className="selectset-grid">
          {sets.map((set) => {
            const isSelected = selectedSet?.setId === set.setId;
            const setIcon = SETS_MAP[set.setName];

            return (
              <motion.div
                key={set.setId}
                className={`selectset-item ${isSelected ? "selected" : ""}`}
                onClick={() => handleSetSelect(set)}
                whileHover={{ scale: 1.05 }}
                animate={{ scale: isSelected ? 1.05 : 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
              >
                <img
                  src={setIcon}
                  alt={set.setName}
                  className="selectset-avatar"
                />
                <div className="selectset-info">
                  <div className="selectset-name">
                    {nameMap({ name: set.setName })}
                  </div>
                  <div className="selectset-card-count">
                    {set.cards.length} cards
                  </div>
                  <button
                    className="selectset-view-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewSet(set);
                    }}
                  >
                    View Cards
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="selectset-actions">
          {goBack && (
            <button className="selectset-back" onClick={goBack}>
              Go Back
            </button>
          )}
          <button
            className="selectset-confirm"
            onClick={handleConfirm}
            disabled={!selectedSet}
          >
            Confirm
          </button>
        </div>
      </motion.div>

      {/* ViewSet Modal */}
      {viewingSet && selectedSet && (
        <ViewSetModal cards={selectedSet.cards} onClose={handleCloseViewSet} />
      )}
    </div>
  );
}
