import Lobby from '../../components/Lobby/Lobby';

function App() {

  return (
    <div>
      <Lobby
        MatchName="La barba azul"
        MinPlayers={5}
        MaxPlayers={6}
        MatchCreator="Marco"
        CurrentUser="Juan"
        Players={["Elias","Joaquin", "Pedro","santi"]}
      />
    </div>
  )
}

export default App
