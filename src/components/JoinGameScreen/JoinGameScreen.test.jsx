import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from "react-router-dom";
import '@testing-library/jest-dom'
import JoinGameScreen from './JoinGameScreen'
import userEvent from '@testing-library/user-event'

describe('JoinGameScreen', () => {
  it('should render the game creation form', () => {
    render(
      <MemoryRouter>
        <JoinGameScreen />
      </MemoryRouter>
    );
    
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/your birthday/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /join/i })).toBeInTheDocument()
  })

  it('should show error messages when required fields are empty', async () => {
    
    const user = userEvent.setup()
    const mockFetch = vi.fn()
    global.fetch = mockFetch
    render(
      <MemoryRouter>
        <JoinGameScreen />
      </MemoryRouter>
    );
    
    const submitButton = screen.getByRole('button', { name: /join/i })
    await user.click(submitButton)
    
    expect(screen.getByText(/you must have a name/i)).toBeInTheDocument()
    expect(screen.getByText(/you must say your birthday/i)).toBeInTheDocument()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should show error message when name is too long', async () => {
    
    const user = userEvent.setup()
    const mockFetch = vi.fn()
    global.fetch = mockFetch
    render(
      <MemoryRouter>
        <JoinGameScreen />
      </MemoryRouter>
    );
    
    await user.type(screen.getByLabelText(/your name/i), 'Supercalifragilisticoespiraleidoso')
    await user.type(screen.getByLabelText(/your birthday/i), '1969-04-20')

    const submitButton = screen.getByRole('button', { name: /join/i })
    await user.click(submitButton)
    
    expect(screen.getByText(/name too long! must be less than 20 characters/i)).toBeInTheDocument()
    expect(mockFetch).not.toHaveBeenCalled()

  })

  it('should validate future birthday', async () => {
    
    const user = userEvent.setup()
    const mockFetch = vi.fn()
    global.fetch = mockFetch
    render(
      <MemoryRouter>
        <JoinGameScreen />
      </MemoryRouter>
    );
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const futureDate = tomorrow.toISOString().split('T')[0]
    
    await user.type(screen.getByLabelText(/your name/i), 'Test Player')
    await user.type(screen.getByLabelText(/your birthday/i), futureDate)
    
    const submitButton = screen.getByRole('button', { name: /join/i })
    await user.click(submitButton)
    
    expect(screen.getByText(/date cannot be in the future/i)).toBeInTheDocument()
    expect(mockFetch).not.toHaveBeenCalled()

  })
})

it('should call the API with correct data when form is valid', async () => {
  const user = userEvent.setup()
  const mockFetch = vi.fn(() =>
    Promise.resolve({ ok: true, status: 200, statusText: 'OK' })
  )
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
  expect(mockFetch).toHaveBeenCalledWith(
    expect.stringMatching(/http:\/\/localhost:8000\/games\/\d+\/join/),
    expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        { playerName: 'Esta locuraaa...', 
          birthDate: '2022-12-18' })
    })
  )
})

it('should handle API error response', async () => {
  const user = userEvent.setup()
  const mockFetch = vi.fn(() =>
    Promise.resolve({ ok: false, status: 400, statusText: 'Internal Server Error' })
  )
  global.fetch = mockFetch
  console.error = vi.fn() // silenciar error esperado en consola

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
  expect(console.error).toHaveBeenCalledWith(
    'Error en la solicitud:',
    expect.any(Error)
  )
})