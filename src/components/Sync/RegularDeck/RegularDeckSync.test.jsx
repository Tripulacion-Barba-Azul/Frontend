// RegularDeckSync.test.jsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";

import RegularDeckSync from "./RegularDeckSync.jsx";
import * as logic from "./RegularDeckLogic.js";

// Mock del hijo RegularDeck
vi.mock("../../RegularDeck/RegularDeck.jsx", () => {
  return {
    default: ({ number }) => <div data-testid="mock-regulardeck">{number}</div>,
  };
});

describe("RegularDeckSync simple tests", () => {
  it("renders correct number of cards", () => {
    const serverCards = [
      { isInDeck: true },
      { isInDeck: false },
      { isInDeck: true },
    ];
    render(<RegularDeckSync serverCards={serverCards} />);
    // computeDeckCount debería contar solo las cartas en deck
    expect(screen.getByTestId("mock-regulardeck")).toHaveTextContent("2");
  });

  it("calls computeDeckCount with serverCards", () => {
    const spy = vi.spyOn(logic, "computeDeckCount");
    const serverCards = [{ isInDeck: true }, { isInDeck: false }];
    render(<RegularDeckSync serverCards={serverCards} />);
    expect(spy).toHaveBeenCalledWith(serverCards);
    spy.mockRestore();
  });

  it("respects className prop", () => {
    const { container } = render(
      <RegularDeckSync serverCards={[]} className="my-anchor" />
    );
    const outerDiv = container.firstChild;
    expect(outerDiv).toHaveClass("absolute pointer-events-none my-anchor");
  });

  it("works with empty serverCards", () => {
    render(<RegularDeckSync serverCards={[]} />);
    expect(screen.getByTestId("mock-regulardeck")).toHaveTextContent("0");
  });
});