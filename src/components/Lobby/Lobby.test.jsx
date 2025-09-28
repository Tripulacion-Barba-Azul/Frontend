import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import Lobby from './Lobby';


vi.mock('../StartGameButton/StartGameButton', () => ({
    default: function MockStartGameButton({ disabled, onClick }) {
        return (
            <button 
                data-testid="start-game-button" 
                disabled={disabled} 
                onClick={onClick}
            >
                Iniciar Partida
            </button>
        );
    }
}));


global.WebSocket = vi.fn().mockImplementation(() => ({
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
}));


global.fetch = vi.fn();

describe('Lobby Component', () => {
    const mockGameData = {
        gameId: 1,
        gameName: 'Partida Test',
        ownerId: 5,
        minPlayers: 2,
        maxPlayers: 4,
        players: [
            { playerId: 5, playerName: 'Owner_test_2' },
            { playerId: 3, playerName: 'Player_test_1' }
        ]
    };

    beforeEach(() => {
        vi.clearAllMocks();
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockGameData)
        });
    });

    describe('Renderizado básico', () => {
        test('renderiza correctamente como owner', async () => {
            const ownerProps = { id: 1, playerId: 5, playerName: 'Owner_test_2' };
            
            render(<Lobby {...ownerProps} />);
            
            await waitFor(() => {
                expect(screen.getByText('Partida: Partida Test')).toBeInTheDocument();
                expect(screen.getByText('Creador de la partida: Owner_test_2')).toBeInTheDocument();
                expect(screen.getByText('Min: 2, Max: 4')).toBeInTheDocument();
                
                expect(screen.getByTestId('start-game-button')).toBeInTheDocument();
            });
        });

        test('renderiza correctamente como player', async () => {
            const playerProps = { id: 1, playerId: 3, playerName: 'Player_test_1' };
            
            render(<Lobby {...playerProps} />);
            
            await waitFor(() => {
                expect(screen.getByText('Partida: Partida Test')).toBeInTheDocument();
                expect(screen.getByText('Creador de la partida: Owner_test_2')).toBeInTheDocument();
                
                expect(screen.queryByTestId('start-game-button')).not.toBeInTheDocument();
            });
        });

        test('muestra mensaje de carga inicial', () => {
            render(<Lobby id={1} playerId={5} />);
            
            expect(screen.getByText('Cargando información del juego...')).toBeInTheDocument();
        });

        test('diferencia correctamente entre owner y player por la presencia del botón Start Game', async () => {
            
            const ownerProps = { id: 1, playerId: 5, playerName: 'Owner_test_2' };
            const { unmount } = render(<Lobby {...ownerProps} />);
            
            await waitFor(() => {
                expect(screen.getByTestId('start-game-button')).toBeInTheDocument();
            });

            
            unmount();

            
            const playerProps = { id: 1, playerId: 3, playerName: 'Player_test_1' };
            render(<Lobby {...playerProps} />);
            
            await waitFor(() => {
                expect(screen.queryByTestId('start-game-button')).not.toBeInTheDocument();
            });
        });
    });

    describe('Lógica de jugadores', () => {
        test('muestra todos los jugadores correctamente', async () => {
            const ownerProps = { id: 1, playerId: 5, playerName: 'Owner_test_2' };
            
            render(<Lobby {...ownerProps} />);
            
            await waitFor(() => {
                expect(screen.getByText('Owner_test_2')).toBeInTheDocument();
                expect(screen.getByText('Player_test_1')).toBeInTheDocument();
                expect(screen.getByText(/Jugadores en espera \(2\)/)).toBeInTheDocument();
            });
        });

        test('muestra badges correctos para owner', async () => {
            const ownerProps = { id: 1, playerId: 5, playerName: 'Owner_test_2' };
            
            render(<Lobby {...ownerProps} />);
            
            await waitFor(() => {
                expect(screen.getByText('(Creador)')).toBeInTheDocument();
                expect(screen.getByText('(Tú)')).toBeInTheDocument();
            });
        });

        test('muestra badge correcto para player normal', async () => {
            const playerProps = { id: 1, playerId: 3, playerName: 'Player_test_1' };
            
            render(<Lobby {...playerProps} />);
            
            await waitFor(() => {
                expect(screen.getByText('(Creador)')).toBeInTheDocument(); 
                expect(screen.getByText('(Tú)')).toBeInTheDocument(); 
            });
        });

        test('maneja correctamente cuando el jugador no está en la partida', async () => {
            const invalidPlayerProps = { id: 1, playerId: 999, playerName: 'InvalidPlayer' };
            
            render(<Lobby {...invalidPlayerProps} />);
            
            await waitFor(() => {
                expect(screen.getByText('No tienes acceso a esta partida')).toBeInTheDocument();
                expect(screen.queryByText('Owner_test_2')).not.toBeInTheDocument();
            });
        });

        test('muestra conteo correcto de jugadores', async () => {
            const mockGameDataWithMorePlayers = {
                ...mockGameData,
                players: [
                    { playerId: 5, playerName: 'Owner_test_2' },
                    { playerId: 3, playerName: 'Player_test_1' },
                    { playerId: 7, playerName: 'Player_test_2' }
                ]
            };
            
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockGameDataWithMorePlayers)
            });

            const ownerProps = { id: 1, playerId: 5, playerName: 'Owner_test_2' };
            
            render(<Lobby {...ownerProps} />);
            
            await waitFor(() => {
                expect(screen.getByText(/Jugadores en espera \(3\)/)).toBeInTheDocument();
            });
        });
    });

    describe('Estado de partida llena', () => {
        test('muestra badge de partida llena cuando se alcanza el máximo', async () => {
            const mockGameDataFull = {
                ...mockGameData,
                maxPlayers: 2,
                players: [
                    { playerId: 5, playerName: 'Owner_test_2' },
                    { playerId: 3, playerName: 'Player_test_1' }
                ]
            };
            
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockGameDataFull)
            });

            const ownerProps = { id: 1, playerId: 5, playerName: 'Owner_test_2' };
            
            render(<Lobby {...ownerProps} />);
            
            await waitFor(() => {
                expect(screen.getByText('- PARTIDA LLENA')).toBeInTheDocument();
            });
        });

        test('no muestra badge de partida llena cuando no se alcanza el máximo', async () => {
            const ownerProps = { id: 1, playerId: 5, playerName: 'Owner_test_2' };
            
            render(<Lobby {...ownerProps} />);
            
            await waitFor(() => {
                expect(screen.queryByText('- PARTIDA LLENA')).not.toBeInTheDocument();
            });
        });
    });

    describe('Botón de inicio (para owner)', () => {
        test('muestra el botón de inicio cuando el usuario es el owner', async () => {
            const ownerProps = { id: 1, playerId: 5, playerName: 'Owner_test_2' };
            
            render(<Lobby {...ownerProps} />);
            
            await waitFor(() => {
                expect(screen.getByTestId('start-game-button')).toBeInTheDocument();
            });
        });

        test('no muestra el botón de inicio cuando el usuario no es el owner', async () => {
            const playerProps = { id: 1, playerId: 3, playerName: 'Player_test_1' };
            
            render(<Lobby {...playerProps} />);
            
            await waitFor(() => {
                expect(screen.queryByTestId('start-game-button')).not.toBeInTheDocument();
            });
        });

        test('habilita el botón cuando se alcanza el mínimo de jugadores', async () => {
            const ownerProps = { id: 1, playerId: 5, playerName: 'Owner_test_2' };
            
            render(<Lobby {...ownerProps} />);
            
            await waitFor(() => {
                
                expect(screen.getByText(/Jugadores en espera \(2\)/)).toBeInTheDocument();
                
                const button = screen.getByTestId('start-game-button');
                expect(button).not.toBeDisabled();
            });
        });

        test('deshabilita el botón cuando no se alcanza el mínimo de jugadores', async () => {
            const mockGameDataInsufficientPlayers = {
                ...mockGameData,
                minPlayers: 4, 
                players: [
                    { playerId: 5, playerName: 'Owner_test_2' },
                    { playerId: 3, playerName: 'Player_test_1' }
                ] 
            };
            
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockGameDataInsufficientPlayers)
            });

            const ownerProps = { id: 1, playerId: 5, playerName: 'Owner_test_2' };
            
            render(<Lobby {...ownerProps} />);
            
            await waitFor(() => {
                const button = screen.getByTestId('start-game-button');
                expect(button).toBeDisabled();
            });
        });
    });

    describe('Casos edge y manejo de errores', () => {
        test('maneja error en el fetch correctamente', async () => {
            fetch.mockRejectedValueOnce(new Error('Network error'));
            
            const ownerProps = { id: 1, playerId: 5, playerName: 'Owner_test_2' };
            
            render(<Lobby {...ownerProps} />);
            
            
            expect(screen.getByText('Cargando información del juego...')).toBeInTheDocument();
        });

        test('maneja respuesta HTTP no exitosa', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 404
            });
            
            const ownerProps = { id: 1, playerId: 5, playerName: 'Owner_test_2' };
            
            render(<Lobby {...ownerProps} />);
            
            
            expect(screen.getByText('Cargando información del juego...')).toBeInTheDocument();
        });

        test('maneja correctamente cuando el owner y player actual son la misma persona', async () => {
            const ownerProps = { id: 1, playerId: 5, playerName: 'Owner_test_2' };
            
            render(<Lobby {...ownerProps} />);
            
            await waitFor(() => {
                expect(screen.getByText('Owner_test_2')).toBeInTheDocument();
                expect(screen.getByText('(Creador)')).toBeInTheDocument();
                expect(screen.getByText('(Tú)')).toBeInTheDocument();
                
                expect(screen.getByTestId('start-game-button')).toBeInTheDocument();
            });
        });

        test('renderiza mensaje cuando no hay jugadores en una partida vacía', async () => {
            const mockEmptyGameData = {
                ...mockGameData,
                players: []
            };
            
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockEmptyGameData)
            });

            const ownerProps = { id: 1, playerId: 5, playerName: 'Owner_test_2' };
            
            render(<Lobby {...ownerProps} />);
            
            await waitFor(() => {
                expect(screen.getByText('No hay jugadores en la partida')).toBeInTheDocument();
            });
        });

        test('verifica que el WebSocket se inicializa correctamente', async () => {
            const ownerProps = { id: 1, playerId: 5, playerName: 'Owner_test_2' };
            
            render(<Lobby {...ownerProps} />);
            
            
            await waitFor(() => {
                expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:8000/ws/1');
            });
        });
    });
});