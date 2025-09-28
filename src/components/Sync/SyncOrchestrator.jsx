import TurnSync from "./Turn/TurnSync.jsx";
import OwnCardsSync from "./OwnCards/OwnCardsSync.jsx";
import DiscardPileSync from "./DiscardPile/DiscardPileSync.jsx";

export default function SyncOrchestrator({
  serverPlayers = [],
  serverCards = [],
  currentPlayerId,
}) {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Board + badges (turn sync) */}
      <TurnSync serverPlayers={serverPlayers} />

      {/* OwnCards */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Discard pile  */}
        <DiscardPileSync serverCards={serverCards} />

        {/* Turn */}
        <OwnCardsSync
          serverCards={serverCards}
          currentPlayerId={currentPlayerId}
        />
      </div>
    </div>
  );
}
