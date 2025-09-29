import TitleScreen from "../../components/TitleScreen/TitleScreen";
import ExamplePageRegularDeck from "../../components/Sync/RegularDeck/ExamplePageRegularDeck";
import ExampleOwnCards from "../../components/Sync/OwnCards/ExamplePageOwnCards";
import ExamplePageBoard from "../../components/Sync/Board/ExamplePageBoard";
import ExampleDiscardPile from "../../components/Sync/DiscardPile/ExamplePageDiscardPile";
import ExamplePageViewMyCards from "../../components/Sync/ViewMyCards/ExamplePageViewMyCards";
import Board from "../../components/Board/Board";

function App() {
  return (
    <div>
      <ExamplePageViewMyCards />
    </div>
  );
}

export default App;
