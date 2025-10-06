import { BrowserRouter, Routes, Route } from "react-router-dom";
import TitleScreen from "../../components/TitleScreen/TitleScreen";
import CreateGameScreen from "../../components/CreateGameScreen/CreateGameScreen";
import JoinGameScreen from "../../components/JoinGameScreen/JoinGameScreen";
import GameMatchesList from "../../components/GameMatchesList/GameMatchesList";
import GameScreen from "../../components/GameScreen/GameScreen";
import ExamplePageOrchestrator from "../../components/Sync/ExamplePageOrchestrator";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TitleScreen />} />
        <Route path="/create" element={<CreateGameScreen />} />
        <Route path="/join" element={<ExamplePageOrchestrator />} />
        <Route path="/join/:gameId" element={<JoinGameScreen />} />
        <Route path="/game/:gameId" element={<GameScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
