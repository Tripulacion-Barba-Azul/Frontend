// SyncOrchestrator.test.jsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// --- Mocks for all child sync modules to capture props ---
let lastBoardProps = null;
let lastDeckProps = null;
let lastDiscardProps = null;
let lastOwnCardsProps = null;
let lastViewMyCardsProps = null;
let lastViewMySecretsProps = null;

const BoardSyncMock = vi.fn((props) => {
  lastBoardProps = props;
  return <div data-testid="BoardSyncMock" />;
});
const RegularDeckSyncMock = vi.fn((props) => {
  lastDeckProps = props;
  return <div data-testid="RegularDeckSyncMock" />;
});
const DiscardPileSyncMock = vi.fn((props) => {
  lastDiscardProps = props;
  return <div data-testid="DiscardPileSyncMock" />;
});
const OwnCardsSyncMock = vi.fn((props) => {
  lastOwnCardsProps = props;
  return <div data-testid="OwnCardsSyncMock" />;
});
const ViewMyCardsSyncMock = vi.fn((props) => {
  lastViewMyCardsProps = props;
  return <div data-testid="ViewMyCardsSyncMock" />;
});
const ViewMySecretsSyncMock = vi.fn((props) => {
  lastViewMySecretsProps = props;
  return <div data-testid="ViewMySecretsSyncMock" />;
});

// The paths below must match the imports inside SyncOrchestrator.jsx
vi.mock("./Board/BoardSync.jsx", () => ({ default: (p) => BoardSyncMock(p) }));
vi.mock("./RegularDeck/RegularDeckSync.jsx", () => ({
  default: (p) => RegularDeckSyncMock(p),
}));
vi.mock("./DiscardPile/DiscardPileSync.jsx", () => ({
  default: (p) => DiscardPileSyncMock(p),
}));
vi.mock("./OwnCards/OwnCardsSync.jsx", () => ({
  default: (p) => OwnCardsSyncMock(p),
}));
vi.mock("./ViewMySecrets/ViewMySecretsSync.jsx", () => ({
  default: (p) => ViewMySecretsSyncMock(p),
}));
vi.mock("./ViewMyCards/ViewMyCardsSync.jsx", () => ({
  default: (p) => ViewMyCardsSyncMock(p),
}));

// Import after mocks
import SyncOrchestrator from "./SyncOrchestrator.jsx";

beforeEach(() => {
  cleanup();
  lastBoardProps = lastDeckProps = lastDiscardProps = lastOwnCardsProps = null;
  lastViewMyCardsProps = lastViewMySecretsProps = null;

  BoardSyncMock.mockClear();
  RegularDeckSyncMock.mockClear();
  DiscardPileSyncMock.mockClear();
  OwnCardsSyncMock.mockClear();
  ViewMyCardsSyncMock.mockClear();
  ViewMySecretsSyncMock.mockClear();
});

// --- Helpers to craft server data ---
function makePlayers() {
  return [
    {
      playerName: "Alice",
      avatar: "default",
      playerID: 1,
      orderNumber: 1,
      role: "murderer",
      isTurn: true,
    },
    {
      playerName: "Bob",
      avatar: "default",
      playerID: 2,
      orderNumber: 2,
      role: "detective",
      isTurn: false,
    },
    {
      playerName: "Carol",
      avatar: "default",
      playerID: 3,
      orderNumber: 3,
      role: "detective",
      isTurn: false,
    },
  ];
}
function makeCards() {
  return [
    // in deck
    {
      cardID: "C-1",
      cardOwnerID: null,
      cardName: "detective_poirot",
      spriteId: 7,
      isInDeck: true,
      isInDiscard: false,
      isInDiscardTop: false,
      faceUp: false,
    },
    // in hand (Alice)
    {
      cardID: "C-2",
      cardOwnerID: 1,
      cardName: "detective_marple",
      spriteId: 8,
      isInDeck: false,
      isInDiscard: false,
      isInDiscardTop: false,
      faceUp: false,
    },
    // in discard (top)
    {
      cardID: "C-3",
      cardOwnerID: null,
      cardName: "instant_notsofast",
      spriteId: 16,
      isInDeck: false,
      isInDiscard: true,
      isInDiscardTop: true,
      faceUp: true,
    },
  ];
}
function makeSecrets() {
  return [
    {
      secretID: 1000,
      secretName: "murderer",
      revealed: false,
      secretOwnerID: 2,
    },
    {
      secretID: 1001,
      secretName: "accomplice",
      revealed: true,
      secretOwnerID: 2,
    },
    {
      secretID: 1002,
      secretName: "regular",
      revealed: false,
      secretOwnerID: 3,
    },
  ];
}

