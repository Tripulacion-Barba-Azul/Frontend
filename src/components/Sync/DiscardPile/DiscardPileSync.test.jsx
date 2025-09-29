// DiscardPileSync.test.jsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// ---- Mocks ----

// Mock DiscardPile to capture props passed by the Sync component
let lastDiscardProps = null;
const DiscardPileMock = vi.fn((props) => {
  lastDiscardProps = props;
  return <div data-testid="DiscardPileMock" />;
});

// DiscardPileSync imports "../../DiscardPile/DiscardPile.jsx"
vi.mock("../../DiscardPile/DiscardPile.jsx", () => ({
  default: (props) => DiscardPileMock(props),
}));

// DiscardPileLogic imports NAME_TO_ID from "../OwnCards/OwnCardsSyncConstants.js"
// We mock it to control the mapping in tests.
vi.mock("../OwnCards/OwnCardsSyncConstants.js", () => ({
  NAME_TO_ID: {
    detective_poirot: 7,
    detective_marple: 8,
    instant_notsofast: 16,
  },
}));

// Import under test AFTER mocks
import DiscardPileSync from "./DiscardPileSync.jsx";

beforeEach(() => {
  cleanup();
  DiscardPileMock.mockClear();
  lastDiscardProps = null;
});

// Helpers to craft cards
function makeCard({
  id,
  name = "detective_poirot",
  owner = null,
  inDeck = true,
  inDiscard = false,
  isTop = false,
}) {
  return {
    cardID: id,
    cardName: name,
    cardOwnerID: owner,
    isInDeck: inDeck,
    isInDiscard: inDiscard,
    isInDiscardTop: isTop,
  };
}

describe("DiscardPileSync", () => {
  it("renders DiscardPile with count=0 and img_id=null when no cards are in discard", () => {
    const serverCards = [
      makeCard({ id: "c1", inDeck: true, inDiscard: false }),
      makeCard({ id: "c2", inDeck: true, inDiscard: false }),
    ];
    render(<DiscardPileSync serverCards={serverCards} />);

    expect(DiscardPileMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("DiscardPileMock")).toBeInTheDocument();
    expect(lastDiscardProps.number).toBe(0);
    expect(lastDiscardProps.img_id).toBeNull();
  });

  it("computes count from all isInDiscard=true and img_id from the single isInDiscardTop=true mapped via NAME_TO_ID", () => {
    const serverCards = [
      makeCard({
        id: "c1",
        name: "detective_poirot",
        inDeck: false,
        inDiscard: true,
      }),
      makeCard({
        id: "c2",
        name: "detective_marple",
        inDeck: false,
        inDiscard: true,
        isTop: true, // top card
      }),
      makeCard({
        id: "c3",
        name: "instant_notsofast",
        inDeck: true,
        inDiscard: false,
      }),
    ];
    render(<DiscardPileSync serverCards={serverCards} />);

    expect(DiscardPileMock).toHaveBeenCalledTimes(1);
    expect(lastDiscardProps.number).toBe(2); // two cards in discard
    expect(lastDiscardProps.img_id).toBe(8); // top is "detective_marple" → 8
  });

  it("updates when serverCards changes (count and top mapping change accordingly)", () => {
    const first = [
      makeCard({
        id: "c1",
        name: "detective_poirot",
        inDeck: false,
        inDiscard: true,
        isTop: true,
      }),
      makeCard({
        id: "c2",
        name: "instant_notsofast",
        inDeck: false,
        inDiscard: true,
      }),
    ];
    const { rerender } = render(<DiscardPileSync serverCards={first} />);
    expect(lastDiscardProps.number).toBe(2);
    expect(lastDiscardProps.img_id).toBe(7); // poirot

    const second = [
      // different top and only one in discard
      makeCard({
        id: "c3",
        name: "instant_notsofast",
        inDeck: false,
        inDiscard: true,
        isTop: true,
      }),
      makeCard({
        id: "c4",
        name: "detective_poirot",
        inDeck: true,
        inDiscard: false,
      }),
    ];
    rerender(<DiscardPileSync serverCards={second} />);
    expect(lastDiscardProps.number).toBe(1);
    expect(lastDiscardProps.img_id).toBe(16); // instant_notsofast
  });

  it("sets img_id=null if top card name is not found in NAME_TO_ID", () => {
    const serverCards = [
      makeCard({
        id: "c1",
        name: "unknown_card_name",
        inDeck: false,
        inDiscard: true,
        isTop: true,
      }),
      makeCard({
        id: "c2",
        name: "detective_marple",
        inDeck: false,
        inDiscard: true,
      }),
    ];
    render(<DiscardPileSync serverCards={serverCards} />);
    expect(lastDiscardProps.number).toBe(2);
    expect(lastDiscardProps.img_id).toBeNull(); // top not mapped
  });

  it("if multiple cards are incorrectly marked as top, uses the first found by logic", () => {
    const serverCards = [
      makeCard({
        id: "c1",
        name: "detective_poirot",
        inDeck: false,
        inDiscard: true,
        isTop: true,
      }),
      makeCard({
        id: "c2",
        name: "detective_marple",
        inDeck: false,
        inDiscard: true,
        isTop: true,
      }),
      makeCard({
        id: "c3",
        name: "instant_notsofast",
        inDeck: false,
        inDiscard: true,
      }),
    ];
    render(<DiscardPileSync serverCards={serverCards} />);

    // DiscardPileLogic uses `find` → first matching is top
    expect(lastDiscardProps.number).toBe(3);
    expect(lastDiscardProps.img_id).toBe(7); // first top is poirot → 7
  });
});
