import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../App';


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

describe('App 7-Step Wizard Integration', () => {
  const originalWebSocket = globalThis.WebSocket;

  beforeEach(() => {
    localStorage.clear();
    MockWebSocket.instances = [];
    (globalThis as any).WebSocket = MockWebSocket;
    global.fetch = vi.fn().mockImplementation(async (url: string, init?: any) => {
      if (init?.method === 'POST' && url === '/api/rooms') {
        return {
          ok: true,
          json: async () => ({
            id: 'room-server-123',
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
        json: async () => ({ status: 'ok' }),
      };
    });
  });


  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
    vi.restoreAllMocks();
  });


  it('renders step 1 by default with title and host inputs', async () => {
    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText(/SplitMe/i)).toBeInTheDocument();
    expect(screen.getByText(/主揪與聚餐名稱/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/聚餐名稱/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/主揪姓名/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /下一步/i })).toBeInTheDocument();
  });

  it('allows navigating forward and backward through steps', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Step 1: Click Next
    const nextBtn = screen.getByRole('button', { name: /下一步/i });
    await user.click(nextBtn);

    // Step 2: Mode Selection
    expect(screen.getByText(/即時連線模式/i)).toBeInTheDocument();
    expect(screen.getByText(/主揪速算模式/i)).toBeInTheDocument();

    // Step 2: Click Next -> Step 3
    await user.click(screen.getByRole('button', { name: /下一步/i }));
    expect(screen.getByText(/成員名單/i)).toBeInTheDocument();

    // Click Previous -> Step 2
    const prevBtn = screen.getByRole('button', { name: /上一步/i });
    await user.click(prevBtn);
    expect(screen.getByText(/即時連線模式/i)).toBeInTheDocument();
  });

  it('loads sample data and can navigate through all steps to receipt export', async () => {
    const user = userEvent.setup();
    render(<App />);

    // In Step 1: Load sample data
    const loadSampleBtn = screen.getByRole('button', { name: /載入示範/i });
    await user.click(loadSampleBtn);

    // Step 1 -> Step 2 (Mode)
    await user.click(screen.getByRole('button', { name: /下一步/i }));
    expect(screen.getByText(/選擇分帳模式/i)).toBeInTheDocument();

    // Step 2 -> Step 3 (Members)
    await user.click(screen.getByRole('button', { name: /下一步/i }));
    expect(screen.getByText(/成員名單/i)).toBeInTheDocument();

    // Step 3 -> Step 4 (Items)
    await user.click(screen.getByRole('button', { name: /下一步/i }));
    expect(screen.getByText(/餐點品項與金額/i)).toBeInTheDocument();

    // Step 4 -> Step 5 (Split)
    await user.click(screen.getByRole('button', { name: /下一步/i }));
    expect(screen.getByText(/品項分攤確認/i)).toBeInTheDocument();

    // Step 5 -> Step 6 (Settlement)
    await user.click(screen.getByRole('button', { name: /下一步/i }));
    expect(screen.getByText(/最簡轉帳指南/i)).toBeInTheDocument();
    expect(screen.getByText(/收支完全平衡/i)).toBeInTheDocument();

    // Step 6 -> Step 7 (Receipt)
    await user.click(screen.getByRole('button', { name: /下一步/i }));
    expect(screen.getByTestId('receipt-card')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /下載 PNG 長圖/i })).toBeInTheDocument();
  });

  it('gates collaborative share button in Step 5 based on live vs offline mode', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Header has no share button
    expect(screen.queryByRole('button', { name: /^邀請分享$/i })).not.toBeInTheDocument();

    // Navigate through to Step 5 in live mode
    for (let i = 1; i <= 4; i++) {
      await user.click(screen.getByRole('button', { name: /下一步/i }));
    }

    // Step 5 has collaborative share button in live mode
    expect(screen.getByRole('button', { name: /邀請朋友協作/i })).toBeInTheDocument();
  });



  it('loads room from URL param ?room=CODE on startup and switches to friend view if view=friend', async () => {
    const mockRoomData = {
      id: 'room-url-test',
      code: 'URL123',
      title: '網址載入火鍋聚餐',
      isLocked: false,
      currency: 'NT$',
      members: [
        { id: 'm-u1', name: '小華', avatarColor: '#10B981', isHost: true },
        { id: 'm-u2', name: '小明', avatarColor: '#3B82F6', isHost: false },
      ],
      items: [
        {
          id: 'i-u1',
          name: '牛肉片',
          price: 200,
          paidByMemberId: 'm-u1',
          splits: [{ memberId: 'm-u1', splitType: 'EQUAL' }],
        },
      ],
      extraFees: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockRoomData,
    } as any);

    // Simulate URL search params
    delete (window as any).location;
    window.location = {
      search: '?room=URL123&view=friend',
      origin: 'http://localhost:5173',
      pathname: '/',
    } as any;

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/rooms/URL123');
      expect(screen.getByText('網址載入火鍋聚餐')).toBeInTheDocument();
    });

    // Host 小華 is excluded from friend identity picker, friend 小明 is shown
    expect(screen.queryByText(/小華/i)).not.toBeInTheDocument();
    expect(screen.getByText(/小明/i)).toBeInTheDocument();
  });
});
