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
    gameName: "Batalla Épica",
    ownerName: "JugadorPro",
    minPlayers: 2,
    maxPlayers: 6,
    actualPlayers: 1 // 1 player currently
  },
  {
    gameId: 2,
    gameName: "Arena de Combate",
    ownerName: "WarriorX",
    minPlayers: 4,
    maxPlayers: 8,
    actualPlayers: 4 // 4 players currently
  },
  {
    gameId: 3,
    gameName: "Misión Secreta",
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

      expect(screen.getByText('Cargando partidas...')).toBeInTheDocument();
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
        expect(screen.getByText('Partidas Disponibles')).toBeInTheDocument();
      });

      // Check if matches are rendered
      expect(screen.getByText('Batalla Épica')).toBeInTheDocument();
      expect(screen.getByText('Arena de Combate')).toBeInTheDocument();
      expect(screen.getByText('Misión Secreta')).toBeInTheDocument();
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
        expect(screen.getByText('No hay partidas disponibles')).toBeInTheDocument();
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
        expect(screen.getByText('No hay partidas disponibles')).toBeInTheDocument();
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
        expect(screen.getByText('Partidas Disponibles')).toBeInTheDocument();
      });
    });

    it('shows correct status for waiting for players (green)', () => {
      // First match: 1/6 players, min 2 - should be green "Esperando jugadores"
      const matchCard = screen.getByText('Batalla Épica').closest('.match-card');
      expect(matchCard).toHaveTextContent('🟢 Esperando jugadores');
      expect(matchCard.querySelector('.join-button-enabled')).toBeInTheDocument();
      expect(matchCard).toHaveTextContent('Unirse a la partida');
    });

    it('shows correct status for ready to play (yellow)', () => {
      // Second match: 4/8 players, min 4 - should be yellow "Lista para jugar"
      const matchCard = screen.getByText('Arena de Combate').closest('.match-card');
      expect(matchCard).toHaveTextContent('🟡 Lista para jugar');
      expect(matchCard.querySelector('.join-button-enabled')).toBeInTheDocument();
      expect(matchCard).toHaveTextContent('Unirse a la partida');
    });

    it('shows correct status for full match (red)', () => {
      // Third match: 5/5 players, max 5 - should be red "Llena"
      const matchCard = screen.getByText('Misión Secreta').closest('.match-card');
      expect(matchCard).toHaveTextContent('🔴 Llena');
      expect(matchCard.querySelector('.join-button-disabled')).toBeInTheDocument();
      expect(matchCard).toHaveTextContent('Partida llena');
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
        expect(screen.getByText('Partidas Disponibles')).toBeInTheDocument();
      });
    });

    it('displays match creator information', () => {
      expect(screen.getAllByText('Creado por:')).toHaveLength(3);
      expect(screen.getByText('JugadorPro')).toBeInTheDocument();
      expect(screen.getByText('WarriorX')).toBeInTheDocument();
      expect(screen.getByText('ShadowHunter')).toBeInTheDocument();
    });

    it('displays correct player counts', () => {
      expect(screen.getByText('1/6 jugadores')).toBeInTheDocument();
      expect(screen.getByText('4/8 jugadores')).toBeInTheDocument();
      expect(screen.getByText('5/5 jugadores')).toBeInTheDocument();
    });

    it('displays min and max player labels', () => {
      const matchCards = screen.getAllByText(/Mín: \d+/);
      expect(matchCards).toHaveLength(3);
      
      const maxLabels = screen.getAllByText(/Máx: \d+/);
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
        expect(screen.getByText('Actualizar')).toBeInTheDocument();
      });

      // Clear previous mock calls
      mockFetch.mockClear();

      // Mock refresh response
      const refreshedData = [
        {
          gameId: 4,
          gameName: "Nueva Partida",
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
      const refreshButton = screen.getByText('Actualizar');
      fireEvent.click(refreshButton);

      // Check that button shows refreshing state
      expect(screen.getByText('Actualizando...')).toBeInTheDocument();

      // Wait for new data to load
      await waitFor(() => {
        expect(screen.getByText('Nueva Partida')).toBeInTheDocument();
      });

      // Original matches should be gone
      expect(screen.queryByText('Batalla Épica')).not.toBeInTheDocument();

      // Button should be back to normal state
      expect(screen.getByText('Actualizar')).toBeInTheDocument();
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
        expect(screen.getByText('Actualizar')).toBeInTheDocument();
      });

      mockFetch.mockClear();

      // Mock refresh error
      mockFetch.mockRejectedValueOnce(new Error('Refresh failed'));

      const refreshButton = screen.getByText('Actualizar');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByText('No hay partidas disponibles')).toBeInTheDocument();
      });

      // Button should be back to normal state
      expect(screen.getByText('Actualizar')).toBeInTheDocument();
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
        expect(screen.getByText('Partidas Disponibles')).toBeInTheDocument();
      });
    });

    it('calls handleJoinMatch when join button is clicked', () => {
      // Mock console.log to check if it's called
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const joinButtons = screen.getAllByText('Unirse a la partida');
      fireEvent.click(joinButtons[0]); // Click first available join button

      expect(consoleSpy).toHaveBeenCalledWith('Intentando unirse a la partida 1');

      consoleSpy.mockRestore();
    });

    it('disables join button for full matches', () => {
      const matchCard = screen.getByText('Misión Secreta').closest('.match-card');
      const joinButton = matchCard.querySelector('button');
      
      expect(joinButton).toBeDisabled();
      expect(joinButton).toHaveTextContent('Partida llena');
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
        expect(screen.getByText('Partidas Disponibles')).toBeInTheDocument();
      });
    });

    it('displays status legend correctly', () => {
      expect(screen.getByText('Leyenda de estados:')).toBeInTheDocument();
      expect(screen.getByText('Esperando jugadores (se puede unir, no alcanza mínimo)')).toBeInTheDocument();
      expect(screen.getByText('Lista para jugar (se puede unir, alcanza mínimo)')).toBeInTheDocument();
      expect(screen.getByText('Partida llena (no se puede unir)')).toBeInTheDocument();
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
        expect(screen.getByText('No hay partidas disponibles')).toBeInTheDocument();
      });
    });
  });
});
