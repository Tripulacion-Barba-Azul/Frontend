// OwnCardsSync.test.jsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";

import OwnCardsSync from "./OwnCardsSync.jsx";
import * as logic from "./OwnCardsLogic.js";

// Mock del hijo OwnCards
vi.mock("../../OwnCards/OwnCards.jsx", () => {
  return {
    default: ({ cardIds }) => (
      <div data-testid="mock-owncards">{JSON.stringify(cardIds)}</div>
    ),
  };
});

describe("OwnCardsSync simple tests", () => {
  it("renders empty when no cards", () => {
    render(<OwnCardsSync serverCards={[]} currentPlayerId={1} />);
    expect(screen.getByTestId("mock-owncards")).toHaveTextContent("[]");
  });

  it("filters cards to current player", () => {
    const serverCards = [
      { cardOwnerID: 1, spriteId: 7 },
      { cardOwnerID: 2, spriteId: 8 },
      { cardOwnerID: 1, spriteId: 9 },
    ];
    render(<OwnCardsSync serverCards={serverCards} currentPlayerId={1} />);
    expect(screen.getByTestId("mock-owncards")).toHaveTextContent(
      JSON.stringify([7, 9])
    );
  });

  it("calls computeHandIds with correct arguments", () => {
    const spy = vi.spyOn(logic, "computeHandIds");
    const serverCards = [{ cardOwnerID: 1, spriteId: 7 }];
    render(<OwnCardsSync serverCards={serverCards} currentPlayerId={1} />);
    expect(spy).toHaveBeenCalledWith(serverCards, 1);
    spy.mockRestore();
  });

  it("updates cardIds when serverCards changes", () => {
    const { rerender } = render(
      <OwnCardsSync
        serverCards={[{ cardOwnerID: 1, spriteId: 7 }]}
        currentPlayerId={1}
      />
    );
    expect(screen.getByTestId("mock-owncards")).toHaveTextContent("[7]");

    rerender(
      <OwnCardsSync
        serverCards={[
          { cardOwnerID: 1, spriteId: 7 },
          { cardOwnerID: 1, spriteId: 9 },
        ]}
        currentPlayerId={1}
      />
    );
    expect(screen.getByTestId("mock-owncards")).toHaveTextContent("[7,9]");
  });
});