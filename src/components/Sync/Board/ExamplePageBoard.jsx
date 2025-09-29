// ExamplePageBoard.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import SyncOrchestrator from "../SyncOrchestrator.jsx";

// Helpers
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const sampleOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
const sampleMany = (arr, k = 1) => {
  const a = [...arr];
  const out = [];
  while (a.length && out.length < k) {
    out.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]);
  }
  return out;
};

// Catálogo de nombres para cartas de demo
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
];

export default function ExamplePageBoard() {
  // --- 1) Players base (servidor) ---
  const serverPlayersInit = useMemo(
    () => [
      {
        playerName: "Alice",
        avatar: "default1",
        playerID: 1,
        orderNumber: 1,
        role: "Asesino",
        isTurn: true,
      },
      {
        playerName: "Bob",
        avatar: "default1",
        playerID: 2,
        orderNumber: 2,
        role: "Detective",
        isTurn: false,
      },
      {
        playerName: "Carol",
        avatar: "default1",
        playerID: 3,
        orderNumber: 3,
        role: "Detective",
        isTurn: false,
      },
      {
        playerName: "Diego",
        avatar: "default1",
        playerID: 4,
        orderNumber: 4,
        role: "Complice",
        isTurn: false,
      },
      {
        playerName: "Eva",
        avatar: "default1",
        playerID: 5,
        orderNumber: 5,
        role: "Detective",
        isTurn: false,
      },
      {
        playerName: "Fred",
        avatar: "default1",
        playerID: 6,
        orderNumber: 6,
        role: "Nothing",
        isTurn: false,
      },
    ],
    []
  );

  const CURRENT_PLAYER_ID = 1; // Alice como jugador local
  const [serverPlayers, setServerPlayers] = useState(serverPlayersInit);

  // --- 2) Cards base (servidor) ---
  const buildCardsFromCounts = (countsByPid) => {
    let uid = 1;
    const cards = [];
    for (const [pid, n] of countsByPid) {
      for (let i = 0; i < n; i++) {
        const name = CARD_NAMES[(uid - 1) % CARD_NAMES.length];
        cards.push({
          cardID: `C${pid}-${uid}`, // único
          cardOwnerID: pid,
          cardName: name,
          cardType: "regular",
          faceUp: false,
        });
        uid++;
      }
    }
    return cards;
  };

  const [serverCards, setServerCards] = useState(() => {
    const counts = new Map(
      serverPlayersInit.map((p) => [p.playerID, randInt(0, 5)])
    );
    return buildCardsFromCounts(counts);
  });

  // --- 3) Secrets base (servidor) ---
  const secretIdRef = useRef(1000);
  const makeSecret = (owner, name) => ({
    secretID: secretIdRef.current++,
    secretName: name,
    revealed: false,
    secretOwnerID: owner,
  });

  const [serverSecrets, setServerSecrets] = useState(() => [
    makeSecret(2, "murderer"),
    makeSecret(3, "accomplice"),
    makeSecret(4, "regular"),
    makeSecret(5, "accomplice"),
  ]);

  // ====== INTERVALOS DE SIMULACIÓN ======

  // (A) Turnos — cada 3s
  useEffect(() => {
    const TURN_MS = 3000;
    const turnTick = () => {
      setServerPlayers((prev) => {
        const ordered = [...prev].sort(
          (a, b) => (a.orderNumber || 0) - (b.orderNumber || 0)
        );
        const curIdx = ordered.findIndex((p) => !!p.isTurn);
        const nextIdx = curIdx === -1 ? 0 : (curIdx + 1) % ordered.length;
        const nextOrdered = ordered.map((p, i) => ({
          ...p,
          isTurn: i === nextIdx,
        }));
        const byId = new Map(nextOrdered.map((p) => [p.playerID, p]));
        return prev.map((p) => byId.get(p.playerID));
      });
    };
    const id = setInterval(turnTick, TURN_MS);
    return () => clearInterval(id);
  }, []);

  // (B) numCards — cada 3.5s
  useEffect(() => {
    const CARDS_MS = 2000;
    const cardsTick = () => {
      setServerCards((prev) => {
        const players = serverPlayers;
        const currentCounts = new Map(players.map((p) => [p.playerID, 0]));
        for (const c of prev) {
          currentCounts.set(
            c.cardOwnerID,
            (currentCounts.get(c.cardOwnerID) || 0) + 1
          );
        }
        const pids = players.map((p) => p.playerID);
        const k = randInt(1, 2);
        for (const pid of sampleMany(pids, k)) {
          const delta = sampleOne([-1, +1, +1]);
          const next = Math.max(
            0,
            Math.min(9, (currentCounts.get(pid) || 0) + delta)
          );
          currentCounts.set(pid, next);
        }
        return buildCardsFromCounts(currentCounts);
      });
    };
    const id = setInterval(cardsTick, CARDS_MS);
    return () => clearInterval(id);
  }, [serverPlayers]);

  // (C) secrets — cada 2s
  useEffect(() => {
    const SECRETS_MS = 1000;
    const secretsTick = () => {
      setServerSecrets((prev) => {
        const players = serverPlayers.filter(
          (p) => p.playerID !== CURRENT_PLAYER_ID
        );
        if (players.length === 0) return prev;

        let next = [...prev];
        const targets = sampleMany(
          players.map((p) => p.playerID),
          randInt(1, 2)
        );

        for (const pid of targets) {
          const mine = next.filter((s) => s.secretOwnerID === pid);
          const action = sampleOne(["toggle", "add", "remove"]);

          if (action === "toggle" && mine.length > 0) {
            const idx = next.findIndex(
              (s) =>
                s.secretOwnerID === pid &&
                s.secretID === sampleOne(mine).secretID
            );
            if (idx !== -1) {
              next = next.map((s, i) =>
                i === idx ? { ...s, revealed: !s.revealed } : s
              );
            }
          } else if (action === "add") {
            const names = ["accomplice", "murderer", "regular"];
            next = [...next, makeSecret(pid, sampleOne(names))];
          } else if (action === "remove" && mine.length > 0) {
            const victim = sampleOne(mine);
            next = next.filter((s) => s.secretID !== victim.secretID);
          }
        }
        return next;
      });
    };
    const id = setInterval(secretsTick, SECRETS_MS);
    return () => clearInterval(id);
  }, [serverPlayers]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <SyncOrchestrator
        serverPlayers={serverPlayers}
        serverCards={serverCards}
        serverSecrets={serverSecrets}
        currentPlayerId={CURRENT_PLAYER_ID}
      />
    </div>
  );
}
