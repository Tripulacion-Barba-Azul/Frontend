import "./CreateGameScreen.css";
import CreateGameForm from "./CreateGameForm/CreateGameForm";

export default function CreateGameScreen() {
  return (
    <div 
      className="CreateGameScreen"
      style={{
        background: `url('/Assets/background_pregame.jpg') no-repeat center center fixed`,
        backgroundSize: 'cover'
      }}
    >
      <CreateGameForm />
    </div>
  );
}