
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import DrawRegularCardButton from './DrawRegularCardButton';


// Mock fetch
global.fetch = vi.fn();

// Mock router hooks
const mockUseParams = vi.fn();
const mockUseSearchParams = vi.fn();


vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => mockUseParams(),
    useSearchParams: () => mockUseSearchParams(),
  };
});


describe('DrawRegularCardButton', () => {
  beforeEach(() => {
    fetch.mockClear();
    mockUseParams.mockReturnValue({ gameId: '1' });
    mockUseSearchParams.mockReturnValue([new URLSearchParams('playerId=123')]);
  });

  const defaultProps = {
    isDrawCardPhase: true,
    playerCardCount: 3,
    onCardDrawn: vi.fn()
  };

  test('renders draw card button', () => {
    render(<DrawRegularCardButton {...defaultProps} />);
    expect(screen.getByTestId('draw-card-button')).toBeInTheDocument();
  });

  test('button is enabled when in draw card phase and player has less than 6 cards', () => {
    render(<DrawRegularCardButton {...defaultProps} />);
    const button = screen.getByTestId('draw-card-button');
    expect(button).not.toBeDisabled();
  });

  test('button is disabled when not in draw card phase', () => {
    render(<DrawRegularCardButton {...defaultProps} isDrawCardPhase={false} />);
    const button = screen.getByTestId('draw-card-button');
    expect(button).toBeDisabled();
  });

  test('button is disabled when player has 6 cards', () => {
    render(<DrawRegularCardButton {...defaultProps} playerCardCount={6} />);
    const button = screen.getByTestId('draw-card-button');
    expect(button).toBeDisabled();
  });

  test('makes API call when button is clicked', async () => {
    const mockResponse = {

    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    render(<DrawRegularCardButton {...defaultProps} />);
    
    const button = screen.getByTestId('draw-card-button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/play/1/actions/draw-card',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
          playerId: 123,
          deck: 'regular'
          })
        }
      );
    });

  });

  test('handles API error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 400
    });

    render(<DrawRegularCardButton {...defaultProps} />);
    
    const button = screen.getByTestId('draw-card-button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to draw')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  test('shows loading state during API call', async () => {
    fetch.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve({
        ok: true,
        json: async () => ({ card: 42 })
      }), 100);
    }));

    render(<DrawRegularCardButton {...defaultProps} />);
    
    const button = screen.getByTestId('draw-card-button');
    fireEvent.click(button);

    expect(button).toHaveTextContent('Tomando...');
    expect(button).toBeDisabled();
  });

});
