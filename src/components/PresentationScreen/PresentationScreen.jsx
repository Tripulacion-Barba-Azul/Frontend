import "./PresentationScreen.css";
import { SECRETS_MAP } from "../generalMaps";

/**
 * PresentationScreen
 *
 * Props:
 * - actualPlayer: { name: string; role: "murderer" | "accomplice" | "detective" | string }
 * - ally?: { name: string } | null
 *
 * Behavior:
 * - murderer:
 *    - shows murdererSrc image
 *    - left (big) text box: murdererOwnText
 *    - right (small) text box: murdererOtherText (uses ally name if available)
 * - accomplice:
 *    - shows accompliceSrc image
 *    - left (big) text box: accompliceOwnText
 *    - right (small) text box: accompliceOtherText (uses ally name if available)
 * - detective:
 *    - shows detectiveSrc image
 *    - a single text box (spans both columns) with detectiveText
 */
export default function PresentationScreen({ actualPlayer, ally = null }) {
  const backgroundSrc = "/Board/backgroundBoard.png";

  // Role images (from secrets/cards mapping)
  const murdererSrc = SECRETS_MAP["You are the murderer"];
  const accompliceSrc = SECRETS_MAP["You are the accomplice"];
  const detectiveSrc = SECRETS_MAP["You are a detective"];

  const playerName = actualPlayer?.name ?? "You";
  const allyName = ally?.name ?? null;
  const role = String(actualPlayer?.role || "detective").toLowerCase();

  // Role-specific texts
  const murdererOwnText = `${playerName}, you are the murderer. Your goal is to escape without being caught. When the deck runs out of cards, you escape and win the game. Use your cards wisely to buy time and mislead the other players. But beware, detectives may find you suspicious if you are not careful.`;
  const murdererOtherText = allyName
    ? `${allyName} is your accomplice. They'll help you achieve your goals, but you won't lose if they get caught.`
    : `Your accomplice will help you, but you won't lose if they get caught.`;

  const accompliceOwnText = `${playerName}, you are the accomplice. Your goal is to help the murderer escape. When the deck runs out of cards, both of you escape and win the game. Work together to buy time and mislead the other players. But beware, detectives may find you suspicious if you are not careful.`;
  const accompliceOtherText = allyName
    ? `${allyName} is the murderer. If the murderer is caught, both of you lose. If you are caught, the murderer may still escape.`
    : `The murderer is your ally: if they are caught, you both lose; if you are caught, they may still escape.`;

  const detectiveText = `${playerName}, you are a detective. Your goal is to find the murderer and stop them before they escape. You win if you reveal the murderer’s secret card before the deck runs out. Use your skills to gather clues and identify suspicious subjects. Time matters—trust no one.`;

  // Resolve per-role content
  let cardSrc = detectiveSrc;
  let leftText = detectiveText; // big box
  let rightText = null; // small box (null means do not render)

  if (role === "murderer") {
    cardSrc = murdererSrc || cardSrc;
    leftText = murdererOwnText;
    rightText = murdererOtherText;
  } else if (role === "accomplice") {
    cardSrc = accompliceSrc || cardSrc;
    leftText = accompliceOwnText;
    rightText = accompliceOtherText;
  } else if (role === "detective") {
    cardSrc = detectiveSrc || cardSrc;
    leftText = detectiveText;
    rightText = null; // single textbox for detectives
  }

  return (
    <div
      className="root"
      aria-label="Información del jugador"
      style={
        backgroundSrc ? { backgroundImage: `url(${backgroundSrc})` } : undefined
      }
    >
      <div className="panel">
        {/* Role card image */}
        <div className="cardSlot">
          {cardSrc ? (
            <img
              src={cardSrc}
              alt={`${role} card`}
              className="cardImage"
              draggable={false}
            />
          ) : (
            <div className="cardPlaceholder" aria-hidden="true" />
          )}
        </div>

        {/* Texts area */}
        <div className="textRow">
          {/* Left (big) text box; for detective we span across both columns */}
          <div
            className="textBox"
            data-variant="big"
            style={rightText ? undefined : { gridColumn: "1 / -1" }}
          >
            {leftText}
          </div>

          {/* Right (small) text box only for murderer/accomplice */}
          {rightText && (
            <div className="textBox" data-variant="small">
              {rightText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
