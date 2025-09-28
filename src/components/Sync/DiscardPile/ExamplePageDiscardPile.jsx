import { useEffect, useMemo, useState } from "react";
import SyncOrchestrator from "../SyncOrchestrator.jsx";

// Nombres EXACTOS que usa tu mapping (NAME_TO_ID / cardMapping)
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

// Crea un mazo de ejemplo: algunas en deck, otras en discard; exactamente UNA top
function makeInitialServerCards() {
  const cards = CARD_NAMES.map((name, idx) => ({
    cardName: name,
    cardID: 1000 + idx, // id cualquiera
    cardOwnerID: null, // no importa para discard
    isInDeck: true,
    isInDiscard: false,
    isInDiscardTop: false,
  }));

  // Mueve 8 cartas al descarte
  const discardIdxs = [2, 5, 7, 10, 12, 14, 17, 19].filter(
    (i) => i < cards.length
  );
  discardIdxs.forEach((i) => {
    cards[i].isInDeck = false;
    cards[i].isInDiscard = true;
  });

  // Marca UNA sola como top (primera del descarte)
  if (discardIdxs.length === 0) {
    // Fallback por si la lista cambia: garantiza al menos una en discard/top
    cards[0].isInDeck = false;
    cards[0].isInDiscard = true;
    cards[0].isInDiscardTop = true;
  } else {
    cards[discardIdxs[0]].isInDiscardTop = true;
  }

  return cards;
}

// Garantiza el invariante: exactamente UNA top y está en discard (no en deck)
function setTopAt(cards, index) {
  return cards.map((c, i) => {
    if (i === index) {
      return {
        ...c,
        isInDeck: false,
        isInDiscard: true,
        isInDiscardTop: true,
      };
    }
    return { ...c, isInDiscardTop: false };
  });
}

export default function ExamplePageDiscardPile() {
  // Players mínimos para que el orquestador pinte el tablero (no nos enfocamos en turnos acá)
  const serverPlayers = useMemo(
    () => [
      {
        name: "P1",
        avatar: "default1",
        order: 1,
        actualPlayer: true,
        role: "detective",
        turn: true,
      },
      {
        name: "P2",
        avatar: "default1",
        order: 2,
        actualPlayer: false,
        role: "detective",
        turn: false,
      },
      {
        name: "P3",
        avatar: "default1",
        order: 3,
        actualPlayer: false,
        role: "detective",
        turn: false,
      },
      {
        name: "P4",
        avatar: "default1",
        order: 4,
        actualPlayer: false,
        role: "detective",
        turn: false,
      },
      {
        name: "P5",
        avatar: "default1",
        order: 5,
        actualPlayer: false,
        role: "detective",
        turn: false,
      },
      {
        name: "P6",
        avatar: "default1",
        order: 6,
        actualPlayer: false,
        role: "detective",
        turn: false,
      },
    ],
    []
  );

  // Estado de cartas que “emula” lo que te enviaría el backend por WS
  const [serverCards, setServerCards] = useState(() =>
    makeInitialServerCards()
  );

  // Cada 2.5s rota la carta top dentro del descarte, manteniendo SIEMPRE una sola top
  useEffect(() => {
    const ROTATE_MS = 2500;

    const timer = setInterval(() => {
      setServerCards((prev) => {
        const discardIdxs = prev
          .map((c, i) => (c.isInDiscard ? i : -1))
          .filter((i) => i >= 0);

        // Si por algún motivo quedaron 0 en discard, forzamos una y la marcamos top
        if (discardIdxs.length === 0) {
          const fallback = [...prev];
          fallback[0] = {
            ...fallback[0],
            isInDeck: false,
            isInDiscard: true,
            isInDiscardTop: true,
          };
          return fallback.map((c, i) =>
            i === 0 ? fallback[0] : { ...c, isInDiscardTop: false }
          );
        }

        // Localiza el top actual y avanza al siguiente dentro del descarte
        const currentTopIdx = prev.findIndex((c) => c.isInDiscardTop);
        const list = discardIdxs;
        const posInList = Math.max(0, list.indexOf(currentTopIdx));
        const nextIdx = list[(posInList + 1) % list.length];

        return setTopAt(prev, nextIdx);
      });
    }, ROTATE_MS);

    return () => clearInterval(timer);
  }, []);

  // Id de jugador actual (no afecta al discard; lo pasamos por el orquestador)
  const currentPlayerId = 42;

  return (
    <SyncOrchestrator
      serverPlayers={serverPlayers}
      serverCards={serverCards}
      currentPlayerId={currentPlayerId}
    />
  );
}
