import React, { useEffect, useState } from 'react';
import { Split, Server, Users } from 'lucide-react';
import { useRoomState } from './hooks/useRoomState';
import { useRoomSync } from './hooks/useRoomSync';
import { RoomHeader } from './components/RoomHeader';
import { MemberBar } from './components/MemberBar';
import { ItemList } from './components/ItemList';
import { SettlementDashboard } from './components/SettlementDashboard';
import { ShareWeightModal } from './components/ShareWeightModal';
import { FeeSettingsModal } from './components/FeeSettingsModal';
import { ShareModal } from './components/ShareModal';
import { FriendCheckView } from './components/FriendCheckView';
import { HostCollabProgress } from './components/HostCollabProgress';
import { ReceiptExportModal } from './components/ReceiptExportModal';
import { Item, Member, RoundingMode, SplitShare } from './types/models';

export const App: React.FC = () => {
  const [serverStatus, setServerStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
  const [viewMode, setViewMode] = useState<'host' | 'friend'>(() => {
    if (typeof window !== 'undefined' && window.location?.search) {
      const params = new URLSearchParams(window.location.search);
      return params.get('view') === 'friend' ? 'friend' : 'host';
    }
    return 'host';
  });

  const [currentFriendMemberId, setCurrentFriendMemberId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('splitme_friend_member_id');
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReceiptExportModalOpen, setIsReceiptExportModalOpen] = useState(false);

  const {
    room,
    settlement,
    addMember,
    updateMember,
    removeMember,
    addItem,
    updateItem,
    removeItem,
    toggleItemSplit,
    setAllItemSplit,
    clearItemSplit,
    updateItemSplitShare,
    addExtraFee,
    updateExtraFee,
    removeExtraFee,
    updatePaymentInfo,
    setRoomTitle,
    setRoundingMode,
    loadSampleData,
    resetRoom,
  } = useRoomState();

  // WebSocket Live Synchronization Hook
  const {
    activeMemberIds,
    status: syncStatus,
    joinRoom,
    toggleItemCheck,
    lockSettlement,
  } = useRoomSync({
    roomId: room.id || room.code || 'local-room-1',
    initialRoom: room,
  });

  // Modals state
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [weightModalState, setWeightModalState] = useState<{
    isOpen: boolean;
    item: Item | null;
    member: Member | null;
    split: SplitShare | null;
  }>({
    isOpen: false,
    item: null,
    member: null,
    split: null,
  });

  useEffect(() => {
    let isMounted = true;
    fetch('/api/health')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Server returned non-200');
      })
      .then(() => {
        if (isMounted) setServerStatus('connected');
      })
      .catch(() => {
        if (isMounted) setServerStatus('offline');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenWeightModal = (itemId: string, memberId: string) => {
    const item = room.items.find((i) => i.id === itemId) || null;
    const member = room.members.find((m) => m.id === memberId) || null;
    const split = (item?.splits || []).find((s) => s.memberId === memberId) || null;

    setWeightModalState({
      isOpen: true,
      item,
      member,
      split,
    });
  };

  const handleCloseWeightModal = () => {
    setWeightModalState({
      isOpen: false,
      item: null,
      member: null,
      split: null,
    });
  };

  const handleSaveWeightSplit = (split: SplitShare) => {
    if (weightModalState.item && weightModalState.member) {
      updateItemSplitShare(weightModalState.item.id, split.memberId, {
        splitType: split.splitType,
        value: split.value,
      });
    }
  };

  const handleRemoveFromSplit = (itemId: string, memberId: string) => {
    toggleItemSplit(itemId, memberId);
  };

  const handleSelectFriendMember = (memberId: string) => {
    setCurrentFriendMemberId(memberId);
    try {
      localStorage.setItem('splitme_friend_member_id', memberId);
    } catch {
      // ignore
    }
    const member = room.members.find((m) => m.id === memberId);
    joinRoom(memberId, member?.name);
  };

  const handleFriendAddMember = (name: string) => {
    const newMember = addMember(name);
    setCurrentFriendMemberId(newMember.id);
    try {
      localStorage.setItem('splitme_friend_member_id', newMember.id);
    } catch {
      // ignore
    }
    joinRoom(newMember.id, newMember.name);
  };

  const handleFriendToggleItemCheck = (itemId: string, memberId: string, isChecked: boolean) => {
    toggleItemSplit(itemId, memberId);
    toggleItemCheck(itemId, memberId, isChecked);
  };

  const handleToggleLock = (isLocked: boolean) => {
    lockSettlement(isLocked);
  };

  // If in Friend View mode, render FriendCheckView
  if (viewMode === 'friend') {
    return (
      <FriendCheckView
        room={room}
        currentMemberId={currentFriendMemberId}
        activeMemberIds={activeMemberIds}
        connectionStatus={syncStatus}
        onSelectMember={handleSelectFriendMember}
        onAddMember={handleFriendAddMember}
        onToggleItemCheck={handleFriendToggleItemCheck}
        onSwitchToHostView={() => setViewMode('host')}
      />
    );
  }

  // Otherwise render Host View
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-sm">
              <Split className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">
                SplitMe
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">極速聚餐分帳與即時協作</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setViewMode('friend')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all active:scale-95 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>切換至朋友勾選</span>
            </button>

            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
              <Server className="w-3.5 h-3.5" />
              <span>
                後端連線:{' '}
                {serverStatus === 'checking' && <span className="text-amber-500">連線中...</span>}
                {serverStatus === 'connected' && <span className="text-emerald-600 font-semibold">正常</span>}
                {serverStatus === 'offline' && <span className="text-slate-400">離線 (本機速算模式)</span>}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="max-w-5xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
        {/* Room Header & Quick Sample Controls */}
        <RoomHeader
          room={room}
          onUpdateTitle={setRoomTitle}
          onLoadSampleData={loadSampleData}
          onResetRoom={resetRoom}
        />

        {/* Host Collaboration Progress & Presence Tracker */}
        <HostCollabProgress
          room={room}
          activeMemberIds={activeMemberIds}
          onToggleLock={handleToggleLock}
          onOpenShare={() => setIsShareModalOpen(true)}
        />

        {/* Member Avatar Badges Bar */}
        <MemberBar
          members={room.members}
          activeMemberIds={activeMemberIds}
          onAddMember={addMember}
          onUpdateMember={updateMember}
          onRemoveMember={removeMember}
        />

        {/* Main 2-Column Responsive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Items List & Drag Split (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <ItemList
              items={room.items}
              members={room.members}
              onAddItem={addItem}
              onUpdateItem={updateItem}
              onRemoveItem={removeItem}
              onToggleSplit={toggleItemSplit}
              onSetAllSplit={setAllItemSplit}
              onClearSplit={clearItemSplit}
              onOpenWeightModal={handleOpenWeightModal}
            />
          </div>

          {/* Right Column: Settlement Dashboard & Transfers (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <SettlementDashboard
              settlement={settlement}
              members={room.members}
              roundingMode={room.roundingMode || RoundingMode.NEAREST_INTEGER}
              onRoundingModeChange={setRoundingMode}
              onOpenFeeModal={() => setIsFeeModalOpen(true)}
              onOpenExportModal={() => setIsReceiptExportModalOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <ReceiptExportModal
        isOpen={isReceiptExportModalOpen}
        room={room}
        settlement={settlement}
        onClose={() => setIsReceiptExportModalOpen(false)}
        onUpdatePaymentInfo={updatePaymentInfo}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        room={room}
        onClose={() => setIsShareModalOpen(false)}
        onSwitchToFriendView={() => {
          setIsShareModalOpen(false);
          setViewMode('friend');
        }}
      />

      <ShareWeightModal
        isOpen={weightModalState.isOpen}
        item={weightModalState.item}
        member={weightModalState.member}
        currentSplit={weightModalState.split}
        onClose={handleCloseWeightModal}
        onSave={handleSaveWeightSplit}
        onRemoveFromSplit={handleRemoveFromSplit}
      />

      <FeeSettingsModal
        isOpen={isFeeModalOpen}
        fees={room.extraFees || []}
        members={room.members}
        onClose={() => setIsFeeModalOpen(false)}
        onAddFee={addExtraFee}
        onUpdateFee={updateExtraFee}
        onRemoveFee={removeExtraFee}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-400">
        © 2026 — Kotlin Ktor + React 19 Monorepo
      </footer>
    </div>
  );
};

export default App;
