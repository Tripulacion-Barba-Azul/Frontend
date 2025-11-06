import React from "react";
import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import SelectPlayer from "./SelectPlayer";

// Silence CSS import noise
vi.mock("./SelectPlayer.css", () => ({}));

// Mock avatar map used by the component
vi.mock("../../../../../utils/generalMaps", () => ({
  AVATAR_MAP: {
    1: "/a1.png",
    2: "/a2.png",
    3: "/a3.png",
  },
}));

afterEach(cleanup);

const PLAYERS = [
  {
    id: 1,
    name: "You",
    avatar: 1,
    socialDisgrace: false,
    turnOrder: 1,
    cardCount: 3,
  },
  {
    id: 2,
    name: "Alice",
    avatar: 2,
    socialDisgrace: false,
    turnOrder: 2,
    cardCount: 4,
  },
  {
    id: 3,
    name: "Bob",
    avatar: 3,
    socialDisgrace: false,
    turnOrder: 3,
    cardCount: 5,
  },
];

const BASE_PROPS = {
  actualPlayerId: 1,
  players: PLAYERS,
  text: "Choose a player",
};

// Helper: find the .selectplayer-item container by the displayed name
function getItemContainerByDisplayedName(displayedName) {
  const label = screen.getByText(displayedName);
  // The label is inside the item; we climb to the container
  const container = label.closest(".selectplayer-item");
  if (!container) throw new Error("Container not found for " + displayedName);
  return container;
}

describe("SelectPlayer", () => {
  test("renders heading and all players", () => {
    render(<SelectPlayer {...BASE_PROPS} selectedPlayerId={() => {}} />);

    // Heading
    const heading = screen.getByRole("heading", { name: /choose a player/i });
    expect(heading).toBeTruthy();

    // Players
    expect(screen.getByText("You (you)")).toBeTruthy();
    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();
  });

  test("confirm is disabled until a player is selected, then calls callback with chosen id", () => {
    const onSelect = vi.fn();
    render(<SelectPlayer {...BASE_PROPS} selectedPlayerId={onSelect} />);

    const confirmBtn = screen.getByRole("button", { name: /confirm/i });
    expect(confirmBtn).toBeDisabled();

    // Click on Alice
    fireEvent.click(screen.getByText("Alice"));
    expect(confirmBtn).not.toBeDisabled();

    fireEvent.click(confirmBtn);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  test("selection toggles 'selected' class on the correct item container", () => {
    render(<SelectPlayer {...BASE_PROPS} selectedPlayerId={() => {}} />);

    const youContainer = getItemContainerByDisplayedName("You (you)");
    const aliceContainer = getItemContainerByDisplayedName("Alice");
    const bobContainer = getItemContainerByDisplayedName("Bob");

    // Initially none selected
    expect(youContainer.className).not.toContain("selected");
    expect(aliceContainer.className).not.toContain("selected");
    expect(bobContainer.className).not.toContain("selected");

    // Select Bob
    fireEvent.click(screen.getByText("Bob"));
    expect(bobContainer.className).toContain("selected");
    expect(aliceContainer.className).not.toContain("selected");
    expect(youContainer.className).not.toContain("selected");

    // Switch to Alice
    fireEvent.click(screen.getByText("Alice"));
    expect(aliceContainer.className).toContain("selected");
    expect(bobContainer.className).not.toContain("selected");
  });

  test("avatar images use AVATAR_MAP (src)", () => {
    render(<SelectPlayer {...BASE_PROPS} selectedPlayerId={() => {}} />);

    const imgAlice = screen.getByAltText("Alice");
    const imgYou = screen.getByAltText("You");

    // JSDOM makes absolute URLs; just assert it contains the path
    expect(imgAlice.getAttribute("src")).toContain("/a2.png");
    expect(imgYou.getAttribute("src")).toContain("/a1.png");
  });

  test("body overflow is hidden on mount and restored on unmount", () => {
    const { unmount } = render(
      <SelectPlayer {...BASE_PROPS} selectedPlayerId={() => {}} />
    );

    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  // --- NEW TESTS FOR goBack FEATURE ---

  test("does not render Go Back button when goBack is not provided", () => {
    render(<SelectPlayer {...BASE_PROPS} selectedPlayerId={() => {}} />);
    const backBtn = screen.queryByRole("button", { name: /go back/i });
    expect(backBtn).toBeNull();
  });

  test("renders Go Back button when goBack is provided and calls it on click", () => {
    const onBack = vi.fn();
    render(
      <SelectPlayer
        {...BASE_PROPS}
        selectedPlayerId={() => {}}
        goBack={onBack}
      />
    );

    const backBtn = screen.getByRole("button", { name: /go back/i });
    expect(backBtn).toBeTruthy();

    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  test("confirm still works with goBack present and does not call goBack", () => {
    const onBack = vi.fn();
    const onSelect = vi.fn();

    render(
      <SelectPlayer
        {...BASE_PROPS}
        selectedPlayerId={onSelect}
        goBack={onBack}
      />
    );

    const confirmBtn = screen.getByRole("button", { name: /confirm/i });
    expect(confirmBtn).toBeDisabled();

    // Select Alice
    fireEvent.click(screen.getByText("Alice"));
    expect(confirmBtn).not.toBeDisabled();

    // Confirm selection
    fireEvent.click(confirmBtn);

    // selectedPlayerId should be called; goBack should not
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(2);
    expect(onBack).not.toHaveBeenCalled();
  });
});
