import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPortal } from 'react-dom';
import SelectSecret from './SelectSecret.jsx';

// Mock createPortal to render content directly instead of using a portal
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (element) => element,
  };
});

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
});

describe('SelectSecret Component', () => {
  const defaultProps = {
    actualPlayerId: 1,
    secrets: [
      { id: 1, revealed: true, name: 'You are the murderer' },
      { id: 2, revealed: false, name: 'Prankster' },
      { id: 3, revealed: true, name: 'You are the acomplice' },
    ],
    playerId: 2,
    text: 'Select a secret card',
    selectedSecretId: vi.fn(),
    goBack: vi.fn(),
  };

  it('renders the modal with correct title', () => {
    render(<SelectSecret {...defaultProps} />);
    
    expect(screen.getByText('Select a secret card')).toBeInTheDocument();
  });

  it('renders Go Back and Confirm buttons', () => {
    render(<SelectSecret {...defaultProps} />);
    
    expect(screen.getByText('Go Back')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('displays all secrets without filtering', () => {
    render(<SelectSecret {...defaultProps} />);
    
    // Should show all secrets (no filtering by revealed parameter)
    const secretCards = document.querySelectorAll('.selectable-secret-card');
    
    expect(secretCards).toHaveLength(3);
  });

  it('handles card selection correctly', () => {
    render(<SelectSecret {...defaultProps} />);
    
    const secretCard = document.querySelector('.selectable-secret-card');
    fireEvent.click(secretCard);
    
    // Should add selected class
    expect(secretCard).toHaveClass('selected');
  });

  it('calls selectedSecretId when confirm button is clicked', async () => {
    vi.useFakeTimers();
    
    render(<SelectSecret {...defaultProps} />);
    
    // First select a card
    const secretCard = document.querySelector('.selectable-secret-card');
    fireEvent.click(secretCard);
    
    // Then click confirm
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);
    
    // Fast-forward time to simulate animation completion
    vi.advanceTimersByTime(700);
    
    // Check that selectedSecretId is called with the card ID
    expect(defaultProps.selectedSecretId).toHaveBeenCalledWith(1);
    
    vi.useRealTimers();
  });

  it('calls goBack when Go Back button is clicked', () => {
    render(<SelectSecret {...defaultProps} />);
    
    const goBackButton = screen.getByText('Go Back');
    fireEvent.click(goBackButton);
    
    expect(defaultProps.goBack).toHaveBeenCalled();
  });

  it('disables confirm button when no card is selected', () => {
    render(<SelectSecret {...defaultProps} />);
    
    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toBeDisabled();
  });

  it('enables confirm button when card is selected', () => {
    render(<SelectSecret {...defaultProps} />);
    
    const secretCard = document.querySelector('.selectable-secret-card');
    const confirmButton = screen.getByText('Confirm');
    
    // Initially disabled
    expect(confirmButton).toBeDisabled();
    
    // Click card to select it
    fireEvent.click(secretCard);
    
    // Should be enabled now
    expect(confirmButton).not.toBeDisabled();
  });

  it('handles empty secrets array', () => {
    const propsWithEmptySecrets = {
      ...defaultProps,
      secrets: [],
    };
    
    render(<SelectSecret {...propsWithEmptySecrets} />);
    
    expect(screen.getByText('No secrets available!')).toBeInTheDocument();
  });

  it('handles null secrets', () => {
    const propsWithNullSecrets = {
      ...defaultProps,
      secrets: null,
    };
    
    render(<SelectSecret {...propsWithNullSecrets} />);
    
    expect(screen.getByText('No secrets available!')).toBeInTheDocument();
  });

  it('applies correct CSS classes for card selection', () => {
    render(<SelectSecret {...defaultProps} />);
    
    const secretCard = document.querySelector('.selectable-secret-card');
    expect(secretCard).toBeInTheDocument();
    
    // Click the card to trigger selection (but not animation yet)
    fireEvent.click(secretCard);
    
    expect(secretCard).toHaveClass('selected');
    // Animation only starts when confirm is clicked
    expect(secretCard.querySelector('.card-flip-container')).not.toHaveClass('flipping');
  });

  it('displays correct secret images based on revealed status and name', () => {
    render(<SelectSecret {...defaultProps} />);
    
    const secretImages = screen.getAllByRole('img');
    const murdererSecret = secretImages.find(img => 
      img.alt === 'Secret You are the murderer'
    );
    const accompliceSecret = secretImages.find(img => 
      img.alt === 'Secret You are the acomplice'
    );
    
    expect(murdererSecret).toBeInTheDocument();
    expect(accompliceSecret).toBeInTheDocument();
  });

  it('triggers animation when confirm button is clicked', () => {
    vi.useFakeTimers();
    
    render(<SelectSecret {...defaultProps} />);
    
    const secretCard = document.querySelector('.selectable-secret-card');
    const confirmButton = screen.getByText('Confirm');
    
    // Select a card first
    fireEvent.click(secretCard);
    
    // Click confirm to trigger animation
    fireEvent.click(confirmButton);
    
    // Check that animation class is applied
    expect(secretCard.querySelector('.card-flip-container')).toHaveClass('flipping');
    
    vi.useRealTimers();
  });
});
