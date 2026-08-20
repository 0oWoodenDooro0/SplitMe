import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step5SplitAssign } from '../Step5SplitAssign';
import { Room } from '../../../types/models';

describe('Step5SplitAssign Component', () => {
  const mockRoom: Room = {
    id: 'room-1',
    code: 'SPLIT99',
    title: '週五聚餐',
    currency: 'NT$',
    members: [
      { id: 'm-1', name: '主揪小王', avatarColor: '#10B981', isHost: true },
      { id: 'm-2', name: '小明', avatarColor: '#3B82F6', isHost: false },
    ],
    items: [
      {
        id: 'i-1',
        name: '麻辣鍋底',
        price: 350,
        paidByMemberId: 'm-1',
        splits: [
          { memberId: 'm-1', splitType: 'EQUAL', value: 1 },
          { memberId: 'm-2', splitType: 'EQUAL', value: 1 },
        ],
      },
    ],
    extraFees: [],
  };

  it('renders item list with member split avatars and quick split buttons', () => {
    render(
      <Step5SplitAssign
        room={mockRoom}
        activeMemberIds={['m-1', 'm-2']}
        mode="live"
        onToggleSplit={vi.fn()}
        onSetAllSplit={vi.fn()}
        onClearSplit={vi.fn()}
        onOpenWeightModal={vi.fn()}
        onToggleLock={vi.fn()}
        onOpenShare={vi.fn()}
        onUpdateItem={vi.fn()}
        onRemoveItem={vi.fn()}
      />
    );

    expect(screen.getByText('麻辣鍋底')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /全員均分|全員/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /清除分攤|清除/i })).toBeInTheDocument();
  });

  it('triggers onToggleSplit when clicking a member avatar', async () => {
    const user = userEvent.setup();
    const handleToggleSplit = vi.fn();

    render(
      <Step5SplitAssign
        room={mockRoom}
        activeMemberIds={['m-1', 'm-2']}
        mode="live"
        onToggleSplit={handleToggleSplit}
        onSetAllSplit={vi.fn()}
        onClearSplit={vi.fn()}
        onOpenWeightModal={vi.fn()}
        onToggleLock={vi.fn()}
        onOpenShare={vi.fn()}
        onUpdateItem={vi.fn()}
        onRemoveItem={vi.fn()}
      />
    );

    const toggleMemberBtn = screen.getByRole('button', { name: /切換分攤: 小明/i });
    await user.click(toggleMemberBtn);

    expect(handleToggleSplit).toHaveBeenCalledWith('i-1', 'm-2');
  });

  it('triggers onSetAllSplit and onClearSplit', async () => {
    const user = userEvent.setup();
    const handleSetAllSplit = vi.fn();
    const handleClearSplit = vi.fn();

    render(
      <Step5SplitAssign
        room={mockRoom}
        activeMemberIds={['m-1', 'm-2']}
        mode="live"
        onToggleSplit={vi.fn()}
        onSetAllSplit={handleSetAllSplit}
        onClearSplit={handleClearSplit}
        onOpenWeightModal={vi.fn()}
        onToggleLock={vi.fn()}
        onOpenShare={vi.fn()}
        onUpdateItem={vi.fn()}
        onRemoveItem={vi.fn()}
      />
    );

    const setAllBtn = screen.getByRole('button', { name: /全員均分|全員/i });
    await user.click(setAllBtn);
    expect(handleSetAllSplit).toHaveBeenCalledWith('i-1');

    const clearBtn = screen.getByRole('button', { name: /清除分攤|清除/i });
    await user.click(clearBtn);
    expect(handleClearSplit).toHaveBeenCalledWith('i-1');
  });
});
