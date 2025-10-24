import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// No longer mocking constants - use real ones for coverage

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
import { SIZES, RING_COLORS, NAME_BG_COLORS } from "./playerBadgeConstants.js";

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
    render(<PlayerBadge name="Carol" ringColor="emerald" />);
    const img = screen.getByRole("img", { name: "Avatar of Carol" });
    const circle = img.closest(".avatar-circle");
    expect(circle?.style.getPropertyValue("--tw-ring-color")).toBe(
      RING_COLORS.emerald
    );
  });

  it("uses correct size classes on the avatar-stack wrapper", () => {
    const { rerender } = render(<PlayerBadge name="P1" size="small" />);
    let img = screen.getByRole("img", { name: "Avatar of P1" });
    let stack = img.closest(".avatar-stack");
    expect(stack).toHaveClass(SIZES.small);

    rerender(<PlayerBadge name="P1" size="big" />);
    img = screen.getByRole("img", { name: "Avatar of P1" });
    stack = img.closest(".avatar-stack");
    expect(stack).toHaveClass(SIZES.big);
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

    // position-right → SetsGrid: vertical-left
    rerender(<PlayerBadge name="M1" position="right" sets={sets} />);
    sg = screen.getByTestId("setsgrid");
    img = screen.getByRole("img", { name: "Avatar of M1" });
    stack = img.closest(".avatar-stack");
    expect(stack).toHaveClass("position-right");
    expect(sg.getAttribute("data-pos")).toBe("vertical-left");
    expect(lastSetsProps?.position).toBe("vertical-left");

    // position-left → SetsGrid: vertical-right
    rerender(<PlayerBadge name="M1" position="left" sets={sets} />);
    sg = screen.getByTestId("setsgrid");
    img = screen.getByRole("img", { name: "Avatar of M1" });
    stack = img.closest(".avatar-stack");
    expect(stack).toHaveClass("position-left");
    expect(sg.getAttribute("data-pos")).toBe("vertical-right");
    expect(lastSetsProps?.position).toBe("vertical-right");

    // position-down → SetsGrid: doubleHorizontal
    rerender(<PlayerBadge name="M1" position="down" sets={sets} />);
    sg = screen.getByTestId("setsgrid");
    img = screen.getByRole("img", { name: "Avatar of M1" });
    stack = img.closest(".avatar-stack");
    expect(stack).toHaveClass("position-down");
    expect(sg.getAttribute("data-pos")).toBe("doubleHorizontal");
    expect(lastSetsProps?.position).toBe("doubleHorizontal");
  });

  // Test all RING_COLORS constants
  it("applies all RING_COLORS values correctly", () => {
    const ringColors = Object.keys(RING_COLORS);
    
    ringColors.forEach((colorKey, index) => {
      render(<PlayerBadge name={`Test${index}`} ringColor={colorKey} />);
      const img = screen.getByRole("img", { name: `Avatar of Test${index}` });
      const circle = img.closest(".avatar-circle");
      expect(circle?.style.getPropertyValue("--tw-ring-color")).toBe(
        RING_COLORS[colorKey]
      );
    });
  });

  // Test all NAME_BG_COLORS constants
  it("applies all NAME_BG_COLORS values correctly", () => {
    const bgColors = Object.keys(NAME_BG_COLORS);
    
    bgColors.forEach((colorKey, index) => {
      render(<PlayerBadge name={`BGTest${index}`} nameBgColor={colorKey} />);
      const nameBox = screen.getByText(`BGTest${index}`);
      expect(nameBox.style.getPropertyValue("--name-bg")).toBe(
        NAME_BG_COLORS[colorKey]
      );
    });
  });

  // Test that constants are properly exported and have expected structure
  it("validates that constants are properly exported", () => {
    // Test SIZES object structure
    expect(SIZES).toBeDefined();
    expect(typeof SIZES).toBe('object');
    expect(SIZES.big).toBe("badge-big");
    expect(SIZES.small).toBe("badge-small");

    // Test RING_COLORS object structure
    expect(RING_COLORS).toBeDefined();
    expect(typeof RING_COLORS).toBe('object');
    expect(Object.keys(RING_COLORS)).toEqual([
      "emerald", "lime", "amber", "lightAmber", "red", "gray"
    ]);
    
    // Verify all ring colors are valid hex colors
    Object.values(RING_COLORS).forEach(color => {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    // Test NAME_BG_COLORS object structure
    expect(NAME_BG_COLORS).toBeDefined();
    expect(typeof NAME_BG_COLORS).toBe('object');
    expect(Object.keys(NAME_BG_COLORS)).toEqual([
      "white", "red", "orange"
    ]);
    
    // Verify all bg colors are valid hex colors
    Object.values(NAME_BG_COLORS).forEach(color => {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  // Test specific color values to ensure they match expected values
  it("validates specific constant values", () => {
    expect(RING_COLORS.emerald).toBe("#10b981");
    expect(RING_COLORS.lime).toBe("#84cc16");
    expect(RING_COLORS.amber).toBe("#f59e0b");
    expect(RING_COLORS.lightAmber).toBe("#fbbf24");
    expect(RING_COLORS.red).toBe("#ef4444");
    expect(RING_COLORS.gray).toBe("#9ca3af");
    
    expect(NAME_BG_COLORS.white).toBe("#f4f1b4");
    expect(NAME_BG_COLORS.red).toBe("#d12222");
    expect(NAME_BG_COLORS.orange).toBe("#ff5900");
  });

  // Test edge cases with constants
  it("handles missing or invalid color keys gracefully", () => {
    // Test with undefined ring color - should not crash
    render(<PlayerBadge name="EdgeTest1" ringColor="nonexistent" />);
    const img = screen.getByRole("img", { name: "Avatar of EdgeTest1" });
    const circle = img.closest(".avatar-circle");
    // Component passes the invalid value directly, so it becomes the CSS value
    expect(circle?.style.getPropertyValue("--tw-ring-color")).toBe("nonexistent");

    // Test with undefined name bg color - component falls back to white default
    render(<PlayerBadge name="EdgeTest2" nameBgColor="nonexistent" />);
    const nameBox = screen.getByText("EdgeTest2");
    // Component falls back to white when nameBgColor key doesn't exist in NAME_BG_COLORS
    expect(nameBox.style.getPropertyValue("--name-bg")).toBe(NAME_BG_COLORS.white);
  });
});
