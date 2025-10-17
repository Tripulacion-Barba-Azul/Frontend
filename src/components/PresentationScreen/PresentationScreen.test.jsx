// PresentationScreen.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import PresentationScreen from "./PresentationScreen";
import "@testing-library/jest-dom";
import { act } from "react-dom/test-utils";

// Mock avatar map to avoid real asset lookups
vi.mock("../generalMaps", () => ({
  AVATAR_MAP: {
    1: "/avatars/1.png",
    2: "/avatars/2.png",
  },
}));

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});

const makeClose = () => vi.fn();

// Helpers
const murdererPlayer = { name: "PlayerOne", role: "murderer" };
const accomplicePlayer = { name: "PlayerTwo", role: "accomplice" };
const detectivePlayer = { name: "Sherlock", role: "detective" };

describe("PresentationScreen", () => {
  it("renders murderer view with ally chip and colored names", () => {
    const close = makeClose();
    render(
      <PresentationScreen
        actualPlayer={murdererPlayer}
        ally={{ name: "Helper", avatar: 1, role: "accomplice" }}
        close={close}
      />
    );

    // Card image alt includes role
    expect(screen.getByAltText(/murderer card/i)).toBeInTheDocument();

    // Player name styled as murderer
    const playerStrong = screen.getByText("PlayerOne");
    expect(playerStrong).toHaveClass("role-name", "role-murderer");

    // Ally name styled as accomplice
    const allyStrong = screen.getByText("Helper");
    expect(allyStrong).toHaveClass("role-name", "role-accomplice");

    // Ally chip container present (outside textbox)
    expect(document.querySelector(".ally-chipWrap")).toBeInTheDocument();
    expect(document.querySelector(".ally-avatar-circle")).toBeInTheDocument();
  });

  it("renders accomplice view with ally chip (murderer) and proper classes", () => {
    const close = makeClose();
    render(
      <PresentationScreen
        actualPlayer={accomplicePlayer}
        ally={{ name: "Boss", avatar: 2, role: "murderer" }}
        close={close}
      />
    );

    expect(screen.getByAltText(/accomplice card/i)).toBeInTheDocument();

    const playerStrong = screen.getByText("PlayerTwo");
    expect(playerStrong).toHaveClass("role-name", "role-accomplice");

    const allyStrong = screen.getByText("Boss");
    expect(allyStrong).toHaveClass("role-name", "role-murderer");

    expect(document.querySelector(".ally-chipWrap")).toBeInTheDocument();
  });

  it("renders detective view with single textbox (detective-box) and no ally chip", () => {
    const close = makeClose();
    render(
      <PresentationScreen
        actualPlayer={detectivePlayer}
        ally={null}
        close={close}
      />
    );

    expect(screen.getByAltText(/detective card/i)).toBeInTheDocument();

    // Only one main textbox should have the detective-box class
    const detectiveBox = document.querySelector(".textBox.detective-box");
    expect(detectiveBox).toBeInTheDocument();

    // No ally chip column
    expect(document.querySelector(".ally-chipWrap")).not.toBeInTheDocument();

    // Detective name styled as white role
    const name = screen.getByText("Sherlock");
    expect(name).toHaveClass("role-name", "role-detective");
  });

  it("does not render ally chip when ally has no avatar (but keeps right text)", () => {
    const close = makeClose();
    render(
      <PresentationScreen
        actualPlayer={murdererPlayer}
        ally={{ name: "NoPic", role: "accomplice" }} // no avatar field
        close={close}
      />
    );

    // Right text still renders ally name
    expect(screen.getByText("NoPic")).toBeInTheDocument();

    // But chip (avatar + name plate component) is not rendered
    expect(document.querySelector(".ally-chipWrap")).not.toBeInTheDocument();
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

    const btn = screen.getByRole("button", { name: /i am ready/i });
    fireEvent.click(btn);
    expect(close).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledWith(true);

    // Advance timers beyond 20s to verify it's not called again
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

    // Not yet
    expect(close).not.toHaveBeenCalled();

    // After 20s
    await act(async () => {
      vi.advanceTimersByTime(20000);
    });

    expect(close).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledWith(true);
  });
});
