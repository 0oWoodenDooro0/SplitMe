import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HostCollabProgress } from '../HostCollabProgress';
import { Room, RoundingMode, SplitType } from '../../types/models';

const mockRoom: Room = {
  id: 'room-1',
  title: '週末火鍋歡聚',
  code: 'HOTPOT',
  isLocked: false,
  currency: 'NT$',
  roundingMode: RoundingMode.NEAREST_INTEGER,
  members: [
    { id: 'm1', name: 'Alice', avatarColor: '#10B981', isHost: true },
    { id: 'm2', name: 'Bob', avatarColor: '#3B82F6', isHost: false },
    { id: 'm3', name: 'Charlie', avatarColor: '#F59E0B', isHost: false },
  ],
  items: [
    {
      id: 'i1',
      name: '麻辣鍋',
      price: 600,
      paidByMemberId: 'm1',
      splits: [
        { memberId: 'm1', splitType: SplitType.EQUAL },
        { memberId: 'm2', splitType: SplitType.EQUAL },
      ],
    },
    {
      id: 'i2',
      name: '青菜拼盤',
      price: 150,
      paidByMemberId: 'm1',
      splits: [{ memberId: 'm1', splitType: SplitType.EQUAL }],
    },
  ],
  extraFees: [],
};

describe('HostCollabProgress Component', () => {
  it('renders member check progress and unselected reminder for members with 0 checks', () => {
    render(
      <HostCollabProgress
        room={mockRoom}
        activeMemberIds={['m1', 'm2']}
        onToggleLock={vi.fn()}
        onOpenShare={vi.fn()}
      />
    );

    // Charlie has 0 checks
    expect(screen.getByText(/尚未勾選|未勾選提醒/i)).toBeInTheDocument();
    expect(screen.getByText(/Charlie/i)).toBeInTheDocument();

    // Alice has 2 checks, Bob has 1 check
    expect(screen.getByText(/2 項/i)).toBeInTheDocument();
    expect(screen.getByText(/1 項/i)).toBeInTheDocument();
  });

  it('displays online presence badge for active members', () => {
    render(
      <HostCollabProgress
        room={mockRoom}
        activeMemberIds={['m1', 'm2']}
        onToggleLock={vi.fn()}
        onOpenShare={vi.fn()}
      />
    );

    expect(screen.getByTestId('presence-badge-m1')).toHaveTextContent(/在線|線上|active/i);
    expect(screen.getByTestId('presence-badge-m2')).toHaveTextContent(/在線|線上|active/i);
    expect(screen.getByTestId('presence-badge-m3')).toHaveTextContent(/離線|未連線|offline/i);
  });

  it('triggers onToggleLock when lock button is clicked', () => {
    const handleToggleLock = vi.fn();
    render(
      <HostCollabProgress
        room={mockRoom}
        activeMemberIds={['m1', 'm2']}
        onToggleLock={handleToggleLock}
        onOpenShare={vi.fn()}
      />
    );

    const lockBtn = screen.getByRole('button', { name: /鎖定結算|lock settlement/i });
    fireEvent.click(lockBtn);

    expect(handleToggleLock).toHaveBeenCalledWith(true);
  });

  it('triggers onOpenShare when share button is clicked', () => {
    const handleOpenShare = vi.fn();
    render(
      <HostCollabProgress
        room={mockRoom}
        activeMemberIds={['m1']}
        onToggleLock={vi.fn()}
        onOpenShare={handleOpenShare}
      />
    );

    const shareBtn = screen.getByRole('button', { name: /邀請朋友協作|分享協作連結|分享房間/i });
    fireEvent.click(shareBtn);

    expect(handleOpenShare).toHaveBeenCalled();
  });
});
