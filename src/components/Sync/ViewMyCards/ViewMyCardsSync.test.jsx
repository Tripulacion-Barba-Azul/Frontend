// ViewMyCardsSync.test.jsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import ViewMyCardsSync from "./ViewMyCardsSync.jsx";
import * as logic from "../OwnCards/OwnCardsLogic.js";

// Mock del componente hijo ViewMyCards
vi.mock("../../ViewMyCards/ViewMyCards.jsx", () => {
  return {
    default: ({ cards }) => (
      <div data-testid="mock-viewmycards">{JSON.stringify(cards)}</div>
    ),
  };
});

describe("ViewMyCardsSync simple tests", () => {
  it("renders empty when no cards", () => {
    render(<ViewMyCardsSync serverCards={[]} currentPlayerId={1} />);
    expect(screen.getByTestId("mock-viewmycards")).toHaveTextContent("[]");
  });

  it("filters cards to current player", () => {
    const serverCards = [
      { cardOwnerID: 1, spriteId: 7, isInDeck: false, isInDiscard: false },
      { cardOwnerID: 2, spriteId: 8, isInDeck: false, isInDiscard: false },
    ];
    render(<ViewMyCardsSync serverCards={serverCards} currentPlayerId={1} />);
    expect(screen.getByTestId("mock-viewmycards")).toHaveTextContent(
      JSON.stringify([7])
    );
  });

  it("calls computeHandIds with correct arguments", () => {
    const spy = vi.spyOn(logic, "computeHandIds");
    const serverCards = [
      { cardOwnerID: 1, spriteId: 7, isInDeck: false, isInDiscard: false },
    ];
    render(<ViewMyCardsSync serverCards={serverCards} currentPlayerId={1} />);
    expect(spy).toHaveBeenCalledWith(serverCards, 1);
    spy.mockRestore();
  });

  it("respects anchorClass prop", () => {
    render(
      <ViewMyCardsSync
        serverCards={[]}
        currentPlayerId={1}
        anchorClass="my-anchor"
      />
    );
    // Ahora usamos el div contenedor directamente
    const container = screen.getByTestId("owncardssync-container");
    expect(container).toHaveClass("my-anchor");
  });
});