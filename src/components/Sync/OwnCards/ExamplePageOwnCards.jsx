// ExamplePageOwnCardsV2.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import OwnCardsSync from "./OwnCardsSync.jsx"; // ajustá la ruta según tu árbol
import {
  NAME_TO_ID,
  HAND_MAX,
  CARD_ID_MIN,
  CARD_ID_MAX,
} from "./OwnCardsSyncConstants.js";

// Nombres canónicos (coinciden con NAME_TO_ID)
const CARD_NAMES = [
  "detective_poirot",
  "detective_marple",
  "detective_satterhwaite",
  "detective_pyne",
  "detective_brent",
  "detective_tommyberesford",
  "detective_tuppenceberesford",
  "detective_quin",
  "detective_oliver",
  "instant_notsofast",
  "event_cardsonthetable",
  "event_anothervictim",
  "event_deadcardfolly",
  "event_lookashes",
  "event_cardtrade",
  "event_onemore",
  "event_delayescape",
  "event_earlytrain",
  "event_pointsuspicions",
  "devious_blackmailed",
  "devious_fauxpas",
];

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const sampleOne = (arr) => arr[Math.floor(Math.random() * arr.length)];

export default function ExamplePageOwnCardsV2() {
  const CURRENT_PLAYER_ID = 1;
  const otherPlayers = useMemo(() => [2, 3, 4], []);

  // Generador de cartas completas
  const uidRef = useRef(1);
  const makeCard = (ownerId = null, inDeck = true, inDiscard = false) => {
    const cardName = sampleOne(CARD_NAMES);
    const spriteId = NAME_TO_ID[cardName];
    return {
      cardID: `C-${uidRef.current++}`,
      cardOwnerID: ownerId, // null si está en mazo
      cardName,
      spriteId: Number.isInteger(spriteId) ? spriteId : CARD_ID_MIN,
      cardType: "regular",
      faceUp: false,
      isInDeck: inDeck,
      isInDiscard: inDiscard,
    };
  };

  // Mazo base + reparto inicial al local
  const [serverCards, setServerCards] = useState(() => {
    const base = Array.from({ length: 40 }, () => makeCard(null, true, false));
    // Reparto inicial 3–5 al local
    let next = base.map((c) => ({ ...c }));
    const count = randInt(3, Math.min(5, HAND_MAX));
    for (let i = 0; i < count; i++) {
      const di = next.findIndex((c) => c.isInDeck && !c.isInDiscard);
      if (di !== -1) {
        next[di] = {
          ...next[di],
          isInDeck: false,
          isInDiscard: false,
          cardOwnerID: CURRENT_PLAYER_ID,
          faceUp: false,
        };
      }
    }
    return next;
  });

  // Tick: cada 3.5s dibuja/descarta/transfiere una carta del local
  useEffect(() => {
    const MS = 3500;
    const id = setInterval(() => {
      setServerCards((prev) => {
        const next = prev.map((c) => ({ ...c }));
        const deckIdx = () =>
          next.findIndex((c) => c.isInDeck && !c.isInDiscard);
        const handIdx = next
          .map((c, i) => ({ c, i }))
          .filter(
            ({ c }) =>
              c.cardOwnerID === CURRENT_PLAYER_ID &&
              !c.isInDeck &&
              !c.isInDiscard
          )
          .map(({ i }) => i);
        const size = handIdx.length;

        const action =
          size <= 0
            ? "draw"
            : size >= HAND_MAX
            ? sampleOne(["discard", "give"])
            : sampleOne(["draw", "discard", "give"]);

        if (action === "draw") {
          const di = deckIdx();
          if (di !== -1 && size < HAND_MAX) {
            next[di] = {
              ...next[di],
              isInDeck: false,
              isInDiscard: false,
              cardOwnerID: CURRENT_PLAYER_ID,
              faceUp: false,
            };
          }
        } else if (action === "discard" && handIdx.length > 0) {
          const idx = sampleOne(handIdx);
          next[idx] = { ...next[idx], isInDiscard: true, faceUp: true };
        } else if (action === "give" && handIdx.length > 0) {
          const idx = sampleOne(handIdx);
          const to = sampleOne(otherPlayers);
          next[idx] = {
            ...next[idx],
            cardOwnerID: to,
            isInDeck: false,
            isInDiscard: false,
            faceUp: false,
          };
        }

        // Seguridad: spriteId válido si se coló algún nombre extraño
        for (let i = 0; i < next.length; i++) {
          const s = next[i].spriteId;
          if (!Number.isInteger(s) || s < CARD_ID_MIN || s > CARD_ID_MAX) {
            const fallback = NAME_TO_ID[next[i].cardName];
            next[i].spriteId = Number.isInteger(fallback)
              ? fallback
              : CARD_ID_MIN;
          }
        }

        return next;
      });
    }, MS);
    return () => clearInterval(id);
  }, [otherPlayers]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black/70">
      <OwnCardsSync
        serverCards={serverCards}
        currentPlayerId={CURRENT_PLAYER_ID}
      />
    </div>
  );
}
