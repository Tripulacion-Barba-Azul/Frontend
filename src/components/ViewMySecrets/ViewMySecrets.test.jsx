import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("../generalMaps.js", () => ({
  SECRETS_MAP: {
    murderer: "/Cards/03-secret_murderer.png",
    accomplice: "/Cards/04-secret_accomplice.png",
    secretFront: "/Cards/05-secret_front.png",
    regular: "/Cards/06-secret_back.png",
  },
}));

import ViewSecrets from "./ViewMySecrets.jsx";

afterEach(() => {
  document.body.classList.remove("my-active-SecretsView");
});

const SECRETS = [
  { secretID: "A", secretName: "murderer", revealed: true },
  { secretID: "B", secretName: "accomplice", revealed: false },
  { secretID: "C", secretName: "regular", revealed: false },
];

describe("ViewMySecrets.jsx (as implemented)", () => {
  it("renders the trigger button (named by inner img alt)", () => {
    render(<ViewSecrets secrets={SECRETS} />);
    const btn = screen.getByRole("button", { name: /shhicon/i });
    expect(btn).toBeInTheDocument();
  });

  it("renders one light-dot per secret with correct classes and titles", () => {
    render(<ViewSecrets secrets={SECRETS} />);
    const dots = screen.getAllByTitle(/Secret/i);
    expect(dots).toHaveLength(SECRETS.length);

    expect(dots[0]).toHaveClass("revealed");
    expect(dots[0]).toHaveAttribute("title", "Secret murderer");
    expect(dots[1]).toHaveClass("unrevealed");
    expect(dots[1]).toHaveAttribute("title", "Secret hidden");
    expect(dots[2]).toHaveClass("unrevealed");
    expect(dots[2]).toHaveAttribute("title", "Secret hidden");
  });

  it("opens the modal and renders expected images for revealed/unrevealed", () => {
    render(<ViewSecrets secrets={SECRETS} />);

    fireEvent.click(screen.getByRole("button", { name: /shhicon/i }));

    const fronts = screen.getAllByRole("img", { name: /Secret \w+/i });
    expect(fronts).toHaveLength(SECRETS.length);

    const backs = screen.getAllByRole("img", { name: /Card back/i });
    expect(backs).toHaveLength(SECRETS.filter((s) => !s.revealed).length);

    expect(fronts[0]).toHaveAttribute("src", "/Cards/03-secret_murderer.png");
    expect(fronts[1]).toHaveAttribute("src", "/Cards/04-secret_accomplice.png");
    expect(fronts[2]).toHaveAttribute("src", "/Cards/06-secret_back.png");

    backs.forEach((img) => {
      expect(img).toHaveAttribute("src", "/Cards/05-secret_front.png");
    });
  });

  it("closes the modal via the close button 'X'", () => {
    render(<ViewSecrets secrets={SECRETS} />);
    fireEvent.click(screen.getByRole("button", { name: /shhicon/i }));

    expect(screen.getByText("X")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Secret murderer" })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText("X"));
    expect(
      screen.queryByRole("img", { name: "Secret murderer" })
    ).not.toBeInTheDocument();
    expect(document.body.classList.contains("my-active-SecretsView")).toBe(
      false
    );
  });

  it("closes the modal by clicking the overlay", () => {
    render(<ViewSecrets secrets={SECRETS} />);
    fireEvent.click(screen.getByRole("button", { name: /shhicon/i }));

    const overlay = document.querySelector(".overlay");
    expect(overlay).toBeTruthy();

    fireEvent.click(overlay);
    expect(
      screen.queryByRole("img", { name: "Secret murderer" })
    ).not.toBeInTheDocument();
    expect(document.body.classList.contains("my-active-SecretsView")).toBe(
      false
    );
  });

  it("shows 'Out of secrets!' when secrets is empty", () => {
    render(<ViewSecrets secrets={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /shhicon/i }));
    expect(screen.getByText(/Out of secrets!/i)).toBeInTheDocument();
  });
});
