import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// --- Constants mock: isolate from real assets and provide safe defaults ---
vi.mock("./playerBadgeConstants.js", () => ({
  SIZES: { big: "badge-big", small: "badge-small" },
  RING_COLORS: {
    gray: "rgba(128,128,128,0.70)",
    black: "rgba(0,0,0,0.70)",
    blue: "rgba(0,0,255,0.70)",
  },
  NAME_BG_COLORS: { white: "#ffffff", red: "#ff0000" },
  AVATAR_MAP: {
    1: "/Board/Avatars/avatar_barba-azul.png",
    robot: "/Board/Avatars/avatar_robotito.png",
  },
}));

// --- Child mocks: keep PlayerBadge focused ---
// CardCount
vi.mock("../CardCount/CardCount.jsx", () => ({
  default: ({ number }) => (
    <span data-testid="cardcount">count:{String(number)}</span>
  ),
}));

// ViewSecrets
vi.mock("../ViewSecrets/ViewSecrets.jsx", () => ({
  default: ({ secrets }) => (
    <span data-testid="viewsecrets">secrets:{secrets?.length ?? "null"}</span>
  ),
}));

// SetsGrid (capture props through DOM attributes for assertions)
let lastSetsProps = null;
vi.mock("../SetsGrid/SetsGrid.jsx", () => ({
  default: (props) => {
    lastSetsProps = props;
    const count = Array.isArray(props.sets) ? props.sets.length : "null";
    return (
      <div
        data-testid="setsgrid"
        data-pos={props.position}
      >{`sets:${count}`}</div>
    );
  },
}));

import PlayerBadge from "./PlayerBadge.jsx";
import { RING_COLORS, NAME_BG_COLORS } from "./playerBadgeConstants.js";

beforeEach(() => {
  lastSetsProps = null;
});

describe("PlayerBadge (updated)", () => {
  it("renders name and avatar with correct alt text", () => {
    render(<PlayerBadge name="Alice" avatar="robot" />);
    expect(screen.getByText("Alice")).toBeInTheDocument();

    const img = screen.getByRole("img", { name: "Avatar of Alice" });
    expect(img).toBeInTheDocument();
    expect(img.closest(".avatar-circle")).toBeTruthy();
  });

  it("applies name background via CSS var --name-bg", () => {
    render(<PlayerBadge name="Bob" nameBgColor="red" />);
    const nameBox = screen.getByText("Bob");
    expect(nameBox.style.getPropertyValue("--name-bg")).toBe(
      NAME_BG_COLORS.red
    );
  });

  it("applies ring color via CSS var --tw-ring-color on avatar circle", () => {
    render(<PlayerBadge name="Carol" ringColor="blue" />);
    const img = screen.getByRole("img", { name: "Avatar of Carol" });
    const circle = img.closest(".avatar-circle");
    expect(circle?.style.getPropertyValue("--tw-ring-color")).toBe(
      RING_COLORS.blue
    );
  });

  it("uses correct size classes on the avatar-stack wrapper", () => {
    const { rerender } = render(<PlayerBadge name="P1" size="small" />);
    let img = screen.getByRole("img", { name: "Avatar of P1" });
    let stack = img.closest(".avatar-stack");
    expect(stack).toHaveClass("badge-small");

    rerender(<PlayerBadge name="P1" size="big" />);
    img = screen.getByRole("img", { name: "Avatar of P1" });
    stack = img.closest(".avatar-stack");
    expect(stack).toHaveClass("badge-big");
  });

  it("renders CardCount only when numCards is a number >= 0; hides it when null", () => {
    const { rerender } = render(<PlayerBadge name="Eve" numCards={3} />);
    expect(screen.getByTestId("cardcount")).toHaveTextContent("count:3");

    rerender(<PlayerBadge name="Eve" numCards={0} />);
    expect(screen.getByTestId("cardcount")).toHaveTextContent("count:0");

    rerender(<PlayerBadge name="Eve" numCards={null} />);
    expect(screen.queryByTestId("cardcount")).not.toBeInTheDocument();
  });

  it("renders ViewSecrets when 'secrets' is an array (including empty); hides it when null", () => {
    const { rerender } = render(<PlayerBadge name="Sec" secrets={[]} />);
    expect(screen.getByTestId("viewsecrets")).toHaveTextContent("secrets:0");

    rerender(
      <PlayerBadge
        name="Sec"
        secrets={[{ id: 1, name: "murderer", revealed: false }]}
      />
    );
    expect(screen.getByTestId("viewsecrets")).toHaveTextContent("secrets:1");

    rerender(<PlayerBadge name="Sec" secrets={null} />);
    expect(screen.queryByTestId("viewsecrets")).not.toBeInTheDocument();
  });

  it("renders SetsGrid only when 'sets' is a non-empty array", () => {
    const { rerender } = render(
      <PlayerBadge name="Sets" sets={[{ setName: "A", cards: [] }]} />
    );
    // Present and reports length:1
    const sg1 = screen.getByTestId("setsgrid");
    expect(sg1).toHaveTextContent("sets:1");

    // Empty -> hidden
    rerender(<PlayerBadge name="Sets" sets={[]} />);
    expect(screen.queryByTestId("setsgrid")).not.toBeInTheDocument();

    // Null -> hidden
    rerender(<PlayerBadge name="Sets" sets={null} />);
    expect(screen.queryByTestId("setsgrid")).not.toBeInTheDocument();
  });

  it("maps PlayerBadge 'position' to SetsGrid layout and applies wrapper class", () => {
    const sets = [
      { setName: "Tommy Beresford", cards: [{ id: 1, name: "Tommy" }] },
    ];

    const { rerender } = render(
      <PlayerBadge name="M1" position="up" sets={sets} />
    );
    // position-up → SetsGrid: horizontal
    let sg = screen.getByTestId("setsgrid");
    let img = screen.getByRole("img", { name: "Avatar of M1" });
    let stack = img.closest(".avatar-stack");
    expect(stack).toHaveClass("position-up");
    expect(sg.getAttribute("data-pos")).toBe("horizontal");
    expect(lastSetsProps?.position).toBe("horizontal");

    // position-right → SetsGrid: vertical
    rerender(<PlayerBadge name="M1" position="right" sets={sets} />);
    sg = screen.getByTestId("setsgrid");
    img = screen.getByRole("img", { name: "Avatar of M1" });
    stack = img.closest(".avatar-stack");
    expect(stack).toHaveClass("position-right");
    expect(sg.getAttribute("data-pos")).toBe("vertical");
    expect(lastSetsProps?.position).toBe("vertical");

    // position-left → SetsGrid: vertical
    rerender(<PlayerBadge name="M1" position="left" sets={sets} />);
    sg = screen.getByTestId("setsgrid");
    img = screen.getByRole("img", { name: "Avatar of M1" });
    stack = img.closest(".avatar-stack");
    expect(stack).toHaveClass("position-left");
    expect(sg.getAttribute("data-pos")).toBe("vertical");
    expect(lastSetsProps?.position).toBe("vertical");

    // position-down → SetsGrid: doubleHorizontal
    rerender(<PlayerBadge name="M1" position="down" sets={sets} />);
    sg = screen.getByTestId("setsgrid");
    img = screen.getByRole("img", { name: "Avatar of M1" });
    stack = img.closest(".avatar-stack");
    expect(stack).toHaveClass("position-down");
    expect(sg.getAttribute("data-pos")).toBe("doubleHorizontal");
    expect(lastSetsProps?.position).toBe("doubleHorizontal");
  });
});
