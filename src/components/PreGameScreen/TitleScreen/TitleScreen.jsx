import CreateGameButton from "./CreateGameButton/CreateGameButton";
import JoinGameButton from "./JoinGameButton/JoinGameButton";
import OwnGamesButton from "./OwnGamesButton/OwnGamesButton"; // NEW
import Instructions from "../../Instructions/Instructions";
import "./TitleScreen.css";

export default function TitleScreen() {
  return (
    <div className="TitleScreen">
      {/* Title Image */}
      <img
        src="/Assets/DOTC_title.png"
        alt="Agatha Christie's Death on the Cards"
        className="title-image"
      />

      {/* Characters Image */}
      <img
        src="/Assets/DOTC_characters.png"
        alt="Characters"
        className="characters-image"
      />

      {/* Row 1: existing buttons */}
      <div className="buttons-container">
        <CreateGameButton />
        <JoinGameButton />
      </div>

      {/* Row 2: Own games button (centered under the first row) */}
      <div className="buttons-container">
        <OwnGamesButton />
      </div>

      <Instructions mode="preGame" />
    </div>
  );
}
