import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

vi.mock("./Seats/seatsLogic.js", () => ({
  buildSeatedPlayersFromOrders: vi.fn(),
}));

// Mock PlayerBadge to capture the props Board forwards
vi.mock("./PlayerBadge/PlayerBadge.jsx", () => ({
  default: ({
    name,
    avatar,
    size,
    ringColor,
    nameBgColor,
    position,
    numCards,
    secrets,
    sets,
  }) => (
    <div
      data-testid="badge"
      data-name={name}
      data-avatar={avatar}
      data-size={size}
      data-ring={ringColor}
      data-namebg={nameBgColor}
      data-position={position}
      data-numcards={numCards === null ? "null" : String(numCards ?? 0)}
      data-secretslen={
        secrets === null
          ? "null"
          : Array.isArray(secrets)
          ? String(secrets.length)
          : "NaN"
      }
      data-setscount={Array.isArray(sets) ? String(sets.length) : "NaN"}
    >
      {name}
    </div>
  ),
}));

import Board from "./Board.jsx";
import { buildSeatedPlayersFromOrders } from "./Seats/seatsLogic.js";

// Helper: seated player factory with sensible defaults
const seated = (overrides) => ({
  id: "p1",
  name: "Player",
  avatar: "default1",
  size: "small",
  ringColor: "black",
  nameBgColor: "white",
  position: "up",
  numCards: 0,
  secrets: [],
  sets: [],
  meta: { actualPlayer: false },
  style: { bottom: "0%", left: "0%" },
  ...overrides,
});

