import TurnSync from "./Board/TurnSync.jsx";
import OwnCardsSync from "./OwnCards/OwnCardsSync.jsx";
import DiscardPileSync from "./DiscardPile/DiscardPileSync.jsx";
import RegularDeckSync from "./RegularDeck/RegularDeckSync.jsx";

export default function SyncOrchestrator({
  serverPlayers = [],
  serverCards = [],
  currentPlayerId,
}) {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Board + player badges (turn sync) */}
      <TurnSync serverPlayers={serverPlayers} />

      {/* Foreground layer for table widgets */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Regular deck (center). Tweak position in RegularDeckSync if needed */}
        <RegularDeckSync serverCards={serverCards} />

        {/* Discard pile (assumes ya la tenés integrada) */}
        <DiscardPileSync serverCards={serverCards} />

        {/* Current player's hand (bottom) */}
        <OwnCardsSync
          serverCards={serverCards}
          currentPlayerId={currentPlayerId}
        />
      </div>
    </div>
  );
}
