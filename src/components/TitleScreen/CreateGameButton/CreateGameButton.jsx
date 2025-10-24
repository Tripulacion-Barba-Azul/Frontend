// CreateGameButton.jsx

/**
 * @description Button that routes to the create match flow ("/create").
 * Props: none (this component does not accept props).
 */

import "./CreateGameButton.css";
import { useNavigate } from "react-router-dom";

export default function CreateGameButton() {
  const navigate = useNavigate();

  // Navigate to the "Create Game" screen
  const handleClick = () => {
    navigate("/create");
  };

  return (
    <div>
      <button onClick={handleClick} className="CreateGameButton">
        Create Game
      </button>
    </div>
  );
}
