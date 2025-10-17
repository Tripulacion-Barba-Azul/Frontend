import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from "@testing-library/react";
import EffectManager from "./EffectManager";

/* --------------------------- Router + child mocks --------------------------- */
// Mock useParams for gameId replacement in endpoints
vi.mock("react-router-dom", async () => {
  const mod = await vi.importActual("react-router-dom");
  return {
    ...mod,
    useParams: vi.fn(() => ({ gameId: "42" })),
  };
});

// Mock children to be interactive test doubles (no CSS, no portals)
vi.mock("../SelectPlayer/SelectPlayer", () => ({
  default: ({ text, players, selectedPlayerId }) => (
    <div data-testid="SelectPlayer">
      <div data-testid="sp-text">{text}</div>
      <div data-testid="sp-count">{players?.length ?? 0}</div>
      {/* Clickable labels to choose deterministically */}
      {players?.map((p) => (
        <button
          key={p.id}
          onClick={() => selectedPlayerId(p.id)}
          aria-label={`pick-player-${p.id}`}
        >
          {p.name}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("../SelectSet/SelectSet", () => ({
  default: ({ text, sets, selectedSetId, goBack }) => (
    <div data-testid="SelectSet">
      <div data-testid="ss-text">{text}</div>
      <div data-testid="ss-count">{sets?.length ?? 0}</div>
      {sets?.map((s) => (
        <button
          key={s.setId}
          onClick={() => selectedSetId(s.setId)}
          aria-label={`pick-set-${s.setId}`}
        >
          {s.setName}
        </button>
      ))}
      {goBack && (
        <button onClick={() => goBack()} aria-label="go-back-selectset">
          GoBack
        </button>
      )}
    </div>
  ),
}));

vi.mock("../SelectSecret/SelectSecret", () => ({
  default: ({
    text,
    secrets,
    revealed,
    selectedSecretId,
    goBack,
    playerId,
  }) => (
    <div
      data-testid="SelectSecret"
      data-revealed={String(revealed)}
      data-playerid={String(playerId)}
    >
      <div data-testid="sec-text">{text}</div>
      <div data-testid="sec-count">{secrets?.length ?? 0}</div>
      <div data-testid="sec-revealed">{String(revealed)}</div>
      <div data-testid="sec-player">{String(playerId)}</div>
      {secrets?.map((s) => (
        <button
          key={s.id}
          onClick={() => selectedSecretId(s.id)}
          aria-label={`pick-secret-${s.id}`}
        >
          secret-{s.id}
        </button>
      ))}
      {goBack && (
        <button onClick={() => goBack()} aria-label="go-back-selectsecret">
          GoBack
        </button>
      )}
    </div>
  ),
}));

vi.mock("../SelectDiscardPileCards/SelectDiscardPileCards", () => ({
  default: ({ text, cards, selectedCardId }) => (
    <div data-testid="SelectDiscardPileCards">
      <div data-testid="sdc-text">{text}</div>
      <div data-testid="sdc-count">{cards?.length ?? 0}</div>
      {cards?.map((c) => (
        <button
          key={c.id}
          onClick={() => selectedCardId(c.id)}
          aria-label={`pick-card-${c.id}`}
        >
          card-{c.id}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("../OrderDiscardPileCards/OrderDiscardPileCards", () => ({
  default: ({ text, cards, selectedCardsOrder }) => (
    <div data-testid="OrderDiscardPileCards">
      <div data-testid="odpc-text">{text}</div>
      <div data-testid="odpc-count">{cards?.length ?? 0}</div>
      <button
        onClick={() => selectedCardsOrder(cards?.map((c) => c.id) ?? [])}
        aria-label="confirm-order"
      >
        ConfirmOrder
      </button>
    </div>
  ),
}));

/* --------------------------- Shared fixtures --------------------------- */
const PUBLIC_DATA = {
  players: [
    {
      id: 1,
      name: "You",
      avatar: 1,
      socialDisgrace: false,
      turnOrder: 1,
      turnStatus: "playing",
      cardCount: 0,
      secrets: [
        { id: 100, revealed: true, name: "You are the murderer" },
        { id: 101, revealed: false, name: null },
      ],
      sets: [],
    },
    {
      id: 2,
      name: "Alice",
      avatar: 2,
      socialDisgrace: false,
      turnOrder: 2,
      turnStatus: "waiting",
      cardCount: 0,
      secrets: [
        { id: 200, revealed: true, name: "You are the murderer" },
        { id: 201, revealed: false, name: null },
      ],
      sets: [
        {
          setId: 202,
          setName: "Hercule Poirot",
          cards: [{ id: 3001, name: "Ariadne Oliver" }],
        },
      ],
    },
    {
      id: 3,
      name: "Bob",
      avatar: 3,
      socialDisgrace: false,
      turnOrder: 3,
      turnStatus: "drawing",
      cardCount: 0,
      secrets: [
        { id: 300, revealed: true, name: "Prankster" },
        { id: 301, revealed: false, name: null },
      ],
      sets: [],
    },
  ],
};

const PRIVATE_DATA = {
  secrets: [
    { id: 500, revealed: false, name: "You are the murderer" },
    { id: 501, revealed: true, name: "Prankster" },
  ],
};

const DISCARD_CARDS = [
  { id: 8001, name: "Hercule Poirot" },
  { id: 8002, name: "Blackmailed!" },
  { id: 8003, name: "Cards off the table" },
  { id: 8004, name: "Another Victim" },
  { id: 8005, name: "Social Faux Pas" },
];

/* --------------------------- Test helpers --------------------------- */
function createWs() {
  // Minimal object that EffectManager mutates: wsRef.onmessage = handler;
  return { onmessage: null };
}

async function waitHandlerReady(ws) {
  await waitFor(() => {
    expect(typeof ws.onmessage).toBe("function");
  });
}

function sendWs(ws, payload) {
  act(() => {
    ws.onmessage?.({ data: JSON.stringify(payload) });
  });
}

function getLastFetchArgs() {
  const [url, opts] = global.fetch.mock.calls.at(-1);
  return { url, opts, body: JSON.parse(opts.body) };
}

/* --------------------------- Test suite --------------------------- */
describe("EffectManager", () => {
  let ws;

  beforeEach(() => {
    ws = createWs();
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("ignores non-effect messages and renders nothing", async () => {
    render(
      <EffectManager
        publicData={PUBLIC_DATA}
        privateData={PRIVATE_DATA}
        actualPlayerId={1}
        wsRef={ws}
      />
    );
    await waitHandlerReady(ws);

    sendWs(ws, { event: "publicUpdate", payload: { x: 1 } });
    // No subcomponent should be visible (no step started)
    expect(screen.queryByTestId("SelectPlayer")).toBeNull();
    expect(screen.queryByTestId("SelectSecret")).toBeNull();
    expect(screen.queryByTestId("SelectSet")).toBeNull();
    expect(screen.queryByTestId("SelectDiscardPileCards")).toBeNull();
    expect(screen.queryByTestId("OrderDiscardPileCards")).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("selectAnyPlayer: shows SelectPlayer and POSTs selected player", async () => {
    render(
      <EffectManager
        publicData={PUBLIC_DATA}
        privateData={PRIVATE_DATA}
        actualPlayerId={1}
        wsRef={ws}
      />
    );
    await waitHandlerReady(ws);
    sendWs(ws, { event: "selectAnyPlayer" });

    // Step 1: SelectPlayer with all players
    const sp = await screen.findByTestId("SelectPlayer");
    expect(sp).toBeInTheDocument();
    expect(screen.getByTestId("sp-count").textContent).toBe(
      String(PUBLIC_DATA.players.length)
    );
    expect(screen.getByTestId("sp-text").textContent.toLowerCase()).toContain(
      "select any player"
    );

    // Pick Alice (id 2) -> triggers fetch
    fireEvent.click(screen.getByLabelText("pick-player-2"));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const { url, body } = getLastFetchArgs();
    expect(url).toBe("http://localhost:8000/play/42/actions/select-any-player");
    expect(body).toMatchObject({
      event: "selectAnyPlayer",
      playerId: 1,
      selectedPlayerId: 2,
    });
  });

  it("stealSet: SelectPlayer (except me) -> SelectSet -> POST; supports goBack to SelectPlayer", async () => {
    render(
      <EffectManager
        publicData={PUBLIC_DATA}
        privateData={PRIVATE_DATA}
        actualPlayerId={1}
        wsRef={ws}
      />
    );
    await waitHandlerReady(ws);
    sendWs(ws, { event: "stealSet" });

    // Step: SelectPlayer (playersExceptMe), so length = all - 1
    const sp = await screen.findByTestId("SelectPlayer");
    expect(sp).toBeInTheDocument();
    expect(screen.getByTestId("sp-count").textContent).toBe(
      String(PUBLIC_DATA.players.length - 1)
    );

    // Choose Alice (id 2)
    fireEvent.click(screen.getByLabelText("pick-player-2"));

    // Step: SelectSet for Alice's sets
    const ss = await screen.findByTestId("SelectSet");
    expect(ss).toBeInTheDocument();
    expect(screen.getByTestId("ss-count").textContent).toBe("1");

    // Go back to SelectPlayer
    fireEvent.click(screen.getByLabelText("go-back-selectset"));
    await screen.findByTestId("SelectPlayer");

    // Choose Alice again
    fireEvent.click(screen.getByLabelText("pick-player-2"));

    // Pick her set (setId 202) -> triggers fetch
    await screen.findByTestId("SelectSet");
    fireEvent.click(screen.getByLabelText("pick-set-202"));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const { url, body } = getLastFetchArgs();
    expect(url).toBe("http://localhost:8000/play/42/actions/steal-set");
    expect(body).toMatchObject({
      event: "stealSet",
      playerId: 1,
      setId: 202,
      stolenPlayerId: 2,
    });
  });

  it("andThenThereWasOneMore: SelectPlayer -> SelectSecret(revealed=true) -> SelectPlayer2 -> POST", async () => {
    render(
      <EffectManager
        publicData={PUBLIC_DATA}
        privateData={PRIVATE_DATA}
        actualPlayerId={1}
        wsRef={ws}
      />
    );
    await waitHandlerReady(ws);
    sendWs(ws, { event: "andThenThereWasOneMore" });

    // Select target player
    await screen.findByTestId("SelectPlayer");
    fireEvent.click(screen.getByLabelText("pick-player-2"));

    // Must show SelectSecret with revealed=true for that playerId=2
    const sec = await screen.findByTestId("SelectSecret");
    expect(sec).toHaveAttribute("data-revealed", "true");
    expect(sec).toHaveAttribute("data-playerid", "2");

    // Go back to SelectPlayer and forward again (back flow)
    fireEvent.click(screen.getByLabelText("go-back-selectsecret"));
    await screen.findByTestId("SelectPlayer");
    fireEvent.click(screen.getByLabelText("pick-player-2"));

    // Pick revealed secret (200), advance to SelectPlayer2
    await screen.findByTestId("SelectSecret");
    fireEvent.click(screen.getByLabelText("pick-secret-200"));

    // Select the receiver player (e.g., Bob id 3)
    const sp2 = await screen.findByTestId("SelectPlayer");
    expect(sp2).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("pick-player-3"));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const { url, body } = getLastFetchArgs();
    expect(url).toBe(
      "http://localhost:8000/play/42/actions/and-then-there-was-one-more"
    );
    expect(body).toMatchObject({
      event: "andThenThereWasOneMore",
      playerId: 1,
      secretId: 200,
      selectedPlayerId: 2, // from whom we stole
      stolenPlayerId: 3, // who receives hidden
    });
  });

  it("revealSecret: SelectPlayer -> SelectSecret(revealed=false) -> POST", async () => {
    render(
      <EffectManager
        publicData={PUBLIC_DATA}
        privateData={PRIVATE_DATA}
        actualPlayerId={1}
        wsRef={ws}
      />
    );
    await waitHandlerReady(ws);
    sendWs(ws, { event: "revealSecret" });

    // Choose target
    await screen.findByTestId("SelectPlayer");
    fireEvent.click(screen.getByLabelText("pick-player-2"));

    // Should display SelectSecret with revealed=false
    const sec = await screen.findByTestId("SelectSecret");
    expect(sec).toHaveAttribute("data-revealed", "false");

    // Pick hidden secret (201)
    fireEvent.click(screen.getByLabelText("pick-secret-201"));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const { url, body } = getLastFetchArgs();
    expect(url).toBe("http://localhost:8000/play/42/actions/reveal-secret");
    expect(body).toMatchObject({
      event: "revealSecret",
      playerId: 1,
      secretId: 201,
      revealedPlayerId: 2,
    });
  });

  it("revealOwnSecret: SelectSecret(revealed=false, from privateData) with no goBack, then POST", async () => {
    render(
      <EffectManager
        publicData={PUBLIC_DATA}
        privateData={PRIVATE_DATA}
        actualPlayerId={1}
        wsRef={ws}
      />
    );
    await waitHandlerReady(ws);
    sendWs(ws, { event: "revealOwnSecret" });

    // Must render SelectSecret immediately and revealed=false
    const sec = await screen.findByTestId("SelectSecret");
    expect(sec).toHaveAttribute("data-revealed", "false");

    // There is no goBack in this case
    expect(screen.queryByLabelText("go-back-selectsecret")).toBeNull();

    // Pick my hidden secret (500)
    fireEvent.click(screen.getByLabelText("pick-secret-500"));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const { url, body } = getLastFetchArgs();
    expect(url).toBe("http://localhost:8000/play/42/actions/reveal-own-secret");
    expect(body).toMatchObject({
      event: "revealOwnSecret",
      playerId: 1,
      secretId: 500,
    });
  });

  it("hideSecret: SelectPlayer -> SelectSecret(revealed=true) -> POST", async () => {
    render(
      <EffectManager
        publicData={PUBLIC_DATA}
        privateData={PRIVATE_DATA}
        actualPlayerId={1}
        wsRef={ws}
      />
    );
    await waitHandlerReady(ws);
    sendWs(ws, { event: "hideSecret" });

    await screen.findByTestId("SelectPlayer");
    fireEvent.click(screen.getByLabelText("pick-player-2"));

    const sec = await screen.findByTestId("SelectSecret");
    expect(sec).toHaveAttribute("data-revealed", "true");

    fireEvent.click(screen.getByLabelText("pick-secret-200"));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const { url, body } = getLastFetchArgs();
    expect(url).toBe("http://localhost:8000/play/42/actions/hide-secret");
    expect(body).toMatchObject({
      event: "hideSecret",
      playerId: 1,
      secretId: 200,
      hiddenPlayerId: 2,
    });
  });

  it("lookIntoTheAshes: SelectDiscardPileCards -> POST with chosen card id", async () => {
    render(
      <EffectManager
        publicData={PUBLIC_DATA}
        privateData={PRIVATE_DATA}
        actualPlayerId={1}
        wsRef={ws}
      />
    );
    await waitHandlerReady(ws);
    // IMPORTANT: payload is an ARRAY of cards (not { cards: [...] })
    sendWs(ws, {
      event: "lookIntoTheAshes",
      payload: DISCARD_CARDS,
    });

    const sdc = await screen.findByTestId("SelectDiscardPileCards");
    expect(sdc).toBeInTheDocument();
    expect(screen.getByTestId("sdc-count").textContent).toBe("5");

    // choose card id=8003
    fireEvent.click(screen.getByLabelText("pick-card-8003"));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const { url, body } = getLastFetchArgs();
    expect(url).toBe(
      "http://localhost:8000/play/42/actions/look-into-the-ashes"
    );
    expect(body).toMatchObject({
      event: "lookIntoTheAshes",
      playerId: 1,
      cardId: 8003,
    });
  });

  it("delayTheMurderersEscape: OrderDiscardPileCards -> POST with ordered ids", async () => {
    render(
      <EffectManager
        publicData={PUBLIC_DATA}
        privateData={PRIVATE_DATA}
        actualPlayerId={1}
        wsRef={ws}
      />
    );
    await waitHandlerReady(ws);
    // IMPORTANT: payload is an ARRAY of cards (not { cards: [...] })
    sendWs(ws, {
      event: "delayTheMurderersEscape",
      payload: DISCARD_CARDS.slice(0, 3),
    });

    const odpc = await screen.findByTestId("OrderDiscardPileCards");
    expect(odpc).toBeInTheDocument();
    expect(screen.getByTestId("odpc-count").textContent).toBe("3");

    // confirm order (our mock returns the current ids in order)
    fireEvent.click(screen.getByLabelText("confirm-order"));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const { url, body } = getLastFetchArgs();
    expect(url).toBe(
      "http://localhost:8000/play/42/actions/delay-the-murderers-escape"
    );
    expect(body).toMatchObject({
      event: "delayTheMurderersEscape",
      playerId: 1,
      cards: [8001, 8002, 8003],
    });
  });

  it("does not crash without wsRef and never posts", async () => {
    render(
      <EffectManager
        publicData={PUBLIC_DATA}
        privateData={PRIVATE_DATA}
        actualPlayerId={1}
        wsRef={null}
      />
    );
    // No steps rendered
    expect(screen.queryByTestId("SelectPlayer")).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("unknown events keep the flow idle and do not POST", async () => {
    render(
      <EffectManager
        publicData={PUBLIC_DATA}
        privateData={PRIVATE_DATA}
        actualPlayerId={1}
        wsRef={ws}
      />
    );
    await waitHandlerReady(ws);

    sendWs(ws, { event: "someRandomEvent", payload: { x: 1 } });

    expect(screen.queryByTestId("SelectPlayer")).toBeNull();
    expect(screen.queryByTestId("SelectSecret")).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
