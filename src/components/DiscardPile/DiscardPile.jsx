import './DiscardPile.css'; 

const fullDiscard = "/Icons/discardicon-full.png";
const halfDiscard = "/Icons/discardicon-half.png";
const thinDiscard = "/Icons/discardicon-thin.png";

const cardMapping = {
    7: "/Cards/07-detective_poirot.png",
    8: "/Cards/08-detective_marple.png",
    9: "/Cards/09-detective_satterhwaite.png",
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

//ejemplo de llamada al componente:
//<DiscardPile number="3" img_id="7" />

  export default function DiscardPile({ number, img_id }) {
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
  
    const topCard = cardMapping[img_id] || null;
  
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
            alt={`Top card ${img_id}`} 
            className="DiscardPile-topcard"
          />
        )}
      </div>
    );
  }