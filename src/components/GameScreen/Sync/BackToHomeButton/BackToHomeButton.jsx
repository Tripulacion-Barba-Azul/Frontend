// BackToHomeButton.jsx

/**
 * @file BackToHomeButton.jsx
 * @description Small utility button that navigates back to the TitleScreen ("/").
 * Props: none.
 */

import "./BackToHomeButton.css";
import { useNavigate } from "react-router-dom";

/**
 * BackToHomeButton
 * - Stateless; renders a single icon button.
 * - On click, navigates to "/".
 */
export default function BackToHomeButton() {
  const navigate = useNavigate();

  /** Click handler: return to home screen */
  const handleClick = () => navigate("/");

  return (
    <button
      type="button"
      className="BackToHomeButton"
      onClick={handleClick}
      aria-label="Back to Home"
      title="Back to Home"
    >
      <img
        src="/Icons/exit.png"
        alt=""
        className="BackToHomeButton__icon"
        draggable={false}
      />
    </button>
  );
}
