import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentInfoEditor } from '../PaymentInfoEditor';
import { PaymentInfo } from '../../types/models';

describe('PaymentInfoEditor Component', () => {
  const mockPaymentInfo: PaymentInfo = {
    bankCode: '822',
    bankAccount: '123456789012',
    note: '轉帳請備註姓名',
    customQrUrl: 'data:image/png;base64,mockqrdata',
  };

  const handleSave = vi.fn();
  const handleClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders existing payment info values', () => {
    render(
      <PaymentInfoEditor
        isOpen={true}
        paymentInfo={mockPaymentInfo}
        onSave={handleSave}
        onClose={handleClose}
      />
    );

    expect(screen.getByDisplayValue('822')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123456789012')).toBeInTheDocument();
    expect(screen.getByDisplayValue('轉帳請備註姓名')).toBeInTheDocument();
    expect(screen.getByAltText(/收款 QR Code 預覽/i)).toBeInTheDocument();
  });

  it('allows selecting common Taiwan banks from quick preset selector', async () => {
    const user = userEvent.setup();
    render(
      <PaymentInfoEditor
        isOpen={true}
        paymentInfo={{}}
        onSave={handleSave}
        onClose={handleClose}
      />
    );

    const bankSelect = screen.getByRole('combobox', { name: /常用銀行/i });
    await user.selectOptions(bankSelect, '013');

    const bankCodeInput = screen.getByPlaceholderText(/銀行代碼|如 822/i);
    expect(bankCodeInput).toHaveValue('013');
  });

  it('submits updated payment info when save button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PaymentInfoEditor
        isOpen={true}
        paymentInfo={{}}
        onSave={handleSave}
        onClose={handleClose}
      />
    );

    const bankCodeInput = screen.getByPlaceholderText(/銀行代碼|如 822/i);
    const bankAccountInput = screen.getByPlaceholderText(/銀行帳號/i);
    const noteInput = screen.getByPlaceholderText(/轉帳備註/i);

    await user.type(bankCodeInput, '808');
    await user.type(bankAccountInput, '9876543210123');
    await user.type(noteInput, '轉帳後告知後五碼');

    const saveButton = screen.getByRole('button', { name: /儲存收款設定|儲存/i });
    await user.click(saveButton);

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        bankCode: '808',
        bankAccount: '9876543210123',
        note: '轉帳後告知後五碼',
      })
    );
    expect(handleClose).toHaveBeenCalled();
  });

  it('handles QR code image upload and preview', async () => {
    render(
      <PaymentInfoEditor
        isOpen={true}
        paymentInfo={{}}
        onSave={handleSave}
        onClose={handleClose}
      />
    );

    const file = new File(['dummy content'], 'qrcode.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/上傳收款 QR Code|上傳 QR/i, { selector: 'input' });

    // Mock FileReader with a class to satisfy Vitest spyOn requirements
    class MockFileReader {
      result: string | null = null;
      onload: (() => void) | null = null;
      readAsDataURL() {
        this.result = 'data:image/png;base64,newuploadedqr';
        if (this.onload) this.onload();
      }
    }
    vi.spyOn(window, 'FileReader').mockImplementation(() => new MockFileReader() as any);

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByAltText(/收款 QR Code 預覽/i)).toBeInTheDocument();
    });
  });

  it('allows removing uploaded QR code image', async () => {
    const user = userEvent.setup();
    render(
      <PaymentInfoEditor
        isOpen={true}
        paymentInfo={mockPaymentInfo}
        onSave={handleSave}
        onClose={handleClose}
      />
    );

    const removeQrButton = screen.getByRole('button', { name: /移除 QR Code|刪除圖片/i });
    await user.click(removeQrButton);

    expect(screen.queryByAltText(/收款 QR Code 預覽/i)).not.toBeInTheDocument();
  });

  it('calls onClose when close button or backdrop is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PaymentInfoEditor
        isOpen={true}
        paymentInfo={mockPaymentInfo}
        onSave={handleSave}
        onClose={handleClose}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /取消|關閉/i });
    await user.click(closeBtn);

    expect(handleClose).toHaveBeenCalled();
  });
});
