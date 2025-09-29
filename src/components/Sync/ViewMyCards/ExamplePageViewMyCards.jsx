// ExamplePageViewMyCards.jsx
import { useEffect, useMemo, useRef, useState } from "react";
// ⬇ ajustá la ruta si tu ViewMyCardsSync.jsx está en otra carpeta
import ViewMyCardsSync from "./ViewMyCardsSync.jsx";
import {
  NAME_TO_ID,
  HAND_MAX,
  CARD_ID_MIN,
  CARD_ID_MAX,
} from "../OwnCards/OwnCardsSyncConstants.js";

// Nombres canónicos existentes en tu sprite sheet
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

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const sampleOne = (arr) => arr[Math.floor(Math.random() * arr.length)];

export default function ExamplePageViewMyCards() {
  // Simulamos 4 jugadores; local = id:1
  const CURRENT_PLAYER_ID = 1;
  const serverPlayers = useMemo(
    () => [
      { playerID: 1, playerName: "Alice" },
      { playerID: 2, playerName: "Bob" },
      { playerID: 3, playerName: "Carol" },
      { playerID: 4, playerName: "Diego" },
    ],
    []
  );

  // ===== Helpers para construir cartas completas =====
  const uidRef = useRef(1);
  const makeCard = (ownerId) => {
    const cardName = sampleOne(CARD_NAMES);
    const spriteId = NAME_TO_ID[cardName];
    return {
      cardID: `C${ownerId}-${uidRef.current++}`,
      cardOwnerID: ownerId,
      cardName,
      spriteId: Number.isInteger(spriteId) ? spriteId : CARD_ID_MIN,
      cardType: "regular",
      faceUp: false,
      isInDeck: false,
      isInDiscard: false,
    };
  };

  // Estado inicial: el local arranca con 3–5 cartas; el resto 0–3
  const [serverCards, setServerCards] = useState(() => {
    const cards = [];
    const localCount = randInt(3, Math.min(5, HAND_MAX));
    for (let i = 0; i < localCount; i++)
      cards.push(makeCard(CURRENT_PLAYER_ID));
    for (const p of serverPlayers.filter(
      (x) => x.playerID !== CURRENT_PLAYER_ID
    )) {
      const n = randInt(0, 3);
      for (let i = 0; i < n; i++) cards.push(makeCard(p.playerID));
    }
    return cards;
  });

  // ===== Tick: cada 3.5s varía la mano local respetando HAND_MAX =====
  useEffect(() => {
    const MS = 3500;
    const id = setInterval(() => {
      setServerCards((prev) => {
        const next = [...prev];

        // Hand del local (sólo cartas que no están en deck/discard)
        const handIdx = next
          .map((c, i) => ({ c, i }))
          .filter(
            ({ c }) =>
              c.cardOwnerID === CURRENT_PLAYER_ID &&
              !c.isInDeck &&
              !c.isInDiscard
          )
          .map(({ i }) => i);

        const handSize = handIdx.length;

        // 3 acciones posibles: robar al local, descartar del local, mover una carta del local a otro jugador
        const action =
          handSize <= 0
            ? "draw"
            : handSize >= HAND_MAX
            ? sampleOne(["discard", "give"])
            : sampleOne(["draw", "discard", "give"]);

        if (action === "draw") {
          // Roba 1 carta al local (creamos carta nueva)
          next.push(makeCard(CURRENT_PLAYER_ID));
        } else if (action === "discard" && handIdx.length > 0) {
          // Marca una carta del local como en descarte
          const idx = sampleOne(handIdx);
          next[idx] = { ...next[idx], isInDiscard: true, faceUp: true };
        } else if (action === "give" && handIdx.length > 0) {
          // Cambia de dueño a otro jugador
          const idx = sampleOne(handIdx);
          const others = serverPlayers
            .map((p) => p.playerID)
            .filter((id) => id !== CURRENT_PLAYER_ID);
          const newOwner = sampleOne(others);
          next[idx] = { ...next[idx], cardOwnerID: newOwner };
        }

        // Clamp defensivo: nunca IDs fuera de rango
        for (let i = 0; i < next.length; i++) {
          const s = next[i].spriteId;
          if (!Number.isInteger(s) || s < CARD_ID_MIN || s > CARD_ID_MAX) {
            const cardName = next[i].cardName;
            const idOk = NAME_TO_ID[cardName];
            next[i].spriteId =
              Number.isInteger(idOk) &&
              idOk >= CARD_ID_MIN &&
              idOk <= CARD_ID_MAX
                ? idOk
                : CARD_ID_MIN;
          }
        }

        return next;
      });
    }, MS);
    return () => clearInterval(id);
  }, [serverPlayers]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black/80 grid place-items-center">
      {/* La sync de zoom de mis cartas */}
      <ViewMyCardsSync
        serverCards={serverCards}
        currentPlayerId={CURRENT_PLAYER_ID}
      />
    </div>
  );
}
