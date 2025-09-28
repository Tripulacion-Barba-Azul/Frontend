import React, { useMemo } from "react";
import DiscardPile from "../../DiscardPile/DiscardPile.jsx";
import { computeDiscardState } from "./DiscardPileLogic.js";

export default function DiscardPileSync({ serverCards = [] }) {
  // Derive count + top-card id only when serverCards changes
  const { count, imgId } = useMemo(
    () => computeDiscardState(serverCards),
    [serverCards]
  );

  return (
    <div className="absolute inset-0 pointer-events-none">
      <DiscardPile number={count} img_id={imgId} />
    </div>
  );
}
