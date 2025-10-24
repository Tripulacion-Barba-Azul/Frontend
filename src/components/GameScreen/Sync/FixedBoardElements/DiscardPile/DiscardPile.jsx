// DiscardPile.jsx

/**
 * @file DiscardPile.jsx
 * @description Discard pile widget: shows stack icon (full/half/thin) + last discarded card animation.
 *
 * === Canonical shapes (from API DOCUMENT) ===
 * @typedef {{ id:number, name:string }} SimpleCard
 *
 * === Props ===
 * @typedef {Object} DiscardPileProps
 * @property {number} number - Discard pile size (0..61). Clamped internally.
 * @property {SimpleCard | null | undefined} card - Top discard card (last discarded) or null.
 */

import "./DiscardPile.css";
import { CARDS_MAP } from "../../../../../utils/generalMaps";
import { motion, AnimatePresence } from "framer-motion";

const fullDiscard = "/Icons/discardicon-full.png";
const halfDiscard = "/Icons/discardicon-half.png";
const thinDiscard = "/Icons/discardicon-thin.png";

/** @param {DiscardPileProps} props */
export default function DiscardPile({ number, card }) {
  // Clamp for visuals and to avoid invalid assets
  const validatedNumber = Math.max(0, Math.min(61, Number(number)));

  // Nothing to render if there are no cards in the discard pile
  if (validatedNumber === 0) return null;

  // Pick stack sprite by thresholds
  let discardImage, discardClass;
  if (validatedNumber >= 26) {
    discardImage = fullDiscard;
    discardClass = "full";
  } else if (validatedNumber >= 6) {
    discardImage = halfDiscard;
    discardClass = "half";
  } else if (validatedNumber >= 2) {
    discardImage = thinDiscard;
    discardClass = "thin";
  } else {
    discardImage = null;
    discardClass = "one-card";
  }

  // Resolve top card image (optional)
  const topCard = card?.name ? CARDS_MAP[card.name] : null;

  return (
    <motion.div
      key={card?.id}
      className={`DiscardPile-container ${discardClass}`}
      data-testid="discard-container"
      animate={{ rotate: [0, -1.5, 1.5, -0.5, 0.5, 0] }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      {discardImage && (
        <img
          src={discardImage}
          alt={`Discard pile (${validatedNumber} cards)`}
          className="DiscardPile-image"
        />
      )}

      {/* Top card animation */}
      <div className="DiscardPile-topcard-wrapper">
        <AnimatePresence mode="sync">
          {topCard && (
            <motion.img
              key={card.id}
              src={topCard}
              alt={`Top card ${card.id}`}
              className="DiscardPile-topcard"
              initial={{ opacity: 0, y: -80, scale: 0.8, rotate: -8 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              exit={{
                opacity: 0,
                y: 0,
                scale: 1,
                transition: { delay: 0.25, duration: 0.25 },
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                duration: 0.6,
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
