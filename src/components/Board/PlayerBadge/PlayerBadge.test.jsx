import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// --- Mock constants to isolate from real assets ---
vi.mock("./playerBadgeConstants.js", () => ({
  SIZES: { big: "badge-big", small: "badge-small" },
  RING_COLORS: {
    black: "rgba(0,0,0,0.70)",
    blue: "rgba(0,0,255,0.70)",
  },
  NAME_BG_COLORS: { white: "#ffffff", red: "#ff0000" },
  AVATAR_MAP: {
    1: "/Board/Avatars/avatar_barba-azul.png",
    robot: "/Board/Avatars/avatar_robotito.png",
  },
}));

// --- Mock children to focus on PlayerBadge behavior ---
vi.mock("../CardCount/CardCount.jsx", () => ({
  default: ({ number }) => (
    <span data-testid="cardcount">count:{String(number)}</span>
  ),
}));
vi.mock("../ViewSecrets/ViewSecrets.jsx", () => ({
  default: ({ secrets }) => (
    <span data-testid="viewsecrets">secrets:{secrets?.length ?? "null"}</span>
  ),
}));

import PlayerBadge from "./PlayerBadge.jsx";
import { RING_COLORS, NAME_BG_COLORS } from "./playerBadgeConstants.js";

describe("PlayerBadge", () => {
  it("renders name and avatar with alt='Avatar of <name>'", () => {
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

  it("applies ring color via CSS var --tw-ring-color on avatar container", () => {
    render(<PlayerBadge name="Carol" ringColor="blue" />);
    const img = screen.getByRole("img", { name: "Avatar of Carol" });
    const circle = img.closest(".avatar-circle");
    expect(circle?.style.getPropertyValue("--tw-ring-color")).toBe(
      RING_COLORS.blue
    );
  });

  it("uses correct size classes for small and big", () => {
    const { rerender } = render(<PlayerBadge name="P1" size="small" />);
    let img = screen.getByRole("img", { name: "Avatar of P1" });
    let circle = img.closest(".avatar-circle");
    expect(circle).toHaveClass("badge-small");

    rerender(<PlayerBadge name="P1" size="big" />);
    img = screen.getByRole("img", { name: "Avatar of P1" });
    circle = img.closest(".avatar-circle");
    expect(circle).toHaveClass("badge-big");
  });

  it("toggles 'turn' indicator classes 'on'/'off'", () => {
    const { rerender } = render(<PlayerBadge name="Dana" turn={true} />);
    let indicator = screen.getByText((_, el) =>
      el?.classList?.contains("turn-indicator")
    );
    expect(indicator).toHaveClass("turn-indicator", "on");

    rerender(<PlayerBadge name="Dana" turn={false} />);
    indicator = screen.getByText((_, el) =>
      el?.classList?.contains("turn-indicator")
    );
    expect(indicator).toHaveClass("turn-indicator", "off");
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
        secrets={[{ secretName: "murderer", revealed: false }]}
      />
    );
    expect(screen.getByTestId("viewsecrets")).toHaveTextContent("secrets:1");

    rerender(<PlayerBadge name="Sec" secrets={null} />);
    expect(screen.queryByTestId("viewsecrets")).not.toBeInTheDocument();
  });
});
