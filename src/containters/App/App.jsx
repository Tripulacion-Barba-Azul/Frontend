import TitleScreen from "../../components/TitleScreen/TitleScreen";
import ExamplePageRegularDeck from "../../components/Sync/RegularDeck/ExamplePageRegularDeck";
import ExampleOwnCards from "../../components/Sync/OwnCards/ExamplePageOwnCards";
import ExampleTurnSync from "../../components/Sync/Board/ExamplePageTurn";
import ExampleDiscardPile from "../../components/Sync/DiscardPile/ExamplePageDiscardPile";
import Board from "../../components/Board/Board";

function App() {
  const players = [
    {
      id: 1,
      name: "Detective Holmes",
      avatar: "default",
      order: 1,
      actualPlayer: true,
      role: "accomplice",
      turn: true,
      numCards: 5,
    },
    {
      id: 2,
      name: "Dr. Evil",
      avatar: "default",
      order: 2,
      actualPlayer: false,
      role: "murderer",
      turn: false,
      numCards: 3,
    },
    {
      id: 3,
      name: "Mr. Helper",
      avatar: "default",
      order: 3,
      actualPlayer: false,
      role: "detective",
      turn: false,
      numCards: 4,
    },
    {
      id: 4,
      name: "Inspector Clouseau",
      avatar: "default",
      order: 4,
      actualPlayer: false,
      role: "detective",
      turn: false,
      numCards: 2,
    },
    {
      id: 5,
      name: "Agent Smith",
      avatar: "default",
      order: 5,
      actualPlayer: false,
      role: "detective",
      turn: false,
      numCards: 6,
    },
    {
      id: 6,
      name: "Miss Marple",
      avatar: "default",
      order: 6,
      actualPlayer: false,
      role: "detective",
      turn: false,
      numCards: 1,
    },
  ];

  return (
    <div>
      <Board players={players} currentPlayerId={1} />
    </div>
  );
}

export default App;
