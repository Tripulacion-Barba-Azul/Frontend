// App.jsx

/**
 * @file App.jsx
 * @description Root of the application. Sets up client-side routing for the card game simulator.
 * The app uses React Router to map URL paths to screen components.
 *
 * Props: none (this component does not accept props).
 *
 * Route map (for quick reference):
 * - "/"                → <TitleScreen />
 * - "/create"          → <CreateGameScreen />
 * - "/my-games"        → <GameOwnMatchesList />
 * - "/join"            → <GameMatchesList />
 * - "/join/:gameId"    → <JoinGameScreen />   (reads the dynamic :gameId via useParams inside the screen)
 * - "/game/:gameId"    → <GameScreen />       (reads the dynamic :gameId via useParams inside the screen)
 *
 * Notes:
 * - Keep each screen responsible only for its own UI and behavior; routing remains centralized here.
 * - Tailwind + CSS Modules are used at the screen/component level; this file stays presentation-agnostic.
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import TitleScreen from "../../components/TitleScreen/TitleScreen";
import CreateGameScreen from "../../components/CreateGameScreen/CreateGameScreen";
import JoinGameScreen from "../../components/JoinGameScreen/JoinGameScreen";
import GameMatchesList from "../../components/GameMatchesList/GameMatchesList";
import GameScreen from "../../components/GameScreen/GameScreen";
import GameOwnMatchesList from "../../components/GameOwnMatchesList/GameOwnMatchesList";

import ExampleChat from "../../components/GameScreen/Chat/ExampleChat";

function App() {
  return (
    <div>
      <ExampleChat />
    </div>
  );
}

export default App;
