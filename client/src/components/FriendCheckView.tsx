import React, { useState } from 'react';
import {
  Utensils,
  Lock,
  Wifi,
  WifiOff,
  UserPlus,
  Share2,
  Check,
} from 'lucide-react';

import { Room } from '../types/models';
import { MemberAvatar } from './MemberAvatar';
import { calculateSettlement } from '../core/financialCalculator';
import { formatCurrency } from '../utils/formatters';

interface FriendCheckViewProps {
  room: Room;
  currentMemberId: string | null;
  activeMemberIds?: string[];
  connectionStatus?: 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';
  onSelectMember: (memberId: string) => void;
  onAddMember: (name: string) => void;
  onToggleItemCheck: (itemId: string, memberId: string, isChecked: boolean) => void;
}


export const FriendCheckView: React.FC<FriendCheckViewProps> = ({
  room,
  currentMemberId,
  activeMemberIds = [],
  connectionStatus = 'connected',
  onSelectMember,
  onAddMember,
  onToggleItemCheck,
}) => {
  const [isSwitchingMember, setIsSwitchingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [copiedShare, setCopiedShare] = useState(false);

  const handleCopyShareUrl = async () => {
    try {
      const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : 'http://localhost:5173';
      const shareCode = room.code || room.id;
      const shareUrl = `${baseUrl}?room=${encodeURIComponent(shareCode)}&view=friend`;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch (e) {
      console.warn('Failed to copy share url:', e);
    }
  };

  const currentMember = room.members.find((m) => m.id === currentMemberId) || null;
  const settlement = calculateSettlement(room);
  const personalSummary = currentMemberId ? settlement.memberSummaries[currentMemberId] : null;

  const handleAddNewMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMemberName.trim()) {
      onAddMember(newMemberName.trim());
      setNewMemberName('');
      setIsSwitchingMember(false);
    }
  };

  const isLocked = Boolean(room.isLocked);
  const displayTitle = room.title || '聚餐分帳';
  const friendMembers = room.members.filter((m) => !m.isHost);

  // Identity Picker Screen
  if (!currentMember || isSwitchingMember) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-4 sm:p-6">
        <div className="max-w-md w-full mx-auto space-y-6 pt-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200 font-mono font-bold">
              短碼: {room.code || 'SPLIT'}
            </span>
            <button
              type="button"
              onClick={handleCopyShareUrl}
              className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200 font-medium transition-all active:scale-95 cursor-pointer"
            >
              {copiedShare ? <Check className="w-3 h-3 text-emerald-600" /> : <Share2 className="w-3 h-3 text-emerald-600" />}
              <span>{copiedShare ? '已複製！' : '複製分享連結'}</span>
            </button>
          </div>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl mx-auto flex items-center justify-center text-white shadow-xs">
              <Utensils className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">{displayTitle}</h1>
            <p className="text-sm text-slate-500">你是哪位聚餐成員？</p>
          </div>

          {/* Members List */}
          {friendMembers.length > 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                點選你的名字進入勾選
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {friendMembers.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      onSelectMember(member.id);
                      setIsSwitchingMember(false);
                    }}
                    className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 hover:border-emerald-400 border border-slate-200 transition-all text-left group active:scale-98 cursor-pointer"
                  >
                    <MemberAvatar member={member} size="md" showName={false} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 block truncate">
                        {member.name || '成員'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {activeMemberIds.includes(member.id) ? '🟢 線上' : '離線'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs text-center space-y-1">
              <p className="text-xs font-bold text-slate-700">尚未有其他成員加入</p>
              <p className="text-[11px] text-slate-400">請在下方輸入你的姓名，立即加入聚餐！</p>
            </div>
          )}

          {/* Add New Member Form */}
          <form
            onSubmit={handleAddNewMember}
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs"
          >
            <div className="flex items-center gap-2">
              <input
                id="new-friend-name-input"
                aria-label="新增我的名字"
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="輸入你的姓名"
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
              <button
                type="submit"
                disabled={!newMemberName.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>加入聚餐</span>
              </button>
            </div>
          </form>
        </div>

        <footer className="text-center text-xs text-slate-400 py-4">
          SplitMe 朋友協作模式 • 免註冊即開即用
        </footer>
      </div>
    );
  }

  const activeCurrentMemberId = currentMember.id;

  // Main Friend Checklist Screen
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      {/* Friend Top Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5 min-w-0">
            <MemberAvatar member={currentMember} size="md" showName={false} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900 truncate">
                  {currentMember.name || (currentMember.isHost ? '主揪' : '成員')}
                </span>
                <button
                  type="button"
                  onClick={() => setIsSwitchingMember(true)}
                  className="text-[11px] text-emerald-600 hover:text-emerald-700 underline font-medium cursor-pointer"
                >
                  切換身份
                </button>
              </div>
              <p className="text-[11px] text-slate-500 truncate">{displayTitle}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyShareUrl}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
            >
              {copiedShare ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-emerald-600" />}
              <span>{copiedShare ? '已複製！' : '複製連結'}</span>
            </button>

            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
            >
              {connectionStatus === 'connected' ? (
                <Wifi className="w-3 h-3 text-emerald-600" />
              ) : (
                <WifiOff className="w-3 h-3 text-amber-600" />
              )}
              <span>{connectionStatus === 'connected' ? '已連線' : '連線中...'}</span>

            </div>
          </div>
        </div>
      </header>

      {/* Main Checklist Container */}
      <main className="max-w-xl mx-auto w-full px-4 py-5 flex-1 space-y-4">
        {/* Locked Mode Banner */}
        {isLocked && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center space-x-3 text-amber-800 shadow-2xs animate-in fade-in duration-200">
            <Lock className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs font-bold text-amber-800">
              主揪已鎖定結算，目前僅供檢視
            </div>
          </div>
        )}

        {/* Live Personal Amount Card */}
        <div className="bg-gradient-to-tr from-emerald-600 to-teal-600 text-white rounded-2xl p-4 sm:p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-100 uppercase tracking-wider block">
              我的即時應付金額
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white">
              {formatCurrency(personalSummary?.totalToPay ?? 0, room.currency)}
            </span>
            <span className="text-[11px] text-emerald-100/90 block mt-0.5">
              已勾選{' '}
              {room.items.filter((i) => (i.splits || []).some((s) => s.memberId === activeCurrentMemberId)).length}{' '}
              / {room.items.length} 項品項
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-emerald-100/80 block">餐點小計</span>
            <span className="text-sm font-bold text-white font-mono">
              {formatCurrency(personalSummary?.subtotal ?? 0, room.currency)}
            </span>
            {(personalSummary?.feesAndDiscounts ?? 0) !== 0 && (
              <span className="text-[10px] text-emerald-200 block">
                +附加費用 {formatCurrency(personalSummary?.feesAndDiscounts ?? 0, room.currency)}
              </span>
            )}
          </div>
        </div>

        {/* Food Items Checklist */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-emerald-600" />
              <span>點選你吃過的品項</span>
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">
              共 {room.items.length} 項
            </span>
          </div>

          {room.items.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 space-y-1 shadow-2xs">
              <p className="text-xs font-medium">主揪尚未建立任何消費品項</p>
              <p className="text-[11px] text-slate-500">品項建立後將會自動同步至此清單</p>
            </div>
          ) : (
            room.items.map((item) => {
              const splits = item.splits || [];
              const isChecked = splits.some((s) => s.memberId === activeCurrentMemberId);
              const payer = room.members.find((m) => m.id === item.paidByMemberId);
              const eaters = room.members.filter((m) => splits.some((s) => s.memberId === m.id));

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (!isLocked) {
                      onToggleItemCheck(item.id, activeCurrentMemberId, !isChecked);
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer select-none shadow-2xs ${
                    isChecked
                      ? 'bg-emerald-50/70 border-emerald-400 ring-1 ring-emerald-400'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  } ${isLocked ? 'cursor-not-allowed opacity-90' : 'active:scale-99'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Item Details */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900 leading-tight">
                          {item.name}
                        </span>
                        <span className="text-xs font-bold text-emerald-700 font-mono">
                          {formatCurrency(item.price, room.currency)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>由 {payer?.name || '主揪'} 墊付</span>
                        <span>•</span>
                        <span>共 {eaters.length} 人分攤</span>
                      </div>

                      {/* Co-eater Avatars */}
                      {eaters.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-slate-400">分攤者:</span>
                          <div className="flex items-center -space-x-1.5">
                            {eaters.map((eater) => (
                              <div
                                key={eater.id}
                                title={eater.name}
                                className="ring-2 ring-white rounded-full"
                              >
                                <MemberAvatar member={eater} size="sm" showName={false} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Checkbox Trigger */}
                    <div className="shrink-0 pt-0.5">
                      <input
                        type="checkbox"
                        data-testid={`friend-check-${item.id}`}
                        checked={isChecked}
                        disabled={isLocked}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (!isLocked) {
                            onToggleItemCheck(item.id, activeCurrentMemberId, e.target.checked);
                          }
                        }}
                        className="w-6 h-6 rounded-lg bg-white border-slate-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-white cursor-pointer disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Friend Sticky Footer */}
      <footer className="border-t border-slate-200 bg-white/95 py-3 px-4 text-center text-xs text-slate-500 flex items-center justify-between max-w-xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span>聚會短碼: <strong className="text-emerald-700 font-mono font-bold">{room.code || 'LOCAL'}</strong></span>
          <button
            type="button"
            onClick={handleCopyShareUrl}
            className="text-emerald-600 hover:text-emerald-700 font-medium underline cursor-pointer"
          >
            {copiedShare ? '已複製連結' : '複製分享連結'}
          </button>
        </div>
        <span className="text-slate-400 text-[11px]">SplitMe 朋友協作勾選</span>
      </footer>
    </div>
  );
};



