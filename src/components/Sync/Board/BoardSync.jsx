import React from "react";
import Board from "../../Board/Board";
import { buildBoardPlayers } from "./BoardLogic.js";

export default function BoardSync({
  serverPlayers,
  serverCards,
  serverSecrets,
  currentPlayerId,
}) {
  const players = React.useMemo(() => {
    return buildBoardPlayers({
      serverPlayers,
      serverCards,
      serverSecrets,
      currentPlayerId,
    });
  }, [serverPlayers, serverCards, serverSecrets, currentPlayerId]);

  if (!Array.isArray(players) || players.length < 2) return null;

  return <Board players={players} />;
}
