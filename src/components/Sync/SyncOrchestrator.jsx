import React from "react";
import Board from "../Board/Board.jsx";
import DiscardPile from "../DiscardPile/DiscardPile.jsx";
import OwnCards from "../OwnCards/OwnCards.jsx";
import RegularDeck from "../RegularDeck/RegularDeck.jsx";
import ViewMyCards from "../ViewMyCards/ViewMyCards.jsx";
import ViewMySecrets from "../ViewMySecrets/ViewMySecrets.jsx";
import DrawDraftCardButton from "../DrawDraftCardButton/DrawDraftCardButton.jsx";
import BackToHomeButton from "./BackToHomeButton/BackToHomeButton.jsx";

export default function SyncOrchestrator({
  publicData,
  privateData,
  currentPlayerId,
}) {
  const turnStatus =
    publicData.players.find((p) => p?.id === currentPlayerId)?.turnStatus ??
    "waiting";
  const socialDisgrace =
    publicData.players.find((p) => p?.id === currentPlayerId)?.socialDisgrace ??
    false;

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Game Board */}
      <Board
        players={publicData.players}
        currentPlayerId={currentPlayerId}
        currentPlayerRole={privateData.role}
        currentPlayerAlly={privateData.ally}
      />

      <div className="absolute inset-0">
        {/* Regular Deck */}
        <div className="absolute inset-0">
          <RegularDeck
            number={publicData.regularDeckCount}
            turnStatus={turnStatus}
          />
        </div>

        {/* Discard Pile */}
        <div className="absolute inset-0">
          <DiscardPile
            number={publicData.discardPileCount}
            card={publicData.discardPileTop}
          />
        </div>

        {/* Own Cards */}
        <OwnCards
          cards={privateData.cards}
          turnStatus={turnStatus}
          socialDisgrace={socialDisgrace}
        />

        {/* View My Cards */}
        <div className="fixed left-105 bottom-45 z-50 pointer-events-auto">
          <ViewMyCards cards={privateData.cards} />
        </div>

        {/* View My Secrets */}
        <div className="fixed right-421 bottom-27 z-50 pointer-events-auto">
          <ViewMySecrets secrets={privateData.secrets} />
        </div>

        {/* Draw Draft Cards */}
        <DrawDraftCardButton
          cards={publicData.draftCards}
          turnStatus={turnStatus}
        />

        {/* Back to home button */}
        <BackToHomeButton />
      </div>
    </div>
  );
}
