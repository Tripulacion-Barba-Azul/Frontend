// PlayerBadge.test.jsx
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// --- Mocks de constantes (simple y estable para tests) ---
vi.mock("./playerBadgeConstants.js", () => ({
  SIZES: { big: "badge-big", small: "badge-small" },
  RING_COLORS: { black: "rgba(0,0,0,0.70)", blue: "rgba(0,0,255,0.70)" },
  NAME_BG_COLORS: { white: "#ffffff", red: "#ff0000" },
  AVATAR_MAP: { default: "/assets/default.png", robot: "/assets/robot.png" },
  MAX_NAME_LEN: 20,
}));

// --- Mocks de hijos para aislar PlayerBadge ---
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
import {
  RING_COLORS,
  NAME_BG_COLORS,
  MAX_NAME_LEN,
} from "./playerBadgeConstants.js";

describe("PlayerBadge (new features)", () => {
  it("muestra nombre y avatar (img con alt='Avatar of <name>')", () => {
    render(<PlayerBadge name="Alice" avatar="robot" />);
    expect(screen.getByText("Alice")).toBeInTheDocument();

    const img = screen.getByRole("img", { name: "Avatar of Alice" });
    expect(img).toBeInTheDocument();
    const circle = img.closest(".avatar-circle");
    expect(circle).toBeTruthy();
  });

  it("aplica background del nombre con CSS var --name-bg", () => {
    render(<PlayerBadge name="Bob" nameBgColor="red" />);
    const nameBox = screen.getByText("Bob");
    expect(nameBox.style.getPropertyValue("--name-bg")).toBe(
      NAME_BG_COLORS.red
    );
  });

  it("aplica ring color via --tw-ring-color en el contenedor del avatar", () => {
    render(<PlayerBadge name="Carol" ringColor="blue" />);
    const img = screen.getByRole("img", { name: "Avatar of Carol" });
    const circle = img.closest(".avatar-circle");
    expect(circle?.style.getPropertyValue("--tw-ring-color")).toBe(
      RING_COLORS.blue
    );
  });

  it("usa clases de tamaño correctas para small/big", () => {
    const { rerender } = render(<PlayerBadge name="P1" size="small" />);
    let img = screen.getByRole("img", { name: "Avatar of P1" });
    let circle = img.closest(".avatar-circle");
    expect(circle).toHaveClass("badge-small");

    rerender(<PlayerBadge name="P1" size="big" />);
    img = screen.getByRole("img", { name: "Avatar of P1" });
    circle = img.closest(".avatar-circle");
    expect(circle).toHaveClass("badge-big");
  });

  it("mapea avatar key al src esperado", () => {
    render(<PlayerBadge name="Robo" avatar="robot" />);
    const img = screen.getByRole("img", { name: "Avatar of Robo" });
    expect(img.getAttribute("src")).toContain("/assets/robot.png");
  });

  it("indicador de turno cambia clases 'on'/'off'", () => {
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

  it("renderiza CardCount solo cuando numCards es número >= 0; lo oculta si es null", () => {
    const { rerender } = render(<PlayerBadge name="Eve" numCards={3} />);
    expect(screen.getByTestId("cardcount")).toHaveTextContent("count:3");

    rerender(<PlayerBadge name="Eve" numCards={0} />);
    expect(screen.getByTestId("cardcount")).toHaveTextContent("count:0");

    rerender(<PlayerBadge name="Eve" numCards={null} />);
    expect(screen.queryByTestId("cardcount")).not.toBeInTheDocument();
  });

  it("renderiza ViewSecrets cuando secrets es un array (inclusive vacío); lo oculta si es null", () => {
    const { rerender } = render(<PlayerBadge name="Sec" secrets={[]} />);
    expect(screen.getByTestId("viewsecrets")).toHaveTextContent("secrets:0");

    rerender(
      <PlayerBadge
        name="Sec"
        secrets={[{ secretID: 1, secretName: "murderer", revealed: false }]}
      />
    );
    expect(screen.getByTestId("viewsecrets")).toHaveTextContent("secrets:1");

    rerender(<PlayerBadge name="Sec" secrets={null} />);
    expect(screen.queryByTestId("viewsecrets")).not.toBeInTheDocument();
  });

  it("usa defaults cuando faltan props", () => {
    render(<PlayerBadge />);
    expect(screen.getByText("Jugador")).toBeInTheDocument();

    const img = screen.getByRole("img", { name: "Avatar of Jugador" });
    const circle = img.closest(".avatar-circle");
    expect(circle).toHaveClass("badge-small");
    expect(circle?.style.getPropertyValue("--tw-ring-color")).toBe(
      RING_COLORS.black
    );

    const nameBox = screen.getByText("Jugador");
    expect(nameBox.style.getPropertyValue("--name-bg")).toBe(
      NAME_BG_COLORS.white
    );

    expect(img.getAttribute("src")).toContain("/assets/default.png");
  });

  it("trunca y agrega '…' cuando el nombre supera MAX_NAME_LEN", () => {
    const long = "C".repeat(MAX_NAME_LEN + 5);
    const truncated = long.slice(0, MAX_NAME_LEN) + "…";
    render(<PlayerBadge name={long} />);
    expect(screen.getByText(truncated)).toBeInTheDocument();
    expect(screen.queryByText(long)).not.toBeInTheDocument();

    const img = screen.getByRole("img", { name: `Avatar of ${truncated}` });
    expect(img).toBeInTheDocument();
  });
});
