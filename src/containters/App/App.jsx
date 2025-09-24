import { useState } from "react";
import Board from "../Board/Board.jsx";

function App() {
  const players = [
    "Robotito",
    "Wolovick",
    "Parce",
    "Gunther",
    "Santi Avalos",
    "Demetrio",
  ];
  return (
    <div>
      <Board players={players} />;
    </div>
  );
}

export default App;
