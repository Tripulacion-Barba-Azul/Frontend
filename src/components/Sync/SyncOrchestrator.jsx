import React from "react";
import BoardSync from "./Board/BoardSync.jsx";
import RegularDeckSync from "./RegularDeck/RegularDeckSync.jsx";
import DiscardPileSync from "./DiscardPile/DiscardPileSync.jsx";
import OwnCardsSync from "./OwnCards/OwnCardsSync.jsx";
import ViewMySecretsSync from "./ViewMySecrets/ViewMySecretsSync.jsx";
import ViewMyCardsSync from "./ViewMyCards/ViewMyCardsSync.jsx";

export default function SyncOrchestrator({
  serverPlayers,
  serverCards,
  serverSecrets,
  currentPlayerId,
}) {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Capa Board (turnos + jugadores) */}
      <BoardSync
        serverPlayers={serverPlayers}
        serverCards={serverCards}
        serverSecrets={serverSecrets}
        currentPlayerId={currentPlayerId}
      />

      {/* Capa mazo + descarte + mano propia (como antes) */}
      <div className="absolute inset-0 pointer-events-none">
        <RegularDeckSync serverCards={serverCards} />
        <DiscardPileSync serverCards={serverCards} />
        <OwnCardsSync
          serverCards={serverCards}
          currentPlayerId={currentPlayerId}
        />
        <ViewMySecretsSync
          allSecrets={serverSecrets}
          playerId={currentPlayerId}
        />

        <ViewMyCardsSync
          serverCards={serverCards}
          currentPlayerId={currentPlayerId}
        />
      </div>
    </div>
  );
}
