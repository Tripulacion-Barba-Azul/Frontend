// JoinGameScreen.jsx

/**
 * @description Screen wrapper for the "join game" flow. Renders background and <JoinGameForm />.
 * Reads the route parameter to determine if the game is private or public.
 */

import "./JoinGameScreen.css";
import JoinGameForm from "./JoinGameForm/JoinGameForm";
import { useParams } from "react-router-dom";

export default function JoinGameScreen() {
  const params = useParams();
  
  // Determine if the game is private based on the URL parameter
  const isPrivate = params.private === 'private';
  
  return (
    <div
      className="JoinGameScreen"
      style={{
        background: `url('/Assets/background_pregame.jpg') no-repeat center center fixed`,
        backgroundSize: "cover",
      }}
    >
      {/* Delegates the actual join logic/UI to the form component */}
      <JoinGameForm private={isPrivate}/>
    </div>
  );
}
