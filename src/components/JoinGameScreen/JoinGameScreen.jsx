// JoinGameScreen.jsx

/**
 * @description Screen wrapper for the "join game" flow. Renders background and <JoinGameForm />.
 * @property {bool} private - Whether the game to join is private (requires password) or public.
 */

import "./JoinGameScreen.css";
import JoinGameForm from "./JoinGameForm/JoinGameForm";

export default function JoinGameScreen(props) {
  return (
    <div
      className="JoinGameScreen"
      style={{
        background: `url('/Assets/background_pregame.jpg') no-repeat center center fixed`,
        backgroundSize: "cover",
      }}
    >
      {/* Delegates the actual join logic/UI to the form component */}
      <JoinGameForm private={props.private}/>
    </div>
  );
}
