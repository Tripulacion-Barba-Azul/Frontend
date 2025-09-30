import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from "react-router-dom";
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import JoinGameScreen from '../../components/JoinGameScreen/JoinGameScreen'
import TitleScreen from '../../components/TitleScreen/TitleScreen';
import CreateGameScreen from '../../components/CreateGameScreen/CreateGameScreen'
import GameMatchesList from '../../components/GameMatchesList/GameMatchesList';
import { expect, vi } from "vitest";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockBackendData = 
    [{
      gameId: 1,
      gameName: "Batalla Épica",
      ownerName: "JugadorPro",
      minPlayers: 2,
      maxPlayers: 6,
      actualPlayers: 1 
    }];

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Routing Test', () => {
    it('Create game button on title screen navigates to /create when Create Game is clicked', async () =>{
        const user = userEvent.setup();

        render(
              <MemoryRouter>
                <TitleScreen />
              </MemoryRouter>
            );

        const button = screen.getByRole("button", { name: /create game/i });
        await user.click(button);
        
        expect(mockNavigate).toHaveBeenCalledWith("/create");
    });

    it('Join game button on title screen navigates to /join when Join Game is clicked', async () =>{
        const user = userEvent.setup();

        render(
              <MemoryRouter>
                <TitleScreen />
              </MemoryRouter>
            );

        const button = screen.getByRole("button", { name: /join game/i });
        await user.click(button);
        
        expect(mockNavigate).toHaveBeenCalledWith("/join");
    });

    it('Game list navigates to /join/:id when Join is clicked', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => [mockBackendData]   
        });
      
        render(
          <MemoryRouter>
            <GameMatchesList />
          </MemoryRouter>
        );
      
        const joinButtons = await screen.findAllByRole('button', { name: /unirse a la partida/i });
        await userEvent.click(joinButtons[0]);
      
        expect(mockNavigate).toHaveBeenCalledWith(`/join/${mockBackendData.gameId}`);
      });

      it('join game navigates to /join/:id when encounters an errror', async () => {
        const user = userEvent.setup()
        const mockFetch = vi.fn(() =>
          Promise.resolve({ ok: false, status: 400, statusText: 'Int    ernal Server Error' })
        )
        global.fetch = mockFetch;
        console.error = vi.fn() 
      
        render(
          <MemoryRouter>
            <JoinGameScreen />
          </MemoryRouter>
        );
      
        await user.type(screen.getByLabelText(/your name/i), 'Robotito')
        await user.type(screen.getByLabelText(/your birthday/i), '1990-01-01')
      
        const submitButton = screen.getByRole('button', { name: /join/i })
        await user.click(submitButton)
      
        expect(mockFetch).toHaveBeenCalledTimes(1)
        expect(mockNavigate).toHaveBeenCalledWith(`/join`);
      })

      it('join game navigates to /join/:id?playerId=... when succesfull', async () => {
        const user = userEvent.setup()
        const mockFetch = vi.fn(() =>
        Promise.resolve({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => ({
              actualPlayerId: 42,
              gameId: 3
            })
          })
        );
        global.fetch = mockFetch
      
        render(
          <MemoryRouter initialEntries={["/join/3"]}>
            <Routes>
              <Route path="/join/:gameId" element={<JoinGameScreen />} />
            </Routes>
          </MemoryRouter>
        );
      
        await user.type(screen.getByLabelText(/your name/i), 'Esta locuraaa...')
        await user.type(screen.getByLabelText(/your birthday/i), '2022-12-18')
      
        const submitButton = screen.getByRole('button', { name: /join/i })
        await user.click(submitButton)
      
        expect(mockFetch).toHaveBeenCalledTimes(1)
        expect(mockNavigate).toHaveBeenCalledWith(`/game/3?playerId=42`);
        
      })

      it('create game navigates to /game/:id?playerId=... when succesfull', async () => {
        const user = userEvent.setup()
        const mockFetch = vi.fn(() =>
        Promise.resolve({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => ({
              actualPlayerId: 42,
              gameId: 3
            })
          })
        );
        global.fetch = mockFetch
      
        render(
          <MemoryRouter>
            <CreateGameScreen />
          </MemoryRouter>
        );
        await user.type(screen.getByLabelText(/game name/i), 'Test Game')
        await user.type(screen.getByLabelText(/minimum players/i), '2')
        await user.type(screen.getByLabelText(/maximum players/i), '4') 
        await user.type(screen.getByLabelText(/your name/i), 'Robotito')
        await user.type(screen.getByLabelText(/your birthday/i), '1990-01-01')
      
        const submitButton = screen.getByRole('button', { name: /create/i })
        await user.click(submitButton)
      
        expect(mockFetch).toHaveBeenCalledTimes(1)
        expect(mockNavigate).toHaveBeenCalledWith(`/game/3?playerId=42`);
      })
      
      it('create game should navigate to / when encounters an errror', async () => {
        const user = userEvent.setup()
        const mockFetch = vi.fn(() =>
          Promise.resolve({ ok: false, status: 400, statusText: 'Internal Server Error' })
        )
        global.fetch = mockFetch
        console.error = vi.fn() 
      
        render(
          <MemoryRouter>
            <CreateGameScreen />
          </MemoryRouter>
        );
        await user.type(screen.getByLabelText(/game name/i), 'Test Game')
        await user.type(screen.getByLabelText(/minimum players/i), '2')
        await user.type(screen.getByLabelText(/maximum players/i), '4') 
        await user.type(screen.getByLabelText(/your name/i), 'Robotito')
        await user.type(screen.getByLabelText(/your birthday/i), '1990-01-01')
      
        const submitButton = screen.getByRole('button', { name: /create/i })
        await user.click(submitButton)
      
        expect(mockFetch).toHaveBeenCalledTimes(1)
        expect(mockNavigate).toHaveBeenCalledWith(`/`);
      })
})
