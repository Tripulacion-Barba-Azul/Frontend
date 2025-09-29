// OwnCardsLogic.js
import {
  NAME_TO_ID,
  CARD_ID_MIN,
  CARD_ID_MAX,
  HAND_MAX,
} from "./OwnCardsSyncConstants.js";

export function computeHandIds(allCards, currentPlayerId) {
  if (!Array.isArray(allCards)) return [];

  const hand = [];
  for (const c of allCards) {
    // Solo cartas EN MANO del jugador actual
    if (c?.cardOwnerID !== currentPlayerId) continue;
    if (c?.isInDeck || c?.isInDiscard) continue;

    // Preferí spriteId si es numérico y válido; si no, mapeá por nombre
    let id = Number.isInteger(c?.spriteId)
      ? c.spriteId
      : NAME_TO_ID[c?.cardName];

    if (Number.isInteger(id) && id >= CARD_ID_MIN && id <= CARD_ID_MAX) {
      hand.push(id);
      if (hand.length >= HAND_MAX) break; // nunca exceder HAND_MAX
    } else {
      // Si aparece un nombre fuera del mapeo, lo ignoramos (evita crashear la UI)
      // console.warn("[OwnCardsLogic] unknown cardName/spriteId:", c);
    }
  }

  return hand;
}
