// src/Sync/SyncOrchestrator.test.jsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

// Capture last props passed to each child
let lastBoardProps = null;
let lastDeckProps = null;
let lastDiscardProps = null;
let lastOwnCardsProps = null;
let lastViewMyCardsProps = null;
let lastViewMySecretsProps = null;
let lastDrawDraftProps = null;

// Component mocks
const BoardMock = vi.fn((props) => {
  lastBoardProps = props;
  return <div data-testid="BoardMock" />;
});
const RegularDeckMock = vi.fn((props) => {
  lastDeckProps = props;
  return <div data-testid="RegularDeckMock" />;
});
const DiscardPileMock = vi.fn((props) => {
  lastDiscardProps = props;
  return <div data-testid="DiscardPileMock" />;
});
const OwnCardsMock = vi.fn((props) => {
  lastOwnCardsProps = props;
  return <div data-testid="OwnCardsMock" />;
});
const ViewMyCardsMock = vi.fn((props) => {
  lastViewMyCardsProps = props;
  return <div data-testid="ViewMyCardsMock" />;
});
const ViewMySecretsMock = vi.fn((props) => {
  lastViewMySecretsProps = props;
  return <div data-testid="ViewMySecretsMock" />;
});
const DrawDraftCardButtonMock = vi.fn((props) => {
  lastDrawDraftProps = props;
  return <div data-testid="DrawDraftCardButtonMock" />;
});
const BackToHomeButtonMock = vi.fn(() => {
  return <div data-testid="BackToHomeButtonMock" />;
});

// Wire mocks to the same import paths used by SyncOrchestrator.jsx
vi.mock("../Board/Board.jsx", () => ({ default: (p) => BoardMock(p) }));
vi.mock("../RegularDeck/RegularDeck.jsx", () => ({
  default: (p) => RegularDeckMock(p),
}));
vi.mock("../DiscardPile/DiscardPile.jsx", () => ({
  default: (p) => DiscardPileMock(p),
}));
vi.mock("../OwnCards/OwnCards.jsx", () => ({
  default: (p) => OwnCardsMock(p),
}));
vi.mock("../ViewMyCards/ViewMyCards.jsx", () => ({
  default: (p) => ViewMyCardsMock(p),
}));
vi.mock("../ViewMySecrets/ViewMySecrets.jsx", () => ({
  default: (p) => ViewMySecretsMock(p),
}));
vi.mock("../DrawDraftCardButton/DrawDraftCardButton.jsx", () => ({
  default: (p) => DrawDraftCardButtonMock(p),
}));

// IMPORTANT: path matches the component import in SyncOrchestrator.jsx
vi.mock("./BackToHomeButton/BackToHomeButton.jsx", () => ({
  default: () => BackToHomeButtonMock(),
}));

import SyncOrchestrator from "./SyncOrchestrator.jsx";

// --- Test data helpers
function makePublicPlayers() {
  return [
    {
      id: 1,
      name: "Alice",
      avatar: "default",
      turnOrder: 1,
      turnStatus: "playing",
      cardCount: 3,
      secrets: [{ id: 501, name: "murderer", revealed: true }],
      sets: [],
    },
    {
      id: 2,
      name: "Bob",
      avatar: "default",
      turnOrder: 2,
      turnStatus: "waiting",
      cardCount: 0,
      secrets: [
        { id: 502, name: "murderer", revealed: false },
        { id: 503, name: "accomplice", revealed: true },
      ],
      sets: [],
    },
    {
      id: 3,
      name: "Carol",
      avatar: "default",
      turnOrder: 3,
      turnStatus: "waiting",
      cardCount: 1,
      secrets: [],
      sets: [],
    },
  ];
}

function makePublicData() {
  return {
    actionStatus: "unblocked",
    gameStatus: "inProgress",
    regularDeckCount: 10,
    discardPileTop: { id: "C-3", name: "instant_notsofast" },
    draftCards: [], // starts empty
    discardPileCount: 2,
    players: makePublicPlayers(),
  };
}

function makePrivateData() {
  return {
    role: "detective",
    ally: null,
    cards: [{ id: "C-2", name: "detective_marple" }],
    secrets: [],
  };
}

beforeEach(() => {
  cleanup();
  lastBoardProps = lastDeckProps = lastDiscardProps = lastOwnCardsProps = null;
  lastViewMyCardsProps = lastViewMySecretsProps = lastDrawDraftProps = null;

  BoardMock.mockClear();
  RegularDeckMock.mockClear();
  DiscardPileMock.mockClear();
  OwnCardsMock.mockClear();
  ViewMyCardsMock.mockClear();
  ViewMySecretsMock.mockClear();
  DrawDraftCardButtonMock.mockClear();
  BackToHomeButtonMock.mockClear();
});

