// OwnGamesButton.jsx

/**
 * @description Button that routes to the user's own games list ("/my-games").
 * Props: none (this component does not accept props).
 */

import "./OwnGamesButton.css";
import { useNavigate } from "react-router-dom";

export default function OwnGamesButton() {
  const navigate = useNavigate();

  // Navigate to the "My Games" screen
  const handleClick = () => {
    navigate("/my-games");
  };

  return (
    <div>
      <button onClick={handleClick} className="OwnGamesButton">
        My Games
      </button>
    </div>
  );
}
