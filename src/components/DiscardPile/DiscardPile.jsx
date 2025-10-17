import "./DiscardPile.css";
import { CARDS_MAP } from "../generalMaps.js";
import { motion, AnimatePresence } from "framer-motion";

const fullDiscard = "/Icons/discardicon-full.png";
const halfDiscard = "/Icons/discardicon-half.png";
const thinDiscard = "/Icons/discardicon-thin.png";

export default function DiscardPile({ number, card }) {
  const validatedNumber = Math.max(0, Math.min(61, Number(number)));

  if (validatedNumber === 0) return null;

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

  const topCard = card?.name ? CARDS_MAP[card.name] : null;

  return (
    <motion.div
      key={card?.id}
      className={`DiscardPile-container ${discardClass}`}
      data-testid="discard-container"
      animate={{
        rotate: [0, -1.5, 1.5, -0.5, 0.5, 0],
      }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      {discardImage && (
        <img
          src={discardImage}
          alt={`Discard pile (${validatedNumber} cards)`}
          className="DiscardPile-image"
        />
      )}
  
      {/* 🃏 Animation Layer */}
      <div className="DiscardPile-topcard-wrapper">
        <AnimatePresence mode="sync">
          {topCard && (
            <motion.img
              key={card.id}
              src={topCard}
              alt={`Top card ${card.id}`}
              className="DiscardPile-topcard"
              initial={{ opacity: 0, y: -80, scale: 0.8, rotate: -8 }} // More above & rotation
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              exit={{
                opacity: 0,
                y: 0,
                scale: 1,
                transition: { delay: 0.25, duration: 0.25 },
              }}
              transition={{
                type: "spring",
                stiffness: 300, // Lower stiffness for slower movement
                damping: 25, // Lower damping for more oscillation
                duration: 0.6, // Explicit longer duration
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
