import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom";
import JoinGameScreen from "./JoinGameScreen";
import userEvent from "@testing-library/user-event";

describe("JoinGameScreen", () => {
  it("renders the join form", () => {
    render(
      <MemoryRouter>
        <JoinGameScreen />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your birthday/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /choose avatar/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /selected avatar/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /join game/i })
    ).toBeInTheDocument();
  });

  it("shows error messages when required fields are empty", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn();

    render(
      <MemoryRouter>
        <JoinGameScreen />
      </MemoryRouter>
    );

    // Clear default values before submitting
    const nameInput = screen.getByLabelText(/your name/i);
    const birthdayInput = screen.getByLabelText(/your birthday/i);
    await user.clear(nameInput);
    await user.clear(birthdayInput);

    await user.click(screen.getByRole("button", { name: /join game/i }));

    expect(
      screen.getByText(/you must have a name/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/you must say your birthday/i)
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("validates that birthday is not in the future", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn();

    render(
      <MemoryRouter>
        <JoinGameScreen />
      </MemoryRouter>
    );

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const futureDate = tomorrow.toISOString().split("T")[0];

    await user.clear(screen.getByLabelText(/your name/i));
    await user.type(screen.getByLabelText(/your name/i), "Tester");
    await user.clear(screen.getByLabelText(/your birthday/i));
    await user.type(screen.getByLabelText(/your birthday/i), futureDate);

    await user.click(screen.getByRole("button", { name: /join game/i }));

    // Match real text from your UI
    expect(
      screen.getByText(/date cannot be in the future/i)
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("calls the API with correct data when form is valid", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn(() =>
      Promise.resolve({ ok: true, status: 200, statusText: "OK" })
    );
    global.fetch = mockFetch;

    render(
      <MemoryRouter initialEntries={["/join/3"]}>
        <Routes>
          <Route path="/join/:gameId" element={<JoinGameScreen />} />
        </Routes>
      </MemoryRouter>
    );

    await user.clear(screen.getByLabelText(/your name/i));
    await user.type(screen.getByLabelText(/your name/i), "Robotito");
    await user.clear(screen.getByLabelText(/your birthday/i));
    await user.type(screen.getByLabelText(/your birthday/i), "1990-01-01");

    await user.click(screen.getByRole("button", { name: /join game/i }));

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/http:\/\/localhost:8000\/games\/3\/join/),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName: "Robotito",
          birthDate: "1990-01-01",
          avatar: 1,
        }),
      })
    );
  });

  it("handles API error response gracefully", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        statusText: "Internal Server Error",
      })
    );
    global.fetch = mockFetch;
    console.error = vi.fn();

    render(
      <MemoryRouter>
        <JoinGameScreen />
      </MemoryRouter>
    );

    await user.clear(screen.getByLabelText(/your name/i));
    await user.type(screen.getByLabelText(/your name/i), "Robotito");
    await user.clear(screen.getByLabelText(/your birthday/i));
    await user.type(screen.getByLabelText(/your birthday/i), "1990-01-01");

    await user.click(screen.getByRole("button", { name: /join game/i }));

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      "Error joining game:",
      expect.anything()
    );
  });
});
