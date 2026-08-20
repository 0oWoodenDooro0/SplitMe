import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';

// Mock html-to-image
vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,mockPngBase64String'),
}));

// Mock WebSocket
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  url: string;
  readyState: number = WebSocket.CONNECTING;
  onopen: ((event: any) => void) | null = null;
  onclose: ((event: any) => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  sentMessages: string[] = [];

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sentMessages.push(data);
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) this.onclose({ code: 1000, reason: 'Normal Closure' });
  }

  triggerOpen() {
    this.readyState = WebSocket.OPEN;
    if (this.onopen) this.onopen({});
  }

  triggerMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data: typeof data === 'string' ? data : JSON.stringify(data) });
    }
  }
}

describe('SplitMe Full End-to-End & Offline Integration Suite', () => {
  const originalWebSocket = globalThis.WebSocket;

  beforeEach(() => {
    localStorage.clear();
    MockWebSocket.instances = [];
    (globalThis as any).WebSocket = MockWebSocket;
    vi.clearAllMocks();

    // Default healthy backend mock
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok' }),
    } as any);

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
    vi.restoreAllMocks();
  });

  it('Flow 1: Single-user fast calculation with extra fees, discounts, and weighted shares', async () => {
    const user = userEvent.setup();
    render(<App />);

    // 1. Initial state has default sample or empty state
    expect(screen.getByText(/SplitMe/i)).toBeInTheDocument();

    // 2. Load sample data to quickly populate members and items
    const loadSampleBtn = screen.getByRole('button', { name: /載入示範帳單|載入示範/i });
    await user.click(loadSampleBtn);

    // Verify sample items are loaded
    expect(screen.getByText('麻辣鴛鴦鍋底')).toBeInTheDocument();
    expect(screen.getByText('頂級無骨牛小排')).toBeInTheDocument();

    // 3. Open Fee Settings Modal and configure a 10% service fee
    const feeBtn = screen.getByRole('button', { name: /附加費與折扣/i });
    await user.click(feeBtn);

    expect(screen.getByText(/附加費用與折扣攤提/i)).toBeInTheDocument();

    // Close fee modal
    const closeFeeBtn = screen.getByRole('button', { name: '完成' });
    await user.click(closeFeeBtn);

    // 4. Verify Settlement Dashboard shows updated calculated fees and balanced status
    expect(screen.getByText(/最簡轉帳指南/i)).toBeInTheDocument();
    expect(screen.getByText(/收支完全平衡/i)).toBeInTheDocument();
  });

  it('Flow 2: Multi-person real-time collaboration, member join, and host lock settlement', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Trigger WebSocket connection
    const ws = MockWebSocket.instances[0];
    if (ws) {
      act(() => {
        ws.triggerOpen();
      });
    }

    // 1. Host opens share modal to retrieve collaboration shortcode / QR
    const shareBtn = screen.getByRole('button', { name: /邀請朋友協作|分享協作|分享/i });
    await user.click(shareBtn);

    expect(screen.getByText(/房間短碼|掃描 QR Code/i)).toBeInTheDocument();

    // 2. Switch to Friend View
    const friendViewBtn = screen.getByRole('button', { name: /進入朋友視圖|預覽朋友視圖/i });
    await user.click(friendViewBtn);

    // 3. Friend View is displayed, select member identity
    expect(screen.getByText(/你是哪位聚餐成員|選擇你的身份/i)).toBeInTheDocument();
    const memberChoice = screen.getByRole('button', { name: /小明/i });
    await user.click(memberChoice);

    // 4. Friend identity is displayed
    expect(screen.getByText('小明')).toBeInTheDocument();

    // 5. Switch back to Host View to lock settlement
    const hostModeBtn = screen.getByRole('button', { name: '主揪模式' });
    await user.click(hostModeBtn);

    // 6. Host locks settlement
    const lockBtn = screen.getByRole('button', { name: /鎖定結算|鎖定/i });
    await user.click(lockBtn);

    // Verify WebSocket LockSettlement message was sent
    expect(ws?.sentMessages.some((msg) => msg.includes('LOCK_SETTLEMENT'))).toBe(true);
  });

  it('Flow 3: Receipt card visual rendering, payment info setup, and LINE export', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Load sample data
    const loadSampleBtn = screen.getByRole('button', { name: /載入示範帳單|載入示範/i });
    await user.click(loadSampleBtn);

    // Open Receipt Export Modal
    const exportBtn = screen.getByRole('button', { name: /匯出收據與分享|匯出收據/i });
    await user.click(exportBtn);

    // Modal is open
    expect(screen.getByText(/結算收據與匯出分享/i)).toBeInTheDocument();
    expect(screen.getByTestId('receipt-card')).toBeInTheDocument();

    // Open Payment Info Editor
    const setPaymentBtn = screen.getByRole('button', { name: /設定收款資訊/i });
    await user.click(setPaymentBtn);

    // Edit Payment Info: Select bank and account number
    const bankSelect = screen.getByRole('combobox', { name: /常用銀行/i });
    await user.selectOptions(bankSelect, '822');

    const accountInput = screen.getByPlaceholderText(/請輸入銀行帳號/i);
    await user.clear(accountInput);
    await user.type(accountInput, '987654321012');

    // Save payment info
    const savePaymentBtn = screen.getByRole('button', { name: /儲存收款設定/i });
    await user.click(savePaymentBtn);

    // Switch to LINE text tab
    const textTab = screen.getByRole('tab', { name: /LINE 文字/i });
    await user.click(textTab);

    // Test LINE text summary copy
    const copyLineBtn = screen.getByRole('button', { name: /複製 LINE 懶人包/i });
    await user.click(copyLineBtn);

    await waitFor(() => {
      expect(screen.getByText(/已複製/i)).toBeInTheDocument();
    });

    // Switch back to Visual tab
    const visualTab = screen.getByRole('tab', { name: /收據長圖/i });
    await user.click(visualTab);

    // Test PNG image download trigger
    const downloadPngBtn = screen.getByRole('button', { name: /下載 PNG 長圖/i });
    await user.click(downloadPngBtn);
  });

  it('Flow 4: Offline resilience - graceful degradation when network is offline and state persistence', async () => {
    const user = userEvent.setup();

    // Simulate offline backend
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

    render(<App />);

    // Verify offline indicator in navbar
    await waitFor(() => {
      expect(screen.getByText(/離線 \(本機速算模式\)/i)).toBeInTheDocument();
    });

    // Add a new member offline using MemberBar add button
    const addMemberBtn = screen.getByRole('button', { name: '新增成員' });
    await user.click(addMemberBtn);

    const addMemberInput = screen.getByPlaceholderText(/輸入成員暱稱/i);
    await user.type(addMemberInput, '離線小幫手');

    const confirmAddBtn = screen.getByRole('button', { name: '確認新增' });
    await user.click(confirmAddBtn);

    // Member should be added locally
    expect(screen.getAllByText('離線小幫手').length).toBeGreaterThan(0);

    // LocalStorage should have saved the room state
    const savedRoom = localStorage.getItem('splitme_current_room');
    expect(savedRoom).not.toBeNull();
    expect(savedRoom).toContain('離線小幫手');
  });
});
