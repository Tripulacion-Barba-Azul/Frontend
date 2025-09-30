// ExamplePageViewMySecrets.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import ViewMySecretsSync from "./ViewMySecretsSync.jsx";

// Helpers
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const sampleOne = (arr) => arr[Math.floor(Math.random() * arr.length)];

export default function ExamplePageViewMySecrets() {
  // Jugador local al que vamos a mostrarle SUS secretos
  const CURRENT_PLAYER_ID = 1;

  // Catálogo de nombres de secretos que ya usás
  const SECRET_NAMES = useMemo(() => ["murderer", "accomplice", "regular"], []);

  // Generador de IDs únicos para secretos
  const secretIdRef = useRef(1000);
  const makeSecret = (ownerId, name, revealed = false) => ({
    secretID: secretIdRef.current++,
    secretName: name,
    revealed,
    secretOwnerID: ownerId,
  });

  // Estado “servidor”: todos los secretos (de todos los jugadores)
  const [serverSecrets, setServerSecrets] = useState(() => {
    // Inicial: algunos secretos para el local y otros para terceros
    const init = [
      makeSecret(CURRENT_PLAYER_ID, "murderer", false),
      makeSecret(CURRENT_PLAYER_ID, "accomplice", false),
      makeSecret(2, "regular", true),
      makeSecret(3, "accomplice", false),
    ];
    return init;
  });

  // Tick de simulación: cada 4s alteramos los secretos del jugador local
  useEffect(() => {
    const MS = 4000;
    const id = setInterval(() => {
      setServerSecrets((prev) => {
        let next = [...prev];

        // secretos del jugador local
        const mine = next.filter((s) => s.secretOwnerID === CURRENT_PLAYER_ID);

        // Elegimos una acción simple para ver cambios en UI
        // - si tiene pocos (<3): tendemos a agregar
        // - si tiene muchos (>=5): tendemos a toggle/remove
        const action =
          mine.length < 3
            ? sampleOne(["add", "toggle"])
            : sampleOne(["toggle", "add", "remove"]);

        if (action === "add") {
          // agrega un secreto nuevo (no duplicamos ID)
          next.push(
            makeSecret(CURRENT_PLAYER_ID, sampleOne(SECRET_NAMES), false)
          );
          return next;
        }

        if (mine.length === 0) {
          // si no tiene, nada que togglear/remover; agregamos uno
          next.push(
            makeSecret(CURRENT_PLAYER_ID, sampleOne(SECRET_NAMES), false)
          );
          return next;
        }

        const target = sampleOne(mine);

        if (action === "toggle") {
          next = next.map((s) =>
            s.secretID === target.secretID ? { ...s, revealed: !s.revealed } : s
          );
          return next;
        }

        if (action === "remove") {
          next = next.filter((s) => s.secretID !== target.secretID);
          return next;
        }

        return next;
      });
    }, MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden grid place-items-center bg-black/70">
      {/* Pasamos TODOS los secretos + el id del jugador local */}
      <ViewMySecretsSync
        allSecrets={serverSecrets}
        playerId={CURRENT_PLAYER_ID}
      />
    </div>
  );
}
