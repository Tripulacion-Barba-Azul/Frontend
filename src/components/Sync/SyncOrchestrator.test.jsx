import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

let lastBoardProps = null;
let lastDeckProps = null;
let lastDiscardProps = null;
let lastOwnCardsProps = null;
let lastViewMyCardsProps = null;
let lastViewMySecretsProps = null;

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

import SyncOrchestrator from "./SyncOrchestrator.jsx";

function makePlayers() {
  return [
    {
      playerName: "Alice",
      avatar: "default",
      playerID: 1,
      orderNumber: 1,
      role: "detective",
      turnStatus: "playing",
    },
    {
      playerName: "Bob",
      avatar: "default",
      playerID: 2,
      orderNumber: 2,
      role: "murderer",
      turnStatus: "waiting",
    },
    {
      playerName: "Carol",
      avatar: "default",
      playerID: 3,
      orderNumber: 3,
      role: "detective",
      turnStatus: "waiting",
    },
  ];
}
function makeCards() {
  return [
    {
      cardID: "C-1",
      cardOwnerID: null,
      cardName: "detective_poirot",
      isInDeck: true,
      isInDiscardPile: false,
      isInDiscardTop: false,
    },
    {
      cardID: "C-2",
      cardOwnerID: 1,
      cardName: "detective_marple",
      isInDeck: false,
      isInDiscardPile: false,
      isInDiscardTop: false,
    },
    {
      cardID: "C-3",
      cardOwnerID: null,
      cardName: "instant_notsofast",
      isInDeck: false,
      isInDiscardPile: true,
      isInDiscardTop: true,
    },
    {
      cardID: "C-4",
      cardOwnerID: null,
      cardName: "event_cardsonthetable",
      isInDeck: false,
      isInDiscardPile: true,
      isInDiscardTop: false,
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

beforeEach(() => {
  cleanup();
  lastBoardProps = lastDeckProps = lastDiscardProps = lastOwnCardsProps = null;
  lastViewMyCardsProps = lastViewMySecretsProps = null;
  BoardMock.mockClear();
  RegularDeckMock.mockClear();
  DiscardPileMock.mockClear();
  OwnCardsMock.mockClear();
  ViewMyCardsMock.mockClear();
  ViewMySecretsMock.mockClear();
});

describe("SyncOrchestrator (integration with child props)", () => {
  it("computes and passes the correct derived props to children", () => {
    const serverPlayers = makePlayers();
    const serverCards = makeCards();
    const serverSecrets = makeSecrets();
    const CURRENT_PLAYER_ID = 1;

    render(
      <SyncOrchestrator
        serverPlayers={serverPlayers}
        serverCards={serverCards}
        serverSecrets={serverSecrets}
        currentPlayerId={CURRENT_PLAYER_ID}
      />
    );

    expect(BoardMock).toHaveBeenCalledTimes(1);
    expect(Array.isArray(lastBoardProps.players)).toBe(true);
    expect(lastBoardProps.players).toHaveLength(3);

    const alice = lastBoardProps.players[0];
    expect(alice).toMatchObject({
      name: "Alice",
      order: 1,
      actualPlayer: true,
      numCards: null,
      secrets: null,
    });

    const bob = lastBoardProps.players[1];
    expect(bob).toMatchObject({
      name: "Bob",
      order: 2,
      actualPlayer: false,
      numCards: 0,
      secrets: [
        { secretName: "murderer", revealed: false },
        { secretName: "accomplice", revealed: true },
      ],
    });

    expect(RegularDeckMock).toHaveBeenCalledTimes(1);
    expect(lastDeckProps.number).toBe(1);

    expect(DiscardPileMock).toHaveBeenCalledTimes(1);
    expect(lastDiscardProps.number).toBe(2);
    expect(lastDiscardProps.card).toEqual({
      cardID: "C-3",
      cardName: "instant_notsofast",
      cardOwnerID: null,
      isInDeck: false,
      isInDiscardPile: true,
      isInDiscardTop: true,
    });

    expect(OwnCardsMock).toHaveBeenCalledTimes(1);
    expect(lastOwnCardsProps.cards.map((c) => c.cardID)).toEqual(["C-2"]);

    expect(ViewMyCardsMock).toHaveBeenCalledTimes(1);
    expect(lastViewMyCardsProps.cards.map((c) => c.cardID)).toEqual(["C-2"]);

    expect(ViewMySecretsMock).toHaveBeenCalledTimes(1);
    expect(lastViewMySecretsProps.secrets).toEqual([]);
  });

  it("updates children when upstream props change (smoke)", () => {
    const CURRENT_PLAYER_ID = 1;
    const { rerender } = render(
      <SyncOrchestrator
        serverPlayers={makePlayers()}
        serverCards={makeCards()}
        serverSecrets={makeSecrets()}
        currentPlayerId={CURRENT_PLAYER_ID}
      />
    );

    const newCards = [
      ...makeCards(),
      {
        cardID: "C-99",
        cardOwnerID: 1,
        cardName: "detective_poirot",
        isInDeck: false,
        isInDiscardPile: false,
        isInDiscardTop: false,
      },
    ];
    const newSecrets = [
      ...makeSecrets(),
      {
        secretID: 2000,
        secretName: "murderer",
        revealed: true,
        secretOwnerID: 1,
      },
    ];

    rerender(
      <SyncOrchestrator
        serverPlayers={makePlayers()}
        serverCards={newCards}
        serverSecrets={newSecrets}
        currentPlayerId={CURRENT_PLAYER_ID}
      />
    );

    expect(BoardMock).toHaveBeenCalledTimes(2);
    expect(RegularDeckMock).toHaveBeenCalledTimes(2);
    expect(DiscardPileMock).toHaveBeenCalledTimes(2);
    expect(OwnCardsMock).toHaveBeenCalledTimes(2);
    expect(ViewMyCardsMock).toHaveBeenCalledTimes(2);
    expect(ViewMySecretsMock).toHaveBeenCalledTimes(2);

    expect(lastOwnCardsProps.cards.map((c) => c.cardID).sort()).toEqual(
      ["C-2", "C-99"].sort()
    );

    expect(lastViewMySecretsProps.secrets).toEqual([
      {
        secretID: 2000,
        secretName: "murderer",
        revealed: true,
        secretOwnerID: 1,
      },
    ]);
  });
});
