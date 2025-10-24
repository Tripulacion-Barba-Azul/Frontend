// JoinGameButton.jsx

/**
 * @description Button that routes to the public joinable matches list ("/join").
 * Props: none (this component does not accept props).
 */

import "./JoinGameButton.css";
import { useNavigate } from "react-router-dom";

export default function JoinGameButton() {
  const navigate = useNavigate();

  // Navigate to the "Join Game" screen
  const handleClick = () => {
    navigate("/join");
  };

  return (
    <div>
      <button onClick={handleClick} className="JoinGameButton">
        Join Game
      </button>
    </div>
  );
}
