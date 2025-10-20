import { BrowserRouter, Routes, Route } from "react-router-dom";
import TitleScreen from "../../components/PreGameScreen/TitleScreen/TitleScreen";
import CreateGameScreen from "../../components/PreGameScreen/CreateGameScreen/CreateGameScreen";
import JoinGameScreen from "../../components/PreGameScreen/JoinGameScreen/JoinGameScreen";
import GameMatchesList from "../../components/GameMatchesList/GameMatchesList";
import GameScreen from "../../components/GameScreen/GameScreen";
import GameOwnMatchesList from "../../components/GameOwnMatchesList/GameOwnMatchesList";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TitleScreen />} />
        <Route path="/create" element={<CreateGameScreen />} />
        <Route path="/my-games" element={<GameOwnMatchesList />} />
        <Route path="/join" element={<GameMatchesList />} />
        <Route path="/join/:gameId" element={<JoinGameScreen />} />
        <Route path="/game/:gameId" element={<GameScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
