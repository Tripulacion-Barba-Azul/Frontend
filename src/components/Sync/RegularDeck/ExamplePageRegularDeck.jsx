// ExamplePageRegularDeck.jsx
import React, { useEffect, useState } from "react";
import SyncOrchestrator from "../SyncOrchestrator.jsx";

// --- Minimal sample players (static for this demo) ---
const SAMPLE_PLAYERS = [
  {
    name: "Alice",
    avatar: "default1",
    order: 1,
    actualPlayer: true,
    role: "detective",
    turn: true,
  },
  {
    name: "Bob",
    avatar: "default2",
    order: 2,
    actualPlayer: false,
    role: "detective",
    turn: false,
  },
  {
    name: "Cara",
    avatar: "default1",
    order: 3,
    actualPlayer: false,
    role: "detective",
    turn: false,
  },
];

// Build an initial pool of cards with many in the deck
function makeInitialCards(total = 40, inDeckCount = 30) {
  const cards = [];
  for (let i = 0; i < total; i++) {
    cards.push({
      cardName: `dummy_${i}`,
      cardID: 1000 + i,
      cardOwnerID: null,
      isInDeck: i < inDeckCount, // first N start in deck
      isInDiscard: i >= inDeckCount, // rest start in discard
      isInDiscardTop: false, // not used here
    });
  }
  return cards;
}

export default function ExamplePageRegularDeck() {
  // Authoritative list that would normally come from the server
  const [serverCards, setServerCards] = useState(() =>
    makeInitialCards(40, 28)
  );

  useEffect(() => {
    // Interval: every 1200ms move exactly ONE card from deck -> discard
    const id = setInterval(() => {
      setServerCards((prev) => {
        // Clone to keep immutability
        const next = prev.map((c) => ({ ...c }));

        // Find one card currently in deck
        const inDeck = next.filter((c) => c.isInDeck === true);

        // If deck already empty, stop the interval (handled below)
        if (inDeck.length === 0) return next;

        // Pick the first in-deck card and move it to discard
        const cand = inDeck[0];
        cand.isInDeck = false;
        cand.isInDiscard = true;

        return next;
      });
    }, 1200);

    return () => clearInterval(id);
  }, []);

  // Optional: stop the interval once deck reaches 0 (safety for hot reloads)
  useEffect(() => {
    const remaining = serverCards.filter((c) => c.isInDeck).length;
    if (remaining === 0) {
      // No-op here because interval clears on unmount; you can log if desired
      // console.log("Deck reached 0 cards. Stopping decrements.");
    }
  }, [serverCards]);

  return (
    <SyncOrchestrator
      serverPlayers={SAMPLE_PLAYERS}
      serverCards={serverCards}
      currentPlayerId={null} // not used in this demo
    />
  );
}
