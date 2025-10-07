import React from "react";
import Board from "../Board/Board.jsx";
import DiscardPile from "../DiscardPile/DiscardPile.jsx";
import OwnCards from "../OwnCards/OwnCards.jsx";
import RegularDeck from "../RegularDeck/RegularDeck.jsx";
import ViewMyCards from "../ViewMyCards/ViewMyCards.jsx";
import ViewMySecrets from "../ViewMySecrets/ViewMySecrets.jsx";

import {
  computeBoardPlayers,
  computeDeckCount,
  computeDiscardState,
  computeOwnCards,
  computeOwnSecrets,
} from "./SyncOrchestratorLogic.js";

/**
 * Input:
 * - serverPlayers: Array[{
 *     playerName: string,
 *     playerID: Int,
 *     orderNumber: number,           // 1..N ordering within the match
 *     role: string                   "detective"|"murderer"|"accomplice",
 *     turnStatus: string             “waiting”|“playing”|“discarding”|“drawing”
 *     avatar: string,                // key in AVATAR_MAP
 *   }>
 *
 * - serverCards: Array[{
 *     cardName: string,
 *     cardID: Int,
 *     cardOwnerID: Int,
 *     isInDeck: Bool,
 *     isInDiscardPile: Bool,
 *     isInDiscardTop: Bool,
 *   }>
 *
 * - serverSecrets: Array[{
 *     secretName: string,
 *     secretId: Int,
 *     revealed: Bool,
 *     secretOwnerID: Int,
 *   }>
 */

export default function SyncOrchestrator({
  serverPlayers,
  serverCards,
  serverSecrets,
  currentPlayerId,
}) {
  // Board
  const boardPlayers = React.useMemo(() => {
    return computeBoardPlayers({
      serverPlayers,
      serverCards,
      serverSecrets,
      currentPlayerId,
    });
  }, [serverPlayers, serverCards, serverSecrets, currentPlayerId]);

  // Regular deck
  const deckCount = React.useMemo(() => {
    return computeDeckCount(serverCards);
  }, [serverCards]);

  // Discard pile
  const { discardCount, discardTop } = React.useMemo(() => {
    return computeDiscardState(serverCards);
  }, [serverCards]);

  // Own cards
  const ownCards = React.useMemo(() => {
    return computeOwnCards(serverCards, currentPlayerId);
  }, [serverCards, currentPlayerId]);

  // View my secrets
  const ownSecrets = React.useMemo(() => {
    return computeOwnSecrets(serverSecrets, currentPlayerId);
  }, [serverSecrets, currentPlayerId]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Board */}
      <Board players={boardPlayers} />

      <div className="absolute inset-0 pointer-events-none">
        {/* Regular Deck */}
        <div
          className={`absolute pointer-events-noneq`}
          style={{
            bottom: "40%",
            left: "32.2%",
            transform: "translateX(-50%)",
          }}
        >
          <div className="pointer-events-auto">
            <RegularDeck number={deckCount} />
          </div>
        </div>

        {/* Discard Pile */}
        <div className="absolute inset-0 pointer-events-none">
          <DiscardPile number={discardCount} card={discardTop} />
        </div>

        {/* Own Cards */}
        <OwnCards
          cards={ownCards}
          turnStatus={
            boardPlayers.find((player) => player.playerID === currentPlayerId)
              ?.turnStatus
          }
        />

        {/* View My Cards */}
        <div className="fixed left-110 bottom-45 z-50 pointer-events-auto">
          <ViewMyCards cards={ownCards} />
        </div>

        {/* View My Secrets */}
        <div className="fixed right-416 bottom-27 z-50 pointer-events-auto">
          <ViewMySecrets secrets={ownSecrets} />
        </div>
      </div>
    </div>
  );
}
