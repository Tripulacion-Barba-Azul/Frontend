import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom";
import JoinGameScreen from "./JoinGameScreen";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

describe("JoinGameScreen", () => {
  it("renders the join form for public games", () => {
    render(
      <MemoryRouter initialEntries={["/join/3/public"]}>
        <Routes>
          <Route path="/join/:gameId/:private" element={<JoinGameScreen />} />
        </Routes>
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
      <MemoryRouter initialEntries={["/join/3/public"]}>
        <Routes>
          <Route path="/join/:gameId/:private" element={<JoinGameScreen />} />
        </Routes>
      </MemoryRouter>
    );

    // Clear default values before submitting
    const nameInput = screen.getByLabelText(/your name/i);
    const birthdayInput = screen.getByLabelText(/your birthday/i);
    await user.clear(nameInput);
    await user.clear(birthdayInput);

    await user.click(screen.getByRole("button", { name: /join game/i }));

    expect(screen.getByText(/you must have a name/i)).toBeInTheDocument();
    expect(screen.getByText(/you must say your birthday/i)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("validates that birthday is not in the future", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn();

    render(
      <MemoryRouter initialEntries={["/join/3/public"]}>
        <Routes>
          <Route path="/join/:gameId/:private" element={<JoinGameScreen />} />
        </Routes>
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

  it("calls the API with correct data when form is valid (public game)", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        json: () => Promise.resolve({ gameId: 3, actualPlayerId: "p1" }),
      })
    );
    global.fetch = mockFetch;

    render(
      <MemoryRouter initialEntries={["/join/3/public"]}>
        <Routes>
          <Route path="/join/:gameId/:private" element={<JoinGameScreen />} />
          <Route path="/game/:gameId" element={<div>Game Screen</div>} />
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
      "http://localhost:8000/games/3/join",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          playerName: "Robotito",
          birthDate: "1990-01-01",
          avatar: 1,
          password: null, // Always included for public games with null value
        }),
      })
    );
  });

  it("calls the API with correct data including password for private games", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        json: () => Promise.resolve({ gameId: 5, actualPlayerId: "p2" }),
      })
    );
    global.fetch = mockFetch;

    render(
      <MemoryRouter initialEntries={["/join/5/private"]}>
        <Routes>
          <Route path="/join/:gameId/:private" element={<JoinGameScreen />} />
          <Route path="/game/:gameId" element={<div>Game Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Fill out the form including password field
    await user.clear(screen.getByLabelText(/your name/i));
    await user.type(screen.getByLabelText(/your name/i), "PrivatePlayer");
    await user.clear(screen.getByLabelText(/your birthday/i));
    await user.type(screen.getByLabelText(/your birthday/i), "1990-01-01");
    
    // Password field should be visible for private games
    const passwordField = screen.getByLabelText(/game password/i);
    await user.type(passwordField, "secret123");

    await user.click(screen.getByRole("button", { name: /join game/i }));

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8000/games/5/join",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          playerName: "PrivatePlayer",
          birthDate: "1990-01-01",
          avatar: 1,
          password: "secret123",
        }),
      })
    );
  });

  it("shows password field only for private games", () => {
    // Test public game - no password field
    const { unmount } = render(
      <MemoryRouter initialEntries={["/join/3/public"]}>
        <Routes>
          <Route path="/join/:gameId/:private" element={<JoinGameScreen />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByLabelText(/game password/i)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Join Game" })).toBeInTheDocument(); // Title should not have lock emoji

    unmount();

    // Test private game - password field should be visible
    render(
      <MemoryRouter initialEntries={["/join/5/private"]}>
        <Routes>
          <Route path="/join/:gameId/:private" element={<JoinGameScreen />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/game password/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Join Private Game" })).toBeInTheDocument(); // Title should have lock emoji
  });

  it("validates password is required for private games", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn();

    render(
      <MemoryRouter initialEntries={["/join/5/private"]}>
        <Routes>
          <Route path="/join/:gameId/:private" element={<JoinGameScreen />} />
        </Routes>
      </MemoryRouter>
    );

    // Fill out name and birthday but leave password empty
    await user.clear(screen.getByLabelText(/your name/i));
    await user.type(screen.getByLabelText(/your name/i), "TestUser");
    await user.clear(screen.getByLabelText(/your birthday/i));
    await user.type(screen.getByLabelText(/your birthday/i), "1990-01-01");
    
    // Leave password field empty and try to submit
    await user.click(screen.getByRole("button", { name: /join game/i }));

    expect(screen.getByText(/password is required for private games/i)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("handles API error response gracefully", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      })
    );
    global.fetch = mockFetch;
    console.error = vi.fn();

    render(
      <MemoryRouter initialEntries={["/join/3/public"]}>
        <Routes>
          <Route path="/join/:gameId/:private" element={<JoinGameScreen />} />
          <Route path="/join" element={<div>Join list</div>} />
        </Routes>
      </MemoryRouter>
    );

    await user.clear(screen.getByLabelText(/your name/i));
    await user.type(screen.getByLabelText(/your name/i), "Robotito");
    await user.clear(screen.getByLabelText(/your birthday/i));
    await user.type(screen.getByLabelText(/your birthday/i), "1990-01-01");

    await user.click(screen.getByRole("button", { name: /join game/i }));

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("handles 401 error (incorrect password) for private games", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      })
    );
    global.fetch = mockFetch;

    render(
      <MemoryRouter initialEntries={["/join/5/private"]}>
        <Routes>
          <Route path="/join/:gameId/:private" element={<JoinGameScreen />} />
          <Route path="/game/:gameId" element={<div>Game Screen</div>} />
          <Route path="/join" element={<div>Join list</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Fill out the form with correct data but wrong password
    await user.clear(screen.getByLabelText(/your name/i));
    await user.type(screen.getByLabelText(/your name/i), "TestUser");
    await user.clear(screen.getByLabelText(/your birthday/i));
    await user.type(screen.getByLabelText(/your birthday/i), "1990-01-01");
    
    const passwordField = screen.getByLabelText(/game password/i);
    await user.type(passwordField, "wrongpassword");

    await user.click(screen.getByRole("button", { name: /join game/i }));

    // Should call the API
    expect(mockFetch).toHaveBeenCalledTimes(1);
    
    // Should show the incorrect password error message
    expect(screen.getByText(/incorrect password\. please try again\./i)).toBeInTheDocument();
    
    // Should NOT navigate away (still on the same form)
    expect(screen.getByLabelText(/game password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /join game/i })).toBeInTheDocument();
  });

  it("shows 401 error message only in password field for private games", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      })
    );
    global.fetch = mockFetch;

    render(
      <MemoryRouter initialEntries={["/join/3/private"]}>
        <Routes>
          <Route path="/join/:gameId/:private" element={<JoinGameScreen />} />
        </Routes>
      </MemoryRouter>
    );

    // Fill out form and submit
    await user.clear(screen.getByLabelText(/your name/i));
    await user.type(screen.getByLabelText(/your name/i), "TestUser");
    await user.clear(screen.getByLabelText(/your birthday/i));
    await user.type(screen.getByLabelText(/your birthday/i), "1990-01-01");
    
    const passwordField = screen.getByLabelText(/game password/i);
    await user.type(passwordField, "wrongpassword");

    await user.click(screen.getByRole("button", { name: /join game/i }));

    // Check that error appears only for password, not other fields
    expect(screen.getByText(/incorrect password\. please try again\./i)).toBeInTheDocument();
    expect(screen.queryByText(/you must have a name/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/you must say your birthday/i)).not.toBeInTheDocument();
  });

  it("allows retry after 401 error", async () => {
    const user = userEvent.setup();
    
    // First call returns 401, second call succeeds
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: () => Promise.resolve({ gameId: 3, actualPlayerId: "p1" }),
      });
    
    global.fetch = mockFetch;

    render(
      <MemoryRouter initialEntries={["/join/3/private"]}>
        <Routes>
          <Route path="/join/:gameId/:private" element={<JoinGameScreen />} />
          <Route path="/game/:gameId" element={<div>Game Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Fill out form with wrong password first
    await user.clear(screen.getByLabelText(/your name/i));
    await user.type(screen.getByLabelText(/your name/i), "TestUser");
    await user.clear(screen.getByLabelText(/your birthday/i));
    await user.type(screen.getByLabelText(/your birthday/i), "1990-01-01");
    
    const passwordField = screen.getByLabelText(/game password/i);
    await user.type(passwordField, "wrongpassword");
    await user.click(screen.getByRole("button", { name: /join game/i }));

    // Should show error after first attempt
    expect(screen.getByText(/incorrect password\. please try again\./i)).toBeInTheDocument();

    // Clear password and enter correct one
    await user.clear(passwordField);
    await user.type(passwordField, "correctpassword");
    await user.click(screen.getByRole("button", { name: /join game/i }));

    // Should make two API calls
    expect(mockFetch).toHaveBeenCalledTimes(2);
    
    // Second call should have correct password
    expect(mockFetch).toHaveBeenLastCalledWith(
      "http://localhost:8000/games/3/join",
      expect.objectContaining({
        body: JSON.stringify({
          playerName: "TestUser",
          birthDate: "1990-01-01",
          avatar: 1,
          password: "correctpassword",
        }),
      })
    );
  });
});
