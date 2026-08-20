import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step6SettlementCalc } from '../Step6SettlementCalc';
import { Member, RoundingMode, SettlementResult } from '../../../types/models';

describe('Step6SettlementCalc Component', () => {
  const mockMembers: Member[] = [
    { id: 'm-1', name: '主揪小王', avatarColor: '#10B981', isHost: true },
    { id: 'm-2', name: '小明', avatarColor: '#3B82F6', isHost: false },
  ];

  const mockSettlement: SettlementResult = {
    totalItemAmount: 500,
    totalFeeAmount: 50,
    grandTotal: 550,
    roundingMode: RoundingMode.NEAREST_INTEGER,
    isBalanced: true,
    roundingRemainder: 0,
    memberSummaries: {
      'm-1': {
        memberId: 'm-1',
        totalPaid: 550,
        totalOwed: 275,
        netBalance: 275,
        itemBreakdown: [{ itemId: 'i-1', itemName: '火鍋', shareAmount: 250 }],
        feesAndDiscounts: 25,
      },
      'm-2': {
        memberId: 'm-2',
        totalPaid: 0,
        totalOwed: 275,
        netBalance: -275,
        itemBreakdown: [{ itemId: 'i-1', itemName: '火鍋', shareAmount: 250 }],
        feesAndDiscounts: 25,
      },
    },
    transfers: [
      {
        fromMemberId: 'm-2',
        toMemberId: 'm-1',
        amount: 275,
      },
    ],
  };

  it('renders settlement dashboard with transfers, totals, and balances', () => {
    render(
      <Step6SettlementCalc
        settlement={mockSettlement}
        members={mockMembers}
        roundingMode={RoundingMode.NEAREST_INTEGER}
        onRoundingModeChange={vi.fn()}
        onOpenFeeModal={vi.fn()}
      />
    );

    expect(screen.getByText(/最簡轉帳指南/i)).toBeInTheDocument();
    expect(screen.getByText(/550/)).toBeInTheDocument();
    expect(screen.getByText(/收支完全平衡/i)).toBeInTheDocument();
  });

  it('allows changing rounding mode', async () => {
    const user = userEvent.setup();
    const handleRoundingModeChange = vi.fn();

    render(
      <Step6SettlementCalc
        settlement={mockSettlement}
        members={mockMembers}
        roundingMode={RoundingMode.NEAREST_INTEGER}
        onRoundingModeChange={handleRoundingModeChange}
        onOpenFeeModal={vi.fn()}
      />
    );

    const select = screen.getByRole('combobox', { name: /捨入模式|取整/i });
    await user.selectOptions(select, RoundingMode.DECIMAL_2);

    expect(handleRoundingModeChange).toHaveBeenCalledWith(RoundingMode.DECIMAL_2);
  });
});
