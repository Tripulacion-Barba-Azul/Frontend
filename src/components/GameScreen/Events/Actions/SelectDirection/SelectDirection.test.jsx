import React from "react";
import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import SelectDirection from "./SelectDirection";

// Silence CSS import noise
vi.mock("./SelectDirection.css", () => ({}));

afterEach(cleanup);

// Mock avatar map used by the component
vi.mock("../../../../../utils/generalMaps", () => ({
  AVATAR_MAP: {
    1: "/a1.png",
    2: "/a2.png",
    3: "/a3.png",
    4: "/a4.png",
  },
}));

const PLAYERS = [
  {
    id: 1,
    name: "Alice",
    avatar: 1,
    socialDisgrace: false,
    turnOrder: 1,
    cardCount: 3,
    secrets: [],
  },
  {
    id: 2,
    name: "Bob",
    avatar: 2,
    socialDisgrace: false,
    turnOrder: 2,
    cardCount: 4,
    secrets: [],
  },
  {
    id: 3,
    name: "Charlie",
    avatar: 3,
    socialDisgrace: false,
    turnOrder: 3,
    cardCount: 5,
    secrets: [],
  },
  {
    id: 4,
    name: "Diana",
    avatar: 4,
    socialDisgrace: false,
    turnOrder: 4,
    cardCount: 2,
    secrets: [],
  },
];

const BASE_PROPS = {
  playerId: 2, // Bob is the current player
  players: PLAYERS,
  text: "Choose a direction",
};

// Helper: find the .selectdirection-item container by direction
function getItemContainerByDirection(direction) {
  const label = screen.getByText(direction === "left" ? "LEFT" : "RIGHT");
  // The label is inside the item; we climb to the container
  const container = label.closest(".selectdirection-item");
  if (!container) throw new Error(`Container not found for ${direction}`);
  return container;
}

