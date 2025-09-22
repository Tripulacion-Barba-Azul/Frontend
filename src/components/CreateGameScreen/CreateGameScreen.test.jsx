import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import CreateGameScreen from './CreateGameScreen'
import userEvent from '@testing-library/user-event'

describe('CreateGameScreen', () => {
  it('should render the game creation form', () => {
    render(<CreateGameScreen />)
    
    expect(screen.getByLabelText(/game name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/minimum players/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/maximum players/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/your birthday/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument()
  })

  it('should show error messages when required fields are empty', async () => {
    
    const user = userEvent.setup()
    const mockFetch = vi.fn()
    global.fetch = mockFetch
    render(<CreateGameScreen />)
    
    const submitButton = screen.getByRole('button', { name: /create/i })
    await user.click(submitButton)
    
    expect(screen.getByText(/the game must have a name/i)).toBeInTheDocument()
    expect(screen.getByText(/must specify minimum players/i)).toBeInTheDocument()
    expect(screen.getByText(/must specify maximum players/i)).toBeInTheDocument()
    expect(screen.getByText(/you must have a name/i)).toBeInTheDocument()
    expect(screen.getByText(/you must say your birthday/i)).toBeInTheDocument()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should show error messages when names are too long', async () => {
    
    const user = userEvent.setup()
    const mockFetch = vi.fn()
    global.fetch = mockFetch
    render(<CreateGameScreen />)
    
    await user.type(screen.getByLabelText(/game name/i), 'ingenieria del software 2025 es la mejor materia wow')
    await user.type(screen.getByLabelText(/minimum players/i), '2')
    await user.type(screen.getByLabelText(/maximum players/i), '2') 
    await user.type(screen.getByLabelText(/your name/i), 'Supercalifragilisticoespiraleidoso')
    await user.type(screen.getByLabelText(/your birthday/i), '1969-04-20')

    const submitButton = screen.getByRole('button', { name: /create/i })
    await user.click(submitButton)
    
    expect(screen.getByText(/name of the game is too long! must be less than 20 characters/i)).toBeInTheDocument()
    expect(screen.getByText(/name too long! must be less than 20 characters/i)).toBeInTheDocument()
    expect(mockFetch).not.toHaveBeenCalled()

  })

  it('should validate player range consistency', async () => {
    
    const user = userEvent.setup()
    const mockFetch = vi.fn()
    global.fetch = mockFetch
    render(<CreateGameScreen />)
    
    await user.type(screen.getByLabelText(/game name/i), 'Partidarda')
    await user.type(screen.getByLabelText(/minimum players/i), '4')
    await user.type(screen.getByLabelText(/maximum players/i), '2') 
    await user.type(screen.getByLabelText(/your name/i), 'Robotito')
    await user.type(screen.getByLabelText(/your birthday/i), '1969-04-20')
    
    const submitButton = screen.getByRole('button', { name: /create/i })
    await user.click(submitButton)
    
    expect(screen.getByText(/inconsistent with max. players/i)).toBeInTheDocument()
    expect(screen.getByText(/inconsistent with min. players/i)).toBeInTheDocument()
    expect(mockFetch).not.toHaveBeenCalled()

  })

  it('should not allow numbers outside the valid range (<2)', async () => {
    
    const user = userEvent.setup()
    const mockFetch = vi.fn()
    global.fetch = mockFetch
    render(<CreateGameScreen />)
    
    await user.type(screen.getByLabelText(/game name/i), 'Partidarda')
    await user.type(screen.getByLabelText(/minimum players/i), '1')
    await user.type(screen.getByLabelText(/maximum players/i), '3') 
    await user.type(screen.getByLabelText(/your name/i), 'Robotito')
    await user.type(screen.getByLabelText(/your birthday/i), '1969-04-20')
    
    const submitButton = screen.getByRole('button', { name: /create/i })
    await user.click(submitButton)
    
    expect(screen.getByText(/out of range ! the game needs between 2 and 6 players to be played/i)).toBeInTheDocument()
    expect(mockFetch).not.toHaveBeenCalled()

  })

  it('should not allow numbers outside the valid range (>6)', async () => {
    
    const user = userEvent.setup()
    const mockFetch = vi.fn()
    global.fetch = mockFetch
    render(<CreateGameScreen />)
    
    await user.type(screen.getByLabelText(/game name/i), 'Partidarda')
    await user.type(screen.getByLabelText(/minimum players/i), '4')
    await user.type(screen.getByLabelText(/maximum players/i), '10') 
    await user.type(screen.getByLabelText(/your name/i), 'Robotito')
    await user.type(screen.getByLabelText(/your birthday/i), '1969-04-20')
    
    const submitButton = screen.getByRole('button', { name: /create/i })
    await user.click(submitButton)
    
    expect(screen.getByText(/out of range ! the game needs between 2 and 6 players to be played/i)).toBeInTheDocument()
    expect(mockFetch).not.toHaveBeenCalled()

  })

  it('should validate future birthday', async () => {
    
    const user = userEvent.setup()
    const mockFetch = vi.fn()
    global.fetch = mockFetch
    render(<CreateGameScreen />)
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const futureDate = tomorrow.toISOString().split('T')[0]
    
    await user.type(screen.getByLabelText(/game name/i), 'Test Game')
    await user.type(screen.getByLabelText(/minimum players/i), '3')
    await user.type(screen.getByLabelText(/maximum players/i), '4')
    await user.type(screen.getByLabelText(/your name/i), 'Test Player')
    await user.type(screen.getByLabelText(/your birthday/i), futureDate)
    
    const submitButton = screen.getByRole('button', { name: /create/i })
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

  render(<CreateGameScreen />)

  await user.type(screen.getByLabelText(/game name/i), 'Test Game')
  await user.type(screen.getByLabelText(/minimum players/i), '2')
  await user.type(screen.getByLabelText(/maximum players/i), '4') 
  await user.type(screen.getByLabelText(/your name/i), 'Robotito')
  await user.type(screen.getByLabelText(/your birthday/i), '1990-01-01')

  const submitButton = screen.getByRole('button', { name: /create/i })
  await user.click(submitButton)

  expect(mockFetch).toHaveBeenCalledTimes(1)
  expect(mockFetch).toHaveBeenCalledWith(
    'http://localhost:8000/games',
    expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player: { name: 'Robotito', birthday: '1990-01-01' },
        newgame: { name: 'Test Game', minp: 2, maxp: 4 }
      })
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

  render(<CreateGameScreen />)

  await user.type(screen.getByLabelText(/game name/i), 'Test Game')
  await user.type(screen.getByLabelText(/minimum players/i), '2')
  await user.type(screen.getByLabelText(/maximum players/i), '4') 
  await user.type(screen.getByLabelText(/your name/i), 'Robotito')
  await user.type(screen.getByLabelText(/your birthday/i), '1990-01-01')

  const submitButton = screen.getByRole('button', { name: /create/i })
  await user.click(submitButton)

  expect(mockFetch).toHaveBeenCalledTimes(1)
  expect(console.error).toHaveBeenCalledWith(
    'Error en la solicitud:',
    expect.any(Error)
  )
})