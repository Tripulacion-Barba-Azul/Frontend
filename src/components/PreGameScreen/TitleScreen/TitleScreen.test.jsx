import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import TitleScreen from "./TitleScreen";

// Mock the child components to simplify testing
vi.mock("./CreateGameButton/CreateGameButton", () => ({
  default: function MockCreateGameButton() {
    return <button>Create Game</button>;
  },
}));

vi.mock("./JoinGameButton/JoinGameButton", () => ({
  default: function MockJoinGameButton() {
    return <button>Join Game</button>;
  },
}));

vi.mock("../../Instructions/Instructions", () => ({
  default: function MockInstructions({ mode }) {
    return (
      <div>
        <button aria-label="open instructions">Instructions</button>
        {mode === "preGame" && <div data-testid="pre-game-instructions">Pre Game Instructions</div>}
      </div>
    );
  },
}));

describe("TitleScreen", () => {
  it("renders all main images with correct alt texts", () => {
    render(
      <MemoryRouter>
        <TitleScreen />
      </MemoryRouter>
    );

    // Check for title image
    const titleImage = screen.getByAltText("Agatha Christie's Death on the Cards");
    expect(titleImage).toBeInTheDocument();
    expect(titleImage).toHaveAttribute("src", "/Assets/DOTC_title.png");

    // Check for characters image
    const charactersImage = screen.getByAltText("Characters");
    expect(charactersImage).toBeInTheDocument();
    expect(charactersImage).toHaveAttribute("src", "/Assets/DOTC_characters.png");
  });

  it("renders both game buttons in the buttons container", () => {
    render(
      <MemoryRouter>
        <TitleScreen />
      </MemoryRouter>
    );

    expect(screen.getByText("Create Game")).toBeInTheDocument();
    expect(screen.getByText("Join Game")).toBeInTheDocument();
    
    // Verify buttons are contained within the buttons container
    const buttonsContainer = screen.getByText("Create Game").closest('.buttons-container');
    expect(buttonsContainer).toBeInTheDocument();
    expect(buttonsContainer).toContainElement(screen.getByText("Join Game"));
  });

  it("renders the Instructions component with preGame mode", () => {
    render(
      <MemoryRouter>
        <TitleScreen />
      </MemoryRouter>
    );

    expect(screen.getByLabelText("open instructions")).toBeInTheDocument();
    expect(screen.getByTestId("pre-game-instructions")).toBeInTheDocument();
  });

  it("has correct layout structure", () => {
    render(
      <MemoryRouter>
        <TitleScreen />
      </MemoryRouter>
    );

    // Verify the main container
    const titleScreen = screen.getByText("Create Game").closest('.TitleScreen');
    expect(titleScreen).toBeInTheDocument();

    // Verify the order of elements: title -> characters -> buttons -> instructions
    const elements = titleScreen.children;
    expect(elements[0]).toHaveClass('title-image');
    expect(elements[1]).toHaveClass('characters-image');
    expect(elements[2]).toHaveClass('buttons-container');
  });

  it("instructions button is interactive", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <TitleScreen />
      </MemoryRouter>
    );

    const instructionsButton = screen.getByLabelText("open instructions");
    
    // Verify the button is in the document and can be focused
    expect(instructionsButton).toBeInTheDocument();
    
    // Test interaction
    await user.click(instructionsButton);
    // Since we're mocking the Instructions component, we're mainly testing
    // that the interaction doesn't break anything
    expect(screen.getByTestId("pre-game-instructions")).toBeInTheDocument();
  });

  it("matches the visual structure with images and buttons", () => {
    render(
      <MemoryRouter>
        <TitleScreen />
      </MemoryRouter>
    );

    // Quick snapshot of the structure
    const titleImage = screen.getByAltText("Agatha Christie's Death on the Cards");
    const charactersImage = screen.getByAltText("Characters");
    const createButton = screen.getByText("Create Game");
    const joinButton = screen.getByText("Join Game");
    const instructions = screen.getByLabelText("open instructions");

    expect(titleImage).toBeInTheDocument();
    expect(charactersImage).toBeInTheDocument();
    expect(createButton).toBeInTheDocument();
    expect(joinButton).toBeInTheDocument();
    expect(instructions).toBeInTheDocument();
  });
});