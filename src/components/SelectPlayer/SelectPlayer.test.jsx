import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SelectPlayer from './SelectPlayer';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

// Mock AVATAR_MAP
vi.mock('../Board/PlayerBadge/playerBadgeConstants', () => ({
  AVATAR_MAP: {
    1: '/avatar1.jpg',
    2: '/avatar2.jpg',
    3: '/avatar3.jpg',
  },
}));

describe('SelectPlayer', () => {
  const mockPlayers = [
    { id: 1, name: 'Player One', avatar: 1 },
    { id: 2, name: 'Player Two', avatar: 2 },
    { id: 3, name: 'Player Three', avatar: 3 },
    { id: 4, name: 'Player Four', avatar: 1 },
  ];

  const mockSelectedPlayerId = vi.fn();
  const mockActualPlayerId = 1;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock document.body.style.overflow
    Object.defineProperty(document.body, 'style', {
      value: {
        overflow: '',
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders with all players and text', () => {
    render(
      <SelectPlayer
        actualPlayerId={mockActualPlayerId}
        players={mockPlayers}
        selectedPlayerId={mockSelectedPlayerId}
        text="Select a player to target"
      />
    );

    expect(screen.getByText('Select a player to target')).toBeInTheDocument();
    expect(screen.getByText('Player One (you)')).toBeInTheDocument();
    expect(screen.getByText('Player Two')).toBeInTheDocument();
    expect(screen.getByText('Player Three')).toBeInTheDocument();
    expect(screen.getByText('Player Four')).toBeInTheDocument();
  });

  it('marks actual player with "(you)" suffix', () => {
    render(
      <SelectPlayer
        actualPlayerId={mockActualPlayerId}
        players={mockPlayers}
        selectedPlayerId={mockSelectedPlayerId}
        text="Select a player"
      />
    );

    expect(screen.getByText('Player One (you)')).toBeInTheDocument();
    expect(screen.getByText('Player Two')).toBeInTheDocument();
    expect(screen.queryByText('Player Two (you)')).not.toBeInTheDocument();
  });

  it('handles player selection correctly', () => {
    render(
      <SelectPlayer
        actualPlayerId={mockActualPlayerId}
        players={mockPlayers}
        selectedPlayerId={mockSelectedPlayerId}
        text="Select a player"
      />
    );

    // Click on player 2
    const playerTwo = screen.getByText('Player Two').closest('.selectplayer-item');
    fireEvent.click(playerTwo);

    // Confirm button should be enabled now
    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).not.toBeDisabled();
  });

  it('calls selectedPlayerId with correct id when confirm is clicked', () => {
    render(
      <SelectPlayer
        actualPlayerId={mockActualPlayerId}
        players={mockPlayers}
        selectedPlayerId={mockSelectedPlayerId}
        text="Select a player"
      />
    );

    // Select player 3 and confirm
    const playerThree = screen.getByText('Player Three').closest('.selectplayer-item');
    fireEvent.click(playerThree);

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    expect(mockSelectedPlayerId).toHaveBeenCalledWith(3);
    expect(mockSelectedPlayerId).toHaveBeenCalledTimes(1);
  });

  it('disables confirm button when no player is selected', () => {
    render(
      <SelectPlayer
        actualPlayerId={mockActualPlayerId}
        players={mockPlayers}
        selectedPlayerId={mockSelectedPlayerId}
        text="Select a player"
      />
    );

    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toBeDisabled();
  });

  it('enables confirm button when a player is selected', () => {
    render(
      <SelectPlayer
        actualPlayerId={mockActualPlayerId}
        players={mockPlayers}
        selectedPlayerId={mockSelectedPlayerId}
        text="Select a player"
      />
    );

    const playerFour = screen.getByText('Player Four').closest('.selectplayer-item');
    fireEvent.click(playerFour);

    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).not.toBeDisabled();
  });

  it('handles empty players array', () => {
    render(
      <SelectPlayer
        actualPlayerId={mockActualPlayerId}
        players={[]}
        selectedPlayerId={mockSelectedPlayerId}
        text="Select a player"
      />
    );

    expect(screen.getByText('Select a player')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('sets body overflow to hidden on mount and cleans up on unmount', () => {
    const { unmount } = render(
      <SelectPlayer
        actualPlayerId={mockActualPlayerId}
        players={mockPlayers}
        selectedPlayerId={mockSelectedPlayerId}
        text="Select a player"
      />
    );

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('');
  });


  it('allows selecting different players sequentially', () => {
    render(
      <SelectPlayer
        actualPlayerId={mockActualPlayerId}
        players={mockPlayers}
        selectedPlayerId={mockSelectedPlayerId}
        text="Select a player"
      />
    );

    // Select player 2
    const playerTwo = screen.getByText('Player Two').closest('.selectplayer-item');
    fireEvent.click(playerTwo);

    // Select player 4
    const playerFour = screen.getByText('Player Four').closest('.selectplayer-item');
    fireEvent.click(playerFour);

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    expect(mockSelectedPlayerId).toHaveBeenCalledWith(4);
  });

  it('renders player avatars correctly', () => {
    render(
      <SelectPlayer
        actualPlayerId={mockActualPlayerId}
        players={mockPlayers}
        selectedPlayerId={mockSelectedPlayerId}
        text="Select a player"
      />
    );

    const avatars = screen.getAllByAltText(/Player/);
    expect(avatars).toHaveLength(4);
    
    avatars.forEach((avatar, index) => {
      expect(avatar).toHaveAttribute('src', expect.stringContaining('.jpg'));
    });
  });

  it('handles player with missing avatar by using default', () => {
    const playersWithMissingAvatar = [
      { id: 1, name: 'Player One', avatar: 999 }, // Non-existent avatar
    ];

    render(
      <SelectPlayer
        actualPlayerId={mockActualPlayerId}
        players={playersWithMissingAvatar}
        selectedPlayerId={mockSelectedPlayerId}
        text="Select a player"
      />
    );

    const avatar = screen.getByAltText('Player One');
    expect(avatar).toHaveAttribute('src', '/avatar1.jpg'); // Should fallback to avatar 1
  });
});