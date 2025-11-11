// CardCount.jsx

import "./CardCount.css";

const CardIcon = "../../../public/Icons/cardicon.png";

/**
 * @file CardCount.jsx
 * @description Small overlay showing the player's hand size (0..6).
 *
 * === Props ===
 * @typedef {Object} CardCountProps
 * @property {number} number - Hand size; clamped to [0..6] for display.
 */

/** @param {CardCountProps} props */
export default function CardCount({ number }) {
  // Validate that number is between 0 and 6
  const validatedNumber = Math.max(0, Math.min(6, Number(number)));

  return (
    <div className="cardcount-container">
      <img src={CardIcon} alt="Card Icon" className="base-image" />
      <div className="number-overlay">{validatedNumber}</div>
    </div>
  );
}
