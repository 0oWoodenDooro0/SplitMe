import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReceiptCard } from '../ReceiptCard';
import { Room, SettlementResult, RoundingMode, SplitType, FeeType, FeeAllocationMethod } from '../../types/models';

const mockRoom: Room = {
  id: 'room-1',
  title: '週末火鍋歡聚 🍲',
  code: 'POT888',
  currency: 'NT$',
  roundingMode: RoundingMode.NEAREST_INTEGER,
  members: [
    { id: 'm1', name: 'Alice', avatarColor: '#10B981', isHost: true },
    { id: 'm2', name: 'Bob', avatarColor: '#3B82F6', isHost: false },
  ],
  items: [
    {
      id: 'i1',
      name: '麻辣鴛鴦鍋',
      price: 600,
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
    note: '轉帳請備註姓名',
    customQrUrl: 'data:image/png;base64,mockqr',
  },
};

const mockSettlement: SettlementResult = {
  roomId: 'room-1',
  totalItemAmount: 600,
  totalFeeAmount: 60,
  grandTotal: 660,
  isBalanced: true,
  memberSummaries: {
    m1: {
      memberId: 'm1',
      subtotal: 300,
      feesAndDiscounts: 30,
      totalToPay: 330,
      totalPaid: 660,
      netBalance: 330,
      itemBreakdown: [{ itemId: 'i1', itemName: '麻辣鴛鴦鍋', itemPrice: 600, shareAmount: 300 }],
      feeBreakdown: [{ feeId: 'f1', feeName: '服務費 10%', shareAmount: 30 }],
    },
    m2: {
      memberId: 'm2',
      subtotal: 300,
      feesAndDiscounts: 30,
      totalToPay: 330,
      totalPaid: 0,
      netBalance: -330,
      itemBreakdown: [{ itemId: 'i1', itemName: '麻辣鴛鴦鍋', itemPrice: 600, shareAmount: 300 }],
      feeBreakdown: [{ feeId: 'f1', feeName: '服務費 10%', shareAmount: 30 }],
    },
  },
  transfers: [
    {
      fromMemberId: 'm2',
      toMemberId: 'm1',
      amount: 330,
    },
  ],
};

describe('ReceiptCard Component', () => {
  it('renders receipt header with room title, code, and grand total', () => {
    render(<ReceiptCard room={mockRoom} settlement={mockSettlement} />);

    expect(screen.getByText('週末火鍋歡聚 🍲')).toBeInTheDocument();
    expect(screen.getByText(/POT888/)).toBeInTheDocument();
    expect(screen.getByText(/660/)).toBeInTheDocument();
    expect(screen.getByText(/餐點.*600/)).toBeInTheDocument();
    expect(screen.getByText(/附加費.*60/)).toBeInTheDocument();
  });

  it('renders member breakdown cards with items and net status badges', () => {
    render(<ReceiptCard room={mockRoom} settlement={mockSettlement} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText(/需收款/i)).toBeInTheDocument();
    expect(screen.getByText(/需支付/i)).toBeInTheDocument();
    expect(screen.getAllByText('麻辣鴛鴦鍋').length).toBeGreaterThan(0);
  });

  it('renders debt simplification transfer route correctly', () => {
    render(<ReceiptCard room={mockRoom} settlement={mockSettlement} />);

    expect(screen.getByText(/最簡轉帳指南/i)).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText(/應轉帳給/i)).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getAllByText(/330/).length).toBeGreaterThan(0);
  });

  it('renders payment info section with bank details, note, and QR code image', () => {
    render(<ReceiptCard room={mockRoom} settlement={mockSettlement} />);

    expect(screen.getByText(/收款資訊/i)).toBeInTheDocument();
    expect(screen.getByText(/822/)).toBeInTheDocument();
    expect(screen.getByText(/123456789012/)).toBeInTheDocument();
    expect(screen.getByText(/轉帳請備註姓名/)).toBeInTheDocument();
    expect(screen.getByAltText(/收款 QR Code/i)).toBeInTheDocument();
  });

  it('handles room without payment info or transfers gracefully', () => {
    const emptyPaymentRoom: Room = {
      ...mockRoom,
      paymentInfo: undefined,
    };
    const balancedSettlement: SettlementResult = {
      ...mockSettlement,
      transfers: [],
    };

    render(<ReceiptCard room={emptyPaymentRoom} settlement={balancedSettlement} />);

    expect(screen.getByText(/收支完全平衡/i)).toBeInTheDocument();
    expect(screen.queryByText(/收款資訊/i)).not.toBeInTheDocument();
  });
});
