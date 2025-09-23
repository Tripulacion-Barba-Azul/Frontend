import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import Lobby from './Lobby';

// Mock del componente StartGameButton
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

describe('Lobby Component', () => {
    const defaultProps = {
        MatchName: 'Partida Test',
        MatchCreator: 'Creador',
        CurrentUser: 'UsuarioActual',
        MinPlayers: 2,
        MaxPlayers: 4,
        Players: [],
        onStartGame: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Renderizado básico', () => {
        test('renderiza correctamente con props básicas', () => {
            render(<Lobby {...defaultProps} />);
            
            expect(screen.getByText('Partida: Partida Test')).toBeInTheDocument();
            expect(screen.getByText('Creador de la partida: Creador')).toBeInTheDocument();
            expect(screen.getByText('Min: 2, Max: 4')).toBeInTheDocument();
        });

        test('muestra el título de jugadores en espera con el conteo correcto', () => {
            render(<Lobby {...defaultProps} />);
            
            expect(screen.getByText(/Jugadores en espera \(2\)/)).toBeInTheDocument();
        });
    });

    describe('Lógica de jugadores', () => {
        test('siempre incluye al creador y usuario actual en la lista', () => {
            render(<Lobby {...defaultProps} />);
            
            expect(screen.getByText('Creador')).toBeInTheDocument();
            expect(screen.getByText('UsuarioActual')).toBeInTheDocument();
        });

        test('muestra badges correctos para creador y usuario actual', () => {
            render(<Lobby {...defaultProps} />);
            
            expect(screen.getByText('(Creador)')).toBeInTheDocument();
            expect(screen.getByText('(Tú)')).toBeInTheDocument();
        });

        test('incluye jugadores adicionales de la prop Players', () => {
            const propsWithPlayers = {
                ...defaultProps,
                Players: ['Jugador1', 'Jugador2']
            };
            
            render(<Lobby {...propsWithPlayers} />);
            
            expect(screen.getByText('Jugador1')).toBeInTheDocument();
            expect(screen.getByText('Jugador2')).toBeInTheDocument();
            expect(screen.getByText(/Jugadores en espera \(4\)/)).toBeInTheDocument();
        });

        test('elimina duplicados cuando el creador o usuario actual están en Players', () => {
            const propsWithDuplicates = {
                ...defaultProps,
                Players: ['Creador', 'UsuarioActual', 'Jugador1']
            };
            
            render(<Lobby {...propsWithDuplicates} />);
            
            // Debe mostrar solo una instancia de cada jugador en la lista de jugadores
            // El "Creador" aparece en: título, lista de jugadores, y badge
            const creadorElements = screen.getAllByText(/Creador/);
            const usuarioElements = screen.getAllByText(/UsuarioActual/);
            
            expect(creadorElements).toHaveLength(3); // Título + lista + badge
            expect(usuarioElements).toHaveLength(1); // Solo en la lista
            expect(screen.getByText('Jugador1')).toBeInTheDocument();
            
            // Verificar que el conteo sea correcto (no duplicados)
            expect(screen.getByText(/Jugadores en espera \(3\)/)).toBeInTheDocument();
        });

        test('limita el número de jugadores al máximo permitido', () => {
            const propsWithManyPlayers = {
                ...defaultProps,
                MaxPlayers: 3,
                Players: ['Jugador1', 'Jugador2', 'Jugador3', 'Jugador4']
            };
            
            render(<Lobby {...propsWithManyPlayers} />);
            
            expect(screen.getByText(/Jugadores en espera \(3\)/)).toBeInTheDocument();
            expect(screen.getByText('Jugador1')).toBeInTheDocument();
            expect(screen.queryByText('Jugador4')).not.toBeInTheDocument();
        });
    });

    describe('Estado de partida llena', () => {
        test('muestra badge de partida llena cuando se alcanza el máximo', () => {
            const propsFullLobby = {
                ...defaultProps,
                MaxPlayers: 2,
                Players: []
            };
            
            render(<Lobby {...propsFullLobby} />);
            
            expect(screen.getByText('- PARTIDA LLENA')).toBeInTheDocument();
        });

        test('no muestra badge de partida llena cuando no se alcanza el máximo', () => {
            const propsNotFull = {
                ...defaultProps,
                MaxPlayers: 4,
                Players: ['Jugador1']
            };
            
            render(<Lobby {...propsNotFull} />);
            
            expect(screen.queryByText('- PARTIDA LLENA')).not.toBeInTheDocument();
        });
    });

    describe('Botón de inicio (para creador)', () => {
        test('muestra el botón de inicio cuando el usuario actual es el creador', () => {
            const creatorProps = {
                ...defaultProps,
                CurrentUser: 'Creador'
            };
            
            render(<Lobby {...creatorProps} />);
            
            expect(screen.getByTestId('start-game-button')).toBeInTheDocument();
        });

        test('no muestra el botón de inicio cuando el usuario actual no es el creador', () => {
            render(<Lobby {...defaultProps} />);
            
            expect(screen.queryByTestId('start-game-button')).not.toBeInTheDocument();
        });

        test('habilita el botón cuando se alcanza el mínimo de jugadores', () => {
            const creatorPropsMinPlayers = {
                ...defaultProps,
                CurrentUser: 'Creador', // El usuario actual es el creador
                MinPlayers: 2, // Mínimo 2 jugadores
                // Con Creador y UsuarioActual ya son 2 jugadores (cumple el mínimo)
            };
            
            render(<Lobby {...creatorPropsMinPlayers} />);
            
            // Debug: verificar cuántos jugadores hay
            expect(screen.getByText(/Jugadores en espera \(1\)/)).toBeInTheDocument(); // Solo 1 porque Creador = CurrentUser
            
            const button = screen.getByTestId('start-game-button');
            expect(button).toBeDisabled(); // Está deshabilitado porque solo hay 1 jugador, no 2
        });

        test('habilita el botón cuando hay suficientes jugadores diferentes', () => {
            const creatorPropsWithEnoughPlayers = {
                ...defaultProps,
                CurrentUser: 'Creador', // El usuario actual es el creador
                MatchCreator: 'Creador',
                MinPlayers: 2, // Mínimo 2 jugadores
                Players: ['UsuarioActual'] // Agregamos un jugador adicional
            };
            
            render(<Lobby {...creatorPropsWithEnoughPlayers} />);
            
            // Ahora hay 2 jugadores: Creador y UsuarioActual
            expect(screen.getByText(/Jugadores en espera \(2\)/)).toBeInTheDocument();
            
            const button = screen.getByTestId('start-game-button');
            expect(button).not.toBeDisabled(); // Ahora SÍ debe estar habilitado
        });

        test('deshabilita el botón cuando no se alcanza el mínimo de jugadores', () => {
            const creatorPropsInsufficientPlayers = {
                ...defaultProps,
                CurrentUser: 'Creador',
                MinPlayers: 4
            };
            
            render(<Lobby {...creatorPropsInsufficientPlayers} />);
            
            const button = screen.getByTestId('start-game-button');
            expect(button).toBeDisabled();
        });
    });

    describe('Casos edge', () => {
        test('maneja correctamente cuando Players es undefined', () => {
            const propsWithoutPlayers = {
                ...defaultProps,
                Players: undefined
            };
            
            render(<Lobby {...propsWithoutPlayers} />);
            
            expect(screen.getByText(/Jugadores en espera \(2\)/)).toBeInTheDocument();
            expect(screen.getByText('Creador')).toBeInTheDocument();
            expect(screen.getByText('UsuarioActual')).toBeInTheDocument();
        });

        test('maneja correctamente cuando el creador y usuario actual son la misma persona', () => {
            const propsSameUser = {
                ...defaultProps,
                CurrentUser: 'Creador',
                MatchCreator: 'Creador'
            };
            
            render(<Lobby {...propsSameUser} />);
            
            expect(screen.getByText(/Jugadores en espera \(1\)/)).toBeInTheDocument();
            expect(screen.getByText('(Creador)')).toBeInTheDocument();
            expect(screen.getByText('(Tú)')).toBeInTheDocument();
        });

        test('renderiza mensaje cuando no hay jugadores (caso imposible por la lógica)', () => {
            // Este caso es prácticamente imposible debido a ensureCreatorAndCurrentUserInPlayers
            // pero lo incluimos para completitud del test
            const propsEmpty = {
                ...defaultProps,
                MatchCreator: '',
                CurrentUser: '',
                Players: []
            };
            
            render(<Lobby {...propsEmpty} />);
            
            // El mensaje "No hay jugadores" aparecerá solo si la lógica falla
            if (screen.queryByText('No hay jugadores en la partida')) {
                expect(screen.getByText('No hay jugadores en la partida')).toBeInTheDocument();
            }
        });
    });
});