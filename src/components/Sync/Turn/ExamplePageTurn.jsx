// ExamplePage.jsx
import { useEffect, useMemo, useState } from "react";
import SyncOrchestrator from "../SyncOrchestrator.jsx";

// NOTE: All comments are in English per your convention
export default function ExamplePageTurn() {
  // Fixed sample to simulate a server snapshot
  const sample = useMemo(
    () => [
      {
        name: "Alice",
        avatar: "default1",
        order: 1,
        actualPlayer: true,
        role: "murderer",
        turn: true,
      },
      {
        name: "Bob",
        avatar: "default1",
        order: 2,
        actualPlayer: false,
        role: "detective",
        turn: false,
      },
      {
        name: "Carol",
        avatar: "default1",
        order: 3,
        actualPlayer: false,
        role: "detective",
        turn: false,
      },
      {
        name: "Diego",
        avatar: "default1",
        order: 4,
        actualPlayer: false,
        role: "accomplice",
        turn: false,
      },
      {
        name: "Eva",
        avatar: "default1",
        order: 5,
        actualPlayer: false,
        role: "detective",
        turn: false,
      },
      {
        name: "Fred",
        avatar: "default1",
        order: 6,
        actualPlayer: false,
        role: "detective",
        turn: false,
      },
    ],
    []
  );

  // This state emulates “server push” snapshots
  const [serverPlayers, setServerPlayers] = useState(sample);

  useEffect(() => {
    // Rotate turn every N milliseconds
    const INTERVAL_MS = 2000; // <= change to 3000/5000 if you prefer

    const tick = () => {
      // Sort by order to keep a stable circular sequence
      const ordered = [...serverPlayers].sort((a, b) => a.order - b.order);
      const currentIdx = ordered.findIndex((p) => !!p.turn);
      const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % ordered.length;

      // Build a new snapshot with turn advanced
      const nextSnapshot = ordered.map((p, i) => ({
        ...p,
        turn: i === nextIdx,
      }));

      // Simulate “server push” by updating state
      setServerPlayers(nextSnapshot);
    };

    const id = setInterval(tick, INTERVAL_MS);
    return () => clearInterval(id);
  }, [serverPlayers]); // re-run interval logic on each snapshot update

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* SyncOrchestrator is the single entry point that wires TurnSync */}
      <SyncOrchestrator serverPlayers={serverPlayers} />
    </div>
  );
}
