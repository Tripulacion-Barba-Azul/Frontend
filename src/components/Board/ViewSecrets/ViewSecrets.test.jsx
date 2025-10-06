import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import ViewSecrets from "./ViewSecrets";

const mockSecrets = [
  { secretName: "You are the murderer", revealed: true },
  { secretName: "You are the acomplice", revealed: false },
  { secretName: "Just a Fantasy", revealed: false },
];

const mockNoSecrets = [];

describe("ViewSecrets", () => {
  it("renders a button with the correct number of secret dots", () => {
    render(<ViewSecrets secrets={mockSecrets} />);

    const dots = screen.getAllByTitle(/Secret/i);
    expect(dots).toHaveLength(mockSecrets.length);
  });

  it("applies correct classes to dots based on secret state", () => {
    render(<ViewSecrets secrets={mockSecrets} />);

    const dots = screen.getAllByTitle(/Secret/i);
    mockSecrets.forEach((secret, index) => {
      if (secret.revealed) {
        expect(dots[index]).toHaveClass("revealed");
      } else {
        expect(dots[index]).toHaveClass("unrevealed");
      }
    });
  });

  it("opens and closes the modal correctly", async () => {
    const user = userEvent.setup();
    render(<ViewSecrets secrets={mockSecrets} />);

    // open modal
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button", { name: "X" })).toBeInTheDocument();

    // close modal
    await user.click(screen.getByRole("button", { name: "X" }));
    expect(screen.queryByRole("button", { name: "X" })).not.toBeInTheDocument();
  });

  it("shows 'Out of secrets' message when no secrets are provided", async () => {
    const user = userEvent.setup();
    render(<ViewSecrets secrets={mockNoSecrets} />);

    await user.click(screen.getByRole("button"));
    expect(screen.getByText(/Out of secrets/i)).toBeInTheDocument();
  });

  it("renders correct images for revealed and unrevealed secrets", async () => {
    const user = userEvent.setup();
    render(<ViewSecrets secrets={mockSecrets} />);

    // open modal
    await user.click(screen.getByRole("button"));

    // revealed secret should show its image
    const revealedCard = screen.getByAltText(/Secret You are the murderer/i);
    expect(revealedCard).toHaveAttribute(
      "src",
      "/Cards/03-secret_murderer.png"
    );

    // unrevealed ones show the back/front
    const hiddenCards = screen.getAllByAltText(/Secret hidden/i);
    expect(hiddenCards.length).toBeGreaterThan(0);
    expect(hiddenCards[0]).toHaveAttribute("src", "/Cards/05-secret_front.png");
  });
});
