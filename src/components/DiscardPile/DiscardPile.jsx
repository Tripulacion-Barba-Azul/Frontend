import "./DiscardPile.css";
import { CARDS_MAP } from "../generalMaps.js";

const fullDiscard = "/Icons/discardicon-full.png";
const halfDiscard = "/Icons/discardicon-half.png";
const thinDiscard = "/Icons/discardicon-thin.png";

export default function DiscardPile({ number, card }) {
  const validatedNumber = Math.max(0, Math.min(61, Number(number)));

  if (validatedNumber === 0) {
    return null; // 🛑
  }

  let discardImage, discardClass;
  if (validatedNumber >= 31) {
    discardImage = fullDiscard;
    discardClass = "full";
  } else if (validatedNumber >= 11) {
    discardImage = halfDiscard;
    discardClass = "half";
  } else {
    discardImage = thinDiscard;
    discardClass = "thin";
  }

  const topCard = card?.name ? CARDS_MAP[card.name] : null;

  return (
    <div
      className={`DiscardPile-container ${discardClass}`}
      data-testid="discard-container"
    >
      <img
        src={discardImage}
        alt={`Discard pile (${validatedNumber} cards)`}
        className="DiscardPile-image"
      />
      {topCard && (
        <img
          src={topCard}
          alt={`Top card ${card.id}`}
          className="DiscardPile-topcard"
        />
      )}
    </div>
  );
}
