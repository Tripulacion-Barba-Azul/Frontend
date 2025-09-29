import { useEffect, useMemo, useRef, useState } from "react";
import SyncOrchestrator from "./SyncOrchestrator.jsx";
import {
  NAME_TO_ID,
  HAND_MAX,
  CARD_ID_MIN,
  CARD_ID_MAX,
} from "./OwnCards/OwnCardsSyncConstants.js";

// ===== Helpers =====
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const sampleOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (a) => {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Catálogo de nombres válidos (coinciden con NAME_TO_ID)
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

export default function ExamplePageOrchestrator() {
  // ==== Players base (servidor) ====
  const CURRENT_PLAYER_ID = 1;

  const serverPlayersInit = useMemo(
    () => [
      {
        playerName: "Alice",
        avatar: "default",
        playerID: 1,
        orderNumber: 1,
        role: "murderer",
        isTurn: true,
      },
      {
        playerName: "Bob",
        avatar: "default",
        playerID: 2,
        orderNumber: 2,
        role: "detective",
        isTurn: false,
      },
      {
        playerName: "Carol",
        avatar: "default",
        playerID: 3,
        orderNumber: 3,
        role: "detective",
        isTurn: false,
      },
      {
        playerName: "Diego",
        avatar: "default",
        playerID: 4,
        orderNumber: 4,
        role: "detective",
        isTurn: false,
      },
      {
        playerName: "Eva",
        avatar: "default",
        playerID: 5,
        orderNumber: 5,
        role: "detective",
        isTurn: false,
      },
      {
        playerName: "Fred",
        avatar: "default",
        playerID: 6,
        orderNumber: 6,
        role: "detective",
        isTurn: false,
      },
    ],
    []
  );

  const [serverPlayers, setServerPlayers] = useState(serverPlayersInit);

  // ==== Cartas (servidor) ====
  const uidRef = useRef(1);
  const makeCard = (ownerId = null, inDeck = true, inDiscard = false) => {
    const cardName = sampleOne(CARD_NAMES);
    const spriteId = NAME_TO_ID[cardName];
    return {
      cardID: `C-${uidRef.current++}`, // único
      cardOwnerID: ownerId, // null si no tiene dueño
      cardName,
      spriteId: Number.isInteger(spriteId) ? spriteId : CARD_ID_MIN,
      cardType: "regular",
      faceUp: false,
      isInDeck: inDeck,
      isInDiscard: inDiscard,
      isInDiscardTop: false,
    };
  };

  // Base deck: 60 cartas en mazo; luego repartimos algunas a manos
  const [serverCards, setServerCards] = useState(() => {
    const base = Array.from({ length: 60 }, () => makeCard(null, true, false));

    // Reparto inicial pequeño: cada jugador 0..3 cartas desde el mazo
    const players = serverPlayersInit.map((p) => p.playerID);
    let next = base.map((c) => ({ ...c }));
    const deckIdx = () => next.findIndex((c) => c.isInDeck && !c.isInDiscard);

    for (const pid of players) {
      const give = randInt(0, 3);
      for (let i = 0; i < give; i++) {
        const idx = deckIdx();
        if (idx !== -1) {
          next[idx] = {
            ...next[idx],
            isInDeck: false,
            isInDiscard: false,
            cardOwnerID: pid,
            faceUp: false,
          };
        }
      }
    }
    return next;
  });

  // ==== Secrets (servidor) ====
  const secretIdRef = useRef(1000);
  const makeSecret = (owner, name, revealed = false) => ({
    secretID: secretIdRef.current++,
    secretName: name, // "murderer" | "accomplice" | "regular"
    revealed,
    secretOwnerID: owner,
  });

  const [serverSecrets, setServerSecrets] = useState(() => [
    makeSecret(2, "murderer"),
    makeSecret(3, "accomplice"),
    makeSecret(4, "regular"),
    makeSecret(5, "accomplice"),
  ]);

  // ====== Ticks de simulación ======

  // (A) Turnos — cada 3s
  useEffect(() => {
    const TURN_MS = 2000;
    const id = setInterval(() => {
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
    }, TURN_MS);
    return () => clearInterval(id);
  }, []);

  // (B) Mano / numCards — cada 3.5s
  // Acciones: draw del mazo → mano; discard de mano → descarte; mover de un jugador a otro
  const cardsTickCountRef = useRef(0);
  useEffect(() => {
    const MS = 1500;
    const id = setInterval(() => {
      setServerCards((prev) => {
        cardsTickCountRef.current += 1;
        const next = prev.map((c) => ({ ...c })); // copia inmutable

        const players = serverPlayers.map((p) => p.playerID);
        const deckIdx = () =>
          next.findIndex((c) => c.isInDeck && !c.isInDiscard);
        const handIdxOf = (pid) =>
          next
            .map((c, i) => ({ c, i }))
            .filter(
              ({ c }) => c.cardOwnerID === pid && !c.isInDeck && !c.isInDiscard
            )
            .map(({ i }) => i);

        // elegimos 1–2 jugadores para modificar
        const targets = shuffle(players).slice(0, randInt(1, 2));
        for (const pid of targets) {
          const handIdx = handIdxOf(pid);
          const handSize = handIdx.length;

          // reglas simples
          const action =
            handSize <= 0
              ? "draw"
              : handSize >= HAND_MAX
              ? sampleOne(["discard", "give"])
              : sampleOne(["draw", "discard", "give"]);

          if (action === "draw") {
            const di = deckIdx();
            if (di !== -1 && handSize < HAND_MAX) {
              next[di] = {
                ...next[di],
                isInDeck: false,
                isInDiscard: false,
                cardOwnerID: pid,
                faceUp: false,
              };
            }
          } else if (action === "discard" && handIdx.length > 0) {
            const idx = sampleOne(handIdx);
            next[idx] = { ...next[idx], isInDiscard: true, faceUp: true };
          } else if (action === "give" && handIdx.length > 0) {
            const idx = sampleOne(handIdx);
            const others = players.filter((id0) => id0 !== pid);
            next[idx] = { ...next[idx], cardOwnerID: sampleOne(others) };
          }
        }

        // Cada ~4 ticks, forzamos que alguien quede en 0 cartas (no el local)
        if (cardsTickCountRef.current % 4 === 0) {
          const nonLocal = players.filter((p) => p !== CURRENT_PLAYER_ID);
          const victim = sampleOne(nonLocal);
          const inHand = handIdxOf(victim);
          for (const i of inHand) {
            next[i] = { ...next[i], isInDiscard: true, faceUp: true };
          }
        }

        // clamp defensivo de spriteId por si algún nombre extraño se cuela
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
  }, [serverPlayers]);

  // (C) Deck → Discard goteo — cada 1.8s (para probar estados visuales del descarte)
  useEffect(() => {
    const MS = 800;
    const id = setInterval(() => {
      setServerCards((prev) => {
        const next = prev.map((c) => ({ ...c, isInDiscardTop: false }));
        const idx = next.findIndex((c) => c.isInDeck && !c.isInDiscard);
        if (idx !== -1) {
          next[idx] = {
            ...next[idx],
            isInDeck: false,
            isInDiscard: true,
            isInDiscardTop: true,
            faceUp: true,
          };
        } else {
          // si ya no hay mazo, levantamos una cualquiera a top del descarte
          const discards = next
            .map((c, i) => ({ c, i }))
            .filter(({ c }) => c.isInDiscard);
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

  // (D) Secrets — cada 4s
  const elevenTargetRef = useRef(null);
  const reachedElevenRef = useRef(false);
  useEffect(() => {
    const MS = 500;
    const id = setInterval(() => {
      setServerSecrets((prev) => {
        const players = serverPlayers
          .map((p) => p.playerID)
          .filter((id) => id !== CURRENT_PLAYER_ID);
        if (players.length === 0) return prev;

        let next = [...prev];

        // elegir objetivo para llegar a 11 secretos al menos una vez
        if (!elevenTargetRef.current) {
          elevenTargetRef.current = sampleOne(players);
        }
        const targetPid = elevenTargetRef.current;

        const mineTarget = next.filter((s) => s.secretOwnerID === targetPid);
        if (!reachedElevenRef.current && mineTarget.length < 11) {
          // empujar hacia 11
          const names = ["accomplice", "murderer", "regular"];
          next.push(makeSecret(targetPid, sampleOne(names), false));
          if (mineTarget.length + 1 >= 11) reachedElevenRef.current = true;
          return next;
        }

        // luego, comportamiento aleatorio normal (incluye al local para ViewMySecrets)
        const pickPlayers = shuffle(serverPlayers.map((p) => p.playerID)).slice(
          0,
          randInt(1, 2)
        );
        for (const pid of pickPlayers) {
          const mine = next.filter((s) => s.secretOwnerID === pid);
          const action = sampleOne(["toggle", "add", "remove"]);
          if (action === "toggle" && mine.length > 0) {
            const victim = sampleOne(mine);
            next = next.map((s) =>
              s.secretID === victim.secretID
                ? { ...s, revealed: !s.revealed }
                : s
            );
          } else if (action === "add") {
            const names = ["accomplice", "murderer", "regular"];
            next.push(makeSecret(pid, sampleOne(names), false));
          } else if (action === "remove" && mine.length > 0) {
            const victim = sampleOne(mine);
            next = next.filter((s) => s.secretID !== victim.secretID);
          }
        }
        return next;
      });
    }, MS);
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
