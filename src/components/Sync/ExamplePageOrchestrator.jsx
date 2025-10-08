// ExamplePageOrchestrator.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import SyncOrchestrator from "./SyncOrchestrator.jsx";
import { CARDS_MAP, SECRETS_MAP } from "../generalMaps.js";

// ===== Pools from real maps (keep your naming conventions) =====
const CARD_NAME_POOL = Object.keys(CARDS_MAP);
const SECRET_NAME_POOL = Object.keys(SECRETS_MAP);
const HAND_MAX = 6;

// ===== Small helpers =====
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const sampleOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (a) => {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export default function ExamplePageOrchestrator() {
  // Local/current player id for this demo
  const CURRENT_PLAYER_ID = 1;

  // ---- Players (server-side model for the demo) ----
  // We keep role only here to build privateData (Board gets role-less public players).
  const [serverPlayers, setServerPlayers] = useState(() => [
    {
      playerName: "Alice",
      avatar: 1,
      playerID: 1,
      orderNumber: 1,
      role: "murderer",
      turnStatus: "playing",
    },
    {
      playerName: "Bob",
      avatar: 2,
      playerID: 2,
      orderNumber: 2,
      role: "accomplice",
      turnStatus: "waiting",
    },
    {
      playerName: "Carol",
      avatar: 3,
      playerID: 3,
      orderNumber: 3,
      role: "detective",
      turnStatus: "waiting",
    },
    {
      playerName: "Dave",
      avatar: 4,
      playerID: 4,
      orderNumber: 4,
      role: "detective",
      turnStatus: "waiting",
    },
  ]);

  // ---- Cards (server-side model) ----
  const cardIdRef = useRef(1);
  const makeCard = (overrides = {}) => {
    const cardName = overrides.cardName ?? sampleOne(CARD_NAME_POOL);
    return {
      cardID: `C-${cardIdRef.current++}`, // internal id in server model
      cardName, // internal name in server model
      isInDeck: true,
      isInDiscardPile: false,
      isInDiscardTop: false,
      cardOwnerID: null, // null means not in any hand
      faceUp: false,
      ...overrides,
    };
  };

  const [serverCards, setServerCards] = useState(() => {
    const DECK_COUNT = 40;
    const deck = Array.from({ length: DECK_COUNT }, () => makeCard());

    // Deal 3 cards to each player (if possible)
    const pids = [1, 2, 3, 4];
    for (const pid of pids) {
      for (let i = 0; i < 3; i++) {
        const idx = deck.findIndex((c) => c.isInDeck && !c.isInDiscardPile);
        if (idx !== -1) {
          deck[idx] = {
            ...deck[idx],
            isInDeck: false,
            isInDiscardPile: false,
            cardOwnerID: pid,
            faceUp: false,
          };
        }
      }
    }

    // One initial discard top
    const topIdx = deck.findIndex((c) => c.isInDeck && !c.isInDiscardPile);
    if (topIdx !== -1) {
      deck[topIdx] = {
        ...deck[topIdx],
        isInDeck: false,
        isInDiscardPile: true,
        isInDiscardTop: true,
        faceUp: true,
      };
    }

    return deck;
  });

  // ---- Secrets (server-side model) ----
  const secretIdRef = useRef(1000);
  const makeSecret = (owner, name, revealed = false) => ({
    secretID: secretIdRef.current++, // internal id
    secretName: name, // internal name
    revealed,
    secretOwnerID: owner,
  });

  const [serverSecrets, setServerSecrets] = useState(() => [
    makeSecret(2, sampleOne(SECRET_NAME_POOL), false),
    makeSecret(2, sampleOne(SECRET_NAME_POOL), true),
    makeSecret(3, sampleOne(SECRET_NAME_POOL), false),
    makeSecret(4, sampleOne(SECRET_NAME_POOL), false),
  ]);

  // ===== Simulation ticks (same logic as before, only output shapes changed) =====

  // (A) Turn rotation — every 2s
  useEffect(() => {
    const TURN_MS = 2000;
    const id = setInterval(() => {
      setServerPlayers((prev) => {
        const ordered = [...prev].sort(
          (a, b) => (a.orderNumber || 0) - (b.orderNumber || 0)
        );
        const curIdx = ordered.findIndex((p) => p.turnStatus === "playing");
        const nextIdx = curIdx === -1 ? 0 : (curIdx + 1) % ordered.length;
        const nextOrdered = ordered.map((p, i) => ({
          ...p,
          turnStatus: i === nextIdx ? "playing" : "waiting",
        }));
        const byId = new Map(nextOrdered.map((p) => [p.playerID, p]));
        return prev.map((p) => byId.get(p.playerID));
      });
    }, TURN_MS);
    return () => clearInterval(id);
  }, []);

  // (B) Hand changes — every 1.5s (draw / discard / give)
  const cardsTickCountRef = useRef(0);
  useEffect(() => {
    const MS = 1500;
    const id = setInterval(() => {
      setServerCards((prev) => {
        cardsTickCountRef.current += 1;
        const next = prev.map((c) => ({ ...c })); // immutable copy
        const pids = serverPlayers.map((p) => p.playerID);

        const deckIdx = () =>
          next.findIndex((c) => c.isInDeck && !c.isInDiscardPile);
        const handIdxOf = (pid) =>
          next
            .map((c, i) => ({ c, i }))
            .filter(
              ({ c }) =>
                c.cardOwnerID === pid && !c.isInDeck && !c.isInDiscardPile
            )
            .map(({ i }) => i);

        // mutate 1–2 players per tick
        const targets = shuffle(pids).slice(0, randInt(1, 2));
        for (const pid of targets) {
          const handIdx = handIdxOf(pid);
          const handSize = handIdx.length;

          const actionsForLocal =
            handSize <= 0
              ? ["draw"]
              : handSize >= HAND_MAX
              ? ["discard", "give"]
              : ["draw", "discard", "give"];
          const actionsForOther =
            handSize <= 0 ? ["draw"] : ["draw", "discard", "give"];
          const action = sampleOne(
            pid === CURRENT_PLAYER_ID ? actionsForLocal : actionsForOther
          );

          if (action === "draw") {
            const di = deckIdx();
            if (di !== -1 && handSize < HAND_MAX) {
              next[di] = {
                ...next[di],
                isInDeck: false,
                isInDiscardPile: false,
                isInDiscardTop: false,
                cardOwnerID: pid,
                faceUp: false,
              };
            }
          } else if (action === "discard" && handIdx.length > 0) {
            const idx = sampleOne(handIdx);
            // clear previous top
            for (let k = 0; k < next.length; k++) {
              if (next[k].isInDiscardTop) next[k].isInDiscardTop = false;
            }
            next[idx] = {
              ...next[idx],
              isInDiscardPile: true,
              isInDiscardTop: true,
              faceUp: true,
            };
          } else if (action === "give" && handIdx.length > 0) {
            const idx = sampleOne(handIdx);
            const others = pids.filter((id0) => id0 !== pid);
            const receiver = sampleOne(others);
            const receiverHandSize = handIdxOf(receiver).length;
            if (receiver !== CURRENT_PLAYER_ID || receiverHandSize < HAND_MAX) {
              next[idx] = { ...next[idx], cardOwnerID: receiver };
            }
          }
        }

        // Every ~4 ticks, force some non-local to 0 in-hand (for UI variety)
        if (cardsTickCountRef.current % 4 === 0) {
          const nonLocal = pids.filter((p) => p !== CURRENT_PLAYER_ID);
          const victim = sampleOne(nonLocal);
          const inHand = handIdxOf(victim);
          for (const i of inHand) {
            next[i] = {
              ...next[i],
              isInDiscardPile: true,
              isInDiscardTop: false,
              faceUp: true,
            };
          }
          // make one of them the new top (if any discards exist)
          const discards = next
            .map((c, i) => ({ c, i }))
            .filter(({ c }) => c.isInDiscardPile);
          if (discards.length > 0) {
            for (let k = 0; k < next.length; k++)
              next[k].isInDiscardTop = false;
            const di = sampleOne(discards).i;
            next[di].isInDiscardTop = true;
          }
        }

        return next;
      });
    }, MS);
    return () => clearInterval(id);
  }, [serverPlayers]);

  // (C) Deck → Discard drip — every 0.8s (exercise DiscardPile visuals)
  useEffect(() => {
    const MS = 800;
    const id = setInterval(() => {
      setServerCards((prev) => {
        const next = prev.map((c) => ({ ...c, isInDiscardTop: false }));
        const idx = next.findIndex((c) => c.isInDeck && !c.isInDiscardPile);
        if (idx !== -1) {
          next[idx] = {
            ...next[idx],
            isInDeck: false,
            isInDiscardPile: true,
            isInDiscardTop: true,
            faceUp: true,
          };
        } else {
          const discards = next
            .map((c, i) => ({ c, i }))
            .filter(({ c }) => c.isInDiscardPile);
          if (discards.length > 0) {
            const di = sampleOne(discards).i;
            next[di].isInDiscardTop = true;
          }
        }
        return next;
      });
    }, MS);
    return () => clearInterval(id);
  }, []);

  // (D) Secrets — every 0.6s
  const elevenTargetRef = useRef(null);
  const reachedElevenRef = useRef(false);
  useEffect(() => {
    const MS = 600;
    const id = setInterval(() => {
      setServerSecrets((prev) => {
        const pids = serverPlayers.map((p) => p.playerID);
        if (pids.length === 0) return prev;

        let next = [...prev];

        // pick one non-local to reach 11 at least once
        const nonLocal = pids.filter((id) => id !== CURRENT_PLAYER_ID);
        if (!elevenTargetRef.current) {
          elevenTargetRef.current = sampleOne(
            nonLocal.length ? nonLocal : pids
          );
        }
        const targetPid = elevenTargetRef.current;

        const targetSecrets = next.filter((s) => s.secretOwnerID === targetPid);
        if (!reachedElevenRef.current && targetSecrets.length < 11) {
          next.push(makeSecret(targetPid, sampleOne(SECRET_NAME_POOL), false));
          if (targetSecrets.length + 1 >= 11) reachedElevenRef.current = true;
          return next;
        }

        // else random behavior (includes local so you can see ViewMySecrets too)
        const action = sampleOne(["add", "reveal", "move", "remove"]);
        if (action === "add") {
          const owner = sampleOne(pids);
          next.push(makeSecret(owner, sampleOne(SECRET_NAME_POOL), false));
        } else if (action === "reveal" && next.length > 0) {
          const i = randInt(0, next.length - 1);
          next[i] = { ...next[i], revealed: true };
        } else if (action === "move" && next.length > 0) {
          const i = randInt(0, next.length - 1);
          const owner = sampleOne(pids);
          next[i] = { ...next[i], secretOwnerID: owner };
        } else if (action === "remove" && next.length > 0) {
          const i = randInt(0, next.length - 1);
          next.splice(i, 1);
        }

        return next;
      });
    }, MS);
    return () => clearInterval(id);
  }, [serverPlayers]);

  // ===== Derived "publicData" and "privateData" for SyncOrchestrator =====

  const handCountOf = (pid) =>
    serverCards.filter(
      (c) => c.cardOwnerID === pid && !c.isInDeck && !c.isInDiscardPile
    ).length;

  const discardPileCount = useMemo(
    () => serverCards.filter((c) => c.isInDiscardPile).length,
    [serverCards]
  );

  const discardPileTop = useMemo(() => {
    const top = serverCards.find((c) => c.isInDiscardTop === true) || null;
    // PUBLIC shape must be { id, name }
    return top ? { id: top.cardID, name: top.cardName } : null;
  }, [serverCards]);

  const regularDeckCount = useMemo(
    () => serverCards.filter((c) => c.isInDeck && !c.isInDiscardPile).length,
    [serverCards]
  );

  // PUBLIC players (role-less)
  const publicPlayers = useMemo(
    () =>
      serverPlayers.map((sp) => ({
        id: sp.playerID,
        name: sp.playerName,
        avatar: sp.avatar,
        turnOrder: sp.orderNumber,
        turnStatus: sp.turnStatus,
        cardCount: handCountOf(sp.playerID),
        secrets: serverSecrets
          .filter((s) => s.secretOwnerID === sp.playerID)
          .map((s) => ({
            id: s.secretID,
            revealed: !!s.revealed,
            name: s.secretName ?? null, // keep your naming convention
          })),
        sets: [], // reserved
      })),
    [serverPlayers, serverCards, serverSecrets]
  );

  const currentPlayerRole = useMemo(
    () =>
      serverPlayers.find((p) => p.playerID === CURRENT_PLAYER_ID)?.role ?? null,
    [serverPlayers]
  );

  const currentPlayerAlly = useMemo(() => {
    if (currentPlayerRole !== "murderer" && currentPlayerRole !== "accomplice")
      return null;
    const ally = serverPlayers.find(
      (p) => p.playerID !== CURRENT_PLAYER_ID && p.role === currentPlayerRole
    );
    return ally ? { id: ally.playerID, role: ally.role } : null;
  }, [serverPlayers, currentPlayerRole]);

  // PRIVATE cards/secrets must be arrays of { id, name } / { id, name, revealed }
  const ownCards = useMemo(
    () =>
      serverCards
        .filter(
          (c) =>
            c.cardOwnerID === CURRENT_PLAYER_ID &&
            !c.isInDeck &&
            !c.isInDiscardPile
        )
        .map((c) => ({ id: c.cardID, name: c.cardName })),
    [serverCards]
  );

  const ownSecrets = useMemo(
    () =>
      serverSecrets
        .filter((s) => s.secretOwnerID === CURRENT_PLAYER_ID)
        .map((s) => ({
          id: s.secretID,
          name: s.secretName ?? null,
          revealed: !!s.revealed,
        })),
    [serverSecrets]
  );

  const publicData = useMemo(
    () => ({
      actionStatus: "unblocked",
      gameStatus: "inProgress",
      regularDeckCount,
      discardPileTop, // { id, name }
      draftCards: [], // keep empty in this demo
      discardPileCount,
      players: publicPlayers,
    }),
    [regularDeckCount, discardPileTop, discardPileCount, publicPlayers]
  );

  const privateData = useMemo(
    () => ({
      role: currentPlayerRole,
      ally: currentPlayerAlly,
      cards: ownCards, // [{ id, name }]
      secrets: ownSecrets, // [{ id, name, revealed }]
    }),
    [currentPlayerRole, currentPlayerAlly, ownCards, ownSecrets]
  );

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <SyncOrchestrator
        publicData={publicData}
        privateData={privateData}
        currentPlayerId={CURRENT_PLAYER_ID}
      />
    </div>
  );
}
