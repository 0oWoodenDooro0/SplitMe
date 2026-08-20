import React, { useEffect, useState } from 'react';
import { Split, Server } from 'lucide-react';
import { useRoomState } from './hooks/useRoomState';
import { RoomHeader } from './components/RoomHeader';
import { MemberBar } from './components/MemberBar';
import { ItemList } from './components/ItemList';
import { SettlementDashboard } from './components/SettlementDashboard';
import { ShareWeightModal } from './components/ShareWeightModal';
import { FeeSettingsModal } from './components/FeeSettingsModal';
import { Item, Member, RoundingMode, SplitShare } from './types/models';

export const App: React.FC = () => {
  const [serverStatus, setServerStatus] = useState<'checking' | 'connected' | 'offline'>('checking');

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
    setRoomTitle,
    setRoundingMode,
    loadSampleData,
    resetRoom,
  } = useRoomState();

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
    fetch('/api/health')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Server returned non-200');
      })
      .then(() => setServerStatus('connected'))
      .catch(() => setServerStatus('offline'));
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
              <p className="text-[11px] text-slate-500 font-medium">視覺化拖拉分帳工具</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
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

        {/* Member Avatar Badges Bar */}
        <MemberBar
          members={room.members}
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
            />
          </div>
        </div>
      </main>

      {/* Modals */}
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
