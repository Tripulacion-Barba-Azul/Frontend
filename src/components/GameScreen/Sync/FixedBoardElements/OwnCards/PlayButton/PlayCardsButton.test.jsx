// PlayCardsButton.test.jsx
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { vi, describe, it, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import PlayCardsButton from "./PlayCardsButton.jsx";

// --- Mock router hooks so the component can read params/query ---
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useParams: vi.fn(),
    useSearchParams: vi.fn(),
  };
});
import { useParams, useSearchParams } from "react-router-dom";

// ----------------------------- Fixtures ------------------------------
const DET = (id, name) => ({ id, name, type: "detective" });
const HQ = (id = 901) => DET(id, "Harley Quin");
const ARIADNE = (id = 902) => DET(id, "Ariadne Oliver");
const POIROT = (id) => DET(id, "Hercule Poirot");
const MARPLE = (id) => DET(id, "Miss Marple");
const TOMMY = (id) => DET(id, "Tommy Beresford");
const TUPPENCE = (id) => DET(id, "Tuppence Beresford");
const SATTER = (id) => DET(id, "Mr Satterthwaite");

// ----------------------------- Helpers -------------------------------
function renderBtn(props) {
  return render(
    <MemoryRouter>
      <PlayCardsButton {...props} />
    </MemoryRouter>
  );
}

