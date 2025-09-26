import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import ViewMySecrets from './ViewMySecrets'

// Mock images so Vite/Vitest don’t fail on imports
vi.mock('../../assets/cards/05-secret_front.png', () => ({ default: 'secret_front.png' }))
vi.mock('../../assets/cards/06-secret_back.png', () => ({ default: 'secret_back.png' }))
vi.mock('../../assets/cards/04-secret_accomplice.png', () => ({ default: 'secret_accomplice.png' }))
vi.mock('../../assets/cards/03-secret_murderer.png', () => ({ default: 'secret_murderer.png' }))
vi.mock('../../assets/icons/shh.png', () => ({ default: 'shh_icon.png' }))

const mockSecrets = [
  { class: 'murderer', revealed: true },
  { class: 'accomplice', revealed: false },
  { class: 'regular', revealed: false },
]

describe('ViewMySecrets', () => {
  it('renders the correct number of dots', () => {
    render(<ViewMySecrets secrets={mockSecrets} />)

    const dots = screen.getAllByTitle(/Secret/i)
    expect(dots).toHaveLength(mockSecrets.length)
  })

  it('applies correct classes to dots based on secret state', () => {
    render(<ViewMySecrets secrets={mockSecrets} />)

    const dots = screen.getAllByTitle(/Secret/i)

    mockSecrets.forEach((secret, index) => {
      if (secret.revealed) {
        expect(dots[index]).toHaveClass('revealed')
      } else {
        expect(dots[index]).toHaveClass('hidden')
      }
    })
  })

  it('renders the correct cards when opened', async () => {
    const user = userEvent.setup()
    render(<ViewMySecrets secrets={mockSecrets} />)

    // open modal
    await user.click(screen.getByRole('button'))

    // cards = same count as secrets
    const frontCards = screen.getAllByRole('img', { name: /Secret \w+/ }) 
    const backCards = screen.getAllByRole('img', { name: /Card back/ }) 
    expect(frontCards).toHaveLength(mockSecrets.length)
    expect(backCards).toHaveLength(mockSecrets.length - 1)

    // check each card image
    expect(frontCards[0]).toHaveAttribute('src', 'secret_murderer.png')
    expect(frontCards[1]).toHaveAttribute('src', 'secret_accomplice.png')
    expect(frontCards[2]).toHaveAttribute('src', 'secret_back.png')

    expect(backCards[0]).toHaveAttribute('src', 'secret_front.png')
    expect(backCards[1]).toHaveAttribute('src', 'secret_front.png') 
  })

  it('opens and closes the modal', async () => {
    const user = userEvent.setup()
    render(<ViewMySecrets secrets={mockSecrets} />)

    await user.click(screen.getByRole('button'))
    expect(screen.getByText('X')).toBeInTheDocument()

    await user.click(screen.getByText('X'))
    expect(screen.queryByText('X')).not.toBeInTheDocument()
  })

})