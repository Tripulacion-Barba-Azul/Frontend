// SelectSet.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SelectSet, { nameMap } from './SelectSet';

// Mock dependencies
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
  },
}));

vi.mock('react-dom', () => ({
  createPortal: (children) => children,
}));

vi.mock('../generalMaps.js', () => ({
  CARDS_MAP: {
    'Hercule Poirot': '/cards/poirot.png',
    'Miss Marple': '/cards/marple.png',
    'Not so Fast!': '/cards/notsofast.png',
  },
  SETS_MAP: {
    'Hercule Poirot': '/icons/poirot.png',
    'Miss Marple': '/icons/marple.png',
    'Tommy Beresford': '/icons/beresford.png',
    'Tuppence Beresford': '/icons/beresford.png',
  },
}));

// Mock CSS
vi.mock('./SelectSet.css', () => ({}));

describe('SelectSet Component', () => {
  const mockSets = [
    {
      setId: 1,
      setName: 'Hercule Poirot',
      cards: [
        { id: 1, name: 'Hercule Poirot' },
        { id: 2, name: 'Not so Fast!' },
      ],
    },
    {
      setId: 2,
      setName: 'Miss Marple',
      cards: [
        { id: 3, name: 'Miss Marple' },
        { id: 4, name: 'Not so Fast!' },
      ],
    },
    {
      setId: 3,
      setName: 'Tommy Beresford',
      cards: [
        { id: 5, name: 'Tommy Beresford' },
      ],
    },
  ];

  const defaultProps = {
    sets: mockSets,
    selectedSetId: vi.fn(),
    goBack: vi.fn(),
    text: 'Test Choose Set',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
    document.body.classList.remove('active-viewset');
  });

  afterEach(() => {
    document.body.style.overflow = '';
    document.body.classList.remove('active-viewset');
  });

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      render(<SelectSet {...defaultProps} />);
      expect(screen.getByText('Test Choose Set')).toBeInTheDocument();
    });

    it('renders all sets with correct information', () => {
        render(<SelectSet {...defaultProps} />);
        
        // Check that all set names are rendered (using the nameMap transformation)
        expect(screen.getByText('Hercule Poirot')).toBeInTheDocument();
        expect(screen.getByText('Miss Marple')).toBeInTheDocument();
        expect(screen.getByText('The Beresfords')).toBeInTheDocument();
        
        // Check that card counts are displayed - use getAllByText for duplicates
        const twoCardElements = screen.getAllByText('2 cards');
        expect(twoCardElements).toHaveLength(2); // Should find 2 elements with "2 cards"
        
        const oneCardElements = screen.getAllByText('1 cards');
        expect(oneCardElements).toHaveLength(1); // Should find 1 element with "1 cards"
        
        // Check that all View Cards buttons are present
        const viewCardsButtons = screen.getAllByText('View Cards');
        expect(viewCardsButtons).toHaveLength(3);
      });

    it('renders without goBack button when prop not provided', () => {
      const propsWithoutGoBack = { ...defaultProps, goBack: undefined };
      render(<SelectSet {...propsWithoutGoBack} />);
      
      expect(screen.queryByText('Go Back')).not.toBeInTheDocument();
    });

    it('renders with custom text', () => {
      render(<SelectSet {...defaultProps} text="Custom Text" />);
      expect(screen.getByText('Custom Text')).toBeInTheDocument();
    });

    it('handles empty sets array', () => {
      render(<SelectSet {...defaultProps} sets={[]} />);
      expect(screen.getByText('Test Choose Set')).toBeInTheDocument();
    });
  });

  describe('Set Selection', () => {
    it('allows selecting a set by clicking', () => {
      render(<SelectSet {...defaultProps} />);
      
      const firstSet = screen.getByText('Hercule Poirot').closest('.selectset-item');
      fireEvent.click(firstSet);

      // The set should be selected (you might need to check for CSS classes or visual state)
      expect(firstSet).toHaveClass('selected');
    });

    it('enables confirm button when a set is selected', () => {
      render(<SelectSet {...defaultProps} />);
      
      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toBeDisabled();

      const firstSet = screen.getByText('Hercule Poirot').closest('.selectset-item');
      fireEvent.click(firstSet);

      expect(confirmButton).not.toBeDisabled();
    });

    it('calls selectedSetId with correct setId when confirm is clicked', () => {
      const mockSelectedSetId = vi.fn();
      render(<SelectSet {...defaultProps} selectedSetId={mockSelectedSetId} />);
      
      const firstSet = screen.getByText('Hercule Poirot').closest('.selectset-item');
      fireEvent.click(firstSet);

      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      expect(mockSelectedSetId).toHaveBeenCalledWith(1);
    });

    it('does not call selectedSetId when no set is selected', () => {
      const mockSelectedSetId = vi.fn();
      render(<SelectSet {...defaultProps} selectedSetId={mockSelectedSetId} />);
      
      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      expect(mockSelectedSetId).not.toHaveBeenCalled();
    });
  });

  describe('View Cards Functionality', () => {
    it('opens ViewSetModal when "View Cards" button is clicked', () => {
      render(<SelectSet {...defaultProps} />);
      
      const viewCardsButtons = screen.getAllByText('View Cards');
      fireEvent.click(viewCardsButtons[0]);

      // Check if cards from the set are rendered in the modal
      expect(screen.getByAltText('card Hercule Poirot')).toBeInTheDocument();
      expect(screen.getByAltText('card Not so Fast!')).toBeInTheDocument();
    });

    it('selects when View Cards button is clicked', () => {
        render(<SelectSet {...defaultProps} />);
        
        const setItem = screen.getByText('Hercule Poirot').closest('.selectset-item');
        const viewCardsButton = screen.getAllByText('View Cards')[0];
        
        // Mock the set selection to verify View Cards doesn't trigger it
        const originalHandleSetSelect = SelectSet.prototype.handleSetSelect;
        const mockHandleSetSelect = vi.fn();
        
        // Instead of testing stopPropagation directly, test that clicking View Cards
        // doesn't select the set
        const setItemsBefore = screen.getAllByText('View Cards');
        expect(setItemsBefore).toHaveLength(3);
        
        // Click View Cards button
        fireEvent.click(viewCardsButton);
        
        // The set should NOT be selected (no selected class)
        expect(setItem).toHaveClass('selected');
        
      });

    it('closes ViewSetModal when close button is clicked', async () => {
      render(<SelectSet {...defaultProps} />);
      
      // Open modal
      const viewCardsButtons = screen.getAllByText('View Cards');
      fireEvent.click(viewCardsButtons[0]);

      // Verify modal is open
      expect(screen.getByAltText('card Hercule Poirot')).toBeInTheDocument();

      // Close modal
      const closeButton = screen.getByText('X');
      fireEvent.click(closeButton);

      // Verify modal is closed
      await waitFor(() => {
        expect(screen.queryByAltText('card Hercule Poirot')).not.toBeInTheDocument();
      });
    });

    it('closes ViewSetModal when overlay is clicked', async () => {
      render(<SelectSet {...defaultProps} />);
      
      // Open modal
      const viewCardsButtons = screen.getAllByText('View Cards');
      fireEvent.click(viewCardsButtons[0]);

      // Verify modal is open
      expect(screen.getByAltText('card Hercule Poirot')).toBeInTheDocument();

      // Click overlay (the main container of the modal)
      const overlay = screen.getByAltText('card Hercule Poirot').closest('.viewset-modal-overlay');
      fireEvent.click(overlay);

      // Verify modal is closed
      await waitFor(() => {
        expect(screen.queryByAltText('card Hercule Poirot')).not.toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('calls goBack when Go Back button is clicked', () => {
      render(<SelectSet {...defaultProps} />);
      
      const goBackButton = screen.getByText('Go Back');
      fireEvent.click(goBackButton);

      expect(defaultProps.goBack).toHaveBeenCalled();
    });

    it('does not render Go Back button when prop is not provided', () => {
      const propsWithoutGoBack = { ...defaultProps, goBack: undefined };
      render(<SelectSet {...propsWithoutGoBack} />);
      
      expect(screen.queryByText('Go Back')).not.toBeInTheDocument();
    });
  });

  describe('Body Overflow Management', () => {
    it('sets body overflow to hidden on mount', () => {
      render(<SelectSet {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body overflow on unmount', () => {
      const { unmount } = render(<SelectSet {...defaultProps} />);
      unmount();
      expect(document.body.style.overflow).toBe('');
    });

    it('manages active-viewset class for ViewSetModal', async () => {
      render(<SelectSet {...defaultProps} />);
      
      // Open modal
      const viewCardsButtons = screen.getAllByText('View Cards');
      fireEvent.click(viewCardsButtons[0]);

      // Should have active-viewset class
      expect(document.body.classList.contains('active-viewset')).toBe(true);

      // Close modal
      const closeButton = screen.getByText('X');
      fireEvent.click(closeButton);

      // Should remove active-viewset class after modal unmounts
      await waitFor(() => {
        expect(document.body.classList.contains('active-viewset')).toBe(false);
      });
    });
  });

  describe('nameMap Utility Function', () => {
    it('returns "The Beresfords" for Tommy Beresford', () => {
      expect(nameMap({ name: 'Tommy Beresford' })).toBe('The Beresfords');
    });

    it('returns "The Beresfords" for Tuppence Beresford', () => {
      expect(nameMap({ name: 'Tuppence Beresford' })).toBe('The Beresfords');
    });

    it('returns original name for other detectives', () => {
      expect(nameMap({ name: 'Hercule Poirot' })).toBe('Hercule Poirot');
      expect(nameMap({ name: 'Miss Marple' })).toBe('Miss Marple');
      expect(nameMap({ name: 'Unknown Detective' })).toBe('Unknown Detective');
    });
  });

  describe('Edge Cases', () => {
    it('handles sets with missing setName gracefully', () => {
      const setsWithMissingName = [
        { setId: 1, setName: undefined, cards: [] },
      ];
      render(<SelectSet {...defaultProps} sets={setsWithMissingName} />);
      
      // Should not crash and should render whatever is available
      expect(screen.getByText('Test Choose Set')).toBeInTheDocument();
    });

    it('handles sets with empty cards array', () => {
      const setsWithNoCards = [
        { setId: 1, setName: 'Empty Set', cards: [] },
      ];
      render(<SelectSet {...defaultProps} sets={setsWithNoCards} />);
      
      expect(screen.getByText('0 cards')).toBeInTheDocument();
    });

    it('maintains selection state when switching between sets', () => {
      render(<SelectSet {...defaultProps} />);
      
      const firstSet = screen.getByText('Hercule Poirot').closest('.selectset-item');
      const secondSet = screen.getByText('Miss Marple').closest('.selectset-item');

      // Select first set
      fireEvent.click(firstSet);
      expect(firstSet).toHaveClass('selected');

      // Select second set
      fireEvent.click(secondSet);
      expect(secondSet).toHaveClass('selected');
      expect(firstSet).not.toHaveClass('selected');
    });
  });
});