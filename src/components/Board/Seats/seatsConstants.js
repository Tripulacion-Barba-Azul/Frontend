// A fixed map of seat anchors around the board.
export const SEAT_POSITIONS = {
  // bottom center
  p1: {
    id: "p1",
    style: { bottom: "00%", top: "75%", right: "63%", left: "00%" },
  },
  // mid right
  p2: {
    id: "p2",
    style: { bottom: "00%", top: "40%", right: "00%", left: "90%" },
  },
  // top right
  p3: {
    id: "p3",
    style: { bottom: "00%", top: "03%", right: "00%", left: "55%" },
  },
  // top center
  p4: {
    id: "p4",
    style: { bottom: "00%", top: "00%", right: "00%", left: "00%" },
  },
  // top left
  p5: {
    id: "p5",
    style: { bottom: "00%", top: "03%", right: "55%", left: "00%" },
  },
  // mid left
  p6: {
    id: "p6",
    style: { bottom: "00%", top: "40%", right: "90%", left: "00%" },
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

// A color palette to differentiate rings
export const RING_COLORS = ["black", "blue", "pink", "red", "purple", "yellow"];
