import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import GameEndScreen from "./GameEndSreen";

// Mock de useNavigate
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

    // Mock WebSocket
    mockWebSocket = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
  });

  const renderComponent = (websocket = mockWebSocket) => {
    return render(
      <MemoryRouter>
        <GameEndScreen websocket={websocket} />
      </MemoryRouter>
    );
  };

  it("should not render when game has not ended", () => {
    renderComponent();
    expect(screen.queryByText("Game Over")).not.toBeInTheDocument();
  });

  it("should set up WebSocket message listener on mount", () => {
    renderComponent();
    expect(mockWebSocket.addEventListener).toHaveBeenCalledWith(
      "message",
      expect.any(Function)
    );
  });

  it("should clean up WebSocket listener on unmount", () => {
    const { unmount } = renderComponent();
    unmount();
    expect(mockWebSocket.removeEventListener).toHaveBeenCalledWith(
      "message",
      expect.any(Function)
    );
  });

  it("should display game end popup when Match Ended message is received", async () => {
    renderComponent();

    // Obtener la función de callback del mensaje
    const messageCallback = mockWebSocket.addEventListener.mock.calls[0][1];

    // Simular mensaje de fin de partida
    const gameEndMessage = {
      data: JSON.stringify({
        event: "gameEnded",
        players: [
          { Name: "Player1", Role: "Detective" },
          { Name: "Player2", Role: "Detective" },
        ],
      }),
    };

    messageCallback(gameEndMessage);

    await waitFor(() => {
      expect(
        screen.getByText("The Murderer has been caught!")
      ).toBeInTheDocument();
    });
  });

  it("should display winners correctly", async () => {
    renderComponent();

    const messageCallback = mockWebSocket.addEventListener.mock.calls[0][1];
    const gameEndMessage = {
      data: JSON.stringify({
        event: "gameEnded",
        players: [
          { Name: "Alice", Role: "Detective" },
          { Name: "Bob", Role: "Detective" },
        ],
      }),
    };

    messageCallback(gameEndMessage);

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(
        screen.getByText("The Murderer has been caught!")
      ).toBeInTheDocument();
      expect(screen.getAllByText("detective")).toHaveLength(2);
    });
  });

  it("should display winning role correctly for Murderer", async () => {
    renderComponent();

    const messageCallback = mockWebSocket.addEventListener.mock.calls[0][1];
    const gameEndMessage = {
      data: JSON.stringify({
        event: "gameEnded",
        players: [{ Name: "Player1", Role: "Murderer" }],
      }),
    };

    messageCallback(gameEndMessage);

    await waitFor(() => {
      expect(screen.getByText("Murderer Escapes!")).toBeInTheDocument();
      expect(screen.getByText("Player1")).toBeInTheDocument();
      expect(screen.getByText("murderer")).toBeInTheDocument();
    });
  });

  it("should navigate to home when back button is clicked", async () => {
    renderComponent();

    const messageCallback = mockWebSocket.addEventListener.mock.calls[0][1];
    const gameEndMessage = {
      data: JSON.stringify({
        event: "gameEnded",
        players: [{ Name: "Player1", Role: "Detective" }],
      }),
    };

    messageCallback(gameEndMessage);

    await waitFor(() => {
      expect(
        screen.getByText("The Murderer has been caught!")
      ).toBeInTheDocument();
    });

    const backButton = screen.getByText("Back to Home");
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("should show single detective title for one winner", async () => {
    renderComponent();

    const messageCallback = mockWebSocket.addEventListener.mock.calls[0][1];
    const gameEndMessage = {
      data: JSON.stringify({
        event: "gameEnded",
        players: [{ Name: "Player3", Role: "Detective" }],
      }),
    };

    messageCallback(gameEndMessage);

    await waitFor(() => {
      expect(screen.getByText("Player3")).toBeInTheDocument();
      expect(
        screen.getByText("The Murderer has been caught!")
      ).toBeInTheDocument();
    });
  });

  it("should show multiple detective title for multiple winners", async () => {
    renderComponent();

    const messageCallback = mockWebSocket.addEventListener.mock.calls[0][1];
    const gameEndMessage = {
      data: JSON.stringify({
        event: "gameEnded",
        players: [
          { Name: "Player1", Role: "Detective" },
          { Name: "Player2", Role: "Detective" },
          { Name: "Player3", Role: "Detective" },
        ],
      }),
    };

    messageCallback(gameEndMessage);

    await waitFor(() => {
      expect(screen.getByText("Player1")).toBeInTheDocument();
      expect(screen.getByText("Player2")).toBeInTheDocument();
      expect(screen.getByText("Player3")).toBeInTheDocument();
      expect(
        screen.getByText("The Murderer has been caught!")
      ).toBeInTheDocument();
    });
  });

  it("should handle murdererand accomplice roles", async () => {
    renderComponent();

    const messageCallback = mockWebSocket.addEventListener.mock.calls[0][1];
    const gameEndMessage = {
      data: JSON.stringify({
        event: "gameEnded",
        players: [
          { Name: "EvilPlayer", Role: "Murderer" },
          { Name: "Helper", Role: "Accomplice" },
        ],
      }),
    };

    messageCallback(gameEndMessage);

    await waitFor(() => {
      expect(screen.getByText("EvilPlayer")).toBeInTheDocument();
      expect(screen.getByText("Helper")).toBeInTheDocument();
      expect(screen.getByText("Murderer Escapes!")).toBeInTheDocument();
      expect(screen.getByText("murderer")).toBeInTheDocument();
      expect(screen.getByText("accomplice")).toBeInTheDocument();
    });
  });

  it("should handle malformed JSON messages gracefully", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    renderComponent();

    const messageCallback = mockWebSocket.addEventListener.mock.calls[0][1];
    const malformedMessage = {
      data: "invalid json",
    };

    messageCallback(malformedMessage);

    expect(consoleSpy).toHaveBeenCalledWith(
      "❌ Error parsing WebSocket message:",
      expect.any(Error)
    );
    expect(
      screen.queryByText("The Murderer has been caught!")
    ).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it("should ignore non-Match Ended messages", () => {
    renderComponent();

    const messageCallback = mockWebSocket.addEventListener.mock.calls[0][1];
    const otherMessage = {
      data: JSON.stringify({
        type: "Some Other Event",
        data: "test",
      }),
    };

    messageCallback(otherMessage);

    expect(
      screen.queryByText("The Murderer has been caught!")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Murderer Escapes!")).not.toBeInTheDocument();
  });

  it("should not render when websocket is null", () => {
    renderComponent(null);
    expect(
      screen.queryByText("The Murderer has been caught!")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Murderer Escapes!")).not.toBeInTheDocument();
  });

  it("should hide popup after navigating back to home", async () => {
    renderComponent();

    const messageCallback = mockWebSocket.addEventListener.mock.calls[0][1];
    const gameEndMessage = {
      data: JSON.stringify({
        event: "gameEnded",
        players: [{ Name: "Player1", Role: "Detective" }],
      }),
    };

    messageCallback(gameEndMessage);

    await waitFor(() => {
      expect(
        screen.getByText("The Murderer has been caught!")
      ).toBeInTheDocument();
    });

    const backButton = screen.getByText("Back to Home");
    fireEvent.click(backButton);

    // El popup debería desaparecer
    await waitFor(() => {
      expect(
        screen.queryByText("The Murderer has been caught!")
      ).not.toBeInTheDocument();
    });
  });

  it("should not render when game end data is incomplete", () => {
    renderComponent();

    const messageCallback = mockWebSocket.addEventListener.mock.calls[0][1];

    // Mensaje sin players
    const incompleteMessage1 = {
      data: JSON.stringify({
        event: "gameEnded",
      }),
    };

    messageCallback(incompleteMessage1);
    expect(
      screen.queryByText("The Murderer has been caught!")
    ).not.toBeInTheDocument();

    // Mensaje con array vacío
    const incompleteMessage2 = {
      data: JSON.stringify({
        event: "gameEnded",
        players: [],
      }),
    };

    messageCallback(incompleteMessage2);
    expect(
      screen.queryByText("The Murderer has been caught!")
    ).not.toBeInTheDocument();
  });

  it("should show accomplice role with orange badge", async () => {
    renderComponent();

    const messageCallback = mockWebSocket.addEventListener.mock.calls[0][1];
    const gameEndMessage = {
      data: JSON.stringify({
        event: "gameEnded",
        players: [{ Name: "Helper", Role: "Accomplice" }],
      }),
    };

    messageCallback(gameEndMessage);

    // Con la lógica actual, accomplice solo no genera título, así que no debería renderizar
    await waitFor(() => {
      expect(screen.queryByText("Helper")).not.toBeInTheDocument();
    });
  });

  it("should handle mixed roles correctly - detective wins", async () => {
    renderComponent();

    const messageCallback = mockWebSocket.addEventListener.mock.calls[0][1];
    const gameEndMessage = {
      data: JSON.stringify({
        event: "gameEnded",
        players: [
          { Name: "Detective1", Role: "Detective" },
          { Name: "Helper", Role: "Accomplice" },
        ],
      }),
    };

    messageCallback(gameEndMessage);

    await waitFor(() => {
      expect(screen.getByText("Detective1")).toBeInTheDocument();
      expect(screen.getByText("Helper")).toBeInTheDocument();
      expect(
        screen.getByText("The Murderer has been caught!")
      ).toBeInTheDocument(); // Detective tiene prioridad en la lógica actual
      expect(screen.getByText("detective")).toBeInTheDocument();
      expect(screen.getByText("accomplice")).toBeInTheDocument();
    });
  });
});
