// BoardSync.test.jsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

// --- Capturador de props pasadas al Board real ---
let lastBoardProps = null;
const BoardMock = vi.fn((props) => {
  lastBoardProps = props;
  return <div data-testid="BoardMock" />;
});

// Moqueamos el Board usado por BoardSync (ajustar ruta si cambia)
vi.mock("../../Board/Board", () => ({
  default: (props) => BoardMock(props),
}));

// Import después del mock
import BoardSync from "./BoardSync.jsx";

beforeEach(() => {
  cleanup();
  lastBoardProps = null;
  BoardMock.mockClear();
});

function mkPlayers() {
  return [
    {
      playerName: "Alice",
      avatar: "default",
      playerID: 1,
      orderNumber: 1,
      role: "Asesino",
      isTurn: true,
    },
    {
      playerName: "Bob",
      avatar: "default",
      playerID: 2,
      orderNumber: 3,
      role: "Detective",
      isTurn: false,
    },
    {
      playerName: "Carol",
      avatar: "default",
      playerID: 3,
      orderNumber: 2,
      role: "Detective",
      isTurn: false,
    },
  ];
}

function mkCards(ownerCounts) {
  // ownerCounts: Map<number, number> o { [pid]: count }
  const entries =
    ownerCounts instanceof Map
      ? ownerCounts
      : Object.entries(ownerCounts).map(([k, v]) => [Number(k), v]);
  let uid = 1;
  const out = [];
  for (const [pid, n] of entries) {
    for (let i = 0; i < n; i++) {
      out.push({
        cardID: `C${pid}-${uid++}`,
        cardOwnerID: pid,
        cardName: "detective_poirot",
        cardType: "regular",
        faceUp: false,
      });
    }
  }
  return out;
}

function mkSecrets(list) {
  // list: array de { owner, name, revealed }
  let sid = 1000;
  return list.map((x) => ({
    secretID: sid++,
    secretOwnerID: x.owner,
    secretName: x.name,
    revealed: !!x.revealed,
  }));
}

