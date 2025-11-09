/**
 * @file EventLog.jsx
 * @description Slide-in drawer that lists past notifications rendered the same way as Notifier.
 * Props:
 *  - eventLog: Array<{ event: string, payload: object }>
 *  - publicData: game public data (players, sets, secrets)
 *  - actualPlayerId: current player id (for first-person phrasing)
 *  - buttonLabel?: string (optional)
 */

import React, { useMemo, useState } from "react";
import {
  CARDS_MAP,
  SETS_MAP,
  SECRETS_MAP,
} from "../../../../utils/generalMaps";
import "./EventLog.css";
// IMPORTANT: We reuse Notifier's visual classes for identical look.
// Make sure Notifier.css is bundled somewhere in your app.

export default function EventLog({
  eventLog = [],
  publicData = { players: [] },
  actualPlayerId = null,
  buttonLabel = "Event Log",
}) {
  const [open, setOpen] = useState(false);

  // --- helpers shared with Notifier (kept equivalent) ---
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

  // --- event -> display mapping (mirror of Notifier handlers) ---
  const mapEventToDisplay = (ev, payload) => {
    switch (ev) {
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
        return {
          text:
            selectedPlayerId === playerId
              ? `${playerName} made themselves discard <br /> ${quantity} "Not so Fast!" cards`
              : `${playerName} made ${targetName} discard <br /> ${quantity} "Not so Fast!" cards`,
          cards,
          setImage: null,
        };
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
          shouldFlip: true,
          flipDirection: "hide",
        };

        if (stolenPlayerId === playerId && giftedPlayerId === playerId) {
          return {
            text: `${p} took one of their revealed secrets <br /> and hid it`,
            cards: [card],
            setImage: null,
          };
        } else if (stolenPlayerId === playerId && giftedPlayerId !== playerId) {
          return {
            text: `${p} took one of their own secrets <br /> and gave it to ${to}. <br /> Now the secret is hidden`,
            cards: [card],
            setImage: null,
          };
        } else if (stolenPlayerId !== playerId && giftedPlayerId === playerId) {
          return {
            text: `${p} stole a secret from ${from}. <br /> Now the secret is hidden`,
            cards: [card],
            setImage: null,
          };
        } else if (giftedPlayerId === stolenPlayerId) {
          return {
            text: `${p} took a secret from ${from} <br /> and gave it back to them. <br /> Now the secret is hidden`,
            cards: [card],
            setImage: null,
          };
        }
        return {
          text: `${p} took a secret from ${from} <br /> and gave it to ${to}. <br /> Now the secret is hidden`,
          cards: [card],
          setImage: null,
        };
      }

      case "notifierRevealSecret":
      case "notifierRevealSecretForce": {
        const { playerId, secretId, selectedPlayerId, secretName } = payload;
        const p = getPlayerNameColored(playerId);
        const t = getPlayerNameColored(selectedPlayerId);
        const targetPlayer = publicData?.players?.find(
          (pl) => pl.id === selectedPlayerId
        );
        const secret = targetPlayer?.secrets?.find((s) => s.id === secretId);
        const card = {
          id: secret?.id ?? secretId,
          name: secretName ? secretName : secret?.name,
          revealed: true,
          isSecret: true,
          shouldFlip: !!secretName,
          flipDirection: "reveal",
        };
        const text =
          ev === "notifierRevealSecretForce"
            ? selectedPlayerId === playerId
              ? `${p} revealed one of their own secrets`
              : `${p} made ${t} reveal a secret`
            : selectedPlayerId === playerId
            ? `${p} revealed one of their own secrets`
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
          shouldFlip: true,
          flipDirection: "hide",
        };
        return {
          text:
            selectedPlayerId === playerId
              ? `${p} showed one of their own secrets. <br /> The secret remains hidden`
              : `${p} stole one of ${t}'s secrets. <br /> The secret is now hidden`,
          cards: [card],
          setImage: null,
        };
      }

      case "notifierHideSecret": {
        const { playerId, secretId, selectedPlayerId, secretName } = payload;
        const p = getPlayerNameColored(playerId);
        const t = getPlayerNameColored(selectedPlayerId);
        const targetPlayer = publicData?.players?.find(
          (pl) => pl.id === selectedPlayerId
        );
        const secret = targetPlayer?.secrets?.find((s) => s.id === secretId);
        const card = {
          id: secretId,
          name: secretName ? secretName : secret?.name || "Secret",
          revealed: !!secretName,
          isSecret: true,
          shouldFlip: !!secretName,
          flipDirection: "hide",
        };
        return {
          text:
            selectedPlayerId !== playerId
              ? `${p} hid one of ${t}'s secrets`
              : `${p} hid one of their secrets`,
          cards: [card],
          setImage: null,
        };
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
        let actionText = "played cards";
        if (actionType === "set") actionText = "played a set of detectives";
        else if (actionType === "detective") {
          const isActualPlayerSet =
            setOwnerId != null ? playerId == setOwnerId : false;
          const s = setOwnerId != null ? getPlayerNameColored(setOwnerId) : "";
          actionText = isActualPlayerSet
            ? `added a detective <br /> to a set of his own`
            : `added a detective <br /> to a set owned by ${s}`;
        } else if (actionType === "event") actionText = "played an event card";
        else if (actionType === "instant") actionText = "played a Not so Fast!";
        const displayCards = cards.map((c) => ({
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
        const displayCards = cards.map((c) => ({
          ...c,
          isSecret: false,
          revealed: false,
        }));
        return {
          text: `${getPlayerNameColored(playerId)} discarded ${
            cards.length
          } cards`,
          cards: displayCards,
          setImage: null,
        };
      }

      case "notifierNoEffect":
        return { text: `Nothing happened.`, cards: [], setImage: null };

      case "notifierCardTrade": {
        const { playerId, cardName } = payload;
        const p = getPlayerNameColored(playerId);
        const card = {
          id: 0,
          name: cardName,
          isSecret: false,
          revealed: false,
        };
        return { text: `${p} gave you a card`, cards: [card], setImage: null };
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

      case "notifierDeadCardFolly":
        return {
          text: `Everyone passed a card to their side`,
          cards: [],
          setImage: null,
        };

      case "notifierPointYourSuspicious":
        // For the log, show text only (interactive circle is not suited for list).
        return { text: "Point Your Suspicious", cards: [], setImage: null };

      case "notifierBlackmailedCard": {
        const { playerId, secretName } = payload;
        const p = getPlayerNameColored(playerId);
        const card = {
          id: 0,
          name: secretName,
          revealed: true,
          isSecret: true,
          shouldFlip: true,
          flipDirection: "reveal",
        };
        return {
          text: `You now know one of <br /> ${p}'s secrets`,
          cards: [card],
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
  };

  // Build list (keep original order)
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
  }, [eventLog, publicData, actualPlayerId]);

  return (
    <>
      {/* Toggle button */}
      <button
        type="button"
        className="eventlog-toggle"
        onClick={() => setOpen((s) => !s)}
        aria-expanded={open}
        aria-controls="eventlog-panel"
      >
        {buttonLabel}
      </button>

      {/* Overlay + Drawer */}
      <div
        className={`eventlog-overlay ${open ? "open" : ""}`}
        onClick={() => setOpen(false)}
      />
      <aside
        id="eventlog-panel"
        className={`eventlog-panel ${open ? "open" : ""}`}
        aria-hidden={!open}
      >
        <header className="eventlog-header">
          <h3 className="eventlog-title">Event Log</h3>
          <button
            type="button"
            className="eventlog-close"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <ul className="eventlog-list">
          {items.length === 0 && (
            <li className="eventlog-empty">No events yet.</li>
          )}

          {items.map(({ key, text, cards, setImage }) => (
            <li key={key} className="eventlog-row">
              {/* Reuse Notifier visuals for identical look */}
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
                        <img src={setImage} alt="Set" />
                      </div>
                    )}
                    {cards && cards.length > 0 && (
                      <div className="notifier-cards">
                        {cards.slice(0, 6).map((card, index) => (
                          <div key={index} className="notifier-card">
                            <img src={getCardImage(card)} alt={card.name} />
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
      </aside>
    </>
  );
}
