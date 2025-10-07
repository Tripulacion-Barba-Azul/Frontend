import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import GameEndScreen from './GameEndSreen';

// Mock de useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('GameEndScreen', () => {
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

  it('should not render when game has not ended', () => {
    renderComponent();
    expect(screen.queryByText('¡Fin de la Partida!')).not.toBeInTheDocument();
  });

  it('should set up WebSocket message listener on mount', () => {
    renderComponent();
    expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
  });

  it('should clean up WebSocket listener on unmount', () => {
    const { unmount } = renderComponent();
    unmount();
    expect(mockWebSocket.removeEventListener).toHaveBeenCalledWith('message', expect.any(Function));
  });

  it('should display game end popup when Match Ended message is received', async () => {
    renderComponent();
    
    // Obtener la función de callback del mensaje
    const messageCallback = mockWebSocket.addEventListener.mock.calls[0][1];
    
    // Simular mensaje de fin de partida
    const gameEndMessage = {
      data: JSON.stringify({
        type: "Match Ended",
        winners: ["Player1", "Player2"],
        rol: "detective"
      })
    };
    
    messageCallback(gameEndMessage);
    
    await waitFor(() => {
      expect(screen.getByText('Ganan los detectives')).toBeInTheDocument();
    });
  });

  it('should display winners correctly', async () => {
    renderComponent();
    
    const messageCallback = mockWebSocket.addEventListener.mock.calls[0][1];
    const gameEndMessage = {
      data: JSON.stringify({
        type: "Match Ended",
        winners: ["Alice", "Bob"],
        rol: "detective"
      })
    };
    
    messageCallback(gameEndMessage);
    
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Ganan los detectives')).toBeInTheDocument();
    });
  });

  it('should display winning role correctly for assassin', async () => {
    renderComponent();
    
    const messageCallback = mockWebSocket.addEventListener.mock.calls[0][1];
    const gameEndMessage = {
      data: JSON.stringify({
        type: "Match Ended",
        winners: ["Player1"],
        rol: "asesino"
      })
    };
    
    messageCallback(gameEndMessage);
    
    await waitFor(() => {
      expect(screen.getByText('Gana el asesino')).toBeInTheDocument();
      expect(screen.getByText('Player1')).toBeInTheDocument();
    });
  });

  it('should navigate to home when back button is clicked', async () => {
    renderComponent();
    
    const messageCallback = mockWebSocket.addEventListener.mock.calls[0][1];
    const gameEndMessage = {
      data: JSON.stringify({
        type: "Match Ended",
        winners: ["Player1"],
        rol: "detective"
      })
    };
    
    messageCallback(gameEndMessage);
    
    await waitFor(() => {
      expect(screen.getByText('Gana el detective')).toBeInTheDocument();
    });
    
    const backButton = screen.getByText('Volver al Inicio');
    fireEvent.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should show single detective title for one winner', async () => {
    renderComponent();
    
    const messageCallback = mockWebSocket.addEventListener.mock.calls[0][1];
    const gameEndMessage = {
      data: JSON.stringify({
        type: "Match Ended",
        winners: ["Player3"],
        rol: "detective"
      })
    };
    
    messageCallback(gameEndMessage);
    
    await waitFor(() => {
      expect(screen.getByText('Player3')).toBeInTheDocument();
      expect(screen.getByText('Gana el detective')).toBeInTheDocument();
    });
  });

  it('should show multiple detective title for multiple winners', async () => {
    renderComponent();
    
    const messageCallback = mockWebSocket.addEventListener.mock.calls[0][1];
    const gameEndMessage = {
      data: JSON.stringify({
        type: "Match Ended",
        winners: ["Player1", "Player2", "Player3"],
        rol: "detective"
      })
    };
    
    messageCallback(gameEndMessage);
    
    await waitFor(() => {
      expect(screen.getByText('Player1')).toBeInTheDocument();
      expect(screen.getByText('Player2')).toBeInTheDocument();
      expect(screen.getByText('Player3')).toBeInTheDocument();
      expect(screen.getByText('Ganan los detectives')).toBeInTheDocument();
    });
  });

  it('should handle assassin role variations', async () => {
    renderComponent();
    
    const messageCallback = mockWebSocket.addEventListener.mock.calls[0][1];
    const gameEndMessage = {
      data: JSON.stringify({
        type: "Match Ended",
        winners: ["EvilPlayer"],
        rol: "assassin"
      })
    };
    
    messageCallback(gameEndMessage);
    
    await waitFor(() => {
      expect(screen.getByText('EvilPlayer')).toBeInTheDocument();
      expect(screen.getByText('Gana el asesino')).toBeInTheDocument();
    });
  });

  it('should handle malformed JSON messages gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderComponent();
    
    const messageCallback = mockWebSocket.addEventListener.mock.calls[0][1];
    const malformedMessage = {
      data: 'invalid json'
    };
    
    messageCallback(malformedMessage);
    
    expect(consoleSpy).toHaveBeenCalledWith('❌ Error parsing WebSocket message:', expect.any(Error));
    expect(screen.queryByText('Gana el detective')).not.toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  it('should ignore non-Match Ended messages', () => {
    renderComponent();
    
    const messageCallback = mockWebSocket.addEventListener.mock.calls[0][1];
    const otherMessage = {
      data: JSON.stringify({
        type: "Some Other Event",
        data: "test"
      })
    };
    
    messageCallback(otherMessage);
    
    expect(screen.queryByText('Gana el detective')).not.toBeInTheDocument();
    expect(screen.queryByText('Gana el asesino')).not.toBeInTheDocument();
  });

  it('should not render when websocket is null', () => {
    renderComponent(null);
    expect(screen.queryByText('Gana el detective')).not.toBeInTheDocument();
    expect(screen.queryByText('Gana el asesino')).not.toBeInTheDocument();
  });

  it('should hide popup after navigating back to home', async () => {
    renderComponent();
    
    const messageCallback = mockWebSocket.addEventListener.mock.calls[0][1];
    const gameEndMessage = {
      data: JSON.stringify({
        type: "Match Ended",
        winners: ["Player1"],
        rol: "detective"
      })
    };
    
    messageCallback(gameEndMessage);
    
    await waitFor(() => {
      expect(screen.getByText('Gana el detective')).toBeInTheDocument();
    });
    
    const backButton = screen.getByText('Volver al Inicio');
    fireEvent.click(backButton);
    
    // El popup debería desaparecer
    await waitFor(() => {
      expect(screen.queryByText('Gana el detective')).not.toBeInTheDocument();
    });
  });

  it('should not render when game end data is incomplete', () => {
    renderComponent();
    
    const messageCallback = mockWebSocket.addEventListener.mock.calls[0][1];
    
    // Mensaje sin winners
    const incompleteMessage1 = {
      data: JSON.stringify({
        type: "Match Ended",
        rol: "detective"
      })
    };
    
    messageCallback(incompleteMessage1);
    expect(screen.queryByText('Gana el detective')).not.toBeInTheDocument();
    
    // Mensaje sin rol
    const incompleteMessage2 = {
      data: JSON.stringify({
        type: "Match Ended",
        winners: ["Player1"]
      })
    };
    
    messageCallback(incompleteMessage2);
    expect(screen.queryByText('Gana el detective')).not.toBeInTheDocument();
  });
});
