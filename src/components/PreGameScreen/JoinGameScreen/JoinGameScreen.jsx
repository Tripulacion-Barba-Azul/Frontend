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
      <JoinGameForm />
    </div>
  );
}
