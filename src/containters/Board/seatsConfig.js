// A fixed map of seat anchors around the board.
// Styles use percent-based offsets aligned with your current background board.
export const SEAT_POSITIONS = {
  // bottom center
  p1: {
    id: "p1",
    style: { bottom: "0%", top: "76%", right: "53%", left: "0%" },
  },
  // mid right
  p2: {
    id: "p2",
    style: { bottom: "0%", top: "40%", right: "0%", left: "90%" },
  },
  // top right

  p3: {
    id: "p3",
    style: { bottom: "0%", top: "3%", right: "0%", left: "55%" },
  },
  // top center
  p4: { id: "p4", style: { bottom: "0%", top: "0%", right: "0%", left: "0%" } },
  // top left
  p5: {
    id: "p5",
    style: { bottom: "0%", top: "3%", right: "55%", left: "0%" },
  },
  // mid left
  p6: {
    id: "p6",
    style: { bottom: "0%", top: "40%", right: "90%", left: "0%" },
  },
};

// A stable seating order by player count for a balanced visual layout.
export const SEATING_BY_COUNT = {
  2: ["p1", "p4"], // bottom center, top center
  3: ["p1", "p3", "p5"], // bottom, top-right, top-left
  4: ["p1", "p3", "p4", "p5"], // bottom, top-right, top-left, top center
  5: ["p1", "p2", "p3", "p5", "p6"], // bottom, top-right, top-left, mid-right and mid-left
  6: ["p1", "p2", "p3", "p4", "p5", "p6"], // all seats
};

// A color palette to differentiate rings; cycles if there are more players than colors.
export const RING_COLORS = [
  "black",
  "blue",
  "green",
  "red",
  "purple",
  "yellow",
];
