import { useEffect, useMemo, useState } from "react";
import ViewMyCards from "../../ViewMyCards/ViewMyCards.jsx";
import { computeHandIds } from "../OwnCards/OwnCardsLogic.js";

export default function OwnCardsSync({
  serverCards = [],
  currentPlayerId,
  anchorClass = "",
}) {
  // Recompute hand ids from latest snapshot
  const nextIds = useMemo(
    () => computeHandIds(serverCards, currentPlayerId),
    [serverCards, currentPlayerId]
  );

  // Local state to avoid unnecessary re-renders
  const [cardIds, setCardIds] = useState(nextIds);

  // Shallow-equality for arrays of small length
  const changed = useMemo(() => {
    if (cardIds.length !== nextIds.length) return true;
    for (let i = 0; i < cardIds.length; i++)
      if (cardIds[i] !== nextIds[i]) return true;
    return false;
  }, [cardIds, nextIds]);

  useEffect(() => {
    if (changed) setCardIds(nextIds);
  }, [changed, nextIds]);

  return (
    <div className={anchorClass}>
      <ViewMyCards cards={cardIds} />
    </div>
  );
}
