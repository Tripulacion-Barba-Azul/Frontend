import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import PresentationScreen from "./PresentationScreen";
import "@testing-library/jest-dom";
import { act } from "react-dom/test-utils";

// Mock avatar map
vi.mock("../generalMaps", () => ({
  AVATAR_MAP: { 1: "/avatars/1.png", 2: "/avatars/2.png" },
}));

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});

const murdererPlayer = { name: "PlayerOne", role: "murderer" };
const accomplicePlayer = { name: "PlayerTwo", role: "accomplice" };
const detectivePlayer = { name: "Sherlock", role: "detective" };

const makeClose = () => vi.fn();

describe("PresentationScreen", () => {
  it("renders murderer view with ally chip and proper names", () => {
    const close = makeClose();
    render(
      <PresentationScreen
        actualPlayer={murdererPlayer}
        ally={{ name: "Helper", avatar: 1, role: "accomplice" }}
        close={close}
      />
    );

    // Card image alt
    expect(screen.getByAltText(/murderer card/i)).toBeInTheDocument();

    // Player name (unique)
    expect(screen.getByText("PlayerOne")).toHaveClass(
      "role-name",
      "role-murderer"
    );

    // Ally name appears in the narrative paragraph; pick the strong role-name element
    const allyStrong =
      screen
        .getAllByText("Helper")
        .find((el) => el.classList.contains("role-name")) || null;
    expect(allyStrong).toBeInTheDocument();
    expect(allyStrong).toHaveClass("role-name", "role-accomplice");

    // Avatar visible (ally chip)
    expect(document.querySelector(".ally-avatar-circle")).toBeInTheDocument();

    // When there is a chip, the row should include the chip layout modifier
    expect(
      document.querySelector(".textRow.textRow--withChip")
    ).toBeInTheDocument();
  });

  it("renders accomplice view with murderer ally", () => {
    const close = makeClose();
    render(
      <PresentationScreen
        actualPlayer={accomplicePlayer}
        ally={{ name: "Boss", avatar: 2, role: "murderer" }}
        close={close}
      />
    );

    expect(screen.getByAltText(/accomplice card/i)).toBeInTheDocument();
    expect(screen.getByText("PlayerTwo")).toHaveClass(
      "role-name",
      "role-accomplice"
    );

    const allyStrong =
      screen
        .getAllByText("Boss")
        .find((el) => el.classList.contains("role-name")) || null;
    expect(allyStrong).toBeInTheDocument();
    expect(allyStrong).toHaveClass("role-name", "role-murderer");

    expect(document.querySelector(".ally-avatar-circle")).toBeInTheDocument();
    expect(
      document.querySelector(".textRow.textRow--withChip")
    ).toBeInTheDocument();
  });

  it("detective view uses single textbox (solo-box) and no ally avatar", () => {
    const close = makeClose();
    render(
      <PresentationScreen
        actualPlayer={detectivePlayer}
        ally={null}
        close={close}
      />
    );

    expect(screen.getByAltText(/detective card/i)).toBeInTheDocument();

    // Single text box with the 'solo-box' helper class
    const solo = document.querySelector(".textBox.solo-box");
    expect(solo).toBeInTheDocument();

    // No ally avatar
    expect(
      document.querySelector(".ally-avatar-circle")
    ).not.toBeInTheDocument();

    // Name styling
    expect(screen.getByText("Sherlock")).toHaveClass(
      "role-name",
      "role-detective"
    );
  });

  it("murderer WITHOUT ally renders as a single textbox (solo-box) with no right column or chip", () => {
    const close = makeClose();
    render(
      <PresentationScreen
        actualPlayer={murdererPlayer}
        ally={null}
        close={close}
        // soloAsSingleBox defaults to true; keep explicit for clarity
        soloAsSingleBox={true}
      />
    );

    expect(screen.getByAltText(/murderer card/i)).toBeInTheDocument();
    // Only one text box present
    const boxes = document.querySelectorAll(".textBox");
    expect(boxes.length).toBe(1);
    expect(boxes[0].classList.contains("solo-box")).toBe(true);

    // No ally chip or chip layout class
    expect(
      document.querySelector(".ally-avatar-circle")
    ).not.toBeInTheDocument();
    expect(
      document.querySelector(".textRow.textRow--withChip")
    ).not.toBeInTheDocument();
  });

  it("accomplice WITHOUT ally renders as a single textbox (solo-box) with no right column or chip", () => {
    const close = makeClose();
    render(
      <PresentationScreen
        actualPlayer={accomplicePlayer}
        ally={null}
        close={close}
        soloAsSingleBox={true}
      />
    );

    expect(screen.getByAltText(/accomplice card/i)).toBeInTheDocument();
    const boxes = document.querySelectorAll(".textBox");
    expect(boxes.length).toBe(1);
    expect(boxes[0].classList.contains("solo-box")).toBe(true);

    expect(
      document.querySelector(".ally-avatar-circle")
    ).not.toBeInTheDocument();
    expect(
      document.querySelector(".textRow.textRow--withChip")
    ).not.toBeInTheDocument();
  });

  it("when ally has NO avatar, keeps ally name text but does NOT render an avatar", () => {
    const close = makeClose();
    render(
      <PresentationScreen
        actualPlayer={murdererPlayer}
        ally={{ name: "NoPic", role: "accomplice" }} // no avatar field
        close={close}
      />
    );

    // Ally name still appears in text (role-colored strong element)
    const allyStrong =
      screen
        .getAllByText("NoPic")
        .find((el) => el.classList.contains("role-name")) || null;
    expect(allyStrong).toBeInTheDocument();

    // But no chip avatar is rendered
    expect(
      document.querySelector(".ally-avatar-circle")
    ).not.toBeInTheDocument();
  });

  it('calls close(true) on "I am ready" click and does not call again after 20s', async () => {
    const close = makeClose();
    render(
      <PresentationScreen
        actualPlayer={detectivePlayer}
        ally={null}
        close={close}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /i am ready/i }));
    expect(close).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledWith(true);

    await act(async () => {
      vi.advanceTimersByTime(21000);
    });
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("auto-calls close(true) after 20 seconds if not clicked", async () => {
    const close = makeClose();
    render(
      <PresentationScreen
        actualPlayer={accomplicePlayer}
        ally={{ name: "Boss", avatar: 2, role: "murderer" }}
        close={close}
      />
    );

    expect(close).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(20000);
    });
    expect(close).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledWith(true);
  });
});
