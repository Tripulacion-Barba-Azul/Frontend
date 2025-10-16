import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CARDS_MAP, SETS_MAP } from "../generalMaps.js";
import { createPortal } from "react-dom";
import "./SelectSet.css";

// Modal-only version of ViewSet
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

export function nameMap({ name }) {
  if (name === "Tommy Beresford" || name === "Tuppence Beresford") {
    return "The Beresfords";
  }
  return name;
}

export default function SelectSet({
  sets = [],
  selectedSetId,
  goBack,
  text = "Choose a Set",
}) {
  const [selectedSet, setSelectedSet] = useState(null);
  const [viewingSet, setViewingSet] = useState(false);

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
