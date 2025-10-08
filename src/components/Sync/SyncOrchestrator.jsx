import React from "react";
import Board from "../Board/Board.jsx";
import DiscardPile from "../DiscardPile/DiscardPile.jsx";
import OwnCards from "../OwnCards/OwnCards.jsx";
import RegularDeck from "../RegularDeck/RegularDeck.jsx";
import ViewMyCards from "../ViewMyCards/ViewMyCards.jsx";
import ViewMySecrets from "../ViewMySecrets/ViewMySecrets.jsx";

//
// privateData:  {
// 	        cards: [{
//           		id: int
//           		name: string
//           		type: enum(string)
//           }]
// 	        secrets: [{
// 		          id: int
// 		          reveled: bool
// 		          name: String <NOT NULL>
//           }]
// 	        role: enum(string) # "murderer" | "accomplice" | "detective"
// 	        ally: {
// 		          id: int
// 		          role: enum(String) # "murderer" | "accomplice"
//               } | null
// }

//
// publicData:	{
//         	actionStatus: enum(string) # ”blocked” | “unblocked”
//         	gameStatus: enum(string) # “waiting” | “inProgress” | “finished”
//         	regularDeckCount: int
//         	discardPileTop: {
//         			id: int
//         			name: String
//           }
//         	draftCards: [{
//         			id: int
//         			name: String
//           }]
//         	discardPileCount: int
//           players: [{
//         	    id: int
//         	    name: String
//         	    avatar: int
//         	    turnOrder: int
//         	    turnStatus: enum(string) # “waiting” | “playing” | “discarding” | “Drawing”
//         	    cardCount: int
//         	    secrets: [{
//         		      id: int
//         		      revealed: bool
//         		      name: String #default null
//               }]
//         	    sets: [{
//         			    setName: enum(string)
//         			    cards: [{
//         			        id: int
//         			        name: enum(string)
//                   }]
//               }]
//           }]
//       }

export default function SyncOrchestrator({
  publicData,
  privateData,
  currentPlayerId,
}) {
  // Own cards turn status
  const turnStatus =
    publicData.players.find((p) => p?.id === currentPlayerId)?.turnStatus ??
    "waiting";
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Board */}
      <Board
        players={publicData.players}
        currentPlayerId={currentPlayerId}
        currentPlayerRole={privateData.role}
        currentPlayerAlly={privateData.ally}
      />

      <div className="absolute inset-0">
        {/* Regular Deck */}
        <div
          className="absolute"
          style={{
            bottom: "40%",
            left: "32.2%",
            transform: "translateX(-50%)",
          }}
        >
          <RegularDeck number={publicData.regularDeckCount} />
        </div>

        {/* Discard Pile */}
        <div className="absolute inset-0">
          <DiscardPile
            number={publicData.discardPileCount}
            card={publicData.discardPileTop}
          />
        </div>

        {/* Own Cards */}
        <OwnCards cards={privateData.cards} turnStatus={turnStatus} />

        {/* View My Cards */}
        <div className="fixed left-110 bottom-45 z-50 pointer-events-auto">
          <ViewMyCards cards={privateData.cards} />
        </div>

        {/* View My Secrets */}
        <div className="fixed right-416 bottom-27 z-50 pointer-events-auto">
          <ViewMySecrets secrets={privateData.secrets} />
        </div>
      </div>
    </div>
  );
}
