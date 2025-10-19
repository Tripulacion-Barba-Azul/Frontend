import "./BackToHomeButton.css";
import { useNavigate } from "react-router-dom";

/**
 * BackToHomeButton
 * Returns to TitleScreen ("/") when clicked.
 * Visuals match the game's primary buttons (red background, cream text, hover scale + glow).
 */
export default function BackToHomeButton() {
  const navigate = useNavigate();
  const handleClick = () => navigate("/");
  return (
    <button
      type="button"
      className="BackToHomeButton"
      onClick={handleClick}
    >
      <img 
        src="/Icons/exit.png" 
        alt="" 
        className="BackToHomeButton__icon"
      />
    </button>
  );
}
