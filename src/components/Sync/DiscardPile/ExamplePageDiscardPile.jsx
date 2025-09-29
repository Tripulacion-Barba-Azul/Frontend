// src/components/Sync/DiscardPile/ExamplePageDiscardPile.jsx
import { useEffect, useMemo, useState } from "react";
import SyncOrchestrator from "../SyncOrchestrator.jsx";

// Nombres válidos (los que tengas mapeados en tu app)
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

// Crea un mazo base de "size" cartas, con IDs únicos y todo en el mazo
function makeBaseDeck(size = 60) {
  const deck = [];
  for (let i = 0; i < size; i++) {
    const cardName = CARD_NAMES[i % CARD_NAMES.length];
    deck.push({
      cardName,
      cardID: 2000 + i + 1,
      cardOwnerID: null,
      isInDeck: true,
      isInDiscard: false,
      isInDiscardTop: false,
    });
  }
  return deck;
}

// Dado un mazo base, devuelve un snapshot con exactamente "count" cartas en descarte.
// Si count > 0, pone EXACTAMENTE una como top.
function snapshotWithDiscardCount(base, count) {
  const deck = base.map((c) => ({
    ...c,
    isInDeck: true,
    isInDiscard: false,
    isInDiscardTop: false,
  }));

  const max = Math.min(count, deck.length);
  if (max === 0) return deck;

  // Elegir 'max' índices distintos aleatorios
  const idxs = [...deck.keys()];
  for (let i = idxs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
  }
  const chosen = idxs.slice(0, max);

  chosen.forEach((i) => {
    deck[i].isInDeck = false;
    deck[i].isInDiscard = true;
  });

  // Elegir una de las descartadas como top
  const topIndex = chosen[Math.floor(Math.random() * chosen.length)];
  deck[topIndex].isInDiscardTop = true;

  return deck;
}

export default function ExamplePageDiscardPile() {
  // Jugadores mínimos (no testeamos turnos acá, solo para que renderice el tablero)
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
    ],
    []
  );

  // Mazo base grande para disparar todos los estados visuales
  const baseDeck = useMemo(() => makeBaseDeck(60), []);

  // Secuencia de tamaños objetivo para cubrir:
  // <5, >10 && <20, >25 y >=31 (full), además de algunos intermedios
  const TARGET_SIZES = useMemo(() => [3, 15, 26, 34, 0, 12, 5, 31], []);

  const [serverCards, setServerCards] = useState(() =>
    snapshotWithDiscardCount(baseDeck, TARGET_SIZES[0])
  );
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      const nextIdx = (idx + 1) % TARGET_SIZES.length;
      const nextCount = TARGET_SIZES[nextIdx];
      const nextSnapshot = snapshotWithDiscardCount(baseDeck, nextCount);
      setServerCards(nextSnapshot);
      setIdx(nextIdx);
      // Si querés ver qué está pasando:
      // const top = nextSnapshot.find(c => c.isInDiscardTop);
      // console.log(`discard=${nextCount}`, top?.cardName);
    }, 2000); // ~2s entre cambios
    return () => clearInterval(id);
  }, [idx, TARGET_SIZES, baseDeck]);

  const currentPlayerId = 42;

  return (
    <SyncOrchestrator
      serverPlayers={serverPlayers}
      serverCards={serverCards}
      currentPlayerId={currentPlayerId}
    />
  );
}
