import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import StartGameButton from './StartGameButton';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('StartGameButton', () => {
  const defaultProps = {
    disabled: false,
    gameId: '123',
    actualPlayerId: '456',
    onStartGame: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders the button with correct text', () => {
    render(<StartGameButton {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /start game/i });
    expect(button).toBeInTheDocument();
  });

  it('renders button as enabled when disabled prop is false', () => {
    render(<StartGameButton {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /start game/i });
    expect(button).not.toBeDisabled();
    expect(button).not.toHaveClass('disabled');
  });

  it('renders button as disabled when disabled prop is true', () => {
    render(<StartGameButton {...defaultProps} disabled={true} />);
    
    const button = screen.getByRole('button', { name: /start game/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled');
  });

  it('does not call fetch when button is disabled and clicked', async () => {
    render(<StartGameButton {...defaultProps} disabled={true} />);
    
    const button = screen.getByRole('button', { name: /start game/i });
    fireEvent.click(button);
    
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('calls fetch with correct URL and options when button is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    render(<StartGameButton {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /start game/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/games/123/start?owner_id=456',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    });
  });

  it('logs success message when API call succeeds', async () => {
    const mockResponseData = { success: true, gameId: '123' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponseData)
    });

    render(<StartGameButton {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /start game/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockConsoleLog).toHaveBeenCalledWith('Game started successfully:', mockResponseData);
    });
  });

  it('calls onStartGame callback when API call succeeds and callback is provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    const mockOnStartGame = vi.fn();
    render(<StartGameButton {...defaultProps} onStartGame={mockOnStartGame} />);
    
    const button = screen.getByRole('button', { name: /start game/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockOnStartGame).toHaveBeenCalled();
    });
  });

  it('does not call onStartGame callback when it is not provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    render(<StartGameButton {...defaultProps} onStartGame={null} />);
    
    const button = screen.getByRole('button', { name: /start game/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it('logs error when API call fails with non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400
    });

    render(<StartGameButton {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /start game/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error starting game:', 
        expect.any(Error)
      );
    });
  });

  it('logs error when fetch throws an exception', async () => {
    const mockError = new Error('Network error');
    mockFetch.mockRejectedValueOnce(mockError);

    render(<StartGameButton {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /start game/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalledWith('Error starting game:', mockError);
    });
  });

  it('does not call onStartGame callback when API call fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const mockOnStartGame = vi.fn();
    render(<StartGameButton {...defaultProps} onStartGame={mockOnStartGame} />);
    
    const button = screen.getByRole('button', { name: /start game/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalled();
    });
    
    expect(mockOnStartGame).not.toHaveBeenCalled();
  });

  it('handles different gameId and actualPlayerId values correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    const customProps = {
      ...defaultProps,
      gameId: 'game-999',
      actualPlayerId: 'player-888'
    };

    render(<StartGameButton {...customProps} />);
    
    const button = screen.getByRole('button', { name: /start game/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/games/game-999/start?owner_id=player-888',
        expect.any(Object)
      );
    });
  });
});