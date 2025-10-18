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
      aria-label="Back to home"
      title="Back to home"
    >
      Back to home
    </button>
  );
}
