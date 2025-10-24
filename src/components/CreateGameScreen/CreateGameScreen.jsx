// CreateGameScreen.jsx

/**
 * @description Screen wrapper for the "create game" flow. Pure layout that renders <CreateGameForm />.
 * Props: none (this component does not accept props).
 */

import "./CreateGameScreen.css";
import CreateGameForm from "./CreateGameForm/CreateGameForm";

export default function CreateGameScreen() {
  return (
    <div className="CreateGameScreen">
      <CreateGameForm />
    </div>
  );
}
