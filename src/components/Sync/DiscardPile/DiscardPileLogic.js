import { NAME_TO_ID } from "../OwnCards/OwnCardsSyncConstants.js";

export function computeDiscardState(allCards = []) {
  // Todas las que están en descarte
  const inDiscard = allCards.filter((c) => c?.isInDiscard === true);
  const count = inDiscard.length;

  // La carta explicitamente marcada como top (debe haber 1)
  const top = allCards.find((c) => c?.isInDiscardTop === true) || null;

  // Mapear nombre -> id numérica usada por DiscardPile
  const imgId = top ? NAME_TO_ID[top.cardName] ?? null : null;

  return { count, imgId };
}

export default computeDiscardState;