describe("SyncOrchestrator", () => {
  it("renders all sync layers and wires props through correctly", () => {
    const serverPlayers = makePlayers();
    const serverCards = makeCards();
    const serverSecrets = makeSecrets();
    const CURRENT_PLAYER_ID = 1;

    const { container } = render(
      <SyncOrchestrator
        serverPlayers={serverPlayers}
        serverCards={serverCards}
        serverSecrets={serverSecrets}
        currentPlayerId={CURRENT_PLAYER_ID}
      />
    );

    // Root container classes (layout envelope)
    expect(container.firstChild).toHaveClass(
      "relative",
      "w-full",
      "h-screen",
      "overflow-hidden"
    );

    // Overlay wrapper should exist (absolute inset-0 pointer-events-none)
    // We identify it as the parent of the sub-sync mocks (the first div inside root after BoardSync)
    expect(screen.getByTestId("RegularDeckSyncMock").parentElement).toHaveClass(
      "absolute",
      "inset-0",
      "pointer-events-none"
    );

    // BoardSync is rendered with all four props
    expect(BoardSyncMock).toHaveBeenCalledTimes(1);
    expect(lastBoardProps.serverPlayers).toBe(serverPlayers);
    expect(lastBoardProps.serverCards).toBe(serverCards);
    expect(lastBoardProps.serverSecrets).toBe(serverSecrets);
    expect(lastBoardProps.currentPlayerId).toBe(CURRENT_PLAYER_ID);

    // RegularDeckSync gets serverCards
    expect(RegularDeckSyncMock).toHaveBeenCalledTimes(1);
    expect(lastDeckProps.serverCards).toBe(serverCards);

    // DiscardPileSync gets serverCards
    expect(DiscardPileSyncMock).toHaveBeenCalledTimes(1);
    expect(lastDiscardProps.serverCards).toBe(serverCards);

    // OwnCardsSync gets serverCards + currentPlayerId
    expect(OwnCardsSyncMock).toHaveBeenCalledTimes(1);
    expect(lastOwnCardsProps.serverCards).toBe(serverCards);
    expect(lastOwnCardsProps.currentPlayerId).toBe(CURRENT_PLAYER_ID);

    // ViewMyCardsSync gets serverCards + currentPlayerId + anchorClass
    expect(ViewMyCardsSyncMock).toHaveBeenCalledTimes(1);
    expect(lastViewMyCardsProps.serverCards).toBe(serverCards);
    expect(lastViewMyCardsProps.currentPlayerId).toBe(CURRENT_PLAYER_ID);
    expect(typeof lastViewMyCardsProps.anchorClass).toBe("string");
    expect(lastViewMyCardsProps.anchorClass).toMatch(/fixed .*bottom/i);

    // ViewMySecretsSync gets allSecrets + playerId + anchorClass
    expect(ViewMySecretsSyncMock).toHaveBeenCalledTimes(1);
    expect(lastViewMySecretsProps.allSecrets).toBe(serverSecrets);
    expect(lastViewMySecretsProps.playerId).toBe(CURRENT_PLAYER_ID);
    expect(typeof lastViewMySecretsProps.anchorClass).toBe("string");
    expect(lastViewMySecretsProps.anchorClass).toMatch(/fixed .*bottom/i);

    // And all mock components are actually present in the DOM
    expect(screen.getByTestId("BoardSyncMock")).toBeInTheDocument();
    expect(screen.getByTestId("RegularDeckSyncMock")).toBeInTheDocument();
    expect(screen.getByTestId("DiscardPileSyncMock")).toBeInTheDocument();
    expect(screen.getByTestId("OwnCardsSyncMock")).toBeInTheDocument();
    expect(screen.getByTestId("ViewMyCardsSyncMock")).toBeInTheDocument();
    expect(screen.getByTestId("ViewMySecretsSyncMock")).toBeInTheDocument();
  });

  it("re-renders children when upstream props change (smoke)", () => {
    const CURRENT_PLAYER_ID = 1;
    const { rerender } = render(
      <SyncOrchestrator
        serverPlayers={makePlayers()}
        serverCards={makeCards()}
        serverSecrets={makeSecrets()}
        currentPlayerId={CURRENT_PLAYER_ID}
      />
    );

    // Change input arrays (new references)
    const newPlayers = makePlayers().map((p, i) => ({ ...p, isTurn: i === 1 })); // Bob's turn
    const newCards = [
      ...makeCards(),
      {
        cardID: "C-99",
        cardOwnerID: 1,
        cardName: "detective_poirot",
        spriteId: 7,
        isInDeck: false,
        isInDiscard: false,
        isInDiscardTop: false,
        faceUp: false,
      },
    ];
    const newSecrets = [
      ...makeSecrets(),
      {
        secretID: 2000,
        secretName: "murderer",
        revealed: true,
        secretOwnerID: 2,
      },
    ];

    rerender(
      <SyncOrchestrator
        serverPlayers={newPlayers}
        serverCards={newCards}
        serverSecrets={newSecrets}
        currentPlayerId={CURRENT_PLAYER_ID}
      />
    );

    // Ensure mocks were invoked again (new props propagated)
    expect(BoardSyncMock).toHaveBeenCalledTimes(2);
    expect(RegularDeckSyncMock).toHaveBeenCalledTimes(2);
    expect(DiscardPileSyncMock).toHaveBeenCalledTimes(2);
    expect(OwnCardsSyncMock).toHaveBeenCalledTimes(2);
    expect(ViewMyCardsSyncMock).toHaveBeenCalledTimes(2);
    expect(ViewMySecretsSyncMock).toHaveBeenCalledTimes(2);

    // And last captured props correspond to the new references
    expect(lastBoardProps.serverPlayers).toBe(newPlayers);
    expect(lastDeckProps.serverCards).toBe(newCards);
    expect(lastDiscardProps.serverCards).toBe(newCards);
    expect(lastOwnCardsProps.serverCards).toBe(newCards);
    expect(lastViewMyCardsProps.serverCards).toBe(newCards);
    expect(lastViewMySecretsProps.allSecrets).toBe(newSecrets);
  });
});
