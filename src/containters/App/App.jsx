import CreateGameScreen from '../../components/CreateGameScreen/CreateGameScreen';
import TitleScreen from '../../components/TitleScreen/TitleScreen';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TitleScreen />} />
        <Route path="/Create_Game" element={<CreateGameScreen />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
