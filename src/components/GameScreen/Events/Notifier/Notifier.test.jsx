// Notifier.test.jsx
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Notifier from "./Notifier";

// Render portals inline
vi.mock("react-dom", () => ({
  createPortal: (children) => children,
}));

// Maps used by the Notifier helpers (mocked at the same path the component imports)
vi.mock("../../../../utils/generalMaps", () => ({
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
  AVATAR_MAP: {
    1: "/Board/Avatars/avatar1.png",
    2: "/Board/Avatars/avatar2.png",
    3: "/Board/Avatars/avatar3.png",
    4: "/Board/Avatars/avatar4.png",
    5: "/Board/Avatars/avatar5.png",
    6: "/Board/Avatars/avatar6.png",
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
        avatar: 1,
        secrets: [{ id: 101, revealed: false }],
        sets: [{ setId: 1, setName: "Tommy Beresford", cards: [] }],
      },
      {
        id: 2,
        name: "Bob",
        avatar: 2,
        secrets: [{ id: 102, revealed: false }],
        sets: [{ setId: 2, setName: "Miss Marple", cards: [] }],
      },
      {
        id: 3,
        name: "Charlie",
        avatar: 3,
        secrets: [{ id: 103, revealed: false }],
        sets: [{ setId: 3, setName: "Tommy Beresford", cards: [] }],
      },
    ],
  };

  // Helper function to check if text content includes multiple fragments
  const expectTextContent = (textToFind) => {
    const element = document.querySelector(".notifier-text");
    expect(element).toBeInTheDocument();
    expect(element.textContent).toContain(textToFind);
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
    const handler = wsMock.addEventListener.mock.calls.find((c) => c[0] === "message")?.[1];
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
    expect(html).toContain('<span style="color:#e6194B; font-weight:bold">Alice</span>');
    expect(html).toContain('<span style="color:#3cb44b; font-weight:bold">Bob</span>');
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
    const charlieColor = spans.find((s) => s.textContent === "Charlie").style.color;

    expect(aliceColor).not.toBe(charlieColor);
  });

  it("auto-closes notification after 5 seconds", () => {
    render(<Notifier {...defaultProps} />);

    simulateWebSocketMessage("notifierLookIntoTheAshes", { playerId: 1 });

    // Should be visible
    expect(screen.getByText(/Alice/)).toBeInTheDocument();

    // 5s auto-close + small fadeouts
    act(() => {
      vi.advanceTimersByTime(5000);
      vi.advanceTimersByTime(300);
    });

    expect(screen.queryByText(/Alice/)).not.toBeInTheDocument();
  });

  it("displays cards and set images", () => {
    render(<Notifier {...defaultProps} />);

    simulateWebSocketMessage("notifierCardsPlayed", {
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
      vi.advanceTimersByTime(300); // fade-out / close delays
    });

    expect(document.querySelector(".notifier-overlay")).not.toBeInTheDocument();
  });

  it("does not close when clicking on notification content", () => {
    render(<Notifier {...defaultProps} />);

    simulateWebSocketMessage("notifierNoEffect", {});
    const content = document.querySelector(".notifier-content");
    expect(content).toBeInTheDocument();

    act(() => {
      fireEvent.click(content);
    });

    // Should still be visible
    expect(document.querySelector(".notifier-overlay")).toBeInTheDocument();
  });

  it("handles notifierAndThenThereWasOneMore - player takes own secret and hides it", () => {
    render(<Notifier {...defaultProps} />);

    simulateWebSocketMessage("notifierAndThenThereWasOneMore", {
      playerId: 1,
      secretId: 101,
      secretName: "You are the murderer",
      stolenPlayerId: 1,
      giftedPlayerId: 1,
    });

    expectTextContent("Alice took one of their revealed secrets");
    expectTextContent("and hid it");
    expect(screen.getByAltText("You are the murderer")).toBeInTheDocument();
  });

  it("handles notifierAndThenThereWasOneMore - player takes own secret and gives to another", () => {
    render(<Notifier {...defaultProps} />);

    simulateWebSocketMessage("notifierAndThenThereWasOneMore", {
      playerId: 1,
      secretId: 101,
      secretName: "You are the murderer",
      stolenPlayerId: 1,
      giftedPlayerId: 2,
    });

    expectTextContent("Alice took one of their own secrets");
    expectTextContent("gave it to");
    expectTextContent("Bob");
    expectTextContent("Now the secret is hidden");
  });

  it("handles notifierAndThenThereWasOneMore - player steals from another", () => {
    render(<Notifier {...defaultProps} />);

    simulateWebSocketMessage("notifierAndThenThereWasOneMore", {
      playerId: 1,
      secretId: 102,
      secretName: "Just a Fantasy",
      stolenPlayerId: 2,
      giftedPlayerId: 1,
    });

    expectTextContent("Alice stole a secret from");
    expectTextContent("Bob");
    expectTextContent("Now the secret is hidden");
  });

  it("handles notifierAndThenThereWasOneMore - player takes and gives back to same person", () => {
    render(<Notifier {...defaultProps} />);

    simulateWebSocketMessage("notifierAndThenThereWasOneMore", {
      playerId: 1,
      secretId: 102,
      secretName: "Just a Fantasy",
      stolenPlayerId: 2,
      giftedPlayerId: 2,
    });

    expectTextContent("Alice took a secret from");
    expectTextContent("Bob");
    expectTextContent("gave it back to them");
    expectTextContent("Now the secret is hidden");
  });

  it("handles notifierAndThenThereWasOneMore - player takes from one and gives to third person", () => {
    render(<Notifier {...defaultProps} />);

    simulateWebSocketMessage("notifierAndThenThereWasOneMore", {
      playerId: 1,
      secretId: 102,
      secretName: "Just a Fantasy",
      stolenPlayerId: 2,
      giftedPlayerId: 3,
    });

    expectTextContent("Alice took a secret from");
    expectTextContent("Bob");
    expectTextContent("gave it to");
    expectTextContent("Charlie");
    expectTextContent("Now the secret is hidden");
  });

  it("handles notifierRevealSecret - player reveals own secret", () => {
    render(<Notifier {...defaultProps} />);

    simulateWebSocketMessage("notifierRevealSecret", {
      playerId: 1,
      secretId: 101,
      selectedPlayerId: 1,
    });

    expectTextContent("Alice revealed one of their own secrets");
  });

  it("handles notifierRevealSecret - player reveals another's secret", () => {
    render(<Notifier {...defaultProps} />);

    simulateWebSocketMessage("notifierRevealSecret", {
      playerId: 1,
      secretId: 102,
      selectedPlayerId: 2,
    });

    expectTextContent("Alice revealed");
    expectTextContent("Bob's secret");
  });

  it("handles notifierRevealSecretForce - player reveals own secret", () => {
    render(<Notifier {...defaultProps} />);

    simulateWebSocketMessage("notifierRevealSecretForce", {
      playerId: 1,
      secretId: 101,
      selectedPlayerId: 1,
    });

    expectTextContent("Alice revealed one of their own secrets");
  });

  it("handles notifierRevealSecretForce - player forces another to reveal", () => {
    render(<Notifier {...defaultProps} />);

    simulateWebSocketMessage("notifierRevealSecretForce", {
      playerId: 1,
      secretId: 102,
      selectedPlayerId: 2,
    });

    expectTextContent("Alice made");
    expectTextContent("Bob");
    expectTextContent("reveal a secret");
  });

  it("handles notifierSatterthwaiteWild - player shows own secret", () => {
    render(<Notifier {...defaultProps} />);

    simulateWebSocketMessage("notifierSatterthwaiteWild", {
      playerId: 1,
      secretId: 101,
      secretName: "You are the murderer",
      selectedPlayerId: 1,
    });

    expectTextContent("Alice showed one of their own secrets");
    expectTextContent("remains hidden");
  });

  it("handles notifierSatterthwaiteWild - player steals secret", () => {
    render(<Notifier {...defaultProps} />);

    simulateWebSocketMessage("notifierSatterthwaiteWild", {
      playerId: 1,
      secretId: 102,
      secretName: "Just a Fantasy",
      selectedPlayerId: 2,
    });

    expectTextContent("Alice stole one of");
    expectTextContent("Bob's secrets");
    expectTextContent("now hidden");
  });

  it("handles notifierHideSecret - player hides another's secret", () => {
    render(<Notifier {...defaultProps} />);

    simulateWebSocketMessage("notifierHideSecret", {
      playerId: 1,
      secretId: 102,
      selectedPlayerId: 2,
    });

    expectTextContent("Alice hid one of");
    expectTextContent("Bob's secrets");
  });

  it("handles notifierHideSecret - player hides own secret", () => {
    render(<Notifier {...defaultProps} />);

    simulateWebSocketMessage("notifierHideSecret", {
      playerId: 1,
      secretId: 101,
      selectedPlayerId: 1,
    });

    expectTextContent("Alice hid one of their secrets");
  });

  it("handles notifierDelayTheMurderersEscape", () => {
    render(<Notifier {...defaultProps} />);

    simulateWebSocketMessage("notifierDelayTheMurderersEscape", {
      playerId: 2,
    });

    expectTextContent("Bob took cards from the discard pile");
    expectTextContent("put them on top of the deck");
  });

  it("handles notifierDiscardEvent", () => {
    render(<Notifier {...defaultProps} />);

    simulateWebSocketMessage("notifierDiscardEvent", {
      playerId: 1,
      cards: [
        { id: 1, name: "Hercule Poirot" },
        { id: 2, name: "Miss Marple" },
      ],
    });

    expectTextContent("Alice discarded 2 cards");
    expect(screen.getByAltText("Hercule Poirot")).toBeInTheDocument();
    expect(screen.getByAltText("Miss Marple")).toBeInTheDocument();
  });

  it("handles notifierCardsPlayed with different action types", () => {
    render(<Notifier {...defaultProps} />);

    // Test "set" action type
    simulateWebSocketMessage("notifierCardsPlayed", {
      playerId: 1,
      cards: [{ id: 1, name: "Hercule Poirot" }],
      actionType: "set",
    });
    expectTextContent("played a set of detectives");

    // Clear and test "event" action type
    act(() => {
      document.querySelector(".notifier-overlay")?.click();
      vi.advanceTimersByTime(300);
    });
    
    simulateWebSocketMessage("notifierCardsPlayed", {
      playerId: 1,
      cards: [{ id: 1, name: "Not so Fast!" }],
      actionType: "event",
    });
    expectTextContent("played an event card");

    // Clear and test default action type
    act(() => {
      document.querySelector(".notifier-overlay")?.click();
      vi.advanceTimersByTime(300);
    });
    
    simulateWebSocketMessage("notifierCardsPlayed", {
      playerId: 1,
      cards: [{ id: 1, name: "Hercule Poirot" }],
      actionType: "unknown",
    });
    expectTextContent("played cards");
  });

  it("handles player not found scenarios", () => {
    render(<Notifier {...defaultProps} />);

    simulateWebSocketMessage("notifierCardsOffTheTable", {
      playerId: 999, // Non-existent player
      quantity: 1,
      selectedPlayerId: 998, // Non-existent player
    });

    expect(screen.getByText(/Player 999/)).toBeInTheDocument();
    expect(screen.getByText(/Player 998/)).toBeInTheDocument();
  });

  it("handles set not found scenarios", () => {
    render(<Notifier {...defaultProps} />);

    simulateWebSocketMessage("notifierStealSet", {
      playerId: 1,
      stolenPlayerId: 2,
      setId: 999, // Non-existent set
    });

    expect(screen.getByText(/Set 999/)).toBeInTheDocument();
  });

  it("handles secret cards with different revealed states", () => {
    render(<Notifier {...defaultProps} />);

    // Test unrevealed secret
    simulateWebSocketMessage("notifierHideSecret", {
      playerId: 1,
      secretId: 101,
      selectedPlayerId: 1,
    });

    const secretImages = document.querySelectorAll(
      'img[src="/Cards/05-secret_front.png"]'
    );
    expect(secretImages.length).toBeGreaterThan(0);
  });

  it("handles WebSocket JSON parsing error", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<Notifier {...defaultProps} />);

    const handler = wsMock.addEventListener.mock.calls.find((c) => c[0] === "message")?.[1];
    
    if (handler) {
      act(() => {
        handler({ data: "invalid json" });
      });
    }

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error processing websocket message:",
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });

  it("handles null wsRef and undefined wsRef without crashing", () => {
    render(<Notifier {...defaultProps} wsRef={{ current: null }} />);
    render(<Notifier {...defaultProps} wsRef={null} />);
    // Just ensure no crash
  });

  it("handles null publicData without crashing (and logs error on use)", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<Notifier {...defaultProps} publicData={null} />);

    simulateWebSocketMessage("notifierCardsOffTheTable", {
      playerId: 1,
      quantity: 1,
      selectedPlayerId: 2,
    });

    // Should catch the error but not crash the application
    expect(consoleSpy).toHaveBeenCalled();
    
    // No notification should be rendered due to error
    const notifierElement = document.querySelector(".notifier-text");
    expect(notifierElement).toBeNull();

    consoleSpy.mockRestore();
  });

  it("handles player colors cycling through available colors", () => {
    const manyPlayers = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      name: `Player${i + 1}`,
      avatar: 1,
      secrets: [],
      sets: [],
    }));

    render(
      <Notifier {...defaultProps} publicData={{ players: manyPlayers }} />
    );

    simulateWebSocketMessage("notifierCardsOffTheTable", {
      playerId: 7, // Should cycle back to color index 0
      quantity: 1,
      selectedPlayerId: 8, // Should use color index 1
    });

    const spans = Array.from(document.querySelectorAll(".notifier-text span"));
    expect(spans.length).toBeGreaterThanOrEqual(2);
    
    const firstPlayerSpan = spans.find((s) => s.textContent === "Player7");
    const lastPlayerSpan = spans.find((s) => s.textContent === "Player8");
    expect(firstPlayerSpan.style.color).toBe("rgb(230, 25, 75)"); // #e6194B
    expect(lastPlayerSpan.style.color).toBe("rgb(60, 180, 75)"); // #3cb44b
  });

  it("handles Beresford set name transformation", () => {
    const dataWithBeresfords = {
      players: [
        {
          id: 1,
          name: "Alice",
          avatar: 1,
          secrets: [],
          sets: [
            { setId: 1, setName: "Tommy Beresford", cards: [] },
            { setId: 2, setName: "Tuppence Beresford", cards: [] },
          ],
        },
      ],
    };

    render(<Notifier {...defaultProps} publicData={dataWithBeresfords} />);

    simulateWebSocketMessage("notifierStealSet", {
      playerId: 1,
      stolenPlayerId: 1,
      setId: 1,
    });

    expect(screen.getByText(/The Beresfords/)).toBeInTheDocument();
  });

  it("displays secret cards with proper fallback images", () => {
    render(<Notifier {...defaultProps} />);

    // Test revealed secret with known name
    simulateWebSocketMessage("notifierRevealSecret", {
      playerId: 1,
      secretId: 101,
      selectedPlayerId: 1,
    });

    // Should use the secret map for revealed secrets
    expect(document.querySelector('img')).toBeInTheDocument();
  });

  it("renders nothing when no current notification", () => {
    const { container } = render(<Notifier {...defaultProps} />);
    expect(container.firstChild).toBeNull();
  });

  it("cleans up WebSocket listener on unmount", () => {
    const { unmount } = render(<Notifier {...defaultProps} />);

    expect(wsMock.addEventListener).toHaveBeenCalledWith(
      "message",
      expect.any(Function)
    );

    unmount();

    expect(wsMock.removeEventListener).toHaveBeenCalledWith(
      "message",
      expect.any(Function)
    );
  });

  it("renders Point Your Suspicious overlay and highlights selected player", () => {
    render(<Notifier {...defaultProps} />);
    simulateWebSocketMessage("notifierPointYourSuspicious", {
      playersSelections: [
        [1, 3],
        [2, 3],
        [3, 2],
      ],
      selectedPlayerId: 3,
    });

    // Should render overlay and text containing colored selected player name
    const textEl = document.querySelector(".notifier-text");
    expect(textEl).toBeInTheDocument();
    expect(textEl.innerHTML).toContain("was pointed as a suspicious");
    // the selected player's colored span should be present
    expect(textEl.innerHTML).toContain("Charlie");
    // container for avatars should exist
    expect(document.querySelector(".pointyour-container")).toBeInTheDocument();
  });

  it("renders Point Your Suspicious overlay and highlights selected player", () => {
    render(<Notifier {...defaultProps} />);
    simulateWebSocketMessage("notifierPointYourSuspicious", {
      playersSelections: [
        [1, 3],
        [2, 3],
        [3, 2],
      ],
      selectedPlayerId: 3
    });

    // Should render overlay and text containing colored selected player name
    const textEl = document.querySelector(".notifier-text");
    expect(textEl).toBeInTheDocument();
    expect(textEl.innerHTML).toContain("was pointed as a suspicious");
    // the selected player's colored span should be present
    expect(textEl.innerHTML).toContain("Charlie");
    // container for avatars should exist
    expect(document.querySelector(".pointyour-container")).toBeInTheDocument();
  });
});
