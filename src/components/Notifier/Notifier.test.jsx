import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Notifier from "./Notifier";

// Render portals inline
vi.mock("react-dom", () => ({
  createPortal: (children) => children,
}));

// Maps used by the Notifier helpers
vi.mock("../generalMaps.js", () => ({
  CARDS_MAP: {
    "Not so Fast!": "/cards/notsofast.png",
    "Hercule Poirot": "/cards/poirot.png",
    "Miss Marple": "/cards/marple.png",
    "Mr Satterthwaite": "/cards/satterthwaite.png",
    "Cards off the table": "/cards/cardsofftable.png",
  },
  SETS_MAP: {
    "Tommy Beresford": "/icons/beresford.png",
    "Miss Marple": "/icons/marple.png",
    "The Beresfords": "/icons/beresford.png",
  },
  SECRETS_MAP: {
    "You are the murderer": "/secrets/murderer.png",
    "Just a Fantasy": "/secrets/fantasy.png",
    Untouched: "/secrets/untouched.png",
  },
}));

// CSS noop
vi.mock("./Notifier.css", () => ({}));

describe("Notifier Component", () => {
  const mockPublicData = {
    players: [
      {
        id: 1,
        name: "Alice",
        secrets: [{ id: 101, revealed: false }],
        sets: [{ setId: 1, setName: "Tommy Beresford", cards: [] }],
      },
      {
        id: 2,
        name: "Bob",
        secrets: [{ id: 102, revealed: false }],
        sets: [{ setId: 2, setName: "Miss Marple", cards: [] }],
      },
      {
        id: 3,
        name: "Charlie",
        secrets: [{ id: 103, revealed: false }],
        sets: [{ setId: 3, setName: "Tommy Beresford", cards: [] }],
      },
    ],
  };

  const wsMock = { addEventListener: vi.fn(), removeEventListener: vi.fn() };

  const defaultProps = {
    publicData: mockPublicData,
    actualPlayerId: 1,
    wsRef: { current: wsMock },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  /** Helper: fires the WS "message" listener that the component registers */
  const simulateWebSocketMessage = (eventType, payload) => {
    const handler = wsMock.addEventListener.mock.calls.find(
      (c) => c[0] === "message"
    )?.[1];
    if (handler) {
      act(() => {
        handler({ data: JSON.stringify({ event: eventType, payload }) });
      });
    }
  };

  it("renders colored player names in notification", () => {
    render(<Notifier {...defaultProps} />);

    simulateWebSocketMessage("notifierCardsOffTheTable", {
      playerId: 1,
      quantity: 2,
      selectedPlayerId: 2,
    });

    const html = document.body.innerHTML;
    // Alice -> first color, Bob -> second color
    expect(html).toContain(
      '<span style="color:#e6194B; font-weight:bold">Alice</span>'
    );
    expect(html).toContain(
      '<span style="color:#3cb44b; font-weight:bold">Bob</span>'
    );
  });

  it("different players get different colors", () => {
    render(<Notifier {...defaultProps} />);

    simulateWebSocketMessage("notifierCardsOffTheTable", {
      playerId: 1,
      quantity: 1,
      selectedPlayerId: 3,
    });

    const spans = Array.from(document.querySelectorAll(".notifier-text span"));
    expect(spans.length).toBeGreaterThanOrEqual(2);

    const aliceColor = spans.find((s) => s.textContent === "Alice").style.color;
    const charlieColor = spans.find((s) => s.textContent === "Charlie").style
      .color;

    expect(aliceColor).not.toBe(charlieColor);
  });

  it("auto-closes notification after 5 seconds", () => {
    render(<Notifier {...defaultProps} />);

    simulateWebSocketMessage("notifierLookIntoTheAshes", { playerId: 1 });

    // Should be visible
    expect(screen.getByText(/Alice/)).toBeInTheDocument();

    // 5s auto-close + 500ms fade
    act(() => {
      vi.advanceTimersByTime(5000);
      vi.advanceTimersByTime(500);
    });

    expect(screen.queryByText(/Alice/)).not.toBeInTheDocument();
  });

  it("displays cards and set images", () => {
    render(<Notifier {...defaultProps} />);

    simulateWebSocketMessage("cardsPlayed", {
      playerId: 1,
      cards: [{ id: 4, name: "Hercule Poirot" }],
      actionType: "detective",
    });
    expect(screen.getByAltText("Hercule Poirot")).toBeInTheDocument();

    simulateWebSocketMessage("notifierStealSet", {
      playerId: 2,
      stolenPlayerId: 1,
      setId: 1,
    });
    expect(screen.getByAltText("Set")).toBeInTheDocument();
  });

  it("handles missing player gracefully", () => {
    render(
      <Notifier
        {...defaultProps}
        publicData={{ players: [] }} // nobody known
      />
    );

    simulateWebSocketMessage("notifierRevealSecret", {
      playerId: 999,
      secretId: 101,
      selectedPlayerId: 1,
    });

    // Fallback strings "Player 999" / "Player 1"
    expect(
      screen.getByText("Player 999 revealed Player 1's secret")
    ).toBeInTheDocument();
  });

  it("handles unknown WebSocket event", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<Notifier {...defaultProps} />);
    simulateWebSocketMessage("unknownEvent", {});
    expect(warn).toHaveBeenCalledWith("Unknown event type:", "unknownEvent");
    warn.mockRestore();
  });

  it("closes when clicking outside", () => {
    render(<Notifier {...defaultProps} />);

    simulateWebSocketMessage("notifierNoEffect", {});
    // Overlay click should close immediately (then fade-out)
    const overlay = document.querySelector(".notifier-overlay");
    expect(overlay).toBeInTheDocument();

    act(() => {
      fireEvent.click(overlay);
      vi.advanceTimersByTime(300); // fade-out delay in Notification
    });

    expect(document.querySelector(".notifier-overlay")).not.toBeInTheDocument();
  });
});
