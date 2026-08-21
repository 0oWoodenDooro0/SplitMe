import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';

vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,mockpngdata'),
}));

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
    this.readyState = WebSocket.OPEN;
    MockWebSocket.instances.push(this);
    setTimeout(() => {
      if (this.onopen) this.onopen({});
    }, 0);
  }

  send(data: string) {
    this.sentMessages.push(data);
  }

  close() {
    this.readyState = WebSocket.CLOSED;
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

describe('End-to-End User Flow Integration', () => {
  const originalWebSocket = globalThis.WebSocket;

  beforeEach(() => {
    localStorage.clear();
    MockWebSocket.instances = [];
    (globalThis as any).WebSocket = MockWebSocket;
    vi.clearAllMocks();

    global.fetch = vi.fn().mockImplementation(async (url: string, init?: any) => {
      if (init?.method === 'POST' && url === '/api/rooms') {
        return {
          ok: true,
          json: async () => ({
            id: 'server-room-1',
            code: 'SRV123',
            title: '聚餐分帳',
            isLocked: false,
            currency: 'NT$',
            members: [],
            items: [],
            extraFees: [],
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({ status: 'ok', data: {} }),
      };
    });


    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      share: vi.fn().mockResolvedValue(undefined),
    });
  });

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
  });

  it('Flow 1: 7-Step wizard full walkthrough with sample data, fees, and transfers', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Step 1: Initial state & load sample data
    expect(screen.getByRole('heading', { level: 1, name: /SplitMe/i })).toBeInTheDocument();
    const loadSampleBtn = screen.getByRole('button', { name: /載入示範/i });
    await user.click(loadSampleBtn);

    // Verify sample room title is loaded
    expect(screen.getByDisplayValue(/火鍋歡聚|聚餐/i)).toBeInTheDocument();

    // Navigate: Step 1 -> Step 2
    await user.click(screen.getByRole('button', { name: /下一步/i }));
    expect(screen.getByText(/選擇分帳模式/i)).toBeInTheDocument();

    // Navigate: Step 2 -> Step 3
    await user.click(screen.getByRole('button', { name: /下一步/i }));
    expect(screen.getByText(/成員名單/i)).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();

    // Navigate: Step 3 -> Step 4
    await user.click(screen.getByRole('button', { name: /下一步/i }));
    expect(screen.getByText(/餐點品項與金額/i)).toBeInTheDocument();
    expect(screen.getByText('麻辣鴛鴦鍋底')).toBeInTheDocument();

    // Navigate: Step 4 -> Step 5
    await user.click(screen.getByRole('button', { name: /下一步/i }));
    expect(screen.getByText(/品項分攤確認/i)).toBeInTheDocument();

    // Navigate: Step 5 -> Step 6
    await user.click(screen.getByRole('button', { name: /下一步/i }));
    expect(screen.getByText(/結算試算/i)).toBeInTheDocument();
    expect(screen.getByText(/總支出/i)).toBeInTheDocument();
    expect(screen.getByText(/最簡轉帳指南/i)).toBeInTheDocument();

    // Navigate: Step 6 -> Step 7
    await user.click(screen.getByRole('button', { name: /下一步/i }));
    expect(screen.getByText(/收據與匯出分享/i)).toBeInTheDocument();
    expect(screen.getByTestId('receipt-card')).toBeInTheDocument();

    // Step 7: Finish and Reset
    const finishBtns = screen.getAllByRole('button', { name: /建立新聚餐/i });
    await user.click(finishBtns[0]);

    // Should return to Step 1
    expect(screen.getByText(/主揪與聚餐名稱/i)).toBeInTheDocument();
  });

  it('Flow 2: Real-time collaboration, friend view switch, and host lock settlement', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Load sample data
    const loadSampleBtn = screen.getByRole('button', { name: /載入示範/i });
    await user.click(loadSampleBtn);

    // Trigger WebSocket open on the active instance
    const activeWs = MockWebSocket.instances[MockWebSocket.instances.length - 1];
    if (activeWs) {
      activeWs.triggerOpen();
    }

    // Navigate to Step 5 (Split & Share)
    for (let i = 1; i <= 4; i++) {
      await user.click(screen.getByRole('button', { name: /下一步/i }));
    }

    // Open Share Modal in Step 5
    const shareBtns = screen.getAllByRole('button', { name: /邀請朋友協作|邀請分享|分享協作|分享|房間 QR/i });
    await user.click(shareBtns[0]);

    expect(screen.getAllByText(/短碼代號/i).length).toBeGreaterThan(0);


    // Close modal
    const closeBtn = screen.getByRole('button', { name: /關閉/i });
    await user.click(closeBtn);

    // Host locks settlement in Step 5
    const lockBtn = screen.getByRole('button', { name: /鎖定結算|鎖定/i });
    await user.click(lockBtn);

    // Verify WebSocket LockSettlement message was sent on any instance
    const allSentMessages = MockWebSocket.instances.flatMap((w) => w.sentMessages);
    expect(allSentMessages.some((msg) => msg.includes('LOCK_SETTLEMENT'))).toBe(true);
  });


  it('Flow 3: Step 7 receipt card visual rendering, payment info setup, and text export', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Load sample data
    const loadSampleBtn = screen.getByRole('button', { name: /載入示範/i });
    await user.click(loadSampleBtn);

    // Navigate to Step 7
    for (let i = 1; i <= 6; i++) {
      await user.click(screen.getByRole('button', { name: /下一步/i }));
    }

    expect(screen.getByTestId('receipt-card')).toBeInTheDocument();

    // Open Payment Info Editor
    const setPaymentBtn = screen.getByRole('button', { name: /設定收款資訊/i });
    await user.click(setPaymentBtn);

    // Edit Payment Info: Select bank and account number
    const bankSelect = screen.getByRole('combobox', { name: /常用銀行/i });
    await user.selectOptions(bankSelect, '822');

    const accountInput = screen.getByLabelText(/銀行帳號/i);
    await user.clear(accountInput);
    await user.type(accountInput, '987654321012');

    // Save payment info
    const savePaymentBtn = screen.getByRole('button', { name: /儲存收款設定/i });
    await user.click(savePaymentBtn);

    // Test text summary copy
    const copyTextBtn = screen.getByRole('button', { name: /複製文字明細|複製 LINE 懶人包|複製文字/i });
    await user.click(copyTextBtn);

    await waitFor(() => {
      expect(screen.getByText(/已複製/i)).toBeInTheDocument();
    });

    // Test PNG image download trigger
    const downloadPngBtn = screen.getByRole('button', { name: /下載 PNG 長圖/i });
    await user.click(downloadPngBtn);
  });

  it('Flow 4: Offline resilience - graceful degradation when network is offline and state persistence', async () => {
    const user = userEvent.setup();

    // Simulate offline backend
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

    render(<App />);

    // Navigate Step 1 -> Step 2 -> Step 3
    await user.click(screen.getByRole('button', { name: /下一步/i })); // to step 2
    expect(screen.getByText(/主揪速算模式/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /下一步/i })); // to step 3
    expect(screen.getByText(/成員名單/i)).toBeInTheDocument();
  });
});
