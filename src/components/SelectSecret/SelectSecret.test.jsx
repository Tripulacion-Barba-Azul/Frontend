import React from "react";
import { describe, test, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import SelectSecret from "./SelectSecret";

// Silence CSS import
vi.mock("./SelectSecret.css", () => ({}));

// Provide only the secrets your component will ask images for
vi.mock("../generalMaps.js", () => ({
  SECRETS_MAP: {
    "You are the murderer": "/img/secret_murderer.png",
    Prankster: "/img/secret_prankster.png",
    "You are the acomplice": "/img/secret_accomplice.png",
  },
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.useFakeTimers();
});

const BASE_PROPS = {
  actualPlayerId: 1,
  playerId: 1,
  text: "Pick a secret",
};

const SECRETS_SAMPLE = [
  { id: 1, revealed: true, name: "You are the murderer" },
  { id: 2, revealed: false, name: "Prankster" },
  { id: 3, revealed: false, name: null }, // hidden & unknown name in public
];

describe("SelectSecret", () => {
  test("renders secrets and disables not-selectable ones when revealed=true", () => {
    render(
      <SelectSecret
        {...BASE_PROPS}
        secrets={SECRETS_SAMPLE}
        revealed={true}
        selectedSecretId={() => {}}
        goBack={() => {}}
      />
    );

    // Header text
    expect(
      screen.getByRole("heading", { name: /pick a secret/i })
    ).toBeDefined();

    // Non-selectable secrets have title "Not selectable for this step"
    const notSelectable = screen.getAllByTitle("Not selectable for this step");
    // For revealed=true, hidden ones (id 2,3) should be non-selectable
    expect(notSelectable.length).toBe(2);

    // Confirm must be disabled until a selectable secret is chosen
    const confirmBtn = screen.getByRole("button", { name: /confirm/i });
    expect(confirmBtn).toBeDisabled();

    // Clicking a non-selectable secret should not enable confirm
    fireEvent.click(notSelectable[0]);
    expect(confirmBtn).toBeDisabled();

    // Click selectable: the revealed one (id 1)
    // Cards are all role=button; use a safer query: any button without the non-selectable title
    const allCards = screen.getAllByRole("button");
    const selectableCard = allCards.find((el) => !el.getAttribute("title"));
    expect(selectableCard).toBeTruthy();

    fireEvent.click(selectableCard);
    expect(confirmBtn).not.toBeDisabled();
  });

  test("confirm calls selectedSecretId with the chosen id (revealed=true -> id=1)", () => {
    const onSelect = vi.fn();

    render(
      <SelectSecret
        {...BASE_PROPS}
        secrets={SECRETS_SAMPLE}
        revealed={true}
        selectedSecretId={onSelect}
        goBack={() => {}}
      />
    );

    // Pick the only selectable (revealed) card
    const allCards = screen.getAllByRole("button");
    const selectable = allCards.find((el) => !el.getAttribute("title"));
    fireEvent.click(selectable);

    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));

    // The component fires after 600ms
    vi.advanceTimersByTime(600);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  test("when revealed=false only hidden secrets are selectable; confirm returns the picked id", () => {
    const onSelect = vi.fn();

    render(
      <SelectSecret
        {...BASE_PROPS}
        secrets={SECRETS_SAMPLE}
        revealed={false}
        selectedSecretId={onSelect}
        goBack={() => {}}
      />
    );

    // For revealed=false, id 2 and id 3 are selectable (no title attr)
    const cards = screen.getAllByRole("button");
    const selectableCards = cards.filter((el) => !el.getAttribute("title"));
    // There are 3 buttons: (Go Back, Confirm) also have role=button, filter them out by container class
    const gridCards = selectableCards.filter((el) =>
      el.className.includes("selectable-secret-card")
    );
    // Two hidden cards should be selectable
    expect(gridCards.length).toBe(2);

    // Click one hidden card (any of the two)
    fireEvent.click(gridCards[0]);
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));

    vi.advanceTimersByTime(600);

    // Should pass the id of the chosen hidden card
    expect(onSelect).toHaveBeenCalledTimes(1);
    const calledWith = onSelect.mock.calls[0][0];
    expect([2, 3]).toContain(calledWith);
  });

  test("renders Go Back when goBack is provided and calls it", () => {
    const onBack = vi.fn();

    render(
      <SelectSecret
        {...BASE_PROPS}
        secrets={SECRETS_SAMPLE}
        revealed={true}
        selectedSecretId={() => {}}
        goBack={onBack}
      />
    );

    const backBtn = screen.getByRole("button", { name: /go back/i });
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  test("does not render Go Back when goBack is null", () => {
    render(
      <SelectSecret
        {...BASE_PROPS}
        secrets={SECRETS_SAMPLE}
        revealed={true}
        selectedSecretId={() => {}}
        goBack={null}
      />
    );

    expect(screen.queryByRole("button", { name: /go back/i })).toBeNull();
  });
});
