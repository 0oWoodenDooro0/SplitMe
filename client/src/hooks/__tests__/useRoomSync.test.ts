import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRoomSync } from '../useRoomSync';
import { Room, RoundingMode, SplitType } from '../../types/models';

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
    if (this.onclose) {
      this.onclose({ code: 1000, reason: 'Normal Closure' });
    }
  }

  // Helper to trigger open event
  triggerOpen() {
    this.readyState = WebSocket.OPEN;
    if (this.onopen) {
      this.onopen({});
    }
  }

  // Helper to simulate incoming server message
  triggerMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data: typeof data === 'string' ? data : JSON.stringify(data) });
    }
  }

  // Helper to trigger error event
  triggerError(error: any) {
    if (this.onerror) {
      this.onerror(error);
    }
  }
}

const mockRoom: Room = {
  id: 'test-room-1',
  title: '週末火鍋歡聚',
  code: 'HOTPOT',
  isLocked: false,
  currency: 'NT$',
  roundingMode: RoundingMode.NEAREST_INTEGER,
  members: [
    { id: 'm1', name: 'Alice', avatarColor: '#10B981', isHost: true },
    { id: 'm2', name: 'Bob', avatarColor: '#3B82F6', isHost: false },
  ],
  items: [
    {
      id: 'i1',
      name: '牛肉片',
      price: 300,
      paidByMemberId: 'm1',
      splits: [{ memberId: 'm1', splitType: SplitType.EQUAL }],
    },
  ],
  extraFees: [],
};

describe('useRoomSync hook', () => {
  const originalWebSocket = globalThis.WebSocket;

  beforeEach(() => {
    MockWebSocket.instances = [];
    (globalThis as any).WebSocket = MockWebSocket;
    vi.useFakeTimers();
  });

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('connects to WebSocket endpoint with canonical roomId or code', () => {
    const { result } = renderHook(() =>
      useRoomSync({ roomId: 'test-room-1', initialRoom: mockRoom })
    );

    expect(MockWebSocket.instances.length).toBe(1);
    const ws = MockWebSocket.instances[0];
    expect(ws.url).toContain('/ws/rooms/test-room-1');
    expect(result.current.isConnected).toBe(false);

    act(() => {
      ws.triggerOpen();
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.status).toBe('connected');
  });

  it('handles incoming SYNC_STATE event and updates room and presence', () => {
    const { result } = renderHook(() =>
      useRoomSync({ roomId: 'test-room-1', initialRoom: mockRoom })
    );
    const ws = MockWebSocket.instances[0];

    act(() => {
      ws.triggerOpen();
    });

    const updatedRoom: Room = {
      ...mockRoom,
      title: '火鍋派對 (Updated)',
      members: [...mockRoom.members, { id: 'm3', name: 'Charlie', avatarColor: '#F59E0B' }],
    };

    act(() => {
      ws.triggerMessage({
        type: 'SYNC_STATE',
        room: updatedRoom,
        activeMemberIds: ['m1', 'm3'],
      });
    });

    expect(result.current.room.title).toBe('火鍋派對 (Updated)');
    expect(result.current.room.members.length).toBe(3);
    expect(result.current.activeMemberIds).toEqual(['m1', 'm3']);
  });

  it('handles ITEM_CHECK_TOGGLED event and updates item splits', () => {
    const { result } = renderHook(() =>
      useRoomSync({ roomId: 'test-room-1', initialRoom: mockRoom })
    );
    const ws = MockWebSocket.instances[0];

    act(() => {
      ws.triggerOpen();
    });

    const roomAfterToggle: Room = {
      ...mockRoom,
      items: [
        {
          ...mockRoom.items[0],
          splits: [
            { memberId: 'm1', splitType: SplitType.EQUAL },
            { memberId: 'm2', splitType: SplitType.EQUAL },
          ],
        },
      ],
    };

    act(() => {
      ws.triggerMessage({
        type: 'ITEM_CHECK_TOGGLED',
        itemId: 'i1',
        memberId: 'm2',
        isChecked: true,
        room: roomAfterToggle,
      });
    });

    expect(result.current.room.items[0].splits?.some((s) => s.memberId === 'm2')).toBe(true);
  });

  it('handles SETTLEMENT_LOCKED event and updates lock status', () => {
    const { result } = renderHook(() =>
      useRoomSync({ roomId: 'test-room-1', initialRoom: mockRoom })
    );
    const ws = MockWebSocket.instances[0];

    act(() => {
      ws.triggerOpen();
    });

    act(() => {
      ws.triggerMessage({
        type: 'SETTLEMENT_LOCKED',
        isLocked: true,
        room: { ...mockRoom, isLocked: true },
      });
    });

    expect(result.current.room.isLocked).toBe(true);
  });

  it('handles MEMBER_JOINED event and updates activeMemberIds', () => {
    const { result } = renderHook(() =>
      useRoomSync({ roomId: 'test-room-1', initialRoom: mockRoom })
    );
    const ws = MockWebSocket.instances[0];

    act(() => {
      ws.triggerOpen();
    });

    act(() => {
      ws.triggerMessage({
        type: 'MEMBER_JOINED',
        memberId: 'm2',
        memberName: 'Bob',
        activeMemberIds: ['m1', 'm2'],
      });
    });

    expect(result.current.activeMemberIds).toEqual(['m1', 'm2']);
  });

  it('dispatches JOIN_ROOM, TOGGLE_ITEM_CHECK, LOCK_SETTLEMENT, and UPDATE_ROOM correctly', () => {
    const { result } = renderHook(() =>
      useRoomSync({ roomId: 'test-room-1', initialRoom: mockRoom })
    );
    const ws = MockWebSocket.instances[0];

    act(() => {
      ws.triggerOpen();
    });

    // 1. Join room
    act(() => {
      result.current.joinRoom('m2', 'Bob');
    });
    expect(ws.sentMessages).toContain(
      JSON.stringify({ type: 'JOIN_ROOM', memberId: 'm2', memberName: 'Bob' })
    );

    // 2. Toggle item check
    act(() => {
      result.current.toggleItemCheck('i1', 'm2', true);
    });
    expect(ws.sentMessages).toContain(
      JSON.stringify({ type: 'TOGGLE_ITEM_CHECK', itemId: 'i1', memberId: 'm2', isChecked: true })
    );

    // 3. Lock settlement
    act(() => {
      result.current.lockSettlement(true);
    });
    expect(ws.sentMessages).toContain(
      JSON.stringify({ type: 'LOCK_SETTLEMENT', isLocked: true })
    );

    // 4. Update room
    act(() => {
      result.current.updateRoom({ ...mockRoom, title: '新年尾牙' });
    });
    expect(ws.sentMessages).toContain(
      JSON.stringify({ type: 'UPDATE_ROOM', room: { ...mockRoom, title: '新年尾牙' } })
    );
  });

  it('attempts reconnection when disconnected', () => {
    const { result } = renderHook(() =>
      useRoomSync({ roomId: 'test-room-1', initialRoom: mockRoom, reconnectInterval: 1000 })
    );
    const ws = MockWebSocket.instances[0];

    act(() => {
      ws.triggerOpen();
    });
    expect(result.current.isConnected).toBe(true);

    // Simulate connection drop
    act(() => {
      ws.close();
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.status).toBe('reconnecting');

    // Fast-forward timer to trigger reconnect
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(MockWebSocket.instances.length).toBe(2);
    const newWs = MockWebSocket.instances[1];

    act(() => {
      newWs.triggerOpen();
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.status).toBe('connected');
  });
});
