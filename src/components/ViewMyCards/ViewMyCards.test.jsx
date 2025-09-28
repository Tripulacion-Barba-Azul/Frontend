import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import '@testing-library/jest-dom';
import ViewMyCards from "./ViewMyCards";

const sixCards = [7, 8, 9, 10, 11, 12];

describe("ViewMyCards component", () => {
  it("renders the button", () => {
    render(<ViewMyCards cards={sixCards} />);
    const button = screen.getByRole("button", { name: /zoomviewicon/i });
    expect(button).toBeInTheDocument();
  });

  it("opens and closes the viewmycards modal", () => {
    render(<ViewMyCards cards={sixCards} />);
    
    const zoomButton = screen.getByRole("button", { name: /zoomviewicon/i });
    fireEvent.click(zoomButton);

    const modal = screen.getByAltText(/card 7/i);
    expect(modal).toBeInTheDocument();

    const closeButton = screen.getByRole("button", { name: /x/i });
    fireEvent.click(closeButton);

    expect(screen.queryByText(/card 7/i)).toBeNull();
  });

  it("renders all 6 cards correctly", () => {
    render(<ViewMyCards cards={sixCards} />);
    
    fireEvent.click(screen.getByRole("button", { name: /zoomviewicon/i }));

    sixCards.forEach((card) => {
      const cardImage = screen.getByAltText(`card ${card}`);
      expect(cardImage).toBeInTheDocument();
      expect(cardImage.getAttribute("src")).toContain(`${card}`);
    });
  });

  it("shows 'Out of cards!' message when no cards", () => {
    render(<ViewMyCards cards={[]} />);
    
    fireEvent.click(screen.getByRole("button", { name: /zoomviewicon/i }));

    expect(screen.getByText(/Out of cards!/i)).toBeInTheDocument();
  });

  it("adds and removes active-viewmycards class on body", () => {
    render(<ViewMyCards cards={sixCards} />);
    
    const zoomButton = screen.getByRole("button", { name: /zoomviewicon/i });
    
    fireEvent.click(zoomButton);
    expect(document.body.classList.contains("active-viewmycards")).toBe(true);

    fireEvent.click(zoomButton);
    expect(document.body.classList.contains("active-viewmycards")).toBe(false);
  });
});
