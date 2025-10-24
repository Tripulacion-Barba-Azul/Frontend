// JoinGameScreen.jsx

/**
 * @description Screen wrapper for the "join game" flow. Renders background and <JoinGameForm />.
 * Props: none (this component does not accept props).
 */

import "./JoinGameScreen.css";
import JoinGameForm from "./JoinGameForm/JoinGameForm";

export default function JoinGameScreen() {
  return (
    <div
      className="JoinGameScreen"
      style={{
        background: `url('/Assets/background_pregame.jpg') no-repeat center center fixed`,
        backgroundSize: "cover",
      }}
    >
      {/* Delegates the actual join logic/UI to the form component */}
      <JoinGameForm />
    </div>
  );
}
