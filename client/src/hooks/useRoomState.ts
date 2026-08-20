import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ExtraFee,
  FeeAllocationMethod,
  FeeType,
  Item,
  Member,
  PaymentInfo,
  Room,
  RoundingMode,
  SettlementResult,
  SplitShare,
  SplitType,
} from '../types/models';
import { calculateSettlement } from '../core/financialCalculator';
import { getRandomAvatarColor } from '../utils/colors';

const STORAGE_KEY = 'splitme_current_room';

const DEFAULT_MEMBERS: Member[] = [
  { id: 'member-host', name: '我 (主揪)', avatarColor: '#10B981', isHost: true },
  { id: 'member-2', name: '小明', avatarColor: '#0EA5E9', isHost: false },
  { id: 'member-3', name: '小華', avatarColor: '#F59E0B', isHost: false },
];

const DEFAULT_ROOM: Room = {
  id: 'local-room-1',
  title: '今日美味聚餐 🍲',
  code: 'SPLIT1',
  isLocked: false,
  currency: 'NT$',
  roundingMode: RoundingMode.NEAREST_INTEGER,
  members: DEFAULT_MEMBERS,
  items: [],
  extraFees: [],
};

const SAMPLE_MEMBERS: Member[] = [
  { id: 'sample-m1', name: 'Alice', avatarColor: '#10B981', isHost: true },
  { id: 'sample-m2', name: 'Bob', avatarColor: '#0EA5E9', isHost: false },
  { id: 'sample-m3', name: 'Charlie', avatarColor: '#F59E0B', isHost: false },
  { id: 'sample-m4', name: 'Diana', avatarColor: '#8B5CF6', isHost: false },
];

const SAMPLE_ITEMS: Item[] = [
  {
    id: 'sample-i1',
    name: '麻辣鴛鴦鍋底',
    price: 650,
    paidByMemberId: 'sample-m1',
    splits: [
      { memberId: 'sample-m1', splitType: SplitType.EQUAL },
      { memberId: 'sample-m2', splitType: SplitType.EQUAL },
      { memberId: 'sample-m3', splitType: SplitType.EQUAL },
      { memberId: 'sample-m4', splitType: SplitType.EQUAL },
    ],
  },
  {
    id: 'sample-i2',
    name: '頂級無骨牛小排',
    price: 580,
    paidByMemberId: 'sample-m2',
    splits: [
      { memberId: 'sample-m1', splitType: SplitType.EQUAL },
      { memberId: 'sample-m2', splitType: SplitType.EQUAL },
      { memberId: 'sample-m3', splitType: SplitType.EQUAL },
    ],
  },
  {
    id: 'sample-i3',
    name: '特選生啤酒',
    price: 450,
    paidByMemberId: 'sample-m1',
    splits: [
      { memberId: 'sample-m1', splitType: SplitType.WEIGHTED, value: 2 },
      { memberId: 'sample-m2', splitType: SplitType.WEIGHTED, value: 1 },
    ],
  },
  {
    id: 'sample-i4',
    name: '個人精選甜點',
    price: 180,
    paidByMemberId: 'sample-m3',
    splits: [{ memberId: 'sample-m4', splitType: SplitType.EXACT_AMOUNT, value: 180 }],
  },
];

const SAMPLE_FEES: ExtraFee[] = [
  {
    id: 'sample-f1',
    name: '服務費 10%',
    feeType: FeeType.PERCENTAGE,
    rate: 0.1,
    allocationMethod: FeeAllocationMethod.PROPORTIONAL_SUBTOTAL,
  },
];

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}

