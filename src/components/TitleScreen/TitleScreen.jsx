import CreateGameButton from './CreateGameButton/CreateGameButton';
import JoinGameButton from './JoinGameButton/JoinGameButton';
import "./TitleScreen.css";

export default function TitleScreen() {

  return (
    <div className="TitleScreen">
      <h1>Aghata Christie's <br /> Death on the Cards </h1>
      <CreateGameButton />
      <JoinGameButton />
    </div>
  )
}