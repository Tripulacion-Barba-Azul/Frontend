import "./PresentationScreen.css";
import { SECRETS_MAP } from "../generalMaps";

export default function PresentationScreen() {
  const backgroundSrc = "/Board/backgroundBoard.png";
  const cardSrc = SECRETS_MAP["You are the murderer"];

  const murdererText =
    "You are the murderer. Your goal is to escape without being caught. When the deck runs out of cards, you escape and win the game. Use your cards wisely to buy time and mislead the other players. But beware, the detectives may find you suspicious if you are not careful.";
  const accompliceText =
    "Marco is your Accomplice. They'll help you achieve your goals, but you won't lose if they get caught.";

  return (
    <div
      className="root"
      aria-label="Información del jugador"
      style={
        backgroundSrc ? { backgroundImage: `url(${backgroundSrc})` } : undefined
      }
    >
      <div className="panel">
        <div className="cardSlot">
          {cardSrc ? (
            <img
              src={cardSrc}
              alt="Carta"
              className="cardImage"
              draggable={false}
            />
          ) : (
            <div className="cardPlaceholder" aria-hidden="true" />
          )}
        </div>

        <div className="textRow">
          <div className="textBox" data-variant="big">
            {murdererText}
          </div>
          <div className="textBox" data-variant="small">
            {accompliceText}
          </div>
        </div>
      </div>
    </div>
  );
}
