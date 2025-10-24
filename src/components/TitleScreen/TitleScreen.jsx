// TitleScreen.jsx

/**
 * @description Main title screen: shows branding art and primary navigation buttons.
 * Props: none (this component does not accept props).
 */

import CreateGameButton from "./CreateGameButton/CreateGameButton";
import JoinGameButton from "./JoinGameButton/JoinGameButton";
import OwnGamesButton from "./OwnGamesButton/OwnGamesButton";
import Instructions from "../Instructions/Instructions";
import "./TitleScreen.css";

export default function TitleScreen() {
  return (
    <div className="TitleScreen">
      {/* Title artwork */}
      <img
        src="/Assets/DOTC_title.png"
        alt="Agatha Christie's Death on the Cards"
        className="title-image"
      />

      {/* Characters artwork */}
      <img
        src="/Assets/DOTC_characters.png"
        alt="Characters"
        className="characters-image"
      />

      {/* Primary actions */}
      <div className="buttons-container">
        <CreateGameButton />
        <JoinGameButton />
      </div>

      {/* Secondary action */}
      <div className="buttons-container">
        <OwnGamesButton />
      </div>

      {/* Contextual pre-game help/instructions */}
      <Instructions mode="preGame" />
    </div>
  );
}
