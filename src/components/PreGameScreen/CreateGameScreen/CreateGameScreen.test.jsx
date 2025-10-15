import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import CreateGameScreen from "./CreateGameScreen";

describe("CreateGameScreen", () => {
  it("renders all form elements correctly", () => {
    render(
      <MemoryRouter>
        <CreateGameScreen />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/game name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/minimum players/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/maximum players/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your birthday/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /choose avatar/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /selected avatar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create game/i })).toBeInTheDocument();
  });

  it("shows errors when required fields are cleared", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    render(
      <MemoryRouter>
        <CreateGameScreen />
      </MemoryRouter>
    );

    await user.clear(screen.getByLabelText(/game name/i));
    await user.clear(screen.getByLabelText(/minimum players/i));
    await user.clear(screen.getByLabelText(/maximum players/i));
    await user.clear(screen.getByLabelText(/your name/i));
    await user.clear(screen.getByLabelText(/your birthday/i));

    await user.click(screen.getByRole("button", { name: /create game/i }));

    expect(screen.getByText(/the game must have a name/i)).toBeInTheDocument();
    expect(screen.getByText(/must specify minimum players/i)).toBeInTheDocument();
    expect(screen.getByText(/must specify maximum players/i)).toBeInTheDocument();
    expect(screen.getByText(/you must have a name/i)).toBeInTheDocument();
    expect(screen.getByText(/you must say your birthday/i)).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("shows errors when names are too long", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    render(
      <MemoryRouter>
        <CreateGameScreen />
      </MemoryRouter>
    );

    await user.clear(screen.getByLabelText(/game name/i));
    await user.type(screen.getByLabelText(/game name/i), "ingenieria del software 2025 es la mejor materia wow");
    await user.clear(screen.getByLabelText(/your name/i));
    await user.type(screen.getByLabelText(/your name/i), "Supercalifragilisticoespiraleidoso");

    await user.click(screen.getByRole("button", { name: /create game/i }));

    expect(screen.getByText(/name of the game is too long/i)).toBeInTheDocument();
    expect(screen.getByText(/name too long/i)).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("validates inconsistent min/max player range", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    render(
      <MemoryRouter>
        <CreateGameScreen />
      </MemoryRouter>
    );

    await user.clear(screen.getByLabelText(/minimum players/i));
    await user.type(screen.getByLabelText(/minimum players/i), "5");
    await user.clear(screen.getByLabelText(/maximum players/i));
    await user.type(screen.getByLabelText(/maximum players/i), "3");

    await user.click(screen.getByRole("button", { name: /create game/i }));

    expect(screen.getByText(/inconsistent with max\. players/i)).toBeInTheDocument();
    expect(screen.getByText(/inconsistent with min\. players/i)).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rejects numbers out of valid range (<2 or >6)", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn();
    global.fetch = mockFetch;
  
    render(
      <MemoryRouter>
        <CreateGameScreen />
      </MemoryRouter>
    );
  
    const minPlayersInput = screen.getByLabelText(/minimum players/i);
    const maxPlayersInput = screen.getByLabelText(/maximum players/i);
    const submitButton = screen.getByRole("button", { name: /create game/i });
  
    // Test minimum players too low - HTML5 validation should prevent submission
    await user.clear(minPlayersInput);
    await user.type(minPlayersInput, "1");
    await user.click(submitButton);
    
    // The form should not submit due to HTML5 validation
    expect(mockFetch).not.toHaveBeenCalled();
  
    // Test minimum players too high
    await user.clear(minPlayersInput);
    await user.type(minPlayersInput, "7");
    await user.click(submitButton);
    
    expect(mockFetch).not.toHaveBeenCalled();
  
    // Test maximum players too low
    await user.clear(minPlayersInput);
    await user.type(minPlayersInput, "2");
    await user.clear(maxPlayersInput);
    await user.type(maxPlayersInput, "1");
    await user.click(submitButton);
    
    expect(mockFetch).not.toHaveBeenCalled();
  
    // Test maximum players too high
    await user.clear(maxPlayersInput);
    await user.type(maxPlayersInput, "7");
    await user.click(submitButton);
    
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("validates future birthday", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    render(
      <MemoryRouter>
        <CreateGameScreen />
      </MemoryRouter>
    );

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const futureDate = tomorrow.toISOString().split("T")[0];

    await user.clear(screen.getByLabelText(/your birthday/i));
    await user.type(screen.getByLabelText(/your birthday/i), futureDate);

    await user.click(screen.getByRole("button", { name: /create game/i }));

    expect(screen.getByText(/date cannot be in the future/i)).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("calls the API with correct data when form is valid", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ gameId: "g123", ownerId: "p456" }),
      })
    );
    global.fetch = mockFetch;

    render(
      <MemoryRouter>
        <CreateGameScreen />
      </MemoryRouter>
    );

    await user.clear(screen.getByLabelText(/game name/i));
    await user.type(screen.getByLabelText(/game name/i), "Test Game");
    await user.clear(screen.getByLabelText(/minimum players/i));
    await user.type(screen.getByLabelText(/minimum players/i), "2");
    await user.clear(screen.getByLabelText(/maximum players/i));
    await user.type(screen.getByLabelText(/maximum players/i), "4");
    await user.clear(screen.getByLabelText(/your name/i));
    await user.type(screen.getByLabelText(/your name/i), "Robotito");
    await user.clear(screen.getByLabelText(/your birthday/i));
    await user.type(screen.getByLabelText(/your birthday/i), "1990-01-01");

    await user.click(screen.getByRole("button", { name: /create game/i }));

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8000/games",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_info: { playerName: "Robotito", birthDate: "1990-01-01", avatar: 1 },
          game_info: { gameName: "Test Game", minPlayers: 2, maxPlayers: 4 },
        }),
      })
    );
  });

  it("handles API error correctly", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        statusText: "Internal Server Error",
        json: () => Promise.resolve({}),
      })
    );
    global.fetch = mockFetch;
    console.error = vi.fn();

    render(
      <MemoryRouter>
        <CreateGameScreen />
      </MemoryRouter>
    );

    await user.clear(screen.getByLabelText(/game name/i));
    await user.type(screen.getByLabelText(/game name/i), "Test Game");
    await user.clear(screen.getByLabelText(/your name/i));
    await user.type(screen.getByLabelText(/your name/i), "Robotito");

    await user.click(screen.getByRole("button", { name: /create game/i }));

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      "Error en la solicitud:",
      "Internal Server Error"
    );
  });
});
