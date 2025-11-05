// SyncOrchestrator.jsx

/**
 * @file SyncOrchestrator.jsx
 * @description Single source of truth for the live board. Receives the latest
 * public and private snapshots and renders the board + fixed UI elements.
 *
 * === Canonical shapes (from API DOCUMENT) ===
 *
 * @typedef {"waiting"|"inProgress"|"finished"} GameStatus
 * @typedef {"blocked"|"unblocked"} ActionStatus
 * @typedef {"waiting"|"playing"|"discarding"|"discardingOpt"|"drawing"} TurnStatus
 * @typedef {"detective"|"murderer"|"accomplice"} Role
 *
 * @typedef {{ id:number, name:string }} SimpleCard
 * @typedef {{ id:number, name:string, type:string }} HandCard
 *
 * @typedef {{ id:number, revealed:boolean, name:(string|null) }} PublicSecret
 * @typedef {{ id:number, name:string }} DetectiveCard
 * @typedef {{ setId:number, setName:string, cards:DetectiveCard[] }} DetectiveSet
 *
 * @typedef {{
 *   id:number,
 *   name:string,
 *   avatar:number,
 *   socialDisgrace:boolean,
 *   turnOrder:number,
 *   turnStatus:TurnStatus,
 *   cardCount:number,
 *   secrets:PublicSecret[],
 *   sets:DetectiveSet[]
 * }} PublicPlayer
 *
 * @typedef {{
 *   actionStatus:ActionStatus,
 *   gameStatus:GameStatus,
 *   regularDeckCount:number,
 *   discardPileTop:(SimpleCard|null),
 *   draftCards:SimpleCard[],
 *   discardPileCount:number,
 *   players:PublicPlayer[]
 * }} PublicData
 *
 * @typedef {{
 *   cards:HandCard[],
 *   secrets:PublicSecret[],
 *   role:Role,
 *   ally: ({ id:number, role:Exclude<Role,"detective"> } | null)
 * }} PrivateData
 *
 * === Props ===
 * @param {Object} props
 * @param {PublicData}  props.publicData
 * @param {PrivateData} props.privateData
 * @param {number}      props.currentPlayerId
 */

import React from "react";
import Board from "./Board/Board.jsx";
import DiscardPile from "./FixedBoardElements/DiscardPile/DiscardPile.jsx";
import OwnCards from "./FixedBoardElements/OwnCards/OwnCards.jsx";
import RegularDeck from "./FixedBoardElements/RegularDeck/RegularDeck.jsx";
import ViewMyCards from "./FixedBoardElements/ViewMyCards/ViewMyCards.jsx";
import ViewMySecrets from "./FixedBoardElements/ViewMySecrets/ViewMySecrets.jsx";
import DrawDraftCardButton from "./FixedBoardElements/DrawDraftCardButton/DrawDraftCardButton.jsx";
import BackToHomeButton from "./BackToHomeButton/BackToHomeButton.jsx";

/** @param {{ publicData: PublicData, privateData: PrivateData, currentPlayerId: number }} props */
export default function SyncOrchestrator({
  publicData,
  privateData,
  currentPlayerId,
}) {
  // Derive current player's transient flags from the public snapshot.
  const turnStatus =
    publicData.players.find((p) => p?.id === currentPlayerId)?.turnStatus ??
    "waiting";
  const socialDisgrace =
    publicData.players.find((p) => p?.id === currentPlayerId)?.socialDisgrace ??
    false;

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Game Board (players layout + role/ally awareness) */}
      <Board
        players={publicData.players}
        currentPlayerId={currentPlayerId}
        currentPlayerRole={privateData.role}
        currentPlayerAlly={privateData.ally}
      />

      <div className="absolute inset-0">
        {/* Regular Deck counter */}
        <div className="absolute inset-0">
          <RegularDeck
            number={publicData.regularDeckCount}
            turnStatus={turnStatus}
          />
        </div>

        {/* Discard Pile counter + top card preview */}
        <div className="absolute inset-0">
          <DiscardPile
            number={publicData.discardPileCount}
            card={publicData.discardPileTop}
          />
        </div>

        {/* Player hand (private) with turn/socialDisgrace gates */}
        <OwnCards
          cards={privateData.cards}
          turnStatus={turnStatus}
          socialDisgrace={socialDisgrace}
          actionStatus={publicData.actionStatus}
        />

        {/* Quick views */}
        <div
          className="fixed z-50 pointer-events-auto"
          style={{ right: "76.2vw", bottom: "9vw" }}
        >
          <ViewMyCards cards={privateData.cards} />
        </div>

        <div
          className="fixed z-50 pointer-events-auto"
          style={{ right: "89vw", bottom: "5.1vw" }}
        >
          <ViewMySecrets secrets={privateData.secrets} />
        </div>

        {/* Draft draw (uses publicData.draftCards visibility) */}
        <DrawDraftCardButton
          cards={publicData.draftCards}
          turnStatus={turnStatus}
        />

        {/* Escape hatch */}
        <BackToHomeButton />
      </div>
    </div>
  );
}
