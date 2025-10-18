import "./PresentationScreen.css";
import { useEffect, useRef } from "react";
import { AVATAR_MAP } from "../generalMaps";

/**
 * PresentationScreen
 *
 * Props:
 * - actualPlayer: { name: string; role: "murderer" | "accomplice" | "detective" | string }
 * - ally?: { name: string; avatar?: number|string } | null
 * - close: (v: boolean) => void
 * - soloAsSingleBox?: boolean   // NEW: when true, murderer/accomplice render as a single box if there's NO ally (detective is always single)
 *
 * Behavior (unchanged when an ally exists):
 * - murderer/accomplice:
 *    - shows role image
 *    - left text box: role overview
 *    - right text box: ally description
 *    - ally chip: to the RIGHT, outside the textbox
 * - detective:
 *    - shows detective image
 *    - single text box only (placement controlled by .solo-box/.detective-box)
 *
 * Extra:
 * - "I am ready" calls close(true) immediately.
 * - Auto-calls close(true) after 20 seconds.
 */
export default function PresentationScreen({
  actualPlayer,
  ally = null,
  close,
  soloAsSingleBox = true, // default enabled to match the requested behavior
}) {
  const timeoutRef = useRef(null);

  // Auto-close via parent's setter after 20s
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      try {
        if (typeof close === "function") close(true);
      } catch {
        /* no-op */
      }
    }, 20000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [close]);

  const backgroundSrc = "/Presentation/background.png";

  // Role images (replace with your final assets if needed)
  const murdererSrc = "/Presentation/murderer.png";
  const accompliceSrc = "/Presentation/accomplice.png";
  const detectiveSrc = "/Presentation/detective.png";

  const playerName = actualPlayer?.name ?? "You";
  const allyName = ally?.name ?? null;
  const role = String(actualPlayer?.role || "detective").toLowerCase();
  const isDetective = role === "detective";

  /** Flag: should we collapse to a single box? */
  const shouldSolo =
    isDetective ||
    (soloAsSingleBox &&
      !ally &&
      (role === "murderer" || role === "accomplice"));

  /** Colored name inline */
  const Name = ({ name, role }) => (
    <strong className={`role-name role-${role}`}>{name}</strong>
  );

  /** Ally chip (name box + avatar) following PlayerBadge minimal aesthetics */
  const AllyChip = ({ name, avatarSrc, role }) => {
    if (!name || !avatarSrc) return null;
    const ring =
      role === "murderer"
        ? "#EF4444"
        : role === "accomplice"
        ? "#F59E0B"
        : "#E6D7A6"; // detective cream
    return (
      <div className="ally-chip">
        <div className="ally-name-box" data-role={role}>
          {name}
        </div>
        <div
          className={`ally-avatar-circle${
            role === "detective" ? " no-glow" : ""
          }`}
          style={{ ["--ring-color"]: ring }}
        >
          <img
            src={avatarSrc}
            alt={`Avatar of ${name}`}
            className="ally-avatar-img"
            draggable={false}
          />
        </div>
      </div>
    );
  };

  const allyAvatarSrc =
    ally && AVATAR_MAP[ally.avatar] ? AVATAR_MAP[ally.avatar] : null;

  // Role content
  let cardSrc = detectiveSrc;
  let leftContent;
  let rightContent = null;
  let rightChip = null;

  if (role === "murderer") {
    // Ally is the accomplice
    cardSrc = murdererSrc || cardSrc;
    leftContent = (
      <p>
        <Name name={playerName} role="murderer" />, you are the murderer.
        <br />
        <br /> Your goal is to escape without being caught. When the deck runs
        out of cards, you escape and win the game. <br /> Beware, detectives may
        find you suspicious if you are not careful. <br></br>
        <span style={{ fontWeight: 700, fontStyle: "italic" }}>
          Use your cards wisely to buy time and mislead the other players.
        </span>
      </p>
    );
    rightContent = (
      <p>
        {allyName ? (
          <Name name={allyName} role="accomplice" />
        ) : (
          "Your accomplice"
        )}{" "}
        is your accomplice. <br />
        <br />
        They&apos;ll help you achieve your goals, but you won&apos;t lose if
        they get caught. <br />
        Work together to outsmart the detectives.
      </p>
    );
    rightChip = (
      <AllyChip name={allyName} avatarSrc={allyAvatarSrc} role="accomplice" />
    );
  } else if (role === "accomplice") {
    // Ally is the murderer
    cardSrc = accompliceSrc || cardSrc;
    leftContent = (
      <p>
        <Name name={playerName} role="accomplice" />, you are the accomplice.{" "}
        <br />
        <br />
        Your goal is to help the murderer escape. When the deck runs out of
        cards, both of you escape and win the game. <br /> But beware,
        detectives may find you suspicious if you are not careful. <br></br>{" "}
        <span style={{ fontWeight: 700, fontStyle: "italic" }}>
          Work together to buy time and mislead the other players.
        </span>
      </p>
    );
    rightContent = (
      <p>
        {allyName ? <Name name={allyName} role="murderer" /> : "The murderer"}{" "}
        is the murderer.
        <br />
        <br /> If the murderer is caught, both of you lose. If you are caught,
        the murderer can still escape. <br /> Work together to outsmart the
        detectives.
      </p>
    );
    rightChip = (
      <AllyChip name={allyName} avatarSrc={allyAvatarSrc} role="murderer" />
    );
  } else {
    // detective
    cardSrc = detectiveSrc || cardSrc;
    leftContent = (
      <p>
        <Name name={playerName} role="detective" />, you are a detective.
        <br />
        <br /> Your goal is to find the murderer and stop them before they
        escape. <br />
        You win if you reveal the murderer’s secret card before the deck runs
        out. Use your skills to gather clues and identify suspicious subjects.{" "}
        <br></br>
        <span style={{ fontWeight: 700, fontStyle: "italic" }}>
          Time is crucial. Trust no one.
        </span>
      </p>
    );
    rightContent = null;
    rightChip = null;
  }

  const hasRightChip = Boolean(rightChip);
  const showRightContent = Boolean(rightContent) && !shouldSolo;
  const showRightChip = hasRightChip && !shouldSolo;

  const handleReady = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (typeof close === "function") close(true);
  };

  return (
    <div
      className="root"
      aria-label="Player information"
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
        <div className={`textRow ${showRightChip ? "textRow--withChip" : ""}`}>
          <div
            className={`textBox ${shouldSolo ? "solo-box" : ""}`}
            data-variant="big"
            data-det={
              isDetective ? "true" : "false"
            } /* keep legacy flag for CSS */
            data-solo={
              shouldSolo ? "true" : "false"
            } /* new generic flag for single-box layout */
          >
            {leftContent}
          </div>

          {showRightContent && (
            <div className="textBox" data-variant="small">
              {rightContent}
            </div>
          )}

          {/* Ally chip OUTSIDE the textbox, to the RIGHT */}
          {showRightChip && <div className="ally-chipWrap">{rightChip}</div>}
        </div>

        {/* Ready button row */}
        <div className="readyRow">
          <button type="button" className="readyButton" onClick={handleReady}>
            I am ready
          </button>
        </div>
      </div>
    </div>
  );
}
