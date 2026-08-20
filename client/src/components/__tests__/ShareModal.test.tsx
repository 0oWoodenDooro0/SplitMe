import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
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
    render(
      <ShareModal
        isOpen={true}
        room={mockRoom}
        onClose={vi.fn()}
        onSwitchToFriendView={vi.fn()}
      />
    );

    const copyLinkBtn = screen.getByRole('button', { name: /複製連結|copy link/i });
    fireEvent.click(copyLinkBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText(/已複製|copied/i)).toBeInTheDocument();
    });
  });

  it('copies short code to clipboard', async () => {
    render(
      <ShareModal
        isOpen={true}
        room={mockRoom}
        onClose={vi.fn()}
        onSwitchToFriendView={vi.fn()}
      />
    );

    const copyCodeBtn = screen.getByRole('button', { name: /複製代碼|copy code/i });
    fireEvent.click(copyCodeBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('HOTPOT');
  });

  it('calls onSwitchToFriendView when friend preview button is clicked', () => {
    const handleSwitch = vi.fn();
    render(
      <ShareModal
        isOpen={true}
        room={mockRoom}
        onClose={vi.fn()}
        onSwitchToFriendView={handleSwitch}
      />
    );

    const previewBtn = screen.getByRole('button', { name: /進入朋友視圖|預覽朋友視圖|切換視圖/i });
    fireEvent.click(previewBtn);

    expect(handleSwitch).toHaveBeenCalled();
  });

  it('calls onClose when close button or backdrop is clicked', () => {
    const handleClose = vi.fn();
    render(
      <ShareModal
        isOpen={true}
        room={mockRoom}
        onClose={handleClose}
        onSwitchToFriendView={vi.fn()}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /關閉|close/i });
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalled();
  });
});
