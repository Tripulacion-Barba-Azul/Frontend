import { useState } from "react";
import Board from "../Board/Board.jsx";

function App() {
  const players = [
    { name: "Demetrio", order: 3, actualPlayer: false, rol: "asesino" },
    { name: "Robotito", order: 5, actualPlayer: false, rol: "detective" },
    { name: "Parce", order: 6, actualPlayer: false, rol: "detective" },
    { name: "Gunter", order: 1, actualPlayer: false, rol: "detective" },
    { name: "Wolovick", order: 2, actualPlayer: true, rol: "complice" },
    { name: "Penazzi", order: 4, actualPlayer: false, rol: "detective" },
  ];

  return (
    <div>
      <Board players={players} />;
    </div>
  );
}

export default App;
