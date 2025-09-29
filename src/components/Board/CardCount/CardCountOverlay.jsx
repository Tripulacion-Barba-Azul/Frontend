import React from "react";
import CardCount from "./CardCount.jsx";

export default function CardCountOverlay({ seated = [], counts = [] }) {
  // Helper: Find count by player name
  const getCountFor = (playerName) =>
    counts.find((c) => c.name === playerName)?.count ?? null;

  // Visual nudges (in px) for where to place the icon relative to the avatar center
  const OFFSETS = {
    p1: { translateX: 78, translateY: -8 }, // bottom center
    p2: { translateX: 78, translateY: -8 }, // mid right
    p3: { translateX: 60, translateY: 18 }, // top right
    p4: { translateX: 0, translateY: 28 }, // top center
    p5: { translateX: -60, translateY: 18 }, // top left
    p6: { translateX: -78, translateY: -8 }, // mid left
  };

  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      {/* Anchor plane (uses coordinates of Board) */}
      <div
        className="absolute pointer-events-none"
        style={{ bottom: "0%", top: "0%", right: "0%", left: "0%" }}
      >
        {seated.map((p) => {
          const count = getCountFor(p.name);
          const isActual = !!p.meta?.actualPlayer;

          // Dont draw if it's the actual player or no count
          if (isActual || count == null) return null;

          const { translateX, translateY } = OFFSETS[p.id] ?? {
            translateX: 70,
            translateY: 0,
          };

          return (
            <div
              key={`count-${p.id}`}
              className="absolute pointer-events-none"
              style={p.style}
            >
              <div
                className="relative pointer-events-none"
                style={{
                  transform: `translate(${translateX}px, ${translateY}px)`,
                }}
              >
                <div className="pointer-events-auto">
                  <CardCount number={count} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
