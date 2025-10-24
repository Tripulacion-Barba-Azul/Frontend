import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AvatarPicker from './AvatarPicker';

vi.mock('../../generalMaps', () => ({
  AVATAR_MAP: {
    1: '/Board/Avatars/avatar_barba-azul.png',
    2: '/Board/Avatars/avatar_robotito.png',
    3: '/Board/Avatars/avatar_duran.png',
    4: '/Board/Avatars/avatar_wolovick.png',
    5: '/Board/Avatars/avatar_penazzi.png',
    6: '/Board/Avatars/avatar_colorado-guri.png',
  }
}));

const getHiddenByRole = (role, options = {}) => {
  return screen.getByRole(role, { ...options, hidden: true });
};

const getAllHiddenByRole = (role, options = {}) => {
  return screen.getAllByRole(role, { ...options, hidden: true });
};

describe('AvatarPicker', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSelect: vi.fn(),
    ids: [1, 2, 3],
    selectedId: 2,
    title: 'Choose your avatar'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <AvatarPicker {...defaultProps} isOpen={false} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('renders the modal when isOpen is true', () => {
    render(<AvatarPicker {...defaultProps} />);
    
    const modal = getHiddenByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveAttribute('aria-modal', 'true');
  });

  it('displays the correct title', () => {
    render(<AvatarPicker {...defaultProps} />);
    
    const title = screen.getByText('Choose your avatar');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('ap-title');
  });

  it('displays custom title when provided', () => {
    const customTitle = 'Select Avatar';
    render(<AvatarPicker {...defaultProps} title={customTitle} />);
    
    const title = screen.getByText(customTitle);
    expect(title).toBeInTheDocument();
  });

  it('renders close button with correct attributes', () => {
    render(<AvatarPicker {...defaultProps} />);
    
    const closeButton = screen.getByLabelText('Close');
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveClass('ap-close');
    expect(closeButton).toHaveTextContent('×');
  });

  it('calls onClose when close button is clicked', () => {
    const mockOnClose = vi.fn();
    render(<AvatarPicker {...defaultProps} onClose={mockOnClose} />);
    
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const mockOnClose = vi.fn();
    render(<AvatarPicker {...defaultProps} onClose={mockOnClose} />);
    
    const overlay = getHiddenByRole('dialog').parentElement;
    fireEvent.click(overlay);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when modal content is clicked', () => {
    const mockOnClose = vi.fn();
    render(<AvatarPicker {...defaultProps} onClose={mockOnClose} />);
    
    const modal = getHiddenByRole('dialog');
    fireEvent.click(modal);
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('renders all avatar buttons for provided ids', () => {
    const ids = [1, 2, 3, 4];
    render(<AvatarPicker {...defaultProps} ids={ids} />);
    
    const avatarButtons = screen.getAllByLabelText('Select avatar');
    expect(avatarButtons).toHaveLength(ids.length);
  });

  it('renders avatar images with correct src attributes', () => {
    const ids = [1, 2, 3];
    render(<AvatarPicker {...defaultProps} ids={ids} />);
    
    const avatarImages = screen.getAllByRole('presentation', { hidden: true });
    expect(avatarImages).toHaveLength(ids.length);
    
    avatarImages.forEach((img, index) => {
      const expectedSrc = `/Board/Avatars/avatar_${['barba-azul', 'robotito', 'duran'][index]}.png`;
      expect(img).toHaveAttribute('src', expectedSrc);
      expect(img).toHaveAttribute('alt', '');
      expect(img).toHaveClass('ap-avatarImg');
    });
  });

  it('marks selected avatar button with correct data attribute', () => {
    const selectedId = 2;
    render(<AvatarPicker {...defaultProps} selectedId={selectedId} />);
    
    const avatarButtons = screen.getAllByLabelText('Select avatar');
    
    avatarButtons.forEach((button, index) => {
      const isSelected = defaultProps.ids[index] === selectedId;
      expect(button).toHaveAttribute('data-selected', isSelected ? 'true' : 'false');
    });
  });

  it('calls onSelect and onClose when avatar is clicked', () => {
    const mockOnSelect = vi.fn();
    const mockOnClose = vi.fn();
    render(
      <AvatarPicker 
        {...defaultProps} 
        onSelect={mockOnSelect} 
        onClose={mockOnClose} 
      />
    );
    
    const firstAvatarButton = screen.getAllByLabelText('Select avatar')[0];
    fireEvent.click(firstAvatarButton);
    
    expect(mockOnSelect).toHaveBeenCalledWith(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSelect with correct id when different avatars are clicked', () => {
    const mockOnSelect = vi.fn();
    const ids = [1, 3, 5];
    render(
      <AvatarPicker 
        {...defaultProps} 
        ids={ids}
        onSelect={mockOnSelect} 
      />
    );
    
    const avatarButtons = screen.getAllByLabelText('Select avatar');
    
    fireEvent.click(avatarButtons[1]);
    expect(mockOnSelect).toHaveBeenCalledWith(3);
    
    fireEvent.click(avatarButtons[2]);
    expect(mockOnSelect).toHaveBeenCalledWith(5);
  });

  it('does not crash when onSelect is not provided', () => {
    render(<AvatarPicker {...defaultProps} onSelect={null} />);
    
    const firstAvatarButton = screen.getAllByLabelText('Select avatar')[0];
    
    expect(() => {
      fireEvent.click(firstAvatarButton);
    }).not.toThrow();
  });

  it('does not crash when onClose is not provided', () => {
    render(<AvatarPicker {...defaultProps} onClose={null} />);
    
    const closeButton = screen.getByLabelText('Close');
    
    expect(() => {
      fireEvent.click(closeButton);
    }).not.toThrow();
  });

  it('handles empty ids array gracefully', () => {
    render(<AvatarPicker {...defaultProps} ids={[]} />);
    
    const avatarButtons = screen.queryAllByLabelText('Select avatar');
    expect(avatarButtons).toHaveLength(0);
    
    const modal = getHiddenByRole('dialog');
    expect(modal).toBeInTheDocument();
  });

  it('handles selectedId that is not in ids array', () => {
    render(<AvatarPicker {...defaultProps} selectedId={99} />);
    
    const avatarButtons = screen.getAllByLabelText('Select avatar');
    
    avatarButtons.forEach((button) => {
      expect(button).toHaveAttribute('data-selected', 'false');
    });
  });

  it('applies correct CSS classes to elements', () => {
    render(<AvatarPicker {...defaultProps} />);
    
    const overlay = getHiddenByRole('dialog').parentElement;
    expect(overlay).toHaveClass('ap-overlay');
    
    const modal = getHiddenByRole('dialog');
    expect(modal).toHaveClass('ap-modal');
    
    const title = screen.getByText('Choose your avatar');
    expect(title.parentElement).toHaveClass('ap-head');
    
    const grid = screen.getAllByLabelText('Select avatar')[0].parentElement;
    expect(grid).toHaveClass('ap-grid');
    
    const avatarButtons = screen.getAllByLabelText('Select avatar');
    avatarButtons.forEach((button) => {
      expect(button).toHaveClass('ap-avatarBtn');
    });
  });

  it('has correct accessibility attributes', () => {
    const customTitle = 'Select your character';
    render(<AvatarPicker {...defaultProps} title={customTitle} />);
    
    const overlay = getHiddenByRole('dialog').parentElement;
    expect(overlay).toHaveAttribute('aria-hidden');
    
    const modal = getHiddenByRole('dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-label', customTitle);
    
    const avatarButtons = screen.getAllByLabelText('Select avatar');
    avatarButtons.forEach((button) => {
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveAttribute('aria-label', 'Select avatar');
    });
  });

  it('handles single avatar id correctly', () => {
    const singleId = [4];
    render(<AvatarPicker {...defaultProps} ids={singleId} selectedId={4} />);
    
    const avatarButtons = screen.getAllByLabelText('Select avatar');
    expect(avatarButtons).toHaveLength(1);
    expect(avatarButtons[0]).toHaveAttribute('data-selected', 'true');
    
    const avatarImage = screen.getByRole('presentation', { hidden: true });
    expect(avatarImage).toHaveAttribute('src', '/Board/Avatars/avatar_wolovick.png');
  });
});