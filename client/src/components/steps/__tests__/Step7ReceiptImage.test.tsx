import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step7ReceiptImage } from '../Step7ReceiptImage';
import { Room, SettlementResult, RoundingMode } from '../../../types/models';

vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,mockPngString'),
}));

describe('Step7ReceiptImage Component', () => {
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

  const mockSettlement: SettlementResult = {
    totalItemAmount: 350,
    totalFeeAmount: 0,
    grandTotal: 350,
    roundingMode: RoundingMode.NEAREST_INTEGER,
    isBalanced: true,
    memberSummaries: {
      'm-1': {
        memberId: 'm-1',
        totalPaid: 350,
        totalOwed: 175,
        netBalance: 175,
      },
      'm-2': {
        memberId: 'm-2',
        totalPaid: 0,
        totalOwed: 175,
        netBalance: -175,
      },
    },
    transfers: [
      {
        fromMemberId: 'm-2',
        toMemberId: 'm-1',
        amount: 175,
      },
    ],
  };

  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders receipt card preview, download PNG button, and copy LINE button', () => {
    render(
      <Step7ReceiptImage
        room={mockRoom}
        settlement={mockSettlement}
        onUpdatePaymentInfo={vi.fn()}
        onResetRoom={vi.fn()}
      />
    );

    expect(screen.getByTestId('receipt-card')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /下載 PNG 長圖|下載圖片/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /複製 LINE 懶人包|複製文字/i })).toBeInTheDocument();
  });

  it('copies LINE text to clipboard when clicking copy button', async () => {
    const user = userEvent.setup();

    render(
      <Step7ReceiptImage
        room={mockRoom}
        settlement={mockSettlement}
        onUpdatePaymentInfo={vi.fn()}
        onResetRoom={vi.fn()}
      />
    );

    const copyBtn = screen.getByRole('button', { name: /複製 LINE 懶人包|複製文字/i });
    await user.click(copyBtn);

    await waitFor(() => {
      expect(screen.getByText(/已複製/i)).toBeInTheDocument();
    });
  });
});
