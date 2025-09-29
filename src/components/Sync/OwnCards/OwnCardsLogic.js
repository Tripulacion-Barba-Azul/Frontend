import {
  NAME_TO_ID,
  CARD_ID_MIN,
  CARD_ID_MAX,
  HAND_MAX,
} from "./OwnCardsSyncConstants.js";

export function computeHandIds(allCards, currentPlayerId) {
  const hand = [];

  for (const c of allCards) {
    if (c.cardOwnerID !== currentPlayerId) continue;
    if (c.isInDeck || c.isInDiscard) continue;

    const id = NAME_TO_ID[c.cardName];
    if (id != null) hand.push(id);
    else {
      throw new Error("Invalid card name");
    }
  }

  return hand;
}
