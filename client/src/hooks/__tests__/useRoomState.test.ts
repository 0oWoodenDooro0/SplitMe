import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRoomState } from '../useRoomState';
import { FeeAllocationMethod, FeeType, RoundingMode, SplitType } from '../../types/models';

describe('useRoomState hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with default room structure', () => {
    const { result } = renderHook(() => useRoomState());
    expect(result.current.room).toBeDefined();
    expect(result.current.room.members.length).toBeGreaterThan(0);
    expect(result.current.settlement).toBeDefined();
    expect(result.current.settlement.isBalanced).toBe(true);
  });

  it('adds, updates, and removes a member', () => {
    const { result } = renderHook(() => useRoomState());

    let newMemberId = '';
    act(() => {
      const m = result.current.addMember('Charlie', '#10B981');
      newMemberId = m.id;
    });

    expect(result.current.room.members.some((m) => m.id === newMemberId && m.name === 'Charlie')).toBe(true);

    act(() => {
      result.current.updateMember(newMemberId, { name: 'Charlie B.' });
    });
    expect(result.current.room.members.find((m) => m.id === newMemberId)?.name).toBe('Charlie B.');

    act(() => {
      result.current.removeMember(newMemberId);
    });
    expect(result.current.room.members.some((m) => m.id === newMemberId)).toBe(false);
  });

  it('cleans up member from item splits when member is removed', () => {
    const { result } = renderHook(() => useRoomState());
    let memberId = '';
    let itemId = '';

    act(() => {
      const m = result.current.addMember('David', '#3B82F6');
      memberId = m.id;
    });

    act(() => {
      const item = result.current.addItem('Pizza', 300, memberId, [memberId]);
      itemId = item.id;
    });

    expect(result.current.room.items.find((i) => i.id === itemId)?.splits?.some((s) => s.memberId === memberId)).toBe(true);

    act(() => {
      result.current.removeMember(memberId);
    });

    const item = result.current.room.items.find((i) => i.id === itemId);
    expect(item?.splits?.some((s) => s.memberId === memberId)).toBe(false);
  });

  it('adds, updates, and removes an item', () => {
    const { result } = renderHook(() => useRoomState());
    const hostId = result.current.room.members[0].id;
    let itemId = '';

    act(() => {
      const item = result.current.addItem('Burger', 180, hostId, [hostId]);
      itemId = item.id;
    });

    expect(result.current.room.items.some((i) => i.id === itemId && i.name === 'Burger')).toBe(true);

    act(() => {
      result.current.updateItem(itemId, { name: 'Double Burger', price: 240 });
    });

    const updated = result.current.room.items.find((i) => i.id === itemId);
    expect(updated?.name).toBe('Double Burger');
    expect(updated?.price).toBe(240);

    act(() => {
      result.current.removeItem(itemId);
    });
    expect(result.current.room.items.some((i) => i.id === itemId)).toBe(false);
  });

  it('toggles, selects all, and clears member splits for an item', () => {
    const { result } = renderHook(() => useRoomState());
    let m1Id = result.current.room.members[0].id;
    let m2Id = '';

    act(() => {
      const m2 = result.current.addMember('Eve', '#EC4899');
      m2Id = m2.id;
    });

    let itemId = '';
    act(() => {
      const item = result.current.addItem('Shared Hotpot', 600, m1Id, [m1Id]);
      itemId = item.id;
    });

    // Toggle m2 into item
    act(() => {
      result.current.toggleItemSplit(itemId, m2Id);
    });
    expect(result.current.room.items.find((i) => i.id === itemId)?.splits?.map((s) => s.memberId)).toContain(m2Id);

    // Toggle m2 out of item
    act(() => {
      result.current.toggleItemSplit(itemId, m2Id);
    });
    expect(result.current.room.items.find((i) => i.id === itemId)?.splits?.map((s) => s.memberId)).not.toContain(m2Id);

    // Select all members
    act(() => {
      result.current.setAllItemSplit(itemId);
    });
    const splits = result.current.room.items.find((i) => i.id === itemId)?.splits;
    expect(splits?.length).toBe(result.current.room.members.length);

    // Clear all splits
    act(() => {
      result.current.clearItemSplit(itemId);
    });
    expect(result.current.room.items.find((i) => i.id === itemId)?.splits?.length).toBe(0);
  });

  it('updates split share weights and exact amounts', () => {
    const { result } = renderHook(() => useRoomState());
    const m1Id = result.current.room.members[0].id;
    let itemId = '';

    act(() => {
      const item = result.current.addItem('Wine', 500, m1Id, [m1Id]);
      itemId = item.id;
    });

    // Update to weighted 2x
    act(() => {
      result.current.updateItemSplitShare(itemId, m1Id, {
        splitType: SplitType.WEIGHTED,
        value: 2.0,
      });
    });

    let share = result.current.room.items.find((i) => i.id === itemId)?.splits?.find((s) => s.memberId === m1Id);
    expect(share?.splitType).toBe(SplitType.WEIGHTED);
    expect(share?.value).toBe(2.0);

    // Update to exact amount $200
    act(() => {
      result.current.updateItemSplitShare(itemId, m1Id, {
        splitType: SplitType.EXACT_AMOUNT,
        value: 200,
      });
    });

    share = result.current.room.items.find((i) => i.id === itemId)?.splits?.find((s) => s.memberId === m1Id);
    expect(share?.splitType).toBe(SplitType.EXACT_AMOUNT);
    expect(share?.value).toBe(200);
  });

  it('manages extra fees and recalculates settlement dynamically', () => {
    const { result } = renderHook(() => useRoomState());
    const hostId = result.current.room.members[0].id;

    act(() => {
      result.current.addItem('Meal', 1000, hostId, [hostId]);
    });

    let feeId = '';
    act(() => {
      const fee = result.current.addExtraFee({
        name: '服務費 10%',
        feeType: FeeType.PERCENTAGE,
        rate: 0.1,
        allocationMethod: FeeAllocationMethod.PROPORTIONAL_SUBTOTAL,
      });
      feeId = fee.id;
    });

    expect(result.current.settlement.totalFeeAmount).toBe(100);
    expect(result.current.settlement.grandTotal).toBe(1100);

    act(() => {
      result.current.updateExtraFee(feeId, {
        name: '外送固定費',
        feeType: FeeType.FIXED_AMOUNT,
        amount: 50,
      });
    });

    expect(result.current.settlement.totalFeeAmount).toBe(50);
    expect(result.current.settlement.grandTotal).toBe(1050);

    act(() => {
      result.current.removeExtraFee(feeId);
    });
    expect(result.current.settlement.totalFeeAmount).toBe(0);
    expect(result.current.settlement.grandTotal).toBe(1000);
  });

  it('supports rounding mode change and demo sample data loading', () => {
    const { result } = renderHook(() => useRoomState());

    act(() => {
      result.current.setRoundingMode(RoundingMode.ROUND_UP);
      result.current.setRoomTitle('聚餐分帳測試');
    });

    expect(result.current.room.roundingMode).toBe(RoundingMode.ROUND_UP);
    expect(result.current.room.title).toBe('聚餐分帳測試');

    act(() => {
      result.current.loadSampleData();
    });

    expect(result.current.room.members.length).toBeGreaterThanOrEqual(3);
    expect(result.current.room.items.length).toBeGreaterThanOrEqual(3);
    expect(result.current.settlement.grandTotal).toBeGreaterThan(0);
    expect(result.current.settlement.transfers.length).toBeGreaterThan(0);

    act(() => {
      result.current.resetRoom();
    });
    expect(result.current.room.items.length).toBe(0);
    expect(result.current.room.members.length).toBe(1);
    expect(result.current.room.title).toBe('');
    expect(result.current.room.members[0].name).toBe('');
  });

  it('resets room with empty string title and host name for native placeholder support', () => {
    const { result } = renderHook(() => useRoomState());

    act(() => {
      result.current.loadSampleData();
    });
    expect(result.current.room.title).not.toBe('');

    act(() => {
      result.current.resetRoom();
    });
    expect(result.current.room.title).toBe('');
    expect(result.current.room.members.length).toBe(1);
    expect(result.current.room.members[0].name).toBe('');
    expect(result.current.room.items).toEqual([]);
    expect(result.current.room.extraFees).toEqual([]);
  });

  it('supports setRoomDirectly to overwrite room state from backend or websocket', () => {
    const { result } = renderHook(() => useRoomState());
    const remoteRoom = {
      id: 'remote-123',
      code: 'REMOTE',
      title: '遠端聚餐同步',
      isLocked: false,
      currency: 'NT$',
      roundingMode: RoundingMode.NEAREST_INTEGER,
      members: [
        { id: 'm-remote-1', name: '遠端主揪', avatarColor: '#10B981', isHost: true },
        { id: 'm-remote-2', name: '朋友小李', avatarColor: '#3B82F6', isHost: false },
      ],
      items: [
        {
          id: 'i-remote-1',
          name: '烤雞',
          price: 500,
          paidByMemberId: 'm-remote-1',
          splits: [{ memberId: 'm-remote-1', splitType: SplitType.EQUAL }],
        },
      ],
      extraFees: [],
    };

    act(() => {
      result.current.setRoomDirectly(remoteRoom);
    });

    expect(result.current.room.id).toBe('remote-123');
    expect(result.current.room.code).toBe('REMOTE');
    expect(result.current.room.title).toBe('遠端聚餐同步');
    expect(result.current.room.members.length).toBe(2);
    expect(result.current.room.items.length).toBe(1);
  });
});

