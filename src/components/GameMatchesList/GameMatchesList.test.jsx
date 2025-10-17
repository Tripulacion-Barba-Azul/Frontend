import React from 'react';
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import GameMatchesList from './GameMatchesList';

// Setup testing environment
beforeAll(() => {
  // Extend expect with jest-dom matchers
  expect.extend(matchers);
  
  // Setup jsdom environment
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock data matching the new API format
const mockBackendData = [
  {
    gameId: 1,
    gameName: "Epic Battle",
    ownerName: "PlayerPro",
    minPlayers: 2,
    maxPlayers: 6,
    actualPlayers: 1 // 1 player currently
  },
  {
    gameId: 2,
    gameName: "Combat Arena",
    ownerName: "WarriorX",
    minPlayers: 4,
    maxPlayers: 8,
    actualPlayers: 4 // 4 players currently
  },
  {
    gameId: 3,
    gameName: "Secret Mission",
    ownerName: "ShadowHunter",
    minPlayers: 3,
    maxPlayers: 5,
    actualPlayers: 5 // 5 players - full
  }
];

describe('GameMatchesList', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Loading', () => {
    it('shows loading spinner on initial load', () => {
      // Mock fetch to return a pending promise
      mockFetch.mockReturnValue(new Promise(() => {}));

      render(
        <MemoryRouter>
          <GameMatchesList />
        </MemoryRouter>
      );

      expect(screen.getByText('Loading games...')).toBeInTheDocument();
      expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
    });

    it('renders matches after successful fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBackendData
      });

      render(
        <MemoryRouter>
          <GameMatchesList />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('List of games')).toBeInTheDocument();
      });

      // Check if matches are rendered
      expect(screen.getByText('Epic Battle')).toBeInTheDocument();
      expect(screen.getByText('Combat Arena')).toBeInTheDocument();
      expect(screen.getByText('Secret Mission')).toBeInTheDocument();
    });

    it('shows empty state when no matches available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      render(
        <MemoryRouter>
          <GameMatchesList />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('There are no available games')).toBeInTheDocument();
      });

      expect(screen.getByText('🎮')).toBeInTheDocument();
    });

    it('handles fetch error gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(
        <MemoryRouter>
          <GameMatchesList />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(screen.getByText('There are no available games')).toBeInTheDocument();
      });
    });
  });

  describe('Match Status Logic', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBackendData
      });

      render(
        <MemoryRouter>
          <GameMatchesList />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(screen.getByText('List of games')).toBeInTheDocument();
      });
    });

    it('shows correct status for waiting for players (green)', () => {
      // First match: 1/6 players, min 2 - should be green with only icon (no text)
      const matchCard = screen.getByText('Epic Battle').closest('.match-card');
      const statusElement = matchCard.querySelector('.match-status');
      expect(statusElement).toHaveTextContent('🟢');
      expect(statusElement).not.toHaveTextContent('Waiting for players'); // No text in status
      expect(matchCard.querySelector('.join-button-enabled')).toBeInTheDocument();
      expect(matchCard).toHaveTextContent('Join Game');
    });

    it('shows correct status for ready to play (yellow)', () => {
      // Second match: 4/8 players, min 4 - should be yellow with only icon (no text)
      const matchCard = screen.getByText('Combat Arena').closest('.match-card');
      const statusElement = matchCard.querySelector('.match-status');
      expect(statusElement).toHaveTextContent('🟡');
      expect(statusElement).not.toHaveTextContent('Ready to play'); // No text in status
      expect(matchCard.querySelector('.join-button-enabled')).toBeInTheDocument();
      expect(matchCard).toHaveTextContent('Join Game');
    });

    it('shows correct status for full match (red)', () => {
      // Third match: 5/5 players, max 5 - should be red with only icon (no text)
      const matchCard = screen.getByText('Secret Mission').closest('.match-card');
      const statusElement = matchCard.querySelector('.match-status');
      expect(statusElement).toHaveTextContent('🔴');
      expect(statusElement).not.toHaveTextContent('Game is full'); // No text in status
      expect(matchCard.querySelector('.join-button-disabled')).toBeInTheDocument();
      expect(matchCard).toHaveTextContent('Game is full');
    });
  });

  describe('Match Information Display', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBackendData
      });

      render(
        <MemoryRouter>
          <GameMatchesList />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(screen.getByText('List of games')).toBeInTheDocument();
      });
    });

    it('displays match creator information', () => {
      expect(screen.getAllByText('Created by:')).toHaveLength(3);
      expect(screen.getByText('PlayerPro')).toBeInTheDocument();
      expect(screen.getByText('WarriorX')).toBeInTheDocument();
      expect(screen.getByText('ShadowHunter')).toBeInTheDocument();
    });

    it('displays correct player counts', () => {
      expect(screen.getByText('1/6 players')).toBeInTheDocument();
      expect(screen.getByText('4/8 players')).toBeInTheDocument();
      expect(screen.getByText('5/5 players')).toBeInTheDocument();
    });

    it('displays min and max player labels', () => {
      const matchCards = screen.getAllByText(/Min: \d+/);
      expect(matchCards).toHaveLength(3);
      
      const maxLabels = screen.getAllByText(/Max: \d+/);
      expect(maxLabels).toHaveLength(3);
    });
  });

  describe('Refresh Functionality', () => {
    it('refreshes matches when refresh button is clicked', async () => {
      // Initial load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBackendData
      });

      render(
        <MemoryRouter>
          <GameMatchesList />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });

      // Clear previous mock calls
      mockFetch.mockClear();

      // Mock refresh response
      const refreshedData = [
        {
          gameId: 4,
          gameName: "New Game",
          ownerName: "NewPlayer",
          minPlayers: 2,
          maxPlayers: 4,
          actualPlayers: 2
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => refreshedData
      });

      // Click refresh button
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      // Check that button shows refreshing state
      expect(screen.getByText('Refreshing...')).toBeInTheDocument();

      // Wait for new data to load
      await waitFor(() => {
        expect(screen.getByText('New Game')).toBeInTheDocument();
      });

      // Original matches should be gone
      expect(screen.queryByText('Epic Battle')).not.toBeInTheDocument();

      // Button should be back to normal state
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('handles refresh error gracefully', async () => {
      // Initial successful load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBackendData
      });

      render(
        <MemoryRouter>
          <GameMatchesList />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });

      mockFetch.mockClear();

      // Mock refresh error
      mockFetch.mockRejectedValueOnce(new Error('Refresh failed'));

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByText('There are no available games')).toBeInTheDocument();
      });

      // Button should be back to normal state
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
  });

  describe('Join Match Functionality', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBackendData
      });

      render(
        <MemoryRouter>
          <GameMatchesList />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(screen.getByText('List of games')).toBeInTheDocument();
      });
    });

    it('calls handleJoinMatch when join button is clicked', () => {
      // Mock console.log to check if it's called
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const joinButtons = screen.getAllByText('Join Game');
      fireEvent.click(joinButtons[0]); // Click first available join button

      expect(consoleSpy).toHaveBeenCalledWith('Trying to join the game 1');

      consoleSpy.mockRestore();
    });

    it('disables join button for full matches', () => {
      const matchCard = screen.getByText('Secret Mission').closest('.match-card');
      const joinButton = matchCard.querySelector('button');
      
      expect(joinButton).toBeDisabled();
      expect(joinButton).toHaveTextContent('Game is full');
    });

    it('enables join button for non-full matches', () => {
      const matchCard = screen.getByText('Epic Battle').closest('.match-card');
      const joinButton = matchCard.querySelector('button');
      
      expect(joinButton).toBeEnabled();
      expect(joinButton).toHaveTextContent('Join Game');
    });
  });

  describe('Legend Display', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBackendData
      });

      render(
        <MemoryRouter>
          <GameMatchesList />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(screen.getByText('List of games')).toBeInTheDocument();
      });
    });

    it('displays status legend correctly', () => {
      expect(screen.getByText('Statuses:')).toBeInTheDocument();
      expect(screen.getByText(/Waiting for players/)).toBeInTheDocument();
      expect(screen.getByText(/Ready to play/)).toBeInTheDocument();
      expect(screen.getByText(/Game full/)).toBeInTheDocument();
      
      // Check for line breaks in legend text
      const legendItems = screen.getAllByText(/can join|can't join/);
      expect(legendItems).toHaveLength(3);
    });

    it('displays legend color dots', () => {
      expect(document.querySelector('.legend-dot-green')).toBeInTheDocument();
      expect(document.querySelector('.legend-dot-yellow')).toBeInTheDocument();
      expect(document.querySelector('.legend-dot-red')).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('makes correct API call on component mount', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      render(
        <MemoryRouter>
          <GameMatchesList />
        </MemoryRouter>
      );
      
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/games', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    });

    it('handles HTTP error status correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      render(
        <MemoryRouter>
          <GameMatchesList />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(screen.getByText('There are no available games')).toBeInTheDocument();
      });
    });
  });

  describe('Background and Styling', () => {
    it('applies background image to container', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBackendData
      });
  
      render(
        <MemoryRouter>
          <GameMatchesList />
        </MemoryRouter>
      );
  
      await waitFor(() => {
        expect(screen.getByText('List of games')).toBeInTheDocument();
      });
  
      const container = screen.getByText('List of games').closest('.matches-container');
      expect(container).toHaveStyle({
        background: "url('/Assets/background_pregame.jpg') no-repeat center center fixed"
      });
      // backgroundSize is part of the background shorthand, not a separate property
    });
  
    it('applies background image to loading container', () => {
      mockFetch.mockReturnValue(new Promise(() => {}));
  
      render(
        <MemoryRouter>
          <GameMatchesList />
        </MemoryRouter>
      );
  
      const loadingContainer = screen.getByText('Loading games...').closest('.loading-container');
      expect(loadingContainer).toHaveStyle({
        background: "url('/Assets/background_pregame.jpg') no-repeat center center fixed"
      });
      // backgroundSize is part of the background shorthand, not a separate property
    });
  });

  describe('Progress Bar Display', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBackendData
      });

      render(
        <MemoryRouter>
          <GameMatchesList />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(screen.getByText('List of games')).toBeInTheDocument();
      });
    });

    it('displays progress bars with correct colors', () => {
      const progressBars = document.querySelectorAll('.progress-fill');
      expect(progressBars).toHaveLength(3);
      
      // Check that progress bars have appropriate classes
      expect(progressBars[0]).toHaveClass('progress-green');
      expect(progressBars[1]).toHaveClass('progress-yellow');
      expect(progressBars[2]).toHaveClass('progress-red');
    });

    it('calculates progress bar width correctly', () => {
      const progressBars = document.querySelectorAll('.progress-fill');
      
      // First match: 1/6 players = ~16.67% width
      expect(progressBars[0]).toHaveStyle('width: 16.666666666666664%');
      
      // Second match: 4/8 players = 50% width
      expect(progressBars[1]).toHaveStyle('width: 50%');
      
      // Third match: 5/5 players = 100% width
      expect(progressBars[2]).toHaveStyle('width: 100%');
    });
  });
});