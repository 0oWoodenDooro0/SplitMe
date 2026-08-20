import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReceiptExportModal } from '../ReceiptExportModal';
import { Room, SettlementResult, RoundingMode } from '../../types/models';
import * as htmlToImage from 'html-to-image';

vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,renderedreceiptimage'),
}));

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
      splits: [{ memberId: 'm1' }, { memberId: 'm2' }],
    },
  ],
  extraFees: [],
  paymentInfo: {
    bankCode: '822',
    bankAccount: '123456789012',
    note: '轉帳請備註姓名',
  },
};

const mockSettlement: SettlementResult = {
  roomId: 'room-1',
  totalItemAmount: 600,
  totalFeeAmount: 0,
  grandTotal: 600,
  isBalanced: true,
  memberSummaries: {
    m1: {
      memberId: 'm1',
      subtotal: 300,
      feesAndDiscounts: 0,
      totalToPay: 300,
      totalPaid: 600,
      netBalance: 300,
      itemBreakdown: [{ itemId: 'i1', itemName: '麻辣鴛鴦鍋', itemPrice: 600, shareAmount: 300 }],
    },
    m2: {
      memberId: 'm2',
      subtotal: 300,
      feesAndDiscounts: 0,
      totalToPay: 300,
      totalPaid: 0,
      netBalance: -300,
      itemBreakdown: [{ itemId: 'i1', itemName: '麻辣鴛鴦鍋', itemPrice: 600, shareAmount: 300 }],
    },
  },
  transfers: [
    {
      fromMemberId: 'm2',
      toMemberId: 'm1',
      amount: 300,
    },
  ],
};

describe('ReceiptExportModal Component', () => {
  const handleClose = vi.fn();
  const handleUpdatePaymentInfo = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ReceiptExportModal
        isOpen={false}
        room={mockRoom}
        settlement={mockSettlement}
        onClose={handleClose}
        onUpdatePaymentInfo={handleUpdatePaymentInfo}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders modal with tab navigation and receipt card in visual tab', () => {
    render(
      <ReceiptExportModal
        isOpen={true}
        room={mockRoom}
        settlement={mockSettlement}
        onClose={handleClose}
        onUpdatePaymentInfo={handleUpdatePaymentInfo}
      />
    );

    expect(screen.getByText(/結算收據與匯出分享/i)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /收據長圖/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /LINE 文字/i })).toBeInTheDocument();
    expect(screen.getByTestId('receipt-card')).toBeInTheDocument();
  });

  it('switches to LINE text tab and shows formatted text with copy button', async () => {
    const user = userEvent.setup();
    render(
      <ReceiptExportModal
        isOpen={true}
        room={mockRoom}
        settlement={mockSettlement}
        onClose={handleClose}
        onUpdatePaymentInfo={handleUpdatePaymentInfo}
      />
    );

    const lineTab = screen.getByRole('tab', { name: /LINE 文字/i });
    await user.click(lineTab);

    expect(screen.getByText(/週末火鍋歡聚/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /複製 LINE 懶人包/i })).toBeInTheDocument();
  });

  it('copies LINE text to clipboard when copy button is clicked', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <ReceiptExportModal
        isOpen={true}
        room={mockRoom}
        settlement={mockSettlement}
        onClose={handleClose}
        onUpdatePaymentInfo={handleUpdatePaymentInfo}
      />
    );

    const lineTab = screen.getByRole('tab', { name: /LINE 文字/i });
    await user.click(lineTab);

    const copyBtn = screen.getByRole('button', { name: /複製 LINE 懶人包/i });
    await user.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText(/已複製/i)).toBeInTheDocument();
    });
  });

  it('downloads PNG when download button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ReceiptExportModal
        isOpen={true}
        room={mockRoom}
        settlement={mockSettlement}
        onClose={handleClose}
        onUpdatePaymentInfo={handleUpdatePaymentInfo}
      />
    );

    const downloadBtn = screen.getByRole('button', { name: /下載 PNG 長圖|下載長圖/i });
    await user.click(downloadBtn);

    expect(htmlToImage.toPng).toHaveBeenCalled();
  });

  it('calls Web Share API when social share button is clicked if supported', async () => {
    const user = userEvent.setup();
    const shareMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      share: shareMock,
    });

    render(
      <ReceiptExportModal
        isOpen={true}
        room={mockRoom}
        settlement={mockSettlement}
        onClose={handleClose}
        onUpdatePaymentInfo={handleUpdatePaymentInfo}
      />
    );

    const shareBtn = screen.getByRole('button', { name: /分享至 LINE|發送至 LINE|社群分享/i });
    await user.click(shareBtn);

    expect(shareMock).toHaveBeenCalled();
  });

  it('opens PaymentInfoEditor when clicking on edit payment info button', async () => {
    const user = userEvent.setup();
    render(
      <ReceiptExportModal
        isOpen={true}
        room={mockRoom}
        settlement={mockSettlement}
        onClose={handleClose}
        onUpdatePaymentInfo={handleUpdatePaymentInfo}
      />
    );

    const editPaymentBtn = screen.getByRole('button', { name: /設定收款資訊|編輯收款/i });
    await user.click(editPaymentBtn);

    expect(screen.getByRole('dialog', { name: /設定收款資訊|收款資訊設定/i })).toBeInTheDocument();
  });
});
