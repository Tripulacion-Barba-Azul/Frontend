import { useState } from "react";
import Board from "../Board/Board.jsx";

function App() {
  const players = [
    {
      name: "Demetrio",
      order: 3,
      actualPlayer: false,
      role: "murderer",
      turn: false,
    },
    {
      name: "Robotito",
      order: 5,
      actualPlayer: false,
      role: "detective",
      turn: true,
    },
    {
      name: "Parce",
      order: 6,
      actualPlayer: false,
      role: "detective",
      turn: false,
    },
    {
      name: "Gunter",
      order: 1,
      actualPlayer: false,
      role: "detective",
      turn: false,
    },
    {
      name: "Wolovick",
      order: 2,
      actualPlayer: true,
      role: "accomplice",
      turn: false,
    },
    {
      name: "Penazzi",
      order: 4,
      actualPlayer: false,
      role: "detective",
      turn: false,
    },
  ];

  return (
    <div>
      <Board players={players} />;
    </div>
  );
}

export default App;
