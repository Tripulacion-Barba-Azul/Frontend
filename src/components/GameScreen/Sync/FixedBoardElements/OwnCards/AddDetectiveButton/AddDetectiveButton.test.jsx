// AddDetectiveButton.test.jsx
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import AddDetectiveButton from "./AddDetectiveButton.jsx";

/* ----------------- Mocks for child modals (SelectPlayer / SelectSet) ----------------- */
// We mock these using the SAME module specifiers used by AddDetectiveButton.jsx
vi.mock("../../../../Events/Actions/SelectPlayer/SelectPlayer.jsx", () => ({
  default: function SelectPlayerMock({
    players = [],
    selectedPlayerId,
    goBack,
    text,
  }) {
    return (
      <div role="dialog" aria-label="SelectPlayerMock">
        <h2 data-testid="selectplayer-title">{text || "Select a player"}</h2>
        <div>
          {players.map((p) => (
            <button
              key={p.id}
              data-testid={`player-${p.id}`}
              onClick={() => selectedPlayerId(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>
        {goBack && (
          <button data-testid="selectplayer-back" onClick={goBack}>
            Go Back
          </button>
        )}
      </div>
    );
  },
}));

vi.mock("../../../../Events/Actions/SelectSet/SelectSet.jsx", () => ({
  default: function SelectSetMock({ sets = [], selectedSetId, goBack, text }) {
    return (
      <div role="dialog" aria-label="SelectSetMock">
        <h2 data-testid="selectset-title">{text || "Select a set"}</h2>
        <div>
          {sets.map((s) => (
            <button
              key={s.setId}
              data-testid={`set-${s.setId}`}
              onClick={() => selectedSetId(s.setId)}
            >
              {s.setName}
            </button>
          ))}
        </div>
        {goBack && (
          <button data-testid="selectset-back" onClick={goBack}>
            Go Back
          </button>
        )}
      </div>
    );
  },
}));

/* ---------------------------- Test utilities ---------------------------- */
function renderWithRouter(ui) {
  // Provide route param :gameId and query ?playerId=7
  return render(
    <MemoryRouter initialEntries={["/play/42?playerId=7"]}>
      <Routes>
        <Route path="/play/:gameId" element={ui} />
      </Routes>
    </MemoryRouter>
  );
}

const DET = (id, name) => ({ id, name, type: "detective" });
const SET = (setId, setName, cardNames) => ({
  setId,
  setName,
  cards: cardNames.map((n, i) => ({ id: `${setId}-${i}`, name: n })),
});

// Players with sets to exercise validation rules
const PLAYERS_FIXTURE = [
  {
    id: 1,
    name: "Alice",
    avatar: 1,
    sets: [
      SET(101, "Poirot Set", ["Hercule Poirot"]),
      SET(102, "Tommy Set", ["Tommy Beresford"]),
    ],
  },
  {
    id: 2,
    name: "Bob",
    avatar: 2,
    sets: [
      SET(201, "Random Set", ["Miss Marple"]),
      SET(202, "Tuppence Set", ["Tuppence Beresford"]),
    ],
  },
];

/* ------------------------------- Lifecycle ------------------------------ */
beforeEach(() => {
  cleanup();
  vi.restoreAllMocks();
  // Default fetch: success
  global.fetch = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({}) });
});

afterEach(() => {
  cleanup();
});

/* --------------------------------- Tests -------------------------------- */
describe("AddDetectiveButton", () => {
  it("renders the main button and is enabled when not loading", () => {
    renderWithRouter(
      <AddDetectiveButton
        selectedCards={["d1"]}
        selectedCardsMeta={[DET("d1", "Mr Satterthwaite")]}
        players={PLAYERS_FIXTURE}
        label="Add to any set"
      />
    );
    const btn = screen.getByRole("button", { name: /add to any set/i });
    expect(btn).toBeEnabled();
  });

  it("shows error if selection invalid: zero cards", () => {
    renderWithRouter(
      <AddDetectiveButton
        selectedCards={[]}
        selectedCardsMeta={[]}
        players={PLAYERS_FIXTURE}
      />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(
      screen.getByText(/can't add this card to a set/i)
    ).toBeInTheDocument();
  });

  it("shows error if the single card is not detective", () => {
    renderWithRouter(
      <AddDetectiveButton
        selectedCards={["e1"]}
        selectedCardsMeta={[{ id: "e1", name: "Event A", type: "event" }]}
        players={PLAYERS_FIXTURE}
      />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(
      screen.getByText(/can't add this card to a set/i)
    ).toBeInTheDocument();
  });

  it('shows specific error for "Harley Quin"', () => {
    renderWithRouter(
      <AddDetectiveButton
        selectedCards={["hq"]}
        selectedCardsMeta={[DET("hq", "Harley Quin")]}
        players={PLAYERS_FIXTURE}
      />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(
      screen.getByText(/Can't add "Harley Quin" to an existing set/i)
    ).toBeInTheDocument();
  });

  it("filters players/sets by validateSetForCard (same-name, pairing Tommy/Tuppence)", async () => {
    // Card = Tuppence → valid in any set that contains "Tuppence" or pairing with "Tommy"
    renderWithRouter(
      <AddDetectiveButton
        selectedCards={["c1"]}
        selectedCardsMeta={[DET("c1", "Tuppence Beresford")]}
        players={PLAYERS_FIXTURE}
      />
    );

    // Open flow
    fireEvent.click(screen.getByRole("button", { name: /add to any set/i }));

    // SelectPlayer should list both Alice (has Tommy) and Bob (has Tuppence)
    await waitFor(() =>
      expect(screen.getByTestId("selectplayer-title")).toBeInTheDocument()
    );
    expect(screen.getByTestId("player-1")).toHaveTextContent("Alice");
    expect(screen.getByTestId("player-2")).toHaveTextContent("Bob");

    // Choose Alice -> SelectSet shows only her valid sets for Tuppence (Tommy Set)
    fireEvent.click(screen.getByTestId("player-1"));
    await waitFor(() =>
      expect(screen.getByTestId("selectset-title")).toBeInTheDocument()
    );

    // For Alice, only set 102 should be valid (Tommy Set)
    const setTommy = screen.getByTestId("set-102");
    expect(setTommy).toHaveTextContent("Tommy Set");
    expect(screen.queryByTestId("set-101")).toBeNull();
  });

  it("Ariadne Oliver makes ALL sets valid and both players visible", async () => {
    renderWithRouter(
      <AddDetectiveButton
        selectedCards={["c7"]}
        selectedCardsMeta={[DET("c7", "Ariadne Oliver")]}
        players={PLAYERS_FIXTURE}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /add to any set/i }));

    await waitFor(() =>
      expect(screen.getByTestId("selectplayer-title")).toBeInTheDocument()
    );

    // Both players must be listed
    expect(screen.getByTestId("player-1")).toBeInTheDocument();
    expect(screen.getByTestId("player-2")).toBeInTheDocument();

    // Pick Bob -> all his sets should be present (201 + 202)
    fireEvent.click(screen.getByTestId("player-2"));

    await waitFor(() =>
      expect(screen.getByTestId("selectset-title")).toBeInTheDocument()
    );
    expect(screen.getByTestId("set-201")).toHaveTextContent("Random Set");
    expect(screen.getByTestId("set-202")).toHaveTextContent("Tuppence Set");
  });

  it("shows error when there are NO valid sets for the selected card", () => {
    // Card = Hercule Poirot; make all sets NOT contain same name nor pairing; (Alice has Poirot but we'll remove it)
    const playersNoValid = [
      {
        id: 1,
        name: "Alice",
        avatar: 1,
        sets: [SET(102, "Tommy Set", ["Tommy Beresford"])],
      },
      {
        id: 2,
        name: "Bob",
        avatar: 2,
        sets: [SET(201, "Random Set", ["Miss Marple"])],
      },
    ];

    renderWithRouter(
      <AddDetectiveButton
        selectedCards={["p1"]}
        selectedCardsMeta={[DET("p1", "Hercule Poirot")]}
        players={playersNoValid}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /add to any set/i }));
    expect(
      screen.getByText(/There are no valid sets to add this card to/i)
    ).toBeInTheDocument();

    // SelectPlayer modal should NOT open
    expect(screen.queryByTestId("selectplayer-title")).toBeNull();
  });

  it("full happy path: choose player, choose set, fetch called once with correct payload", async () => {
    const onSuccess = vi.fn();
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue({ ok: true, json: async () => ({}) });

    renderWithRouter(
      <AddDetectiveButton
        selectedCards={["t1"]}
        selectedCardsMeta={[DET("t1", "Tuppence Beresford")]}
        players={PLAYERS_FIXTURE}
        onPlaySuccess={onSuccess}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /add to any set/i }));

    // Select player: Alice (has Tommy pairing set 102)
    await waitFor(() => screen.getByTestId("player-1"));
    fireEvent.click(screen.getByTestId("player-1"));

    // Select set: 102
    await waitFor(() => screen.getByTestId("set-102"));
    fireEvent.click(screen.getByTestId("set-102"));

    // Should submit once
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    const [url, req] = fetchSpy.mock.calls[0];
    expect(url).toBe(
      "http://localhost:8000/play/42/actions/add-detective-to-set"
    );

    const body = JSON.parse(req.body);
    // playerId comes from the URL query (?playerId=7), NOT the chosen player
    expect(body).toEqual({
      playerId: 7,
      cardId: null /* parsed below */,
      setId: 102,
    });

    // Success path calls onPlaySuccess and closes modals (no titles)
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId("selectplayer-title")).toBeNull();
    expect(screen.queryByTestId("selectset-title")).toBeNull();
  });

  it("error path: endpoint not ok -> shows error under button and closes modal", async () => {
    const onSuccess = vi.fn();
    vi.spyOn(global, "fetch").mockResolvedValue({ ok: false, status: 404 });

    renderWithRouter(
      <AddDetectiveButton
        selectedCards={["t1"]}
        selectedCardsMeta={[DET("t1", "Tuppence Beresford")]}
        players={PLAYERS_FIXTURE}
        onPlaySuccess={onSuccess}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /add to any set/i }));

    // Select player Bob (has Tuppence set 202)
    await waitFor(() => screen.getByTestId("player-2"));
    fireEvent.click(screen.getByTestId("player-2"));

    // Select set 202 -> triggers submit
    await waitFor(() => screen.getByTestId("set-202"));
    fireEvent.click(screen.getByTestId("set-202"));

    // Error message appears under main button; modals closed
    await waitFor(() =>
      expect(
        screen.getByText(/Failed to add detective to set/i)
      ).toBeInTheDocument()
    );
    expect(screen.queryByTestId("selectplayer-title")).toBeNull();
    expect(screen.queryByTestId("selectset-title")).toBeNull();

    // onPlaySuccess is still called (parity with handled-error flows)
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("goBack from SelectPlayer closes flow and returns to idle (no modals)", async () => {
    renderWithRouter(
      <AddDetectiveButton
        selectedCards={["c1"]}
        selectedCardsMeta={[DET("c1", "Tuppence Beresford")]}
        players={PLAYERS_FIXTURE}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /add to any set/i }));

    await waitFor(() =>
      expect(screen.getByTestId("selectplayer-title")).toBeInTheDocument()
    );

    // Click Go Back on SelectPlayer
    fireEvent.click(screen.getByTestId("selectplayer-back"));

    // Both modals should be gone
    await waitFor(() => {
      expect(screen.queryByTestId("selectplayer-title")).toBeNull();
      expect(screen.queryByTestId("selectset-title")).toBeNull();
    });
  });

  it("single click on a set triggers submit exactly once (fix for double click)", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue({ ok: true, json: async () => ({}) });

    renderWithRouter(
      <AddDetectiveButton
        selectedCards={["c1"]}
        selectedCardsMeta={[DET("c1", "Tuppence Beresford")]}
        players={PLAYERS_FIXTURE}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /add to any set/i }));

    await waitFor(() => screen.getByTestId("player-2"));
    fireEvent.click(screen.getByTestId("player-2"));

    await waitFor(() => screen.getByTestId("set-202"));
    fireEvent.click(screen.getByTestId("set-202"));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
  });
});