describe("BoardSync", () => {
  it("does not render Board if fewer than 2 valid players", () => {
    const onePlayer = [
      {
        playerName: "Solo",
        avatar: "default",
        playerID: 1,
        orderNumber: 1,
        role: "Nothing",
        isTurn: true,
      },
    ];
    render(
      <BoardSync
        serverPlayers={onePlayer}
        serverCards={[]}
        serverSecrets={[]}
        currentPlayerId={1}
      />
    );
    expect(BoardMock).not.toHaveBeenCalled();
    expect(lastBoardProps).toBeNull();
  });

  it("passes players ordered by orderNumber and hides numCards/secrets for the current player", () => {
    const serverPlayers = mkPlayers();
    const serverCards = mkCards({ 1: 4, 2: 2, 3: 5 });
    const serverSecrets = mkSecrets([
      { owner: 2, name: "murderer", revealed: false },
      { owner: 2, name: "accomplice", revealed: true },
      { owner: 3, name: "regular", revealed: false },
    ]);

    render(
      <BoardSync
        serverPlayers={serverPlayers}
        serverCards={serverCards}
        serverSecrets={serverSecrets}
        currentPlayerId={1}
      />
    );

    expect(BoardMock).toHaveBeenCalledTimes(1);
    const { players } = lastBoardProps;
    expect(Array.isArray(players)).toBe(true);
    // Orden debe ser [1,2,3] por orderNumber
    expect(players.map((p) => p.order)).toEqual([1, 2, 3]);

    // Actual player (id 1) → actualPlayer true, numCards y secrets ocultos (null)
    const p1 = players.find((p) => p.order === 1);
    expect(p1.name).toBe("Alice");
    expect(p1.actualPlayer).toBe(true);
    expect(p1.turn).toBe(true);
    expect(p1.numCards).toBeNull();
    expect(p1.secrets).toBeNull();

    // Bob → order 3 (en entrada), pero luego del sort queda último (3)
    const pBob = players.find((p) => p.name === "Bob");
    expect(pBob.order).toBe(3);
    expect(pBob.actualPlayer).toBe(false);
    // numCards según conteo de serverCards
    expect(pBob.numCards).toBe(2);
    // secrets según agrupación
    expect(Array.isArray(pBob.secrets)).toBe(true);
    expect(pBob.secrets.length).toBe(2);

    // Carol
    const pCarol = players.find((p) => p.name === "Carol");
    expect(pCarol.order).toBe(2);
    expect(pCarol.numCards).toBe(5);
    expect(Array.isArray(pCarol.secrets)).toBe(true);
    expect(pCarol.secrets.length).toBe(1);
  });

  it("updates when serverCards changes (recomputes numCards)", () => {
    const serverPlayers = mkPlayers();
    let serverCards = mkCards({ 1: 0, 2: 1, 3: 1 });
    const serverSecrets = [];

    const { rerender } = render(
      <BoardSync
        serverPlayers={serverPlayers}
        serverCards={serverCards}
        serverSecrets={serverSecrets}
        currentPlayerId={1}
      />
    );

    // Estado inicial
    let players = lastBoardProps.players;
    expect(players.find((p) => p.name === "Bob").numCards).toBe(1);
    expect(players.find((p) => p.name === "Carol").numCards).toBe(1);

    // Cambiamos conteos: Bob 4, Carol 0
    serverCards = mkCards({ 1: 0, 2: 4, 3: 0 });
    rerender(
      <BoardSync
        serverPlayers={serverPlayers}
        serverCards={serverCards}
        serverSecrets={serverSecrets}
        currentPlayerId={1}
      />
    );

    players = lastBoardProps.players;
    expect(players.find((p) => p.name === "Bob").numCards).toBe(4);
    expect(players.find((p) => p.name === "Carol").numCards).toBe(0);
  });

  it("updates when serverSecrets changes (groups by owner)", () => {
    const serverPlayers = mkPlayers();
    const serverCards = mkCards({ 2: 2, 3: 1 }); // irrelevante en este test
    let serverSecrets = mkSecrets([
      { owner: 2, name: "murderer", revealed: false },
    ]);

    const { rerender } = render(
      <BoardSync
        serverPlayers={serverPlayers}
        serverCards={serverCards}
        serverSecrets={serverSecrets}
        currentPlayerId={1}
      />
    );

    let players = lastBoardProps.players;
    expect(players.find((p) => p.name === "Bob").secrets?.length).toBe(1);

    // Agrego más secretos a Bob y uno a Carol
    serverSecrets = mkSecrets([
      { owner: 2, name: "murderer", revealed: false },
      { owner: 2, name: "accomplice", revealed: true },
      { owner: 3, name: "regular", revealed: false },
    ]);

    rerender(
      <BoardSync
        serverPlayers={serverPlayers}
        serverCards={serverCards}
        serverSecrets={serverSecrets}
        currentPlayerId={1}
      />
    );

    players = lastBoardProps.players;
    expect(players.find((p) => p.name === "Bob").secrets?.length).toBe(2);
    expect(players.find((p) => p.name === "Carol").secrets?.length).toBe(1);
  });

  it("respects isTurn and preserves order when turn changes", () => {
    // Simula la rotación de turnos como en ExamplePageBoard, pero sin intervalos
    const serverPlayers = mkPlayers();
    const cards = mkCards({ 2: 1, 3: 1 });
    const secrets = [];

    const { rerender } = render(
      <BoardSync
        serverPlayers={serverPlayers}
        serverCards={cards}
        serverSecrets={secrets}
        currentPlayerId={1}
      />
    );

    // Turno inicial: Alice
    let players = lastBoardProps.players;
    expect(players.map((p) => p.order)).toEqual([1, 2, 3]);
    expect(players.find((p) => p.order === 1).turn).toBe(true);

    // Avanzo turno a Carol
    const nextPlayers = serverPlayers.map((p) => ({
      ...p,
      isTurn: p.playerID === 3,
    }));
    rerender(
      <BoardSync
        serverPlayers={nextPlayers}
        serverCards={cards}
        serverSecrets={secrets}
        currentPlayerId={1}
      />
    );

    players = lastBoardProps.players;
    // El orden no cambia
    expect(players.map((p) => p.order)).toEqual([1, 2, 3]);
    // Pero el flag de turno sí
    expect(players.find((p) => p.order === 2).turn).toBe(true); // Carol tiene order 2
  });
});
