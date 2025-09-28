import './RegularDeck.css'; 

const fullDeck = "/Icons/deckicon-full.png"
const halfDeck = "/Icons/deckicon-half.png"
const thinDeck = "/Icons/deckicon-thin.png"
const murdererEscapes = "/Cards/02-murder_escapes.png"


export default function RegularDeck({ number }) {
    const validatedNumber = Math.max(0, Math.min(61, Number(number)));
  
    let deckImage, deckClass;
    if (validatedNumber >= 31) {
      deckImage = fullDeck;
      deckClass = "full";
    } else if (validatedNumber >= 11) {
      deckImage = halfDeck;
      deckClass = "half";
    } else if (validatedNumber >= 1) {
      deckImage = thinDeck;
      deckClass = "thin";
    } else {
      deckImage = murdererEscapes;
      deckClass = "murderer";
    }
  
    return (
      <div className={`RegularDeck-container ${deckClass}`}
      data-testid="deck-container">
        <img 
          src={deckImage} 
          alt={`Deck: (${validatedNumber} cards left)`} 
          className="RegularDeck-image"
        />
        <div className="RegularDeck-count">
          {validatedNumber}
        </div>
      </div>
    );
  }