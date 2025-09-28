import { useEffect, useState, useMemo } from "react";
import Board from "../../Board/Board.jsx";

export default function TurnSync({ serverPlayers = [] }) {
  // Local state mirrors the last snapshot received
  const [players, setPlayers] = useState(serverPlayers);

  // Update local state whenever serverPlayers reference changes
  useEffect(() => {
    setPlayers(serverPlayers || []);
  }, [serverPlayers]);

  // Memo to avoid unnecessary re-renders downstream
  const boardPlayers = useMemo(() => players, [players]);

  return <Board players={boardPlayers} />;
}
