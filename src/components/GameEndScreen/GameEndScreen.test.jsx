// GameEndSreen.test.jsx
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, beforeEach, afterEach, expect } from "vitest";
import GameEndScreen from "./GameEndSreen";

/* -------------------- Mock useNavigate -------------------- */
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("GameEndScreen", () => {
  let mockWebSocket;

  beforeEach(() => {
    mockNavigate.mockClear();
    mockWebSocket = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
  });

  afterEach(() => {
    cleanup();
  });

  function renderComp(ws = mockWebSocket) {
    return render(
      <MemoryRouter>
        <GameEndScreen websocket={ws} />
      </MemoryRouter>
    );
  }

  function emitGameEnded(players, ws = mockWebSocket) {
    const cb = ws.addEventListener.mock.calls[0]?.[1];
    cb?.({
      data: JSON.stringify({
        event: "gameEnded",
        payload: players, // <-- component expects players in `payload`
      }),
    });
  }

  it("does not render anything before game end arrives", () => {
    renderComp();
    // No overlay nor button until a valid 'gameEnded' message comes
    expect(screen.queryByText("Back to Home")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("subscribes to WebSocket 'message' and cleans up on unmount", () => {
    const { unmount } = renderComp();
    expect(mockWebSocket.addEventListener).toHaveBeenCalledWith(
      "message",
      expect.any(Function)
    );
    const handler = mockWebSocket.addEventListener.mock.calls[0][1];
    unmount();
    expect(mockWebSocket.removeEventListener).toHaveBeenCalledWith(
      "message",
      handler
    );
  });

  it("shows 'The Murderer has been caught!' when one detective wins", async () => {
    renderComp();
    emitGameEnded([{ name: "Alice", role: "Detective" }]);

    await waitFor(() => {
      expect(screen.getByRole("heading").textContent).toBe(
        "The Murderer has been caught!"
      );
    });
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("detective")).toBeInTheDocument();
  });

  it("shows 'The Murderer has been caught!' when multiple detectives win", async () => {
    renderComp();
    emitGameEnded([
      { name: "Alice", role: "Detective" },
      { name: "Bob", role: "Detective" },
    ]);

    await waitFor(() => {
      expect(screen.getByRole("heading").textContent).toBe(
        "The Murderer has been caught!"
      );
    });
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getAllByText("detective")).toHaveLength(2);
  });

  it("shows 'Murderer Escapes!' when murderer (alone) wins", async () => {
    renderComp();
    emitGameEnded([{ name: "Evil", role: "Murderer" }]);

    await waitFor(() => {
      expect(screen.getByRole("heading").textContent).toBe("Murderer Escapes!");
    });
    expect(screen.getByText("Evil")).toBeInTheDocument();
    expect(screen.getByText("murderer")).toBeInTheDocument();
  });

  it("shows 'Murderer Escapes!' when murderer and accomplice win", async () => {
    renderComp();
    emitGameEnded([
      { name: "Evil", role: "Murderer" },
      { name: "Helper", role: "Accomplice" },
    ]);

    await waitFor(() => {
      expect(screen.getByRole("heading").textContent).toBe("Murderer Escapes!");
    });
    expect(screen.getByText("Evil")).toBeInTheDocument();
    expect(screen.getByText("Helper")).toBeInTheDocument();
    expect(screen.getByText("murderer")).toBeInTheDocument();
    expect(screen.getByText("accomplice")).toBeInTheDocument();
  });

  it("renders list even if only accomplices (title remains empty)", async () => {
    renderComp();
    emitGameEnded([{ name: "Helper", role: "Accomplice" }]);

    await waitFor(() => {
      // Header exists but may be empty string
      expect(screen.getByRole("heading")).toBeInTheDocument();
    });
    expect(screen.getByText("Helper")).toBeInTheDocument();
    expect(screen.getByText("accomplice")).toBeInTheDocument();
  });

  it("navigates to home and hides popup on 'Back to Home'", async () => {
    renderComp();
    emitGameEnded([{ name: "Alice", role: "Detective" }]);

    await waitFor(() => {
      expect(screen.getByText("Back to Home")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Back to Home"));
    expect(mockNavigate).toHaveBeenCalledWith("/");
    // Popup should be removed after navigate (component clears state)
    await waitFor(() => {
      expect(screen.queryByText("Back to Home")).not.toBeInTheDocument();
    });
  });

  it("handles malformed JSON gracefully (logs error, does not render)", () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    renderComp();

    const cb = mockWebSocket.addEventListener.mock.calls[0][1];
    cb({ data: "not-json" });

    expect(errSpy).toHaveBeenCalledWith(
      "❌ Error parsing WebSocket message:",
      expect.any(Error)
    );
    expect(screen.queryByText("Back to Home")).not.toBeInTheDocument();

    errSpy.mockRestore();
  });

  it("ignores non-gameEnded messages", () => {
    renderComp();
    const cb = mockWebSocket.addEventListener.mock.calls[0][1];
    cb({ data: JSON.stringify({ event: "playerJoined", payload: { id: 1 } }) });
    cb({ data: JSON.stringify({ type: "Some Other Event", data: {} }) });

    expect(screen.queryByText("Back to Home")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("does not subscribe when websocket is null", () => {
    renderComp(null);
    // Nothing crashes and nothing renders
    expect(screen.queryByText("Back to Home")).not.toBeInTheDocument();
  });

  it("does not render when payload is missing or players is empty", () => {
    renderComp();

    const cb = mockWebSocket.addEventListener.mock.calls[0][1];

    // Missing payload
    cb({ data: JSON.stringify({ event: "gameEnded" }) });
    expect(screen.queryByText("Back to Home")).not.toBeInTheDocument();

    // Empty players array
    cb({ data: JSON.stringify({ event: "gameEnded", payload: [] }) });
    expect(screen.queryByText("Back to Home")).not.toBeInTheDocument();
  });

  it("shows role badges with the expected labels", async () => {
    renderComp();
    emitGameEnded([
      { name: "D1", role: "Detective" },
      { name: "M1", role: "Murderer" },
      { name: "A1", role: "Accomplice" },
    ]);

    await waitFor(() => {
      expect(screen.getByText("detective")).toBeInTheDocument();
      expect(screen.getByText("murderer")).toBeInTheDocument();
      expect(screen.getByText("accomplice")).toBeInTheDocument();
    });
  });
});