describe("SyncOrchestrator (children props & back button)", () => {
  it("passes correct props to all children and renders BackToHomeButton", () => {
    const CURRENT_PLAYER_ID = 1;
    const publicData = makePublicData();
    const privateData = makePrivateData();

    const { getByTestId } = render(
      <SyncOrchestrator
        publicData={publicData}
        privateData={privateData}
        currentPlayerId={CURRENT_PLAYER_ID}
      />
    );

    // Board
    expect(BoardMock).toHaveBeenCalledTimes(1);
    expect(Array.isArray(lastBoardProps.players)).toBe(true);
    expect(lastBoardProps.players).toHaveLength(3);
    expect(lastBoardProps.currentPlayerId).toBe(CURRENT_PLAYER_ID);
    expect(lastBoardProps.currentPlayerRole).toBe(privateData.role);
    expect(lastBoardProps.currentPlayerAlly).toBe(privateData.ally);

    // Regular deck
    expect(RegularDeckMock).toHaveBeenCalledTimes(1);
    expect(lastDeckProps.number).toBe(publicData.regularDeckCount);

    // Discard pile
    expect(DiscardPileMock).toHaveBeenCalledTimes(1);
    expect(lastDiscardProps.number).toBe(publicData.discardPileCount);
    expect(lastDiscardProps.card).toEqual(publicData.discardPileTop);

    // Own cards (turnStatus derived from CURRENT_PLAYER_ID in public players)
    expect(OwnCardsMock).toHaveBeenCalledTimes(1);
    expect(lastOwnCardsProps.cards).toEqual(privateData.cards);
    expect(lastOwnCardsProps.turnStatus).toBe("playing");

    // Quick views
    expect(ViewMyCardsMock).toHaveBeenCalledTimes(1);
    expect(lastViewMyCardsProps.cards).toEqual(privateData.cards);

    expect(ViewMySecretsMock).toHaveBeenCalledTimes(1);
    expect(lastViewMySecretsProps.secrets).toEqual(privateData.secrets);

    // DrawDraftCardButton
    expect(DrawDraftCardButtonMock).toHaveBeenCalledTimes(1);
    expect(lastDrawDraftProps.cards).toEqual(publicData.draftCards);
    expect(lastDrawDraftProps.turnStatus).toBe("playing");

    // NEW: Back to home button appears
    expect(getByTestId("BackToHomeButtonMock")).toBeInTheDocument();
  });

  it("updates children when upstream props change", () => {
    const CURRENT_PLAYER_ID = 1;

    const initialPublic = makePublicData();
    const initialPrivate = makePrivateData();

    const { rerender } = render(
      <SyncOrchestrator
        publicData={initialPublic}
        privateData={initialPrivate}
        currentPlayerId={CURRENT_PLAYER_ID}
      />
    );

    const updatedPublic = {
      ...initialPublic,
      regularDeckCount: 9,
      discardPileCount: 3,
      discardPileTop: { id: "C-99", name: "event_cardsonthetable" },
      draftCards: [
        { id: "D-1", name: "instant_notsofast" },
        { id: "D-2", name: "event_cardsonthetable" },
      ],
      players: initialPublic.players.map((p) =>
        p.id === CURRENT_PLAYER_ID ? { ...p, turnStatus: "discarding" } : p
      ),
    };

    const updatedPrivate = {
      ...initialPrivate,
      role: "murderer",
      ally: { id: 2, role: "accomplice" },
      cards: [
        ...initialPrivate.cards,
        { id: "C-77", name: "detective_poirot" },
      ],
      secrets: [{ id: 2000, name: "murderer", revealed: true }],
    };

    rerender(
      <SyncOrchestrator
        publicData={updatedPublic}
        privateData={updatedPrivate}
        currentPlayerId={CURRENT_PLAYER_ID}
      />
    );

    // Called twice after rerender
    expect(BoardMock).toHaveBeenCalledTimes(2);
    expect(RegularDeckMock).toHaveBeenCalledTimes(2);
    expect(DiscardPileMock).toHaveBeenCalledTimes(2);
    expect(OwnCardsMock).toHaveBeenCalledTimes(2);
    expect(ViewMyCardsMock).toHaveBeenCalledTimes(2);
    expect(ViewMySecretsMock).toHaveBeenCalledTimes(2);
    expect(DrawDraftCardButtonMock).toHaveBeenCalledTimes(2);
    expect(BackToHomeButtonMock).toHaveBeenCalledTimes(2);

    // Deck & discard updates
    expect(lastDeckProps.number).toBe(9);
    expect(lastDiscardProps.number).toBe(3);
    expect(lastDiscardProps.card).toEqual({
      id: "C-99",
      name: "event_cardsonthetable",
    });

    // Board role/ally
    expect(lastBoardProps.currentPlayerRole).toBe("murderer");
    expect(lastBoardProps.currentPlayerAlly).toEqual({
      id: 2,
      role: "accomplice",
    });

    // OwnCards & Quick views data
    expect(lastOwnCardsProps.cards.map((c) => c.id).sort()).toEqual(
      ["C-2", "C-77"].sort()
    );
    expect(lastOwnCardsProps.turnStatus).toBe("discarding");
    expect(lastViewMyCardsProps.cards.map((c) => c.id).sort()).toEqual(
      ["C-2", "C-77"].sort()
    );
    expect(lastViewMySecretsProps.secrets).toEqual([
      { id: 2000, name: "murderer", revealed: true },
    ]);

    // DrawDraftCardButton props after update
    expect(lastDrawDraftProps.cards).toEqual([
      { id: "D-1", name: "instant_notsofast" },
      { id: "D-2", name: "event_cardsonthetable" },
    ]);
    expect(lastDrawDraftProps.turnStatus).toBe("discarding");
  });
});
