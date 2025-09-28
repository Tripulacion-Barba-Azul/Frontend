import { useEffect, useMemo, useRef, useState } from "react";
import SyncOrchestrator from "../SyncOrchestrator.jsx";

// Use names that exist in your NAME_TO_ID mapping
const DEMO_CARD_NAMES = [
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

export default function ExamplePageOwnCards() {
  const currentPlayerId = 42;

  // Players just to draw the board; can be static
  const serverPlayers = useMemo(
    () => [
      {
        name: "Wolovick",
        order: 1,
        actualPlayer: false,
        role: "detective",
        turn: false,
      },
      {
        name: "Demetrio",
        order: 2,
        actualPlayer: false,
        role: "accomplice",
        turn: false,
      },
      {
        name: "Robotito",
        order: 3,
        actualPlayer: false,
        role: "detective",
        turn: false,
      },
      {
        name: "Parce",
        order: 4,
        actualPlayer: false,
        role: "detective",
        turn: false,
      },
      {
        name: "Gunter",
        order: 5,
        actualPlayer: true,
        role: "murderer",
        turn: true,
      },
      {
        name: "Penazzi",
        order: 6,
        actualPlayer: false,
        role: "detective",
        turn: false,
      },
    ],
    []
  );

  // Build initial deck: first 3 in hand, the rest in deck
  const [serverCards, setServerCards] = useState(() =>
    DEMO_CARD_NAMES.slice(0, 20).map((name, i) => ({
      cardName: name,
      cardID: 1000 + i,
      cardOwnerID: i < 3 ? currentPlayerId : null,
      isInDeck: i >= 3,
      isInDiscard: false,
    }))
  );

  // Toggle add/remove each tick
  const addPhaseRef = useRef(true);

  useEffect(() => {
    const intervalMs = 2000; // one change every 2 seconds
    const interval = setInterval(() => {
      setServerCards((prev) => {
        // --- work on a fresh copy (immutability) ---
        const next = prev.map((c) => ({ ...c }));

        // Helpers (operate on 'next')
        const countInHand = () =>
          next.filter(
            (c) =>
              c.cardOwnerID === currentPlayerId && !c.isInDeck && !c.isInDiscard
          ).length;

        const drawOneFromDeck = () => {
          // Find ONE deck card and move to hand
          const idx = next.findIndex((c) => c.isInDeck && !c.isInDiscard);
          if (idx !== -1) {
            next[idx].isInDeck = false;
            next[idx].cardOwnerID = currentPlayerId;
            return true; // success
          }
          return false; // no card to draw
        };

        const discardOneFromHand = () => {
          // Find ONE in-hand card and move to discard
          const idx = next.findIndex(
            (c) =>
              c.cardOwnerID === currentPlayerId && !c.isInDeck && !c.isInDiscard
          );
          if (idx !== -1) {
            next[idx].isInDiscard = true;
            return true; // success
          }
          return false; // no card to discard
        };

        // Decide operation (exactly ONE per tick)
        const inHand = countInHand();
        let didChange = false;

        if (addPhaseRef.current) {
          // Add one if hand not full
          if (inHand < 6) {
            didChange = drawOneFromDeck();
          }
          // If cannot add (deck empty or hand is already full), try removing one
          if (!didChange && inHand > 0) {
            didChange = discardOneFromHand();
          }
        } else {
          // Remove one if hand has something
          if (inHand > 0) {
            didChange = discardOneFromHand();
          }
          // If cannot remove (hand empty), try adding one
          if (!didChange && inHand < 6) {
            didChange = drawOneFromDeck();
          }
        }

        // Flip phase only if something actually changed
        if (didChange) addPhaseRef.current = !addPhaseRef.current;

        return next;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [currentPlayerId]);

  return (
    <div className="relative w-full h-screen">
      <SyncOrchestrator
        serverPlayers={serverPlayers}
        serverCards={serverCards}
        currentPlayerId={currentPlayerId}
      />
    </div>
  );
}
