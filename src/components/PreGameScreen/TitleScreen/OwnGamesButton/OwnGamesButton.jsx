// Mirrors Create/Join buttons structure
import "./OwnGamesButton.css";
import { useNavigate } from "react-router-dom";

/**
 * OwnGamesButton
 * Navigates to the user's active games list ("/my-games").
 * Visuals match the existing TitleScreen buttons.
 */
export default function OwnGamesButton() {
  const navigate = useNavigate();

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
