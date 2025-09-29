import TitleScreen from "../../components/TitleScreen/TitleScreen";
import ExamplePageRegularDeck from "../../components/Sync/RegularDeck/ExamplePageRegularDeck";
import ExampleOwnCards from "../../components/Sync/OwnCards/ExamplePageOwnCards";
import ExamplePageBoard from "../../components/Sync/Board/ExamplePageBoard";
import ExampleDiscardPile from "../../components/Sync/DiscardPile/ExamplePageDiscardPile";
import ExamplePageViewMyCards from "../../components/Sync/ViewMyCards/ExamplePageViewMyCards";
import ExamplePageOrchestrator from "../../components/Sync/ExamplePageOrchestrator";
import Board from "../../components/Board/Board";

function App() {
  return (
    <div>
      <ExamplePageOrchestrator />
    </div>
  );
}

export default App;
