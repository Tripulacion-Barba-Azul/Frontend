import React, { useMemo } from "react";
import RegularDeck from "../../RegularDeck/RegularDeck.jsx";
import { computeDeckCount } from "./RegularDeckLogic.js";

export default function RegularDeckSync({ serverCards = [], className = "" }) {
  // Derive deck count efficiently whenever serverCards changes.
  const deckCount = useMemo(() => computeDeckCount(serverCards), [serverCards]);

  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{ bottom: "40%", left: "32.2%", transform: "translateX(-50%)" }}
    >
      <div className="pointer-events-auto">
        <RegularDeck number={deckCount} />
      </div>
    </div>
  );
}
