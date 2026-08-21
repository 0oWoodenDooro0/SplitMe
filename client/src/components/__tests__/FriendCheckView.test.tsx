import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FriendCheckView } from '../FriendCheckView';
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
      name: '麻辣鴛鴦鍋底',
      price: 600,
      paidByMemberId: 'm1',
      splits: [
        { memberId: 'm1', splitType: SplitType.EQUAL },
        { memberId: 'm2', splitType: SplitType.EQUAL },
      ],
    },
    {
      id: 'i2',
      name: '頂級牛小排',
      price: 450,
      paidByMemberId: 'm1',
      splits: [
        { memberId: 'm1', splitType: SplitType.EQUAL },
      ],
    },
  ],
  extraFees: [],
};

describe('FriendCheckView Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders identity picker when current member is not selected', () => {
    const handleJoin = vi.fn();
    render(
      <FriendCheckView
        room={mockRoom}
        currentMemberId={null}
        activeMemberIds={['m1']}
        connectionStatus="connected"
        onSelectMember={handleJoin}
        onAddMember={vi.fn()}
        onToggleItemCheck={vi.fn()}
      />
    );

    expect(screen.getByText(/你是哪位聚餐成員|選擇你的身份/i)).toBeInTheDocument();
    expect(screen.queryByText(/Alice/i)).not.toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });


  it('selects member identity and triggers join callback', () => {
    const handleSelectMember = vi.fn();
    render(
      <FriendCheckView
        room={mockRoom}
        currentMemberId={null}
        activeMemberIds={['m1']}
        connectionStatus="connected"
        onSelectMember={handleSelectMember}
        onAddMember={vi.fn()}
        onToggleItemCheck={vi.fn()}
      />
    );

    const bobBtn = screen.getByRole('button', { name: /Bob/i });
    fireEvent.click(bobBtn);

    expect(handleSelectMember).toHaveBeenCalledWith('m2');
  });

  it('allows friend to add a new name if not in member list', () => {
    const handleAddMember = vi.fn();
    render(
      <FriendCheckView
        room={mockRoom}
        currentMemberId={null}
        activeMemberIds={['m1']}
        connectionStatus="connected"
        onSelectMember={vi.fn()}
        onAddMember={handleAddMember}
        onToggleItemCheck={vi.fn()}
      />
    );

    const input = screen.getByLabelText(/新增我的名字/i);
    fireEvent.change(input, { target: { value: 'David' } });

    const addBtn = screen.getByRole('button', { name: /加入聚餐|新增並加入/i });
    fireEvent.click(addBtn);

    expect(handleAddMember).toHaveBeenCalledWith('David');
  });

  it('selects existing member identity instead of adding duplicate when name matches existing member', () => {
    const handleAddMember = vi.fn();
    const handleSelectMember = vi.fn();

    render(
      <FriendCheckView
        room={mockRoom}
        currentMemberId={null}
        activeMemberIds={['m1']}
        connectionStatus="connected"
        onSelectMember={handleSelectMember}
        onAddMember={handleAddMember}
        onToggleItemCheck={vi.fn()}
      />
    );

    const input = screen.getByLabelText(/新增我的名字/i);
    // Enter "bob" with different casing and whitespace
    fireEvent.change(input, { target: { value: '  bob  ' } });

    const addBtn = screen.getByRole('button', { name: /加入聚餐|新增並加入/i });
    fireEvent.click(addBtn);

    // Expect duplicate guard to select existing member 'm2' and NOT call onAddMember
    expect(handleSelectMember).toHaveBeenCalledWith('m2');
    expect(handleAddMember).not.toHaveBeenCalled();
  });


  it('displays friend items checklist with current checks and estimated amount', () => {
    const handleToggle = vi.fn();
    render(
      <FriendCheckView
        room={mockRoom}
        currentMemberId="m2"
        activeMemberIds={['m1', 'm2']}
        connectionStatus="connected"
        onSelectMember={vi.fn()}
        onAddMember={vi.fn()}
        onToggleItemCheck={handleToggle}
      />
    );

    expect(screen.getByText('麻辣鴛鴦鍋底')).toBeInTheDocument();
    expect(screen.getByText('頂級牛小排')).toBeInTheDocument();

    const item1Checkbox = screen.getByTestId('friend-check-i1');
    expect(item1Checkbox).toBeChecked();

    const item2Checkbox = screen.getByTestId('friend-check-i2');
    expect(item2Checkbox).not.toBeChecked();

    fireEvent.click(item2Checkbox);
    expect(handleToggle).toHaveBeenCalledWith('i2', 'm2', true);

    fireEvent.click(item1Checkbox);
    expect(handleToggle).toHaveBeenCalledWith('i1', 'm2', false);
  });

  it('displays locked settlement banner and disables checkboxes when room is locked', () => {
    const lockedRoom: Room = { ...mockRoom, isLocked: true };
    const handleToggle = vi.fn();

    render(
      <FriendCheckView
        room={lockedRoom}
        currentMemberId="m2"
        activeMemberIds={['m1', 'm2']}
        connectionStatus="connected"
        onSelectMember={vi.fn()}
        onAddMember={vi.fn()}
        onToggleItemCheck={handleToggle}
      />
    );

    expect(screen.getByText(/已鎖定結算|目前僅供檢視/i)).toBeInTheDocument();

    const item1Checkbox = screen.getByTestId('friend-check-i1');
    expect(item1Checkbox).toBeDisabled();
  });

  it('allows switching identity when clicking switch member button', () => {
    const handleSelectMember = vi.fn();
    render(
      <FriendCheckView
        room={mockRoom}
        currentMemberId="m2"
        activeMemberIds={['m1', 'm2']}
        connectionStatus="connected"
        onSelectMember={handleSelectMember}
        onAddMember={vi.fn()}
        onToggleItemCheck={vi.fn()}
      />
    );

    const switchBtn = screen.getByRole('button', { name: /切換身份|換人/i });
    fireEvent.click(switchBtn);

    expect(screen.getByText(/你是哪位聚餐成員|選擇你的身份/i)).toBeInTheDocument();
  });

  it('renders identity picker in light theme styling with fallback title when title is empty', () => {
    const emptyTitleRoom: Room = {
      ...mockRoom,
      title: '',
    };

    const { container } = render(
      <FriendCheckView
        room={emptyTitleRoom}
        currentMemberId={null}
        activeMemberIds={[]}
        connectionStatus="connected"
        onSelectMember={vi.fn()}
        onAddMember={vi.fn()}
        onToggleItemCheck={vi.fn()}
      />
    );

    // Outer container has light theme styling
    const rootDiv = container.firstElementChild as HTMLElement;
    expect(rootDiv.className).toContain('bg-slate-50');
    expect(rootDiv.className).toContain('text-slate-900');
    expect(rootDiv.className).not.toContain('bg-slate-900');

    // Displays fallback title
    expect(screen.getByText('聚餐分帳')).toBeInTheDocument();
  });

  it('renders friend items checklist with light theme classes for unchecked and checked items', () => {
    const { container } = render(
      <FriendCheckView
        room={mockRoom}
        currentMemberId="m2"
        activeMemberIds={['m1', 'm2']}
        connectionStatus="connected"
        onSelectMember={vi.fn()}
        onAddMember={vi.fn()}
        onToggleItemCheck={vi.fn()}
      />
    );

    const rootDiv = container.firstElementChild as HTMLElement;
    expect(rootDiv.className).toContain('bg-slate-50');
    expect(rootDiv.className).toContain('text-slate-900');
    expect(rootDiv.className).not.toContain('bg-slate-900');

    // Header has light theme classes
    const header = container.querySelector('header');
    expect(header?.className).toContain('bg-white');
    expect(header?.className).toContain('border-slate-200');
  });

  it('displays connection status badge accurately for connected, connecting, and disconnected states', () => {
    const { rerender } = render(
      <FriendCheckView
        room={mockRoom}
        currentMemberId="m2"
        activeMemberIds={['m1', 'm2']}
        connectionStatus="connected"
        onSelectMember={vi.fn()}
        onAddMember={vi.fn()}
        onToggleItemCheck={vi.fn()}
      />
    );

    expect(screen.getByText('🟢 已連線')).toBeInTheDocument();

    rerender(
      <FriendCheckView
        room={mockRoom}
        currentMemberId="m2"
        activeMemberIds={['m1', 'm2']}
        connectionStatus="connecting"
        onSelectMember={vi.fn()}
        onAddMember={vi.fn()}
        onToggleItemCheck={vi.fn()}
      />
    );

    expect(screen.getByText('🟡 連線中...')).toBeInTheDocument();

    rerender(
      <FriendCheckView
        room={mockRoom}
        currentMemberId="m2"
        activeMemberIds={['m1', 'm2']}
        connectionStatus="disconnected"
        onSelectMember={vi.fn()}
        onAddMember={vi.fn()}
        onToggleItemCheck={vi.fn()}
      />
    );

    expect(screen.getByText('🔴 已斷線')).toBeInTheDocument();
  });
});



