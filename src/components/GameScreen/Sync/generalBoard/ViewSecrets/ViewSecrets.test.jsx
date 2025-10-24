import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import ViewSecrets from "./ViewSecrets";

const mockSecrets = [
  { class: "murderer", revealed: true },
  { class: "accomplice", revealed: false },
  { class: "regular", revealed: false },
];

const mockNoSecrets = [];

describe("ViewSecrets", () => {
  it("renders the correct number of dots", () => {
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

  it("opens and closes the modal", async () => {
    const user = userEvent.setup();
    render(<ViewSecrets secrets={mockSecrets} />);

    await user.click(screen.getByRole("button"));
    expect(screen.getByText("X")).toBeInTheDocument();

    await user.click(screen.getByText("X"));
    expect(screen.queryByText("X")).not.toBeInTheDocument();
  });

  it("Shows message when there are no secrets", async () => {
    const user = userEvent.setup();
    render(<ViewSecrets secrets={mockNoSecrets} />);

    await user.click(screen.getByRole("button"));
    expect(screen.getByText(/Out of secrets/i)).toBeInTheDocument();
  });
});
