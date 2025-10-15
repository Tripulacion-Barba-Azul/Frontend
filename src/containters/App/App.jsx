import { BrowserRouter, Routes, Route } from "react-router-dom";
import TitleScreen from "../../components/PreGameScreen/TitleScreen/TitleScreen";
import CreateGameScreen from "../../components/PreGameScreen/CreateGameScreen/CreateGameScreen";
import JoinGameScreen from "../../components/PreGameScreen/JoinGameScreen/JoinGameScreen";
import GameMatchesList from "../../components/GameMatchesList/GameMatchesList";
import GameScreen from "../../components/GameScreen/GameScreen";
import EffectScenarioRunnerAuto from "../../components/EffectManager/EffectScenarioRunnerAuto";

function App() {
  return <EffectScenarioRunnerAuto event="lookIntoTheAshes" />;
}

export default App;
