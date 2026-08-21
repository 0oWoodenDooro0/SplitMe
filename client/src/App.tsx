import React, { useState, useEffect, useCallback } from 'react';
import {
  Split,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

import { useRoomState } from './hooks/useRoomState';
import { useRoomSync } from './hooks/useRoomSync';
import { Step1HostName } from './components/steps/Step1HostName';
import { Step2ModeSelect } from './components/steps/Step2ModeSelect';
import { Step3MemberList } from './components/steps/Step3MemberList';
import { Step4ItemInput } from './components/steps/Step4ItemInput';
import { Step5SplitAssign } from './components/steps/Step5SplitAssign';
import { Step6SettlementCalc } from './components/steps/Step6SettlementCalc';
import { Step7ReceiptImage } from './components/steps/Step7ReceiptImage';
import { ShareWeightModal } from './components/ShareWeightModal';
import { FeeSettingsModal } from './components/FeeSettingsModal';
import { ShareModal } from './components/ShareModal';
import { ReceiptExportModal } from './components/ReceiptExportModal';
import { FriendCheckView } from './components/FriendCheckView';
import { Item, Member, RoundingMode, SplitShare, Room } from './types/models';

export const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [wizardMode, setWizardMode] = useState<'live' | 'offline'>('live');

  const [viewMode] = useState<'host' | 'friend'>(() => {
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

  const [roomLoadError, setRoomLoadError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReceiptExportModalOpen, setIsReceiptExportModalOpen] = useState(false);
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);

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
    setRoomDirectly,
  } = useRoomState();

  // Load room from URL parameter (?room=CODE)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location?.search) {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        fetch(`/api/rooms/${encodeURIComponent(roomParam)}`)
          .then((res) => {
            if (res.ok) return res.json();
            throw new Error(`Failed to load room: ${res.status}`);
          })
          .then((loadedRoom: Room) => {
            setRoomDirectly(loadedRoom);
            setRoomLoadError(null);
          })
          .catch((err) => {
            console.warn('Could not load room from URL:', err);
            setRoomLoadError(`找不到代碼為「${roomParam}」的聚餐房間。該聚餐可能已結束或代碼不正確。`);
          });
      }
    }
  }, [setRoomDirectly]);

  // Auto-register room with server when host starts live mode
  const registerRoomOnServer = useCallback(async (currentRoom: Room = room): Promise<Room | null> => {
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentRoom.title || '聚餐分帳',
          members: currentRoom.members,
          items: currentRoom.items,
          extraFees: currentRoom.extraFees,
          currency: currentRoom.currency,
          roundingMode: currentRoom.roundingMode,
          paymentInfo: currentRoom.paymentInfo,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const createdRoom: Room = await res.json();
      setRoomDirectly((prev) => ({
        ...prev,
        id: createdRoom.id,
        code: createdRoom.code,
      }));
      return createdRoom;
    } catch (err) {
      console.warn('Failed to register room on server:', err);
      return null;
    }
  }, [room, setRoomDirectly]);

  useEffect(() => {
    if (viewMode === 'host' && wizardMode === 'live' && !room.code) {
      registerRoomOnServer(room);
    }
  }, [viewMode, wizardMode, room.code, registerRoomOnServer, room]);

  const handleOpenShareModal = useCallback(async () => {
    if (!room.code || room.id.startsWith('local-') || room.id.startsWith('room-')) {
      await registerRoomOnServer(room);
    }
    setIsShareModalOpen(true);
  }, [room, registerRoomOnServer]);

  const handleSelectWizardMode = useCallback(async (mode: 'live' | 'offline') => {
    setWizardMode(mode);
    if (mode === 'live' && (!room.code || room.id.startsWith('local-') || room.id.startsWith('room-'))) {
      await registerRoomOnServer(room);
    }
  }, [room, registerRoomOnServer]);

  // Sync host changes to server
  useEffect(() => {
    if (viewMode === 'host' && wizardMode === 'live' && room.code && room.id && !room.id.startsWith('room-') && !room.id.startsWith('local-')) {
      const timer = setTimeout(() => {
        fetch(`/api/rooms/${encodeURIComponent(room.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(room),
        }).catch((err) => {
          console.warn('Could not sync room to server:', err);
        });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [viewMode, wizardMode, room]);

  const handleRoomUpdatedFromWs = useCallback(
    (updatedRoom: Room) => {
      setRoomDirectly(updatedRoom);
    },
    [setRoomDirectly]
  );

  // WebSocket Live Synchronization Hook (connect when valid server room code/id is present and no error)
  const effectiveRoomId = !roomLoadError ? (room.code || (room.id && !room.id.startsWith('room-') && !room.id.startsWith('local-') ? room.id : '')) : '';
  const {
    activeMemberIds,
    status: syncStatus,
    joinRoom,
    toggleItemCheck,
    lockSettlement,
  } = useRoomSync({
    roomId: effectiveRoomId,
    initialRoom: room,
    onRoomUpdated: handleRoomUpdatedFromWs,
  });

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

  const handleUpdateHostName = (name: string) => {
    const hostMember = room.members.find((m) => m.isHost) || room.members[0];
    if (hostMember) {
      updateMember(hostMember.id, { name });
    }
  };

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
    joinRoom(newMember.id, name);
  };

  const handleFriendToggleItemCheck = (itemId: string, memberId: string, isChecked: boolean) => {
    toggleItemCheck(itemId, memberId, isChecked);
  };

  const handleToggleLock = (isLocked: boolean) => {
    lockSettlement(isLocked);
  };

  const handleNextStep = async () => {
    if (currentStep === 1 && wizardMode === 'live' && (!room.code || room.id.startsWith('local-') || room.id.startsWith('room-'))) {
      await registerRoomOnServer(room);
    }
    setCurrentStep((prev) => Math.min(7, prev + 1));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleFinishAndReset = () => {
    resetRoom();
    setCurrentStep(1);
  };

  // If room failed to load (e.g. 404 / expired)
  if (roomLoadError) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl mx-auto flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-slate-900">找不到聚餐房間</h2>
            <p className="text-xs text-slate-500 leading-relaxed">{roomLoadError}</p>
          </div>
          <div className="pt-2">
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs"
            >
              建立全新聚餐
            </a>
          </div>
        </div>
      </div>
    );
  }

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
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-900">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xs">
              <Split className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-none">
                SplitMe
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Wizard Area */}
      <main className="max-w-3xl mx-auto px-4 py-5 flex-1 w-full space-y-4">
        {/* Step Views */}
        <div className="min-h-[420px]">
          {currentStep === 1 && (
            <Step1HostName
              room={room}
              onUpdateTitle={setRoomTitle}
              onUpdateHostName={handleUpdateHostName}
              onLoadSampleData={loadSampleData}
              onResetRoom={resetRoom}
            />
          )}

          {currentStep === 2 && (
            <Step2ModeSelect
              selectedMode={wizardMode}
              onSelectMode={handleSelectWizardMode}
              roomCode={room.code || room.id}
            />
          )}



          {currentStep === 3 && (
            <Step3MemberList
              members={room.members}
              activeMemberIds={activeMemberIds}
              onAddMember={addMember}
              onUpdateMember={updateMember}
              onRemoveMember={removeMember}
            />
          )}

          {currentStep === 4 && (
            <Step4ItemInput
              items={room.items}
              members={room.members}
              onAddItem={addItem}
              onUpdateItem={updateItem}
              onRemoveItem={removeItem}
              onOpenFeeModal={() => setIsFeeModalOpen(true)}
              totalFeeAmount={settlement.totalFeeAmount}
            />
          )}

          {currentStep === 5 && (
            <Step5SplitAssign
              room={room}
              activeMemberIds={activeMemberIds}
              mode={wizardMode}
              onToggleSplit={toggleItemSplit}
              onSetAllSplit={setAllItemSplit}
              onClearSplit={clearItemSplit}
              onOpenWeightModal={handleOpenWeightModal}
              onToggleLock={handleToggleLock}
              onOpenShare={handleOpenShareModal}
              onUpdateItem={updateItem}
              onRemoveItem={removeItem}
            />
          )}

          {currentStep === 6 && (
            <Step6SettlementCalc
              settlement={settlement}
              members={room.members}
              roundingMode={room.roundingMode || RoundingMode.NEAREST_INTEGER}
              onRoundingModeChange={setRoundingMode}
              onOpenFeeModal={() => setIsFeeModalOpen(true)}
            />
          )}

          {currentStep === 7 && (
            <Step7ReceiptImage
              room={room}
              settlement={settlement}
              onUpdatePaymentInfo={updatePaymentInfo}
              onResetRoom={handleFinishAndReset}
            />
          )}
        </div>
      </main>

      {/* Bottom Sticky Action Bar */}
      <div className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>上一步</span>
          </button>

          <div className="text-xs font-bold text-slate-500">
            步驟 <span className="text-emerald-600 font-extrabold">{currentStep}</span> / 7
          </div>

          {currentStep < 7 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <span>下一步</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishAndReset}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>建立新聚餐</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Modals */}
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
      <footer className="border-t border-slate-200 bg-white py-2.5 px-4 text-center text-xs text-slate-400">
        © 2026
      </footer>
    </div>
  );
};

export default App;
