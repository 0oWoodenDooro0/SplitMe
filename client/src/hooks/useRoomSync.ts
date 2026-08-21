import { useState, useEffect, useRef, useCallback } from 'react';
import { Room, SplitType, WsMessage } from '../types/models';

export interface UseRoomSyncOptions {
  roomId: string;
  initialRoom: Room;
  reconnectInterval?: number;
  onRoomUpdated?: (room: Room) => void;
  onSyncError?: (error: string) => void;
}

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

export function useRoomSync({
  roomId,
  initialRoom,
  reconnectInterval = 2000,
  onRoomUpdated,
  onSyncError,
}: UseRoomSyncOptions) {
  const [room, setRoom] = useState<Room>(initialRoom);
  const [activeMemberIds, setActiveMemberIds] = useState<string[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<any>(null);
  const isExplicitCloseRef = useRef(false);

  // Keep room updated if initialRoom changes and we haven't synced yet
  useEffect(() => {
    if (status === 'idle') {
      setRoom(initialRoom);
    }
  }, [initialRoom, status]);

  const sendJson = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const connect = useCallback(() => {
    if (!roomId) return;
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      setStatus((prev) => (prev === 'connected' ? 'connected' : prev === 'reconnecting' ? 'reconnecting' : 'connecting'));
      setError(null);

      const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = typeof window !== 'undefined' && window.location.host ? window.location.host : 'localhost:8080';
      const wsUrl = `${protocol}//${host}/ws/rooms/${roomId}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data: WsMessage = JSON.parse(event.data);
          switch (data.type) {
            case 'SYNC_STATE': {
              setRoom(data.room);
              if (data.activeMemberIds) {
                setActiveMemberIds(data.activeMemberIds);
              }
              onRoomUpdated?.(data.room);
              break;
            }
            case 'ITEM_CHECK_TOGGLED': {
              if (data.room) {
                setRoom(data.room);
                onRoomUpdated?.(data.room);
              } else {
                setRoom((prev) => {
                  const updatedItems = prev.items.map((item) => {
                    if (item.id !== data.itemId) return item;
                    const splits = item.splits || [];
                    const hasMember = splits.some((s) => s.memberId === data.memberId);
                    const newSplits = data.isChecked
                      ? hasMember
                        ? splits
                        : [...splits, { memberId: data.memberId, splitType: SplitType.EQUAL }]
                      : splits.filter((s) => s.memberId !== data.memberId);
                    return { ...item, splits: newSplits };
                  });
                  const updatedRoom = { ...prev, items: updatedItems };
                  onRoomUpdated?.(updatedRoom);
                  return updatedRoom;
                });
              }
              break;
            }
            case 'SETTLEMENT_LOCKED': {
              setRoom((prev) => {
                const updatedRoom = data.room || { ...prev, isLocked: data.isLocked };
                onRoomUpdated?.(updatedRoom);
                return updatedRoom;
              });
              break;
            }

            case 'MEMBER_JOINED': {
              if (data.activeMemberIds) {
                setActiveMemberIds(data.activeMemberIds);
              } else {
                setActiveMemberIds((prev) =>
                  prev.includes(data.memberId) ? prev : [...prev, data.memberId]
                );
              }
              break;
            }
            case 'ERROR': {
              setError(data.message);
              onSyncError?.(data.message);
              break;
            }
            default:
              break;
          }
        } catch (e: any) {
          console.warn('Failed to parse WebSocket message', e);
        }
      };

      ws.onerror = () => {
        setError('WebSocket connection error');
        onSyncError?.('WebSocket connection error');
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (!isExplicitCloseRef.current) {
          setStatus('reconnecting');
          if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else {
          setStatus('disconnected');
        }
      };
    } catch (err: any) {
      setStatus('error');
      setError(err?.message || 'Connection failed');
    }
  }, [roomId, reconnectInterval, onRoomUpdated, onSyncError]);

  useEffect(() => {
    isExplicitCloseRef.current = false;
    connect();

    return () => {
      isExplicitCloseRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  // Client Actions
  const joinRoom = useCallback(
    (memberId: string, memberName?: string) => {
      sendJson({ type: 'JOIN_ROOM', memberId, memberName });
    },
    [sendJson]
  );

  const toggleItemCheck = useCallback(
    (itemId: string, memberId: string, isChecked: boolean) => {
      // Optimistic local update
      setRoom((prev) => {
        const updatedItems = prev.items.map((item) => {
          if (item.id !== itemId) return item;
          const currentSplits = item.splits || [];
          const exists = currentSplits.some((s) => s.memberId === memberId);
          const newSplits = isChecked
            ? exists
              ? currentSplits
              : [...currentSplits, { memberId, splitType: SplitType.EQUAL }]
            : currentSplits.filter((s) => s.memberId !== memberId);
          return { ...item, splits: newSplits };
        });
        return { ...prev, items: updatedItems };
      });

      sendJson({ type: 'TOGGLE_ITEM_CHECK', itemId, memberId, isChecked });
    },
    [sendJson]
  );

  const updateRoom = useCallback(
    (updatedRoom: Room) => {
      setRoom(updatedRoom);
      sendJson({ type: 'UPDATE_ROOM', room: updatedRoom });
    },
    [sendJson]
  );

  const lockSettlement = useCallback(
    (isLocked: boolean) => {
      setRoom((prev) => ({ ...prev, isLocked }));
      sendJson({ type: 'LOCK_SETTLEMENT', isLocked });
    },
    [sendJson]
  );

  const requestSync = useCallback(() => {
    sendJson({ type: 'REQUEST_SYNC' });
  }, [sendJson]);

  return {
    room,
    setRoom,
    activeMemberIds,
    status,
    isConnected: status === 'connected',
    error,
    joinRoom,
    toggleItemCheck,
    updateRoom,
    lockSettlement,
    requestSync,
    reconnect: connect,
  };
}
