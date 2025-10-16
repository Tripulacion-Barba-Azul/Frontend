import React from "react";
import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import OrderDiscardPileCards from "./OrderDiscardPileCards";

// Ensure cleanup between tests (Vitest no siempre lo hace por defecto)
afterEach(cleanup);

// Mock CSS to keep tests quiet
vi.mock("./OrderDiscardPileCards.css", () => ({}));

// Mock generalMaps so the component finds images in CARDS_MAP
vi.mock("../generalMaps.js", () => ({
  CARDS_MAP: {
    "Express Train": "/img/express_train.png",
    Blackmail: "/img/blackmail.png",
    "Devious Plan": "/img/devious_plan.png",
    "Detective Badge": "/img/detective_badge.png",
  },
}));

// Minimal DataTransfer for DnD events in JSDOM
function createDataTransfer(initial = {}) {
  const store = { ...initial };
  return {
    setData: (type, val) => {
      store[type] = String(val);
    },
    getData: (type) => store[type] ?? "",
    effectAllowed: "move",
    dropEffect: "move",
    setDragImage: () => {},
  };
}

describe("OrderDiscardPileCards", () => {
  const DEMO_CARDS = [
    { id: 1, name: "Express Train" },
    { id: 2, name: "Blackmail" },
    { id: 3, name: "Devious Plan" },
  ];

  test("renders cards and leftmost indicator", () => {
    render(
      <OrderDiscardPileCards
        cards={DEMO_CARDS}
        selectedCardsOrder={() => {}}
        text="Reorder the cards"
      />
    );

    // Cards are buttons with title={card.name}
    expect(screen.getByTitle("Express Train")).toBeInTheDocument();
    expect(screen.getByTitle("Blackmail")).toBeInTheDocument();
    expect(screen.getByTitle("Devious Plan")).toBeInTheDocument();

    // Indicator text
    expect(
      screen.getByText("This card will be on top of the regular deck")
    ).toBeInTheDocument();
  });

  test("drag & drop reorders and callback returns only ids in new order", () => {
    const onOrder = vi.fn();

    const { getByTitle, getByRole } = render(
      <OrderDiscardPileCards
        cards={DEMO_CARDS}
        selectedCardsOrder={onOrder}
        text="Reorder the cards"
      />
    );

    const source = getByTitle("Express Train"); // id=1 (index 0)
    const target = getByTitle("Devious Plan"); // id=3 (index 2)
    const dataTransfer = createDataTransfer();

    // Drag 1 → drop onto slot of 3  => [2,3,1]
    fireEvent.dragStart(source, { dataTransfer });
    fireEvent.dragOver(target, { dataTransfer });
    fireEvent.drop(target, { dataTransfer });
    fireEvent.dragEnd(source, { dataTransfer });

    fireEvent.click(getByRole("button", { name: /confirm/i }));

    expect(onOrder).toHaveBeenCalledTimes(1);
    expect(onOrder).toHaveBeenCalledWith([2, 3, 1]);
  });

  // Parametric test: 1..N cards should always return only ids in current order
  test.each([
    [[{ id: 1, name: "Express Train" }]],
    [
      [
        { id: 1, name: "Express Train" },
        { id: 2, name: "Blackmail" },
      ],
    ],
    [
      [
        { id: 1, name: "Express Train" },
        { id: 2, name: "Blackmail" },
        { id: 3, name: "Devious Plan" },
        { id: 4, name: "Detective Badge" },
      ],
    ],
  ])("returns ids in order without drag (cards=%j)", (cards) => {
    const onOrder = vi.fn();

    const { getByRole, unmount } = render(
      <OrderDiscardPileCards
        cards={cards}
        selectedCardsOrder={onOrder}
        text="Reorder the cards"
      />
    );

    // No drag: confirm should return ids in current order
    fireEvent.click(getByRole("button", { name: /confirm/i }));
    expect(onOrder).toHaveBeenCalledWith(cards.map((c) => c.id));

    // Avoid leaving multiple modals mounted across parameter cases
    unmount();
  });
});
