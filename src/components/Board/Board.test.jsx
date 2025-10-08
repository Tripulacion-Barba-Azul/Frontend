import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

vi.mock("./Seats/seatsLogic.js", () => ({
  buildSeatedPlayersFromOrders: vi.fn(),
}));

vi.mock("./PlayerBadge/PlayerBadge.jsx", () => ({
  default: ({
    name,
    avatar,
    size,
    ringColor,
    nameBgColor,
    turn,
    numCards,
    secrets,
  }) => (
    <div
      data-testid="badge"
      data-name={name}
      data-avatar={avatar}
      data-size={size}
      data-ring={ringColor}
      data-namebg={nameBgColor}
      data-turn={String(turn)}
      data-numcards={numCards === null ? "null" : String(numCards)}
      data-secretslen={
        secrets === null
          ? "null"
          : Array.isArray(secrets)
          ? String(secrets.length)
          : "NaN"
      }
    >
      {name}
    </div>
  ),
}));

import Board from "./Board.jsx";
import { buildSeatedPlayersFromOrders } from "./Seats/seatsLogic.js";

const seated = (overrides) => ({
  id: "p1",
  name: "Player",
  avatar: "default1",
  size: "small",
  ringColor: "black",
  nameBgColor: "white",
  turn: false,
  numCards: 0,
  secrets: [],
  meta: { actualPlayer: false },
  style: { bottom: "0%", left: "0%" },
  ...overrides,
});

describe("Board.jsx", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders an element with an inline background-image with valid players", () => {
    buildSeatedPlayersFromOrders.mockReturnValueOnce([]);
    render(<Board players={[{ name: "Player1" }, { name: "Player2" }]} />);

    const bgDiv = document.querySelector('[style*="background-image"]');
    expect(bgDiv).toBeInTheDocument();
    expect(bgDiv.style.backgroundImage).toContain("url(");
    expect(bgDiv.style.backgroundImage).toMatch(/backgroundBoard\.png/i);
  });

  it("renders background when players array is empty (early validation)", () => {
    render(<Board players={[]} />);
    const bgDiv = document.querySelector('[style*="background-image"]');
    expect(bgDiv).toBeInTheDocument();
    expect(screen.queryAllByTestId("badge")).toHaveLength(0);
  });

  it("renders background when players array has only 1 player (early validation)", () => {
    render(<Board players={[{ name: "Player1" }]} />);
    const bgDiv = document.querySelector('[style*="background-image"]');
    expect(bgDiv).toBeInTheDocument();
    expect(screen.queryAllByTestId("badge")).toHaveLength(0);
  });

  it("renders zero badges when no seated players are returned with valid player count", () => {
    buildSeatedPlayersFromOrders.mockReturnValueOnce([]);
    render(<Board players={[{ name: "Player1" }, { name: "Player2" }]} />);
    expect(screen.queryAllByTestId("badge")).toHaveLength(0);
  });

  it("renders 2 badges with correct props and positions", () => {
    buildSeatedPlayersFromOrders.mockReturnValueOnce([
      seated({
        id: "p1",
        name: "Alice",
        avatar: "default1",
        size: "big",
        ringColor: "purple",
        nameBgColor: "white",
        turn: true,
        numCards: 4,
        secrets: [{ secretName: "S1", revealed: true }],
        style: { bottom: "5%", left: "20%" },
      }),
      seated({
        id: "p3",
        name: "Bob",
        avatar: "default2",
        size: "small",
        ringColor: "red",
        nameBgColor: "orange",
        turn: false,
        numCards: 2,
        secrets: [],
        style: { top: "10%", right: "15%" },
      }),
    ]);

    render(<Board players={[{ name: "Player1" }, { name: "Player2" }]} />);

    const badges = screen.getAllByTestId("badge");
    expect(badges).toHaveLength(2);

    expect(badges[0]).toHaveAttribute("data-name", "Alice");
    expect(badges[0]).toHaveAttribute("data-avatar", "default1");
    expect(badges[0]).toHaveAttribute("data-size", "big");
    expect(badges[0]).toHaveAttribute("data-ring", "purple");
    expect(badges[0]).toHaveAttribute("data-namebg", "white");
    expect(badges[0]).toHaveAttribute("data-turn", "true");
    expect(badges[0]).toHaveAttribute("data-numcards", "4");
    expect(badges[0]).toHaveAttribute("data-secretslen", "1");
    const wrapper1 = badges[0].parentElement;
    expect(wrapper1).toHaveStyle({ bottom: "5%", left: "20%" });

    expect(badges[1]).toHaveAttribute("data-name", "Bob");
    expect(badges[1]).toHaveAttribute("data-avatar", "default2");
    expect(badges[1]).toHaveAttribute("data-size", "small");
    expect(badges[1]).toHaveAttribute("data-ring", "red");
    expect(badges[1]).toHaveAttribute("data-namebg", "orange");
    expect(badges[1]).toHaveAttribute("data-turn", "false");
    expect(badges[1]).toHaveAttribute("data-numcards", "2");
    expect(badges[1]).toHaveAttribute("data-secretslen", "0");
    const wrapper2 = badges[1].parentElement;
    expect(wrapper2).toHaveStyle({ top: "10%", right: "15%" });
  });

  it("hides numCards and secrets for the actual player; forwards values for others", () => {
    buildSeatedPlayersFromOrders.mockReturnValueOnce([
      seated({
        id: "p1",
        name: "Me",
        meta: { actualPlayer: true },
        numCards: 7,
        secrets: [{ secretName: "S1", revealed: false }],
        style: { bottom: "0%", left: "45%" },
      }),
      seated({
        id: "p2",
        name: "Opp",
        meta: { actualPlayer: false },
        numCards: 3,
        secrets: [
          { secretName: "Sx", revealed: true },
          { secretName: "Sy", revealed: false },
        ],
        style: { top: "5%", right: "10%" },
      }),
      seated({
        id: "p3",
        name: "Opp2",
        style: { top: "10%", left: "5%" },
      }),
    ]);

    render(<Board players={[{ n: 1 }, { n: 2 }, { n: 3 }]} />);
    const [me, opp, opp2] = screen.getAllByTestId("badge");

    expect(me).toHaveAttribute("data-name", "Me");
    expect(me).toHaveAttribute("data-numcards", "null");
    expect(me).toHaveAttribute("data-secretslen", "null");

    expect(opp).toHaveAttribute("data-name", "Opp");
    expect(opp).toHaveAttribute("data-numcards", "3");
    expect(opp).toHaveAttribute("data-secretslen", "2");

    expect(opp2).toHaveAttribute("data-name", "Opp2");
    expect(opp2).toHaveAttribute("data-numcards", "0");
    expect(opp2).toHaveAttribute("data-secretslen", "0");
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

  it("keeps the overlay container for badges (absolute, inset, z-index) with valid players", () => {
    buildSeatedPlayersFromOrders.mockReturnValueOnce([]);
    render(<Board players={[{ name: "Player1" }, { name: "Player2" }]} />);

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