// ------------------------------ Tests --------------------------------
describe("<PlayCardsButton /> — exhaustive validations", () => {
  beforeEach(() => {
    cleanup();
    vi.resetAllMocks();

    // Router mocks
    useParams.mockReturnValue({ gameId: "123" });
    const get = vi.fn(() => "42"); // playerId
    const set = vi.fn();
    useSearchParams.mockReturnValue([{ get }, set]);

    // Default fetch mock (override per test when needed)
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  it("renders default label as Play (k) and respects label override", () => {
    renderBtn({ selectedCards: [1, 2] });
    expect(screen.getByRole("button")).toHaveTextContent("Play (2)");

    cleanup();
    renderBtn({ selectedCards: [1, 2], label: "Play detective's set" });
    expect(screen.getByRole("button")).toHaveTextContent(
      "Play detective's set"
    );
  });

  it("prevents fetch and shows error when selecting more than 6 cards", async () => {
    renderBtn({ selectedCards: [1, 2, 3, 4, 5, 6, 7] });
    fireEvent.click(screen.getByRole("button"));
    expect(
      await screen.findByText(/something went wrong with your selection/i)
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('single selected card named "Harley Quin" -> shows error and NO fetch', async () => {
    renderBtn({
      selectedCards: [10],
      selectedCardsMeta: [HQ(10)],
      label: "Play (detective)",
    });
    fireEvent.click(screen.getByRole("button"));
    expect(
      await screen.findByText(/Can't add "Harley Quin" to an existing set/i)
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("detective set: all same non-HQ name (k=2) -> valid, does fetch", async () => {
    renderBtn({
      selectedCards: [1, 2],
      selectedCardsMeta: [SATTER(1), SATTER(2)],
      label: "Play detective's set",
    });
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  });

  it('detective set: same name + includes "Harley Quin" (k=2) -> valid, does fetch', async () => {
    renderBtn({
      selectedCards: [1, 2],
      selectedCardsMeta: [SATTER(1), HQ(2)],
      label: "Play detective's set",
    });
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  });

  it("detective set: Tommy + Tuppence (k=2) -> valid, does fetch", async () => {
    renderBtn({
      selectedCards: [11, 12],
      selectedCardsMeta: [TOMMY(11), TUPPENCE(12)],
      label: "Play detective's set",
    });
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  });

  it('detective set: Tommy + Tuppence + "Harley Quin" (k=3) -> valid, does fetch', async () => {
    renderBtn({
      selectedCards: [11, 12, 13],
      selectedCardsMeta: [TOMMY(11), TUPPENCE(12), HQ(13)],
      label: "Play detective's set",
    });
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  });

  it('detective set: contains "Ariadne Oliver" -> error and NO fetch', async () => {
    renderBtn({
      selectedCards: [21, 22],
      selectedCardsMeta: [SATTER(21), ARIADNE(22)],
      label: "Play detective's set",
    });
    fireEvent.click(screen.getByRole("button"));
    expect(
      await screen.findByText(/Detective set cannot include "Ariadne Oliver"/i)
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('detective set: ALL "Harley Quin" -> error and NO fetch', async () => {
    renderBtn({
      selectedCards: [31, 32],
      selectedCardsMeta: [HQ(31), HQ(32)],
      label: "Play detective's set",
    });
    fireEvent.click(screen.getByRole("button"));
    expect(
      await screen.findByText(/cannot be composed only of "Harley Quin"/i)
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("detective set: invalid mixture not covered by rules -> error generic and NO fetch", async () => {
    renderBtn({
      selectedCards: [41, 42],
      selectedCardsMeta: [SATTER(41), POIROT(42)], // not same name, not Tommy/Tuppence-only
      label: "Play detective's set",
    });
    fireEvent.click(screen.getByRole("button"));
    expect(
      await screen.findByText(/Invalid detective set/i)
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('Poirot set with 2 cards -> error: "Hercule Poirot"s sets must have at least 3 cards', async () => {
    renderBtn({
      selectedCards: [51, 52],
      selectedCardsMeta: [POIROT(51), POIROT(52)],
      label: "Play detective's set",
    });
    fireEvent.click(screen.getByRole("button"));
    expect(
      await screen.findByText(
        /"Hercule Poirot"s set must have at least 3 cards/i
      )
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('Marple set with 2 cards -> error: "Miss Marple"\'s sets must have at least 3 cards', async () => {
    renderBtn({
      selectedCards: [61, 62],
      selectedCardsMeta: [MARPLE(61), MARPLE(62)],
      label: "Play detective's set",
    });
    fireEvent.click(screen.getByRole("button"));
    expect(
      await screen.findByText(/"Miss Marple"s set must have at least 3 cards/i)
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("Poirot set with k=3 -> valid, does fetch with correct body", async () => {
    const spy = vi.spyOn(global, "fetch").mockResolvedValueOnce({ ok: true });
    const onPlaySuccess = vi.fn();

    renderBtn({
      selectedCards: [71, 72, 73],
      selectedCardsMeta: [POIROT(71), POIROT(72), POIROT(73)],
      label: "Play detective's set",
      onPlaySuccess,
    });

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith(
        "http://localhost:8000/play/123/actions/play-card",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId: 42, cards: [71, 72, 73] }),
        })
      )
    );
    expect(onPlaySuccess).toHaveBeenCalledTimes(1);
  });

  it("handles failed fetch: shows network error and still calls onPlaySuccess", async () => {
    const spy = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce({ ok: false, status: 500 });
    const onPlaySuccess = vi.fn();
    renderBtn({
      selectedCards: [81, 82, 83],
      selectedCardsMeta: [POIROT(81), POIROT(82), POIROT(83)],
      onPlaySuccess,
    });

    fireEvent.click(screen.getByRole("button"));
    expect(
      await screen.findByText(/Failed to play cards/i)
    ).toBeInTheDocument();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(onPlaySuccess).toHaveBeenCalledTimes(1);
  });

  it("disables button and shows 'Playing...' while loading", async () => {
    let resolveFetch;
    vi.spyOn(global, "fetch").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    renderBtn({
      selectedCards: [91, 92, 93],
      selectedCardsMeta: [POIROT(91), POIROT(92), POIROT(93)],
    });

    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent(/playing/i);

    resolveFetch({ ok: true });
    await waitFor(() => expect(btn).not.toBeDisabled());
  });

  it("clears previous error on next attempt", async () => {
    // First attempt invalid -> show error
    renderBtn({
      selectedCards: [101],
      selectedCardsMeta: [HQ(101)],
    });

    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    expect(
      await screen.findByText(/Can't add "Harley Quin"/i)
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();

    // Rerender with a valid set -> error should disappear on next click and fetch should run
    cleanup();
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    renderBtn({
      selectedCards: [111, 112],
      selectedCardsMeta: [TOMMY(111), TUPPENCE(112)],
    });

    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(
      screen.queryByText(/Can't add "Harley Quin"/i)
    ).not.toBeInTheDocument();
  });
});
