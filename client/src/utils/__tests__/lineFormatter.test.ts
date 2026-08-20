import { describe, it, expect } from 'vitest';
import { formatLineSummary, getLineShareUrl } from '../lineFormatter';
import { Room, SettlementResult, RoundingMode, SplitType, FeeType, FeeAllocationMethod } from '../../types/models';

const mockRoom: Room = {
  id: 'room-test-1',
  title: '週末火鍋歡聚 🍲',
  code: 'POT123',
  isLocked: true,
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
      name: '鴛鴦鍋底',
      price: 600,
      paidByMemberId: 'm1',
      splits: [
        { memberId: 'm1', splitType: SplitType.EQUAL },
        { memberId: 'm2', splitType: SplitType.EQUAL },
        { memberId: 'm3', splitType: SplitType.EQUAL },
      ],
    },
    {
      id: 'i2',
      name: '牛小排',
      price: 400,
      paidByMemberId: 'm1',
      splits: [
        { memberId: 'm1', splitType: SplitType.EQUAL },
        { memberId: 'm2', splitType: SplitType.EQUAL },
      ],
    },
  ],
  extraFees: [
    {
      id: 'f1',
      name: '服務費 10%',
      feeType: FeeType.PERCENTAGE,
      rate: 0.1,
      allocationMethod: FeeAllocationMethod.PROPORTIONAL_SUBTOTAL,
    },
  ],
  paymentInfo: {
    bankCode: '822',
    bankAccount: '123456789012',
    note: '轉帳後請備註姓名與後五碼',
  },
};

const mockSettlement: SettlementResult = {
  roomId: 'room-test-1',
  totalItemAmount: 1000,
  totalFeeAmount: 100,
  grandTotal: 1100,
  isBalanced: true,
  memberSummaries: {
    m1: {
      memberId: 'm1',
      subtotal: 400,
      feesAndDiscounts: 40,
      totalToPay: 440,
      totalPaid: 1100,
      netBalance: 660,
    },
    m2: {
      memberId: 'm2',
      subtotal: 400,
      feesAndDiscounts: 40,
      totalToPay: 440,
      totalPaid: 0,
      netBalance: -440,
    },
    m3: {
      memberId: 'm3',
      subtotal: 200,
      feesAndDiscounts: 20,
      totalToPay: 220,
      totalPaid: 0,
      netBalance: -220,
    },
  },
  transfers: [
    { fromMemberId: 'm2', toMemberId: 'm1', amount: 440 },
    { fromMemberId: 'm3', toMemberId: 'm1', amount: 220 },
  ],
};

describe('lineFormatter utility', () => {
  it('formats full settlement summary with room title, amounts, member summaries, transfers, and payment info', () => {
    const text = formatLineSummary(mockRoom, mockSettlement);

    // Title
    expect(text).toContain('週末火鍋歡聚 🍲');
    expect(text).toContain('總支出');
    expect(text).toContain('1,100');

    // Member summaries
    expect(text).toContain('Alice');
    expect(text).toContain('需收款');
    expect(text).toContain('660');

    expect(text).toContain('Bob');
    expect(text).toContain('需支付');
    expect(text).toContain('440');

    expect(text).toContain('Charlie');
    expect(text).toContain('需支付');
    expect(text).toContain('220');

    // Transfers
    expect(text).toContain('最簡轉帳指南');
    expect(text).toContain('Bob');
    expect(text).toContain('Alice');
    expect(text).toContain('Charlie');

    // Payment info
    expect(text).toContain('收款資訊');
    expect(text).toContain('822');
    expect(text).toContain('123456789012');
    expect(text).toContain('轉帳後請備註姓名與後五碼');

    // Footer signature
    expect(text).toContain('SplitMe');
  });

  it('handles room without transfers (already balanced)', () => {
    const balancedSettlement: SettlementResult = {
      ...mockSettlement,
      memberSummaries: {
        m1: { memberId: 'm1', subtotal: 500, feesAndDiscounts: 0, totalToPay: 500, totalPaid: 500, netBalance: 0 },
      },
      transfers: [],
    };

    const roomSingle: Room = {
      ...mockRoom,
      members: [{ id: 'm1', name: 'Alice', avatarColor: '#10B981', isHost: true }],
      items: [],
      extraFees: [],
      paymentInfo: undefined,
    };

    const text = formatLineSummary(roomSingle, balancedSettlement);
    expect(text).toContain('收支已完全平衡，無需任何轉帳');
    expect(text).not.toContain('最簡轉帳指南');
    expect(text).not.toContain('收款資訊');
  });

  it('handles partial payment info (only bank account or note)', () => {
    const roomWithBankOnly: Room = {
      ...mockRoom,
      paymentInfo: {
        bankCode: '013',
        bankAccount: '987654321000',
      },
    };

    const text = formatLineSummary(roomWithBankOnly, mockSettlement);
    expect(text).toContain('013');
    expect(text).toContain('987654321000');
  });

  it('generates a valid LINE share URL via getLineShareUrl', () => {
    const text = '🧾【SplitMe 結算收據】\n總計: NT$ 500';
    const url = getLineShareUrl(text);

    expect(url).toBe(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`);
  });
});