describe("SelectDirection", () => {
  test("renders heading and both direction options with adjacent players", () => {
    render(<SelectDirection {...BASE_PROPS} selectedDirection={() => {}} />);

    // Heading
    const heading = screen.getByRole("heading", { name: /choose a direction/i });
    expect(heading).toBeTruthy();

    // Direction options
    expect(screen.getByText("LEFT")).toBeTruthy();
    expect(screen.getByText("RIGHT")).toBeTruthy();

    // Adjacent players (Bob is current player with turnOrder 2)
    // Left player should be Alice (turnOrder 1)
    expect(screen.getByText("Alice")).toBeTruthy();
    // Right player should be Charlie (turnOrder 3)
    expect(screen.getByText("Charlie")).toBeTruthy();

    // Check avatars are rendered
    expect(screen.getByAltText("Alice")).toBeTruthy();
    expect(screen.getByAltText("Charlie")).toBeTruthy();
  });

  test("confirm is disabled until a direction is selected, then calls callback with chosen direction", () => {
    const onSelect = vi.fn();
    render(<SelectDirection {...BASE_PROPS} selectedDirection={onSelect} />);

    const confirmBtn = screen.getByRole("button", { name: /confirm/i });
    expect(confirmBtn).toBeDisabled();

    // Click on Left (can click on the LEFT label or Alice's name)
    fireEvent.click(screen.getByText("LEFT"));
    expect(confirmBtn).not.toBeDisabled();

    fireEvent.click(confirmBtn);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("left");
  });

  test("selection toggles 'selected' class on the correct item container", () => {
    render(<SelectDirection {...BASE_PROPS} selectedDirection={() => {}} />);

    const leftContainer = getItemContainerByDirection("left");
    const rightContainer = getItemContainerByDirection("right");

    // Initially none selected
    expect(leftContainer.className).not.toContain("selected");
    expect(rightContainer.className).not.toContain("selected");

    // Click Left
    fireEvent.click(screen.getByText("LEFT"));
    expect(leftContainer.className).toContain("selected");
    expect(rightContainer.className).not.toContain("selected");

    // Click Right (should deselect Left and select Right)
    fireEvent.click(screen.getByText("RIGHT"));
    expect(leftContainer.className).not.toContain("selected");
    expect(rightContainer.className).toContain("selected");
  });

  test("calls callback with 'right' when right direction is selected and confirmed", () => {
    const onSelect = vi.fn();
    render(<SelectDirection {...BASE_PROPS} selectedDirection={onSelect} />);

    // Click on Right
    fireEvent.click(screen.getByText("RIGHT"));
    
    const confirmBtn = screen.getByRole("button", { name: /confirm/i });
    expect(confirmBtn).not.toBeDisabled();

    fireEvent.click(confirmBtn);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("right");
  });

  test("displays correct text prop", () => {
    const customText = "Select the rotation direction";
    render(
      <SelectDirection
        {...BASE_PROPS}
        text={customText}
        selectedDirection={() => {}}
      />
    );

    const heading = screen.getByRole("heading", { name: customText });
    expect(heading).toBeTruthy();
  });

  test("locks page scroll when component mounts", () => {
    const originalOverflow = document.body.style.overflow;
    
    const { unmount } = render(
      <SelectDirection {...BASE_PROPS} selectedDirection={() => {}} />
    );

    expect(document.body.style.overflow).toBe("hidden");

    // Clean up - unmount should restore overflow
    unmount();
    expect(document.body.style.overflow).toBe("");
    
    // Restore original value
    document.body.style.overflow = originalOverflow;
  });

  test("can switch between selections before confirming", () => {
    const onSelect = vi.fn();
    render(<SelectDirection {...BASE_PROPS} selectedDirection={onSelect} />);

    // Select Left
    fireEvent.click(screen.getByText("LEFT"));
    const leftContainer = getItemContainerByDirection("left");
    const rightContainer = getItemContainerByDirection("right");
    expect(leftContainer.className).toContain("selected");

    // Switch to Right
    fireEvent.click(screen.getByText("RIGHT"));
    expect(leftContainer.className).not.toContain("selected");
    expect(rightContainer.className).toContain("selected");

    // Switch back to Left
    fireEvent.click(screen.getByText("LEFT"));
    expect(leftContainer.className).toContain("selected");
    expect(rightContainer.className).not.toContain("selected");

    // Confirm should still work with latest selection (Left)
    const confirmBtn = screen.getByRole("button", { name: /confirm/i });
    fireEvent.click(confirmBtn);
    expect(onSelect).toHaveBeenCalledWith("left");
  });

  test("handles wrap-around for first and last players correctly", () => {
    // Test with first player (turnOrder 1)
    const firstPlayerProps = {
      ...BASE_PROPS,
      playerId: 1, // Alice
    };
    
    const { rerender } = render(
      <SelectDirection {...firstPlayerProps} selectedDirection={() => {}} />
    );

    // Alice (turnOrder 1) should have:
    // Left: Diana (turnOrder 4) - wrap around
    // Right: Bob (turnOrder 2)
    expect(screen.getByText("Diana")).toBeTruthy(); // Left side
    expect(screen.getByText("Bob")).toBeTruthy();   // Right side

    // Test with last player (turnOrder 4)
    const lastPlayerProps = {
      ...BASE_PROPS,
      playerId: 4, // Diana
    };
    
    rerender(<SelectDirection {...lastPlayerProps} selectedDirection={() => {}} />);

    // Diana (turnOrder 4) should have:
    // Left: Charlie (turnOrder 3)
    // Right: Alice (turnOrder 1) - wrap around
    expect(screen.getByText("Charlie")).toBeTruthy(); // Left side
    expect(screen.getByText("Alice")).toBeTruthy();   // Right side
  });

  test("handles edge case with only 2 players", () => {
    const twoPlayersProps = {
      playerId: 1,
      players: [
        { id: 1, name: "Player1", avatar: 1, turnOrder: 1, secrets: [] },
        { id: 2, name: "Player2", avatar: 2, turnOrder: 2, secrets: [] },
      ],
      text: "Choose direction",
    };

    render(<SelectDirection {...twoPlayersProps} selectedDirection={() => {}} />);

    // Player1 should see Player2 on both sides since there are only 2 players
    // Use getAllByText to handle multiple instances
    const player2Elements = screen.getAllByText("Player2");
    expect(player2Elements).toHaveLength(2); // Should appear twice (left and right)
    
    // Verify both direction labels are present
    expect(screen.getByText("LEFT")).toBeTruthy();
    expect(screen.getByText("RIGHT")).toBeTruthy();
  });
});