import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShareModal } from '../ShareModal';
import { Room, RoundingMode } from '../../types/models';

const mockRoom: Room = {
  id: 'room-12345',
  title: '週末火鍋歡聚',
  code: 'HOTPOT',
  isLocked: false,
  currency: 'NT$',
  roundingMode: RoundingMode.NEAREST_INTEGER,
  members: [
    { id: 'm1', name: 'Alice', avatarColor: '#10B981', isHost: true },
    { id: 'm2', name: 'Bob', avatarColor: '#3B82F6', isHost: false },
  ],
  items: [],
  extraFees: [],
};

describe('ShareModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders room share code, room title, and QR code container when open', () => {
    render(
      <ShareModal
        isOpen={true}
        room={mockRoom}
        onClose={vi.fn()}
        onSwitchToFriendView={vi.fn()}
      />
    );

    expect(screen.getByText('週末火鍋歡聚')).toBeInTheDocument();
    expect(screen.getByText('HOTPOT')).toBeInTheDocument();
    expect(screen.getByText(/掃描 QR Code|免註冊/i)).toBeInTheDocument();
    expect(screen.getByTestId('qr-code-canvas')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <ShareModal
        isOpen={false}
        room={mockRoom}
        onClose={vi.fn()}
        onSwitchToFriendView={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('copies share URL to clipboard and shows feedback', async () => {
    const user = userEvent.setup();
    const writeSpy = vi.spyOn(navigator.clipboard, 'writeText');

    render(
      <ShareModal
        isOpen={true}
        room={mockRoom}
        onClose={vi.fn()}
        onSwitchToFriendView={vi.fn()}
      />
    );

    const copyLinkBtn = screen.getByRole('button', { name: /複製連結|copy link/i });
    await user.click(copyLinkBtn);

    expect(writeSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText(/已複製|copied/i)).toBeInTheDocument();
    });
  });

  it('copies short code to clipboard', async () => {
    const user = userEvent.setup();
    const writeSpy = vi.spyOn(navigator.clipboard, 'writeText');

    render(
      <ShareModal
        isOpen={true}
        room={mockRoom}
        onClose={vi.fn()}
        onSwitchToFriendView={vi.fn()}
      />
    );

    const copyCodeBtn = screen.getByRole('button', { name: /複製代碼|copy code/i });
    await user.click(copyCodeBtn);

    expect(writeSpy).toHaveBeenCalledWith('HOTPOT');
    await waitFor(() => {
      expect(screen.getByText(/已複製/i)).toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(
      <ShareModal
        isOpen={true}
        room={mockRoom}
        onClose={handleClose}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /關閉|close/i });
    await user.click(closeBtn);

    expect(handleClose).toHaveBeenCalled();
  });
});

