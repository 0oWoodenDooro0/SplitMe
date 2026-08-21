import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
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

describe('Collaboration End-to-End Integration', () => {
  const originalWebSocket = globalThis.WebSocket;

  beforeEach(() => {
    localStorage.clear();
    MockWebSocket.instances = [];
    (globalThis as any).WebSocket = MockWebSocket;
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

  it('allows host to open share modal, copy link, and close modal', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Navigate to Step 5 (Split & Share)
    for (let i = 1; i <= 4; i++) {
      await user.click(screen.getByRole('button', { name: /下一步/i }));
    }

    // 1. Open Share Modal in Step 5
    const shareBtns = screen.getAllByRole('button', { name: /邀請朋友協作|邀請分享|分享協作|分享|房間 QR/i });
    await user.click(shareBtns[0]);

    expect(screen.getByText(/掃描 QR Code|房間短碼/i)).toBeInTheDocument();
    expect(screen.getByText(/短碼代號/i)).toBeInTheDocument();

    // 2. Copy share link
    const copyLinkBtn = screen.getByRole('button', { name: /複製連結/i });
    await user.click(copyLinkBtn);
    expect(screen.getByText(/已複製/i)).toBeInTheDocument();

    // 3. Close Share Modal
    const closeBtn = screen.getByRole('button', { name: /關閉/i });
    await user.click(closeBtn);

    expect(screen.getAllByText(/品項分攤確認/i).length).toBeGreaterThan(0);
  });


  it('renders friend check view when loaded via friend url params', async () => {
    delete (window as any).location;
    window.location = {
      search: '?room=TEST123&view=friend',
      origin: 'http://localhost:5173',
      pathname: '/',
    } as any;

    const mockRoomData = {
      id: 'room-test',
      code: 'TEST123',
      title: '測試朋友聚餐',
      isLocked: false,
      currency: 'NT$',
      members: [
        { id: 'm-host', name: '主揪', avatarColor: '#10B981', isHost: true },
        { id: 'm-f1', name: '小明', avatarColor: '#3B82F6', isHost: false },
      ],
      items: [
        {
          id: 'i-1',
          name: '火鍋肉盤',
          price: 250,
          paidByMemberId: 'm-host',
          splits: [],
        },
      ],
      extraFees: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockRoomData,
    } as any);

    const user = userEvent.setup();
    await act(async () => {
      render(<App />);
    });

    // Host is excluded, friend 小明 is shown
    expect(screen.queryByText('主揪 (主揪)')).not.toBeInTheDocument();
    const xiaomingBtn = screen.getByRole('button', { name: /小明/i });
    await user.click(xiaomingBtn);

    // Friend check view with identity 小明
    expect(screen.getByText('小明')).toBeInTheDocument();
    expect(screen.getByText('火鍋肉盤')).toBeInTheDocument();
  });
});