describe("Board.jsx (updated)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a background image when players are valid (>=2)", () => {
    buildSeatedPlayersFromOrders.mockReturnValueOnce([]);
    render(<Board players={[{ name: "P1" }, { name: "P2" }]} />);

    const bgDiv = document.querySelector('[style*="background-image"]');
    expect(bgDiv).toBeInTheDocument();
    expect(bgDiv.style.backgroundImage).toContain("url(");
    expect(bgDiv.style.backgroundImage).toMatch(/backgroundBoard\.png/i);
  });

  it("renders only the background when players array is empty (early validation)", () => {
    render(<Board players={[]} />);
    const bgDiv = document.querySelector('[style*="background-image"]');
    expect(bgDiv).toBeInTheDocument();
    expect(screen.queryAllByTestId("badge")).toHaveLength(0);
  });

  it("renders only the background when there is a single player (early validation)", () => {
    render(<Board players={[{ name: "P1" }]} />);
    const bgDiv = document.querySelector('[style*="background-image"]');
    expect(bgDiv).toBeInTheDocument();
    expect(screen.queryAllByTestId("badge")).toHaveLength(0);
  });

  it("renders zero badges when seat builder returns empty with valid players", () => {
    buildSeatedPlayersFromOrders.mockReturnValueOnce([]);
    render(<Board players={[{ name: "P1" }, { name: "P2" }]} />);
    expect(screen.queryAllByTestId("badge")).toHaveLength(0);
  });

  it("renders badges with correct props (including position and sets) and preserves absolute styles", () => {
    buildSeatedPlayersFromOrders.mockReturnValueOnce([
      seated({
        id: "p1",
        name: "Alice",
        avatar: "default1",
        size: "big",
        ringColor: "purple",
        nameBgColor: "white",
        position: "down",
        numCards: 4,
        secrets: [{ id: 1, name: "S1", revealed: true }],
        sets: [
          { setName: "Tommy Beresford", cards: [{ id: 100, name: "Tommy" }] },
        ],
        style: { bottom: "5%", left: "20%" },
      }),
      seated({
        id: "p3",
        name: "Bob",
        avatar: "default2",
        size: "small",
        ringColor: "red",
        nameBgColor: "orange",
        position: "right",
        numCards: 2,
        secrets: [],
        sets: [],
        style: { top: "10%", right: "15%" },
      }),
    ]);

    render(<Board players={[{ name: "P1" }, { name: "P2" }]} />);

    const badges = screen.getAllByTestId("badge");
    expect(badges).toHaveLength(2);

    // Alice
    expect(badges[0]).toHaveAttribute("data-name", "Alice");
    expect(badges[0]).toHaveAttribute("data-avatar", "default1");
    expect(badges[0]).toHaveAttribute("data-size", "big");
    expect(badges[0]).toHaveAttribute("data-ring", "purple");
    expect(badges[0]).toHaveAttribute("data-namebg", "white");
    expect(badges[0]).toHaveAttribute("data-position", "down");
    expect(badges[0]).toHaveAttribute("data-numcards", "4");
    expect(badges[0]).toHaveAttribute("data-secretslen", "1");
    expect(badges[0]).toHaveAttribute("data-setscount", "1");
    const wrapper1 = badges[0].parentElement;
    expect(wrapper1).toHaveStyle({ bottom: "5%", left: "20%" });

    // Bob
    expect(badges[1]).toHaveAttribute("data-name", "Bob");
    expect(badges[1]).toHaveAttribute("data-avatar", "default2");
    expect(badges[1]).toHaveAttribute("data-size", "small");
    expect(badges[1]).toHaveAttribute("data-ring", "red");
    expect(badges[1]).toHaveAttribute("data-namebg", "orange");
    expect(badges[1]).toHaveAttribute("data-position", "right");
    expect(badges[1]).toHaveAttribute("data-numcards", "2");
    expect(badges[1]).toHaveAttribute("data-secretslen", "0");
    expect(badges[1]).toHaveAttribute("data-setscount", "0");
    const wrapper2 = badges[1].parentElement;
    expect(wrapper2).toHaveStyle({ top: "10%", right: "15%" });
  });

  it("hides numCards and secrets for the actual player; forwards values for others; defaults sets to []", () => {
    buildSeatedPlayersFromOrders.mockReturnValueOnce([
      seated({
        id: "p1",
        name: "Me",
        position: "down",
        meta: { actualPlayer: true }, // Board should send numCards=null, secrets=null
        numCards: 7,
        secrets: [{ id: 9, name: "Hidden", revealed: false }],
        sets: [{ setName: "Set1", cards: [] }],
        style: { bottom: "0%", left: "45%" },
      }),
      seated({
        id: "p2",
        name: "Opponent",
        position: "right",
        meta: { actualPlayer: false },
        numCards: 3,
        secrets: [
          { id: 1, name: "Sx", revealed: true },
          { id: 2, name: "Sy", revealed: false },
        ],
        // sets intentionally omitted -> Board should pass []
        style: { top: "5%", right: "10%" },
      }),
    ]);

    render(<Board players={[{ n: 1 }, { n: 2 }]} />);

    const [me, opp] = screen.getAllByTestId("badge");

    // Actual player: numCards and secrets hidden (null), sets still forwarded
    expect(me).toHaveAttribute("data-name", "Me");
    expect(me).toHaveAttribute("data-position", "down");
    expect(me).toHaveAttribute("data-numcards", "null");
    expect(me).toHaveAttribute("data-secretslen", "null");
    expect(me).toHaveAttribute("data-setscount", "1");

    // Opponent: values forwarded; sets defaulted to []
    expect(opp).toHaveAttribute("data-name", "Opponent");
    expect(opp).toHaveAttribute("data-position", "right");
    expect(opp).toHaveAttribute("data-numcards", "3");
    expect(opp).toHaveAttribute("data-secretslen", "2");
    expect(opp).toHaveAttribute("data-setscount", "0");
  });

  it("renders 4 badges and preserves each player's absolute positioning", () => {
    buildSeatedPlayersFromOrders.mockReturnValueOnce([
      seated({ id: "p1", name: "P1", style: { bottom: "0%", left: "45%" } }),
      seated({ id: "p2", name: "P2", style: { bottom: "25%", right: "5%" } }),
      seated({ id: "p4", name: "P3", style: { top: "5%", left: "10%" } }),
      seated({ id: "p6", name: "P4", style: { top: "30%", right: "10%" } }),
    ]);

    render(<Board players={[{ n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }]} />);

    const [b1, b2, b3, b4] = screen.getAllByTestId("badge");
    expect(b1.parentElement).toHaveStyle({ bottom: "0%", left: "45%" });
    expect(b2.parentElement).toHaveStyle({ bottom: "25%", right: "5%" });
    expect(b3.parentElement).toHaveStyle({ top: "5%", left: "10%" });
    expect(b4.parentElement).toHaveStyle({ top: "30%", right: "10%" });
  });

  it("renders 6 badges (full table) with mixed corners and edges", () => {
    buildSeatedPlayersFromOrders.mockReturnValueOnce([
      seated({ id: "p1", name: "C1", style: { bottom: "5%", left: "20%" } }),
      seated({ id: "p2", name: "R1", style: { bottom: "25%", right: "5%" } }),
      seated({ id: "p3", name: "TR", style: { top: "5%", right: "10%" } }),
      seated({ id: "p4", name: "TC", style: { top: "0%", left: "45%" } }),
      seated({ id: "p5", name: "TL", style: { top: "5%", left: "10%" } }),
      seated({ id: "p6", name: "L1", style: { bottom: "25%", left: "5%" } }),
    ]);

    render(<Board players={Array.from({ length: 6 }, (_, i) => ({ n: i }))} />);

    const [c1, r1, tr, tc, tl, l1] = screen.getAllByTestId("badge");
    expect(c1.parentElement).toHaveStyle({ bottom: "5%", left: "20%" });
    expect(r1.parentElement).toHaveStyle({ bottom: "25%", right: "5%" });
    expect(tr.parentElement).toHaveStyle({ top: "5%", right: "10%" });
    expect(tc.parentElement).toHaveStyle({ top: "0%", left: "45%" });
    expect(tl.parentElement).toHaveStyle({ top: "5%", left: "10%" });
    expect(l1.parentElement).toHaveStyle({ bottom: "25%", left: "5%" });
  });

  it("keeps the overlay container for badges (absolute, inset, z-index) when players are valid", () => {
    buildSeatedPlayersFromOrders.mockReturnValueOnce([]);
    render(<Board players={[{ name: "P1" }, { name: "P2" }]} />);

    const overlay = document.querySelector(
      ".absolute.inset-0.z-10.pointer-events-auto"
    );
    expect(overlay).toBeInTheDocument();
  });

  it("does not render overlay container when players array is invalid (early validation)", () => {
    render(<Board players={[]} />);
    const overlay = document.querySelector(
      ".absolute.inset-0.z-10.pointer-events-auto"
    );
    expect(overlay).not.toBeInTheDocument();
  });
});
