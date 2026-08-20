import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettlementDashboard } from '../SettlementDashboard';
import { Member, RoundingMode, SettlementResult } from '../../types/models';

const mockMembers: Member[] = [
  { id: 'm1', name: 'Alice', avatarColor: '#10B981', isHost: true },
  { id: 'm2', name: 'Bob', avatarColor: '#3B82F6', isHost: false },
  { id: 'm3', name: 'Charlie', avatarColor: '#F59E0B', isHost: false },
];

const mockSettlement: SettlementResult = {
  roomId: 'room-1',
  totalItemAmount: 1000,
  totalFeeAmount: 100,
  grandTotal: 1100,
  isBalanced: true,
  roundingRemainder: 0,
  memberSummaries: {
    m1: {
      memberId: 'm1',
      subtotal: 500,
      feesAndDiscounts: 50,
      totalToPay: 550,
      totalPaid: 1100,
      netBalance: 550, // Paid 1100, due 550 => gets back 550
      itemBreakdown: [{ itemId: 'i1', itemName: '火鍋', itemPrice: 1000, shareAmount: 500 }],
      feeBreakdown: [{ feeId: 'f1', feeName: '服務費 10%', shareAmount: 50 }],
    },
    m2: {
      memberId: 'm2',
      subtotal: 500,
      feesAndDiscounts: 50,
      totalToPay: 550,
      totalPaid: 0,
      netBalance: -550, // Paid 0, due 550 => pays 550
      itemBreakdown: [{ itemId: 'i1', itemName: '火鍋', itemPrice: 1000, shareAmount: 500 }],
      feeBreakdown: [{ feeId: 'f1', feeName: '服務費 10%', shareAmount: 50 }],
    },
    m3: {
      memberId: 'm3',
      subtotal: 0,
      feesAndDiscounts: 0,
      totalToPay: 0,
      totalPaid: 0,
      netBalance: 0,
      itemBreakdown: [],
      feeBreakdown: [],
    },
  },
  transfers: [
    {
      fromMemberId: 'm2',
      toMemberId: 'm1',
      amount: 550,
    },
  ],
};

describe('SettlementDashboard Component', () => {
  it('renders grand total, balance status, and member balances', () => {
    render(
      <SettlementDashboard
        settlement={mockSettlement}
        members={mockMembers}
        roundingMode={RoundingMode.NEAREST_INTEGER}
        onRoundingModeChange={vi.fn()}
        onOpenFeeModal={vi.fn()}
      />
    );

    expect(screen.getByText(/總支出/i)).toBeInTheDocument();
    expect(screen.getByText(/1,100|1100/)).toBeInTheDocument();
    expect(screen.getByText(/收支完全平衡/i)).toBeInTheDocument();

    // Alice net balance: +550
    expect(screen.getByText(/需收款|應收/i)).toBeInTheDocument();
    // Bob net balance: -550
    expect(screen.getByText(/需支付|應付/i)).toBeInTheDocument();
  });

  it('renders simplified debt transfer route', () => {
    render(
      <SettlementDashboard
        settlement={mockSettlement}
        members={mockMembers}
        roundingMode={RoundingMode.NEAREST_INTEGER}
        onRoundingModeChange={vi.fn()}
        onOpenFeeModal={vi.fn()}
      />
    );

    expect(screen.getByText(/最簡轉帳指南/i)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
    expect(screen.getByText(/應轉帳給/i)).toBeInTheDocument();
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/550/)).toBeInTheDocument();
  });

  it('handles rounding mode change', () => {
    const handleRoundingModeChange = vi.fn();
    render(
      <SettlementDashboard
        settlement={mockSettlement}
        members={mockMembers}
        roundingMode={RoundingMode.NEAREST_INTEGER}
        onRoundingModeChange={handleRoundingModeChange}
        onOpenFeeModal={vi.fn()}
      />
    );

    const roundingSelect = screen.getByRole('combobox', { name: /捨入模式|取整/i });
    fireEvent.change(roundingSelect, { target: { value: RoundingMode.ROUND_UP } });

    expect(handleRoundingModeChange).toHaveBeenCalledWith(RoundingMode.ROUND_UP);
  });
});
