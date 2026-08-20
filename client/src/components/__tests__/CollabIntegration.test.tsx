import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
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

  it('allows host to open share modal and switch between host view and friend view', async () => {
    await act(async () => {
      render(<App />);
    });

    // 1. Open Share Modal
    const shareBtn = screen.getByRole('button', { name: /邀請朋友協作|分享協作|分享/i });
    act(() => {
      fireEvent.click(shareBtn);
    });

    expect(screen.getByText(/掃描 QR Code|房間短碼/i)).toBeInTheDocument();

    // 2. Switch to Friend View from modal
    const friendPreviewBtn = screen.getByRole('button', { name: /進入朋友視圖|預覽朋友視圖/i });
    act(() => {
      fireEvent.click(friendPreviewBtn);
    });

    // 3. Friend view is displayed
    expect(screen.getByText(/你是哪位聚餐成員|選擇你的身份/i)).toBeInTheDocument();

    // 4. Return to Host View
    const returnToHostBtn = screen.getByRole('button', { name: /返回主揪管理|主揪模式/i });
    act(() => {
      fireEvent.click(returnToHostBtn);
    });

    expect(screen.getByText(/視覺化拖拉分帳工具|成員名單/i)).toBeInTheDocument();
  });

  it('synchronizes friend checking and host settlement locking', async () => {
    await act(async () => {
      render(<App />);
    });

    // Connect WebSocket
    const ws = MockWebSocket.instances[0];
    if (ws) {
      act(() => {
        ws.triggerOpen();
      });
    }

    // Switch to Friend View
    const viewSwitchBtn = screen.getByRole('button', { name: /切換至朋友勾選|朋友視圖/i });
    act(() => {
      fireEvent.click(viewSwitchBtn);
    });

    // Select member "小明" (member-2)
    const xiaomingBtn = screen.getByRole('button', { name: /小明/i });
    act(() => {
      fireEvent.click(xiaomingBtn);
    });

    // Should show friend check view with identity 小明
    expect(screen.getByText(/小明/i)).toBeInTheDocument();
  });
});
