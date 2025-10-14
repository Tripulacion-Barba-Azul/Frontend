import CreateGameButton from "./CreateGameButton/CreateGameButton";
import JoinGameButton from "./JoinGameButton/JoinGameButton";
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
      
      {/* Buttons Container */}
      <div className="buttons-container">
        <CreateGameButton />
        <JoinGameButton />
      </div>
      
      <Instructions mode="preGame" />
    </div>
  );
}