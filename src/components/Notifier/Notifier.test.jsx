// Notifier.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Notifier from './Notifier';

// Mock dependencies
vi.mock('react-dom', () => ({
  createPortal: (children) => children,
}));

vi.mock('../generalMaps.js', () => ({
  CARDS_MAP: {
    'Not so Fast!': '/cards/notsofast.png',
    'Hercule Poirot': '/cards/poirot.png',
    'Miss Marple': '/cards/marple.png',
    'Mr Satterthwaite': '/cards/satterthwaite.png',
    'Cards off the table': '/cards/cardsofftable.png',
  },
  SETS_MAP: {
    'Tommy Beresford': '/icons/beresford.png',
    'Miss Marple': '/icons/marple.png',
    'The Beresfords': '/icons/beresford.png',
  },
  SECRETS_MAP: {
    'You are the murderer': '/secrets/murderer.png',
    'Just a Fantasy': '/secrets/fantasy.png',
    'Untouched': '/secrets/untouched.png',
  },
}));

vi.mock('./Notifier.css', () => ({}));

describe('Notifier Component', () => {
  const mockPublicData = {
    players: [
      {
        id: 1,
        name: 'Alice',
        secrets: [
          { id: 101, revealed: false },
          { id: 102, revealed: true, name: 'You are the murderer' },
        ],
        sets: [
          {
            setId: 1,
            setName: 'Tommy Beresford',
            cards: [{ id: 4, name: 'Hercule Poirot' }],
          },
        ],
      },
      {
        id: 2,
        name: 'Bob',
        secrets: [
          { id: 103, revealed: false },
          { id: 104, revealed: true, name: 'Just a Fantasy' },
        ],
        sets: [
          {
            setId: 2,
            setName: 'Miss Marple',
            cards: [{ id: 6, name: 'Miss Marple' }],
          },
        ],
      },
      {
        id: 3,
        name: 'Charlie',
        secrets: [
          { id: 105, revealed: false },
          { id: 106, revealed: true, name: 'Untouched' },
        ],
        sets: [
          {
            setId: 3,
            setName: 'Tommy Beresford',
            cards: [{ id: 8, name: 'Tommy Beresford' }],
          },
        ],
      },
    ],
  };

  const defaultProps = {
    publicData: mockPublicData,
    actualPlayerId: 1,
    wsRef: { current: { addEventListener: vi.fn(), removeEventListener: vi.fn() } },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const simulateWebSocketMessage = (component, eventType, payload) => {
    const messageHandler = defaultProps.wsRef.current.addEventListener.mock.calls.find(
      call => call[0] === 'message'
    )?.[1];
    
    if (messageHandler) {
      act(() => {
        messageHandler({
          data: JSON.stringify({ event: eventType, payload }),
        });
      });
    }
  };

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      render(<Notifier {...defaultProps} />);
      expect(document.body).toBeInTheDocument();
    });

    it('does not render anything when no notification', () => {
      const { container } = render(<Notifier {...defaultProps} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('WebSocket Message Handling', () => {
    it('sets up WebSocket listener on mount', () => {
      render(<Notifier {...defaultProps} />);
      
      expect(defaultProps.wsRef.current.addEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );
    });

    it('handles unknown event types', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<Notifier {...defaultProps} />);
      
      simulateWebSocketMessage(Notifier, 'unknownEvent', { someData: 'test' });
      
      expect(consoleWarn).toHaveBeenCalledWith('Unknown event type:', 'unknownEvent');
      consoleWarn.mockRestore();
    });

    it('handles malformed JSON gracefully', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      render(<Notifier {...defaultProps} />);
      
      const messageHandler = defaultProps.wsRef.current.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];
      
      act(() => {
        messageHandler({ data: 'invalid json' });
      });
      
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe('Event Handlers - Cards Off The Table', () => {
    it('handles cards off the table targeting self', () => {
      render(<Notifier {...defaultProps} />);
      
      simulateWebSocketMessage(Notifier, 'notifierCardsOffTheTable', {
        playerID: 1,
        quantity: 2,
        selectedPlayerId: 1,
      });
      
      expect(screen.getByText(/Alice made themselves discard/)).toBeInTheDocument();
      expect(screen.getByText(/2 "Not so Fast!" cards/)).toBeInTheDocument();
    });

    it('handles cards off the table targeting other player', () => {
      render(<Notifier {...defaultProps} />);
      
      simulateWebSocketMessage(Notifier, 'notifierCardsOffTheTable', {
        playerID: 1,
        quantity: 3,
        selectedPlayerId: 2,
      });
      
      expect(screen.getByText(/Alice made Bob discard/)).toBeInTheDocument();
      expect(screen.getByText(/3 "Not so Fast!" cards/)).toBeInTheDocument();
    });
  });

  describe('Event Handlers - Steal Set', () => {
    it('handles steal set event', () => {
      render(<Notifier {...defaultProps} />);
      
      simulateWebSocketMessage(Notifier, 'notifierStealSet', {
        playerID: 2,
        stolenPlayerId: 1,
        setId: 1,
      });
      
      expect(screen.getByText(/Bob stole/)).toBeInTheDocument();
      expect(screen.getByText(/"The Beresfords" detective set/)).toBeInTheDocument();
      expect(screen.getByText(/from Alice/)).toBeInTheDocument();
    });
  });

  describe('Event Handlers - Look Into The Ashes', () => {
    it('handles look into the ashes event', () => {
      render(<Notifier {...defaultProps} />);
      
      simulateWebSocketMessage(Notifier, 'notifierLookIntoTheAshes', {
        playerID: 3,
      });
      
      expect(screen.getByText('Charlie looked into the ashes')).toBeInTheDocument();
    });
  });

  describe('Event Handlers - And Then There Was One More', () => {
    it('handles self to self case', () => {
      render(<Notifier {...defaultProps} />);
      
      simulateWebSocketMessage(Notifier, 'notifierAndThenThereWasOneMore', {
        playerID: 1,
        secretId: 102,
        secretName: 'You are the murderer',
        stolenPlayerId: 1,
        giftedPlayerId: 1,
      });
      
      expect(screen.getByText(/Alice took one of their revealed secrets/)).toBeInTheDocument();
      expect(screen.getByText(/and hid it/)).toBeInTheDocument();
    });

    it('handles self to other case', () => {
      render(<Notifier {...defaultProps} />);
      
      simulateWebSocketMessage(Notifier, 'notifierAndThenThereWasOneMore', {
        playerID: 1,
        secretId: 102,
        secretName: 'You are the murderer',
        stolenPlayerId: 1,
        giftedPlayerId: 2,
      });
      
      expect(screen.getByText(/Alice took one of their own secrets/)).toBeInTheDocument();
      expect(screen.getByText(/and gave it to Bob/)).toBeInTheDocument();
    });

    it('handles other to self case', () => {
      render(<Notifier {...defaultProps} />);
      
      simulateWebSocketMessage(Notifier, 'notifierAndThenThereWasOneMore', {
        playerID: 2,
        secretId: 102,
        secretName: 'You are the murderer',
        stolenPlayerId: 1,
        giftedPlayerId: 2,
      });
      
      expect(screen.getByText(/Bob stole a secret from Alice/)).toBeInTheDocument();
    });

    it('handles other back to same case', () => {
      render(<Notifier {...defaultProps} />);
      
      simulateWebSocketMessage(Notifier, 'notifierAndThenThereWasOneMore', {
        playerID: 3,
        secretId: 104,
        secretName: 'Just a Fantasy',
        stolenPlayerId: 2,
        giftedPlayerId: 2,
      });
      
      expect(screen.getByText(/Charlie took a secret from Bob/)).toBeInTheDocument();
      expect(screen.getByText(/and gave it back to them/)).toBeInTheDocument();
    });

    it('handles other to third case', () => {
      render(<Notifier {...defaultProps} />);
      
      simulateWebSocketMessage(Notifier, 'notifierAndThenThereWasOneMore', {
        playerID: 1,
        secretId: 104,
        secretName: 'Just a Fantasy',
        stolenPlayerId: 2,
        giftedPlayerId: 3,
      });
      
      expect(screen.getByText(/Alice took a secret from Bob/)).toBeInTheDocument();
      expect(screen.getByText(/and gave it to Charlie/)).toBeInTheDocument();
    });
  });

  describe('Event Handlers - Reveal Secret', () => {
    it('handles reveal secret targeting self', () => {
      render(<Notifier {...defaultProps} />);
      
      simulateWebSocketMessage(Notifier, 'notifierRevealSecret', {
        playerID: 1,
        secretId: 102,
        selectedPlayerId: 1,
      });
      
      expect(screen.getByText('Alice revealed one of their own secrets')).toBeInTheDocument();
    });

    it('handles reveal secret targeting other', () => {
      render(<Notifier {...defaultProps} />);
      
      simulateWebSocketMessage(Notifier, 'notifierRevealSecret', {
        playerID: 2,
        secretId: 102,
        selectedPlayerId: 1,
      });
      
      expect(screen.getByText("Bob revealed Alice's secret")).toBeInTheDocument();
    });
  });

  describe('Event Handlers - Reveal Secret Force', () => {
    it('handles force reveal secret targeting self', () => {
      render(<Notifier {...defaultProps} />);
      
      simulateWebSocketMessage(Notifier, 'notifierRevealSecretForce', {
        playerID: 1,
        secretId: 102,
        selectedPlayerId: 1,
      });
      
      expect(screen.getByText('Alice revealed one of their own secrets')).toBeInTheDocument();
    });

    it('handles force reveal secret targeting other', () => {
      render(<Notifier {...defaultProps} />);
      
      simulateWebSocketMessage(Notifier, 'notifierRevealSecretForce', {
        playerID: 2,
        secretId: 102,
        selectedPlayerId: 1,
      });
      
      expect(screen.getByText('Bob told Alice to reveal a secret')).toBeInTheDocument();
    });
  });

  describe('Event Handlers - Satterthwaite Wild', () => {
    it('handles satterthwaite wild targeting self', () => {
      render(<Notifier {...defaultProps} />);
      
      simulateWebSocketMessage(Notifier, 'notifierSatterthwaiteWild', {
        playerID: 1,
        secretId: 102,
        secretName: 'You are the murderer',
        selectedPlayerId: 1,
      });
      
      expect(screen.getByText(/Alice showed one of their own secrets/)).toBeInTheDocument();
    });

    it('handles satterthwaite wild targeting other', () => {
      render(<Notifier {...defaultProps} />);
      
      simulateWebSocketMessage(Notifier, 'notifierSatterthwaiteWild', {
        playerID: 2,
        secretId: 102,
        secretName: 'You are the murderer',
        selectedPlayerId: 1,
      });
      
      expect(screen.getByText(/Bob stole one of Alice's secrets/)).toBeInTheDocument();
    });
  });

  describe('Event Handlers - Hide Secret', () => {
    it('handles hide secret targeting self', () => {
      render(<Notifier {...defaultProps} />);
      
      simulateWebSocketMessage(Notifier, 'notifierHideSecret', {
        playerID: 1,
        secretId: 101,
        selectedPlayerId: 1,
      });
      
      expect(screen.getByText('Alice hid one of their secrets')).toBeInTheDocument();
    });

    it('handles hide secret targeting other', () => {
      render(<Notifier {...defaultProps} />);
      
      simulateWebSocketMessage(Notifier, 'notifierHideSecret', {
        playerID: 2,
        secretId: 101,
        selectedPlayerId: 1,
      });
      
      expect(screen.getByText("Bob hid one of Alice's secrets")).toBeInTheDocument();
    });
  });

  describe('Event Handlers - Cards Played', () => {
    it('handles set cards played', () => {
      render(<Notifier {...defaultProps} />);
      
      simulateWebSocketMessage(Notifier, 'cardsPlayed', {
        playerId: 1,
        cards: [
          { id: 4, name: 'Hercule Poirot' },
          { id: 5, name: 'Not so Fast!' },
        ],
        actionType: 'set',
      });
      
      expect(screen.getByText('Alice played a set of detectives')).toBeInTheDocument();
    });

    it('handles detective card played', () => {
      render(<Notifier {...defaultProps} />);
      
      simulateWebSocketMessage(Notifier, 'cardsPlayed', {
        playerId: 2,
        cards: [{ id: 9, name: 'Mr Satterthwaite' }],
        actionType: 'detective',
      });
      
      expect(screen.getByText('Bob added a detective card to a set')).toBeInTheDocument();
    });

    it('handles event card played', () => {
      render(<Notifier {...defaultProps} />);
      
      simulateWebSocketMessage(Notifier, 'cardsPlayed', {
        playerId: 3,
        cards: [{ id: 10, name: 'Cards off the table' }],
        actionType: 'event',
      });
      
      expect(screen.getByText('Charlie played an event card')).toBeInTheDocument();
    });

    it('handles unknown action type', () => {
      render(<Notifier {...defaultProps} />);
      
      simulateWebSocketMessage(Notifier, 'cardsPlayed', {
        playerId: 1,
        cards: [{ id: 11, name: 'Unknown Card' }],
        actionType: 'unknown',
      });
      
      expect(screen.getByText('Alice played cards')).toBeInTheDocument();
    });
  });

  describe('Event Handlers - Discard Event', () => {
    it('handles discard event', () => {
      render(<Notifier {...defaultProps} />);
      
      simulateWebSocketMessage(Notifier, 'discardEvent', {
        playerId: 1,
        cards: [
          { id: 11, name: 'Another Victim' },
          { id: 12, name: 'Dead Card Folly' },
        ],
      });
      
      expect(screen.getByText('Alice discarded 2 cards')).toBeInTheDocument();
    });
  });

  describe('Notification Component', () => {
    it('closes on click', async () => {
      render(<Notifier {...defaultProps} />);
      
      simulateWebSocketMessage(Notifier, 'notifierLookIntoTheAshes', {
        playerID: 1,
      });
      
      expect(screen.getByText('Alice looked into the ashes')).toBeInTheDocument();
      
      // Click to close
      fireEvent.click(screen.getByText('Alice looked into the ashes').closest('.notifier-overlay'));
      
      // Fast-forward timers to skip the animation delay
      act(() => {
        vi.advanceTimersByTime(300);
      });
      
      // Should be closed now
      expect(screen.queryByText('Alice looked into the ashes')).not.toBeInTheDocument();
    });
  
    it('auto-closes after 3 seconds', async () => {
      render(<Notifier {...defaultProps} />);
      
      simulateWebSocketMessage(Notifier, 'notifierLookIntoTheAshes', {
        playerID: 1,
      });
      
      expect(screen.getByText('Alice looked into the ashes')).toBeInTheDocument();
      
      // Fast-forward through the entire auto-close sequence
      act(() => {
        vi.advanceTimersByTime(3000); // Auto-close timer
      });
      
      act(() => {
        vi.advanceTimersByTime(300); // Fade-out animation
      });
      
      // Should be closed now
      expect(screen.queryByText('Alice looked into the ashes')).not.toBeInTheDocument();
    });
  
    it('displays cards when provided', () => {
      render(<Notifier {...defaultProps} />);
      
      simulateWebSocketMessage(Notifier, 'cardsPlayed', {
        playerId: 1,
        cards: [{ id: 4, name: 'Hercule Poirot' }],
        actionType: 'detective',
      });
      
      expect(screen.getByAltText('Hercule Poirot')).toBeInTheDocument();
    });
  
    it('displays set image when provided', () => {
      render(<Notifier {...defaultProps} />);
      
      simulateWebSocketMessage(Notifier, 'notifierStealSet', {
        playerID: 2,
        stolenPlayerId: 1,
        setId: 1,
      });
      
      expect(screen.getByAltText('Set')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing player data gracefully', () => {
      const propsWithMissingPlayer = {
        ...defaultProps,
        publicData: { players: [] },
      };
      
      render(<Notifier {...propsWithMissingPlayer} />);
      
      simulateWebSocketMessage(Notifier, 'notifierRevealSecret', {
        playerID: 999,
        secretId: 101,
        selectedPlayerId: 1,
      });
      
      expect(screen.getByText('Player 999 revealed Player 1\'s secret')).toBeInTheDocument();
    });

    it('handles missing secret data gracefully', () => {
      render(<Notifier {...defaultProps} />);
      
      simulateWebSocketMessage(Notifier, 'notifierRevealSecret', {
        playerID: 1,
        secretId: 999,
        selectedPlayerId: 1,
      });
      
      expect(screen.getByText('Alice revealed one of their own secrets')).toBeInTheDocument();
    });
  });
});