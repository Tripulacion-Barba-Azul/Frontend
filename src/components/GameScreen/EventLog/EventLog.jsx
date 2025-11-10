import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CARDS_MAP, SETS_MAP, SECRETS_MAP } from "../../../utils/generalMaps";
import "./EventLog.css";

/**
 * @file EventLog.jsx
 * @description Compact window (Chat-like) listing past notifications using the
 *              same visual layout as Notifier: text (left) + media rail (right).
 * Props:
 *  - eventLog: Array<{ event: string, payload: object }>
 *  - publicData: { players: Array<{id,name,avatar,sets?,secrets?}> }
 *  - actualPlayerId: number | null
 *  - buttonLabel?: string ("Event Log" by default)
 */
export default function EventLog({
  eventLog = [],
  publicData = {},
  actualPlayerId = null,
  buttonLabel = "Events",
}) {
  const [open, setOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const CLOSE_MS = 220;

  const openLog = useCallback(() => {
    setIsExiting(false);
    setOpen(true);
  }, []);

  const closeLog = useCallback(() => {
    setIsExiting(true);
    const t = setTimeout(() => {
      setOpen(false);
      setIsExiting(false);
      clearTimeout(t);
    }, CLOSE_MS);
  }, [CLOSE_MS]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      const isEsc = e.key === "Escape" || e.key === "Esc" || e.keyCode === 27;
      if (isEsc) {
        e.preventDefault();
        if (!isExiting) closeLog();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, isExiting, closeLog]);

  /* -----------------------
     Helpers (same as Notifier)
     ----------------------- */
  const PLAYER_COLORS = [
    "#e6194B",
    "#3cb44b",
    "#ffe119",
    "#4363d8",
    "#f58231",
    "#911eb4",
  ];
  const colorName = (name, index) => {
    const color = PLAYER_COLORS[index % PLAYER_COLORS.length];
    return `<span style="color:${color}; font-weight:bold">${name}</span>`;
  };

  const playerColorIndexMap = useMemo(() => {
    const map = {};
    publicData?.players?.forEach((p, idx) => (map[p.id] = idx));
    return map;
  }, [publicData]);

  const getPlayerNameColored = (playerId) => {
    const player = publicData?.players?.find((p) => p.id === playerId);
    if (!player) return `Player ${playerId}`;
    return colorName(player.name, playerColorIndexMap[playerId] ?? 0);
  };

  const getSetName = (setId, playerId) => {
    const player = publicData?.players?.find((p) => p.id === playerId);
    if (!player) return `Set ${setId}`;
    const set = player.sets?.find((s) => s.setId === setId);
    if (
      set &&
      (set.setName === "Tommy Beresford" ||
        set.setName === "Tuppence Beresford")
    ) {
      set.setName = "The Beresfords";
    }
    return set ? set.setName : `Set ${setId}`;
  };

  const getSetImage = (setId, playerId) => {
    const player = publicData?.players?.find((p) => p.id === playerId);
    if (!player) return null;
    const set = player.sets?.find((s) => s.setId === setId);
    return set ? SETS_MAP[set.setName] : null;
  };

  const getCardImage = (card) => {
    if (card.isSecret) {
      if (card.revealed && card.name) {
        return SECRETS_MAP[card.name] || "/Cards/05-secret_front.png";
      }
      return "/Cards/05-secret_front.png";
    }
    return CARDS_MAP[card.name] || "/Cards/05-secret_front.png";
  };

  /* -----------------------
     Map events to display model
     ----------------------- */
  const mapEventToDisplay = useCallback(
    (eventType, payload) => {
      switch (eventType) {
        case "notifierCardsOffTheTable": {
          const { playerId, quantity, selectedPlayerId } = payload;
          const playerName = getPlayerNameColored(playerId);
          const targetName = getPlayerNameColored(selectedPlayerId);
          const cards = Array.from({ length: quantity }, (_, i) => ({
            id: i,
            name: "Not so Fast!",
            isSecret: false,
            revealed: false,
          }));
          const text =
            selectedPlayerId === playerId
              ? `${playerName} made themselves discard <br /> ${quantity} "Not so Fast!" cards`
              : `${playerName} made ${targetName} discard <br /> ${quantity} "Not so Fast!" cards`;
          return { text, cards, setImage: null };
        }

        case "notifierStealSet": {
          const { playerId, stolenPlayerId, setId } = payload;
          const playerName = getPlayerNameColored(playerId);
          const stolenFromName = getPlayerNameColored(stolenPlayerId);
          return {
            text: `${playerName} stole <br /> "${getSetName(
              setId,
              stolenPlayerId
            )}" detective set <br /> from ${stolenFromName}`,
            cards: [],
            setImage: getSetImage(setId, stolenPlayerId),
          };
        }

        case "notifierLookIntoTheAshes": {
          const { playerId } = payload;
          return {
            text: `${getPlayerNameColored(playerId)} looked into the ashes`,
            cards: [],
            setImage: null,
          };
        }

        case "notifierAndThenThereWasOneMore": {
          const {
            playerId,
            secretId,
            secretName,
            stolenPlayerId,
            giftedPlayerId,
          } = payload;
          const p = getPlayerNameColored(playerId);
          const from = getPlayerNameColored(stolenPlayerId);
          const to = getPlayerNameColored(giftedPlayerId);
          const card = {
            id: secretId,
            name: secretName,
            revealed: true,
            isSecret: true,
          };
          let text;
          if (stolenPlayerId === playerId && giftedPlayerId === playerId) {
            text = `${p} took one of their revealed secrets <br /> and hid it`;
          } else if (
            stolenPlayerId === playerId &&
            giftedPlayerId !== playerId
          ) {
            text = `${p} took one of their own secrets <br /> and gave it to ${to}. <br /> Now the secret is hidden`;
          } else if (
            stolenPlayerId !== playerId &&
            giftedPlayerId === playerId
          ) {
            text = `${p} stole a secret from ${from}. <br /> Now the secret is hidden`;
          } else if (giftedPlayerId === stolenPlayerId) {
            text = `${p} took a secret from ${from} <br /> and gave it back to them. <br /> Now the secret is hidden`;
          } else {
            text = `${p} took a secret from ${from} <br /> and gave it to ${to}. <br /> Now the secret is hidden`;
          }
          return { text, cards: [card], setImage: null };
        }

        case "notifierRevealSecret":
        case "notifierRevealSecretForce": {
          const { playerId, secretId, selectedPlayerId, secretName } = payload;
          const p = getPlayerNameColored(playerId);
          const t = getPlayerNameColored(selectedPlayerId);
          const targetPlayer = publicData.players.find(
            (pl) => pl.id === selectedPlayerId
          );
          const secret = targetPlayer?.secrets?.find((s) => s.id === secretId);
          const card = {
            id: secretId,
            name: secretName ? secretName : secret?.name,
            revealed: true,
            isSecret: true,
          };
          const isForce = eventType === "notifierRevealSecretForce";
          const text =
            selectedPlayerId === playerId
              ? `${p} revealed one of their own secrets`
              : isForce
              ? `${p} made ${t} reveal a secret`
              : `${p} revealed ${t}'s secret`;
          return { text, cards: [card], setImage: null };
        }

        case "notifierSatterthwaiteWild": {
          const { playerId, secretId, secretName, selectedPlayerId } = payload;
          const p = getPlayerNameColored(playerId);
          const t = getPlayerNameColored(selectedPlayerId);
          const card = {
            id: secretId,
            name: secretName,
            revealed: true,
            isSecret: true,
          };
          const text =
            selectedPlayerId === playerId
              ? `${p} showed one of their own secrets. <br /> The secret remains hidden`
              : `${p} stole one of ${t}'s secrets. <br /> The secret is now hidden`;
          return { text, cards: [card], setImage: null };
        }

        case "notifierHideSecret": {
          const { playerId, secretId, selectedPlayerId, secretName } = payload;
          const p = getPlayerNameColored(playerId);
          const t = getPlayerNameColored(selectedPlayerId);
          const targetPlayer = publicData.players.find(
            (pl) => pl.id === selectedPlayerId
          );
          const secret = targetPlayer?.secrets?.find((s) => s.id === secretId);
          const card = {
            id: secretId,
            name: secretName ? secretName : secret?.name || "Secret",
            revealed: !!secretName,
            isSecret: true,
          };
          const text =
            selectedPlayerId !== playerId
              ? `${p} hid one of ${t}'s secrets`
              : `${p} hid one of their secrets`;
          return { text, cards: [card], setImage: null };
        }

        case "notifierDelayTheMurderersEscape": {
          const { playerId } = payload;
          return {
            text: `${getPlayerNameColored(
              playerId
            )} took cards from the discard pile <br /> and put them on top of the deck <br /> in some order`,
            cards: [],
            setImage: null,
          };
        }

        case "notifierCardsPlayed": {
          const { playerId, cards, actionType, setOwnerId } = payload;
          const p = getPlayerNameColored(playerId);
          let s = "";
          let isActualPlayerSet = false;
          setOwnerId
            ? ((isActualPlayerSet = playerId == setOwnerId),
              (s = getPlayerNameColored(setOwnerId)))
            : (isActualPlayerSet = false);

          let actionText = "played cards";
          if (actionType === "set") actionText = "played a set of detectives";
          else if (actionType === "detective")
            actionText = isActualPlayerSet
              ? `added a detective <br /> to a set of his own`
              : `added a detective <br /> to a set owned by ${s}`;
          else if (actionType === "event") actionText = "played an event card";
          else if (actionType === "instant")
            actionText = "played a Not so Fast!";

          const displayCards = (cards || []).map((c) => ({
            ...c,
            isSecret: false,
            revealed: false,
          }));

          return {
            text: `${p} ${actionText}`,
            cards: displayCards,
            setImage: null,
          };
        }

        case "notifierDiscardEvent": {
          const { playerId, cards } = payload;
          const displayCards = (cards || []).map((c) => ({
            ...c,
            isSecret: false,
            revealed: false,
          }));
          return {
            text: `${getPlayerNameColored(playerId)} discarded ${
              displayCards.length
            } cards`,
            cards: displayCards,
            setImage: null,
          };
        }

        case "notifierCardTrade": {
          const { playerId, cardName } = payload;
          const p = getPlayerNameColored(playerId);
          const card = {
            id: 0,
            name: cardName,
            isSecret: false,
            revealed: false,
          };
          return {
            text: `${p} gave you a card`,
            cards: [card],
            setImage: null,
          };
        }

        case "notifierCardTradePublic": {
          const { playerId, selectedPlayerId } = payload;
          const p = getPlayerNameColored(playerId);
          const s = getPlayerNameColored(selectedPlayerId);
          return {
            text: `${p} traded cards with ${s}`,
            cards: [],
            setImage: null,
          };
        }

        case "notifierDeadCardFolly": {
          return {
            text: `Everyone passed a card to their side`,
            cards: [],
            setImage: null,
          };
        }

        case "notifierPointYourSuspicious": {
          const { selectedPlayerId } = payload;
          const p = getPlayerNameColored(selectedPlayerId);
          return {
            text: `${p} was pointed as a suspicious!`,
            cards: [],
            setImage: null,
          };
        }

        case "notifierBlackmailed": {
          const { playerId, selectedPlayerId } = payload;
          const p = getPlayerNameColored(playerId);
          const s = getPlayerNameColored(selectedPlayerId);
          const isActualPlayerReceiver = selectedPlayerId === actualPlayerId;
          const card = {
            id: 0,
            name: "Blackmailed!",
            revealed: false,
            isSecret: false,
          };
          const text = isActualPlayerReceiver
            ? `You were blackmailed by ${p}!`
            : `${s} was blackmailed by ${p}!`;
          return { text, cards: [card], setImage: null };
        }

        case "notifierFauxPass": {
          const { playerId, selectedPlayerId } = payload;
          const p = getPlayerNameColored(playerId);
          const s = getPlayerNameColored(selectedPlayerId);
          const isActualPlayerSender = playerId === actualPlayerId;
          const card = {
            id: 0,
            name: "Social Faux Pas",
            revealed: false,
            isSecret: false,
          };
          const text = isActualPlayerSender
            ? `You tricked ${s} <br /> into a Social Faux Pas!`
            : `${s} has been tricked into <br /> a Social Faux Pas by ${p}! `;
          return { text, cards: [card], setImage: null };
        }

        default:
          return { text: ``, cards: [], setImage: null };
      }
    },
    [publicData, actualPlayerId]
  );

  const items = useMemo(() => {
    return (eventLog || []).map((e, idx) => {
      const { text, cards, setImage } = mapEventToDisplay(
        e.event,
        e.payload || {}
      );
      return {
        key: `${idx}-${e.event}`,
        text,
        cards: cards || [],
        setImage: setImage || null,
      };
    });
  }, [eventLog, mapEventToDisplay]);

  return (
    <>
      {/* Minimal badge (no unread/red counter) */}
      <button
        type="button"
        className="eventLogBadge"
        aria-label={open ? "Close event log" : "Open event log"}
        onClick={() => (open ? closeLog() : openLog())}
      >
        <span className="eventLogBadge__label">{buttonLabel}</span>
      </button>

      {/* Window (Chat-like) */}
      {open && (
        <div
          className={`eventLogWindow${isExiting ? " is-exiting" : ""}`}
          role="dialog"
          aria-label="Event log"
        >
          <div className="eventLogWindow__header">
            <div className="eventLogWindow__title">Event Log</div>
            <button
              type="button"
              className="eventLogWindow__close"
              aria-label="Close event log"
              onClick={closeLog}
            >
              <span className="elogCloseIcon" aria-hidden="true" />
            </button>
          </div>

          <ul className="eventLogWindow__list" aria-live="polite">
            {items.length === 0 && (
              <li className="eventLogWindow__empty">No events yet.</li>
            )}

            {items.map(({ key, text, cards, setImage }) => (
              <li key={key} className="eventLogRow">
                <div className="notifier-content">
                  <div className="notifier-left">
                    <div
                      className="notifier-text"
                      dangerouslySetInnerHTML={{ __html: text }}
                    />
                  </div>

                  {(setImage || (cards && cards.length > 0)) && (
                    <div className="notifier-right" aria-label="Media rail">
                      {setImage && (
                        <div className="notifier-set">
                          <img src={setImage} alt="Set" className="is-set" />
                        </div>
                      )}
                      {cards && cards.length > 0 && (
                        <div className="notifier-cards">
                          {cards.slice(0, 6).map((card, index) => (
                            <div key={index} className="notifier-card">
                              <img
                                src={getCardImage(card)}
                                alt={card.name}
                                className={card.isSecret ? "is-secret" : ""}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