export function useRoomState() {
  const [room, setRoom] = useState<Room>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return DEFAULT_ROOM;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(room));
    } catch {
      // ignore
    }
  }, [room]);

  // Compute settlement in real time
  const settlement: SettlementResult = useMemo(() => {
    return calculateSettlement(room);
  }, [room]);

  // --- Member Actions ---
  const addMember = useCallback((name: string, avatarColor?: string, isHost?: boolean): Member => {
    const newMember: Member = {
      id: generateId('member'),
      name: name.trim() || `成員`,
      avatarColor: avatarColor || getRandomAvatarColor(),
      isHost: isHost ?? false,
    };
    setRoom((prev) => ({
      ...prev,
      members: [...prev.members, newMember],
    }));
    return newMember;
  }, []);

  const updateMember = useCallback((id: string, updates: Partial<Member>) => {
    setRoom((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  }, []);

  const removeMember = useCallback((id: string) => {
    setRoom((prev) => {
      const remainingMembers = prev.members.filter((m) => m.id !== id);
      const fallbackPayerId = remainingMembers.length > 0 ? remainingMembers[0].id : '';

      // Clean up member from all item splits and update payer if needed
      const cleanedItems = prev.items.map((item) => {
        const updatedSplits = (item.splits || []).filter((s) => s.memberId !== id);
        return {
          ...item,
          paidByMemberId: item.paidByMemberId === id ? fallbackPayerId : item.paidByMemberId,
          splits: updatedSplits,
        };
      });

      // Clean up from extra fees target members
      const cleanedFees = (prev.extraFees || []).map((fee) => ({
        ...fee,
        targetMemberIds: (fee.targetMemberIds || []).filter((mid) => mid !== id),
      }));

      return {
        ...prev,
        members: remainingMembers,
        items: cleanedItems,
        extraFees: cleanedFees,
      };
    });
  }, []);

  // --- Item Actions ---
  const addItem = useCallback(
    (name: string, price: number, paidByMemberId: string, splitMemberIds?: string[]): Item => {
      const targetSplitIds = splitMemberIds && splitMemberIds.length > 0
        ? splitMemberIds
        : room.members.map((m) => m.id);

      const newItem: Item = {
        id: generateId('item'),
        name: name.trim() || '未命名品項',
        price: Math.max(0, price),
        paidByMemberId: paidByMemberId || (room.members[0]?.id ?? ''),
        splits: targetSplitIds.map((mId) => ({
          memberId: mId,
          splitType: SplitType.EQUAL,
        })),
      };

      setRoom((prev) => ({
        ...prev,
        items: [...prev.items, newItem],
      }));
      return newItem;
    },
    [room.members]
  );

  const updateItem = useCallback((id: string, updates: Partial<Item>) => {
    setRoom((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    }));
  }, []);

  const removeItem = useCallback((id: string) => {
    setRoom((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  }, []);

  // --- Split & Weight Actions ---
  const toggleItemSplit = useCallback((itemId: string, memberId: string) => {
    setRoom((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        const currentSplits = item.splits || [];
        const exists = currentSplits.some((s) => s.memberId === memberId);
        if (exists) {
          return {
            ...item,
            splits: currentSplits.filter((s) => s.memberId !== memberId),
          };
        } else {
          return {
            ...item,
            splits: [...currentSplits, { memberId, splitType: SplitType.EQUAL }],
          };
        }
      }),
    }));
  }, []);

  const setAllItemSplit = useCallback((itemId: string) => {
    setRoom((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          splits: prev.members.map((m) => ({
            memberId: m.id,
            splitType: SplitType.EQUAL,
          })),
        };
      }),
    }));
  }, []);

  const clearItemSplit = useCallback((itemId: string) => {
    setRoom((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        return { ...item, splits: [] };
      }),
    }));
  }, []);

  const updateItemSplitShare = useCallback(
    (itemId: string, memberId: string, share: { splitType?: SplitType; value?: number }) => {
      setRoom((prev) => ({
        ...prev,
        items: prev.items.map((item) => {
          if (item.id !== itemId) return item;
          const currentSplits = item.splits || [];
          const exists = currentSplits.some((s) => s.memberId === memberId);
          let newSplits: SplitShare[];
          if (exists) {
            newSplits = currentSplits.map((s) =>
              s.memberId === memberId ? { ...s, ...share } : s
            );
          } else {
            newSplits = [...currentSplits, { memberId, ...share }];
          }
          return { ...item, splits: newSplits };
        }),
      }));
    },
    []
  );

  // --- Fee Actions ---
  const addExtraFee = useCallback((fee: Omit<ExtraFee, 'id'>): ExtraFee => {
    const newFee: ExtraFee = {
      ...fee,
      id: generateId('fee'),
    };
    setRoom((prev) => ({
      ...prev,
      extraFees: [...(prev.extraFees || []), newFee],
    }));
    return newFee;
  }, []);

  const updateExtraFee = useCallback((id: string, updates: Partial<ExtraFee>) => {
    setRoom((prev) => ({
      ...prev,
      extraFees: (prev.extraFees || []).map((fee) => (fee.id === id ? { ...fee, ...updates } : fee)),
    }));
  }, []);

  const removeExtraFee = useCallback((id: string) => {
    setRoom((prev) => ({
      ...prev,
      extraFees: (prev.extraFees || []).filter((fee) => fee.id !== id),
    }));
  }, []);

  const updatePaymentInfo = useCallback((paymentInfo: PaymentInfo) => {
    setRoom((prev) => ({ ...prev, paymentInfo }));
  }, []);

  const setRoomTitle = useCallback((title: string) => {
    setRoom((prev) => ({ ...prev, title }));
  }, []);

  const setRoundingMode = useCallback((roundingMode: RoundingMode) => {
    setRoom((prev) => ({ ...prev, roundingMode }));
  }, []);

  const loadSampleData = useCallback(() => {
    setRoom({
      id: 'demo-room-sample',
      title: '週末火鍋歡聚 🍲 (示範)',
      code: 'DEMO88',
      isLocked: false,
      currency: 'NT$',
      roundingMode: RoundingMode.NEAREST_INTEGER,
      members: SAMPLE_MEMBERS,
      items: SAMPLE_ITEMS,
      extraFees: SAMPLE_FEES,
      paymentInfo: {
        bankCode: '822',
        bankAccount: '123456789012',
        note: '轉帳後請備註姓名與後五碼',
      },
    });
  }, []);

  const resetRoom = useCallback(() => {
    setRoom({
      id: generateId('room'),
      title: '新聚餐分帳 🍽️',
      code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      isLocked: false,
      currency: 'NT$',
      roundingMode: RoundingMode.NEAREST_INTEGER,
      members: [{ id: 'host-1', name: '主揪', avatarColor: '#10B981', isHost: true }],
      items: [],
      extraFees: [],
      paymentInfo: undefined,
    });
  }, []);

  return {
    room,
    settlement,
    addMember,
    updateMember,
    removeMember,
    addItem,
    updateItem,
    removeItem,
    toggleItemSplit,
    setAllItemSplit,
    clearItemSplit,
    updateItemSplitShare,
    addExtraFee,
    updateExtraFee,
    removeExtraFee,
    updatePaymentInfo,
    setRoomTitle,
    setRoundingMode,
    loadSampleData,
    resetRoom,
  };
}
