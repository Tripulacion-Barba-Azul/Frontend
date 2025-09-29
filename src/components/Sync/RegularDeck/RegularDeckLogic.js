export function computeDeckCount(allCards) {
  if (!Array.isArray(allCards)) return 0;
  let count = 0;
  for (const c of allCards) {
    if (c && c.isInDeck === true) count += 1;
  }
  return count;
}
