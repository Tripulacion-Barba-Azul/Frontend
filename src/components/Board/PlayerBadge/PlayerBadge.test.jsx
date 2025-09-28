// PlayerBadge.test.jsx
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// --- Mock constants ---
vi.mock("./playerBadgeConstants.js", () => ({
  SIZES: { big: "badge-big", small: "badge-small" },
  RING_COLORS: { black: "rgba(0,0,0,0.70)", blue: "rgba(0,0,255,0.70)" },
  NAME_BG_COLORS: { white: "#ffffff", red: "#ff0000" },
  AVATAR_MAP: { default: "/assets/default.png", robot: "/assets/robot.png" },
  MAX_NAME_LEN: 20,
}));

import PlayerBadge from "./PlayerBadge.jsx";
import {
  RING_COLORS,
  NAME_BG_COLORS,
  MAX_NAME_LEN,
} from "./playerBadgeConstants.js";

describe("PlayerBadge", () => {
  it("renders name, avatar image and avatar container with proper aria-label", () => {
    render(<PlayerBadge name="Alice" avatar="robot" />);
    // Name box visible
    expect(screen.getByText("Alice")).toBeInTheDocument();

    // Avatar image present and accessible
    const img = screen.getByRole("img", { name: "Avatar of Alice" });
    expect(img).toBeInTheDocument();

    // Container div uses the same aria-label
    expect(screen.getByLabelText("Avatar of Alice")).toBeInTheDocument();
  });

  it("applies name box background via --name-bg inline CSS variable", () => {
    render(<PlayerBadge name="Bob" nameBgColor="red" />);
    const nameBox = screen.getByText("Bob");
    // Expect the CSS custom property to match the mapped color
    expect(nameBox.style.getPropertyValue("--name-bg")).toBe(
      NAME_BG_COLORS.red
    );
  });

  it("applies ring color via --tw-ring-color inline CSS variable", () => {
    render(<PlayerBadge name="Carol" ringColor="blue" />);
    const circle = screen.getByLabelText("Avatar of Carol");
    // Expect the ring color CSS variable to be set correctly
    expect(circle.style.getPropertyValue("--tw-ring-color")).toBe(
      RING_COLORS.blue
    );
  });

  it("uses correct size classes for small and big", () => {
    const { rerender } = render(<PlayerBadge name="P1" size="small" />);
    let circle = screen.getByLabelText("Avatar of P1");
    // The 'small' size class should be present
    expect(circle).toHaveClass("badge-small");

    rerender(<PlayerBadge name="P1" size="big" />);
    circle = screen.getByLabelText("Avatar of P1");
    // The 'big' size class should be present
    expect(circle).toHaveClass("badge-big");
  });

  it("maps avatar key to expected image src", () => {
    render(<PlayerBadge name="Robo" avatar="robot" />);
    const img = screen.getByRole("img", { name: "Avatar of Robo" });
    // Check that the resolved src includes the mapped path
    expect(img.getAttribute("src")).toContain("/assets/robot.png");
  });

  it("turn indicator shows 'on' when turn=true and 'off' otherwise", () => {
    const { rerender } = render(<PlayerBadge name="Dana" turn={true} />);
    let indicator = screen.getByLabelText("Current turn");
    // Indicator should be marked as 'on'
    expect(indicator).toHaveClass("turn-indicator", "on");

    rerender(<PlayerBadge name="Dana" turn={false} />);
    indicator = screen.getByLabelText("Not current turn");
    // Indicator should be marked as 'off'
    expect(indicator).toHaveClass("turn-indicator", "off");
  });

  it("falls back to defaults when props are omitted", () => {
    render(<PlayerBadge />);
    // Default name
    expect(screen.getByText("Jugador")).toBeInTheDocument();

    // Default size
    const circle = screen.getByLabelText("Avatar of Jugador");
    expect(circle).toHaveClass("badge-small");

    // Default ring color
    expect(circle.style.getPropertyValue("--tw-ring-color")).toBe(
      RING_COLORS.black
    );

    // Default name background
    const nameBox = screen.getByText("Jugador");
    expect(nameBox.style.getPropertyValue("--name-bg")).toBe(
      NAME_BG_COLORS.white
    );

    // Default avatar path
    const img = screen.getByRole("img", { name: "Avatar of Jugador" });
    expect(img.getAttribute("src")).toContain("/assets/default.png");
  });

  // Name truncation edge cases
  it("does NOT truncate when name length < MAX_NAME_LEN", () => {
    const name = "A".repeat(MAX_NAME_LEN - 1); // 19
    render(<PlayerBadge name={name} />);
    // The exact string must be shown
    expect(screen.getByText(name)).toBeInTheDocument();
    // Aria labels should also use the unmodified name
    expect(screen.getByLabelText(`Avatar of ${name}`)).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: `Avatar of ${name}` })
    ).toBeInTheDocument();
  });

  it("does NOT truncate when name length === MAX_NAME_LEN", () => {
    const name = "B".repeat(MAX_NAME_LEN); // 20
    render(<PlayerBadge name={name} />);
    expect(screen.getByText(name)).toBeInTheDocument();
    expect(screen.getByLabelText(`Avatar of ${name}`)).toBeInTheDocument();
  });

  it("truncates and appends ellipsis when name length > MAX_NAME_LEN", () => {
    const long = "C".repeat(MAX_NAME_LEN + 5); // 25
    const truncated = long.slice(0, MAX_NAME_LEN) + "…";

    render(<PlayerBadge name={long} />);

    // Visible text should be the truncated one (with ellipsis)
    expect(screen.getByText(truncated)).toBeInTheDocument();

    // Both the circle and the img use aria-label with the truncated name
    expect(screen.getByLabelText(`Avatar of ${truncated}`)).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: `Avatar of ${truncated}` })
    ).toBeInTheDocument();

    // Original long string should NOT be present
    expect(screen.queryByText(long)).not.toBeInTheDocument();
  });
});
