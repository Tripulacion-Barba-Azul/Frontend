import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CancelGameButton from './CancelGameButton';

// Mock fetch globally
global.fetch = vi.fn();

describe('CancelGameButton', () => {
  const mockOnCancelGame = vi.fn();
  const defaultProps = {
    disabled: false,
    gameId: 'test-game-123',
    actualPlayerId: 'player-456',
    onCancelGame: mockOnCancelGame
  };

  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockClear();
  });

  it('renders cancel game button with correct text', () => {
    render(<CancelGameButton {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /cancel game/i });
    expect(button).toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    render(<CancelGameButton {...defaultProps} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('CancelGameButton');
    expect(button).not.toHaveClass('disabled');
  });

  it('applies disabled class when disabled prop is true', () => {
    render(<CancelGameButton {...defaultProps} disabled={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('CancelGameButton');
    expect(button).toHaveClass('disabled');
    expect(button).toBeDisabled();
  });

  it('calls fetch with correct URL and parameters when clicked', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    render(<CancelGameButton {...defaultProps} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `http://localhost:8000/games/${defaultProps.gameId}/delete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            playerId: defaultProps.actualPlayerId
          })
        }
      );
    });
  });

  it('calls onCancelGame callback when request succeeds', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    render(<CancelGameButton {...defaultProps} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnCancelGame).toHaveBeenCalled();
    });
  });

  it('does not make request when button is disabled', () => {
    render(<CancelGameButton {...defaultProps} disabled={true} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(fetch).not.toHaveBeenCalled();
    expect(mockOnCancelGame).not.toHaveBeenCalled();
  });

  it('handles fetch errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<CancelGameButton {...defaultProps} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error canceling game:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('handles HTTP errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    render(<CancelGameButton {...defaultProps} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error canceling game:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('works without onCancelGame callback', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    const propsWithoutCallback = { ...defaultProps, onCancelGame: undefined };
    render(<CancelGameButton {...propsWithoutCallback} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    // Should not throw error even without callback
  });
});
