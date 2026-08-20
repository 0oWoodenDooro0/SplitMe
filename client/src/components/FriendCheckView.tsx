import React, { useState } from 'react';
import {
  Utensils,
  Lock,
  Wifi,
  WifiOff,
  UserPlus,
  ArrowLeft,
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
  onSwitchToHostView: () => void;
}

export const FriendCheckView: React.FC<FriendCheckViewProps> = ({
  room,
  currentMemberId,
  activeMemberIds = [],
  connectionStatus = 'connected',
  onSelectMember,
  onAddMember,
  onToggleItemCheck,
  onSwitchToHostView,
}) => {
  const [isSwitchingMember, setIsSwitchingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');

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

  // Identity Picker Screen
  if (!currentMember || isSwitchingMember) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6">
        <div className="max-w-md w-full mx-auto space-y-6 pt-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onSwitchToHostView}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回主揪管理</span>
            </button>
            <span className="text-xs px-2.5 py-1 bg-slate-800 text-emerald-400 rounded-full border border-slate-700 font-mono">
              {room.code || 'SPLIT'}
            </span>
          </div>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg">
              <Utensils className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">{room.title}</h1>
            <p className="text-sm text-slate-400">你是哪位聚餐成員？ (選擇你的身份)</p>
          </div>

          {/* Members List */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 shadow-xl space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              點選你的名字進入勾選
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {room.members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    onSelectMember(member.id);
                    setIsSwitchingMember(false);
                  }}
                  className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-700/60 hover:bg-emerald-600/30 hover:border-emerald-500/80 border border-slate-600/60 transition-all text-left group active:scale-98"
                >
                  <MemberAvatar member={member} size="md" showName={false} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 block truncate">
                      {member.name}{member.isHost ? ' (主揪)' : ''}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {activeMemberIds.includes(member.id) ? '🟢 線上' : '離線'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Add New Member Form */}
          <form
            onSubmit={handleAddNewMember}
            className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 space-y-2.5"
          >
            <label className="text-xs font-semibold text-slate-400 block">
              不在名單上？新增我的名字
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="輸入你的名字 (如：David)"
                className="flex-1 px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={!newMemberName.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-xs disabled:opacity-50"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>加入聚餐</span>
              </button>
            </div>
          </form>
        </div>

        <footer className="text-center text-xs text-slate-500 py-4">
          SplitMe 朋友協作模式 • 免註冊即開即用
        </footer>
      </div>
    );
  }

  const activeCurrentMemberId = currentMember.id;

  // Main Friend Checklist Screen
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      {/* Friend Top Sticky Header */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-md">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5 min-w-0">
            <MemberAvatar member={currentMember} size="md" showName={false} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white truncate">{currentMember.name}</span>
                <button
                  type="button"
                  onClick={() => setIsSwitchingMember(true)}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-medium"
                >
                  切換身份
                </button>
              </div>
              <p className="text-[11px] text-slate-400 truncate">{room.title}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-400'
                  : 'bg-amber-950/60 border-amber-800/80 text-amber-400'
              }`}
            >
              {connectionStatus === 'connected' ? (
                <Wifi className="w-3 h-3 text-emerald-400" />
              ) : (
                <WifiOff className="w-3 h-3 text-amber-400" />
              )}
              <span>{connectionStatus === 'connected' ? '連線中' : '連線中...'}</span>
            </div>

            <button
              type="button"
              onClick={onSwitchToHostView}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 transition-colors"
            >
              主揪模式
            </button>
          </div>
        </div>
      </header>

      {/* Main Checklist Container */}
      <main className="max-w-xl mx-auto w-full px-4 py-5 flex-1 space-y-4">
        {/* Locked Mode Banner */}
        {isLocked && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/40 rounded-2xl flex items-center space-x-3 text-amber-300 shadow-sm animate-in fade-in duration-200">
            <Lock className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-xs font-bold text-amber-300">
              主揪已鎖定結算（目前僅供檢視，無法修改勾選狀態）
            </div>
          </div>
        )}

        {/* Live Personal Amount Card */}
        <div className="bg-gradient-to-r from-emerald-900/60 to-teal-900/60 border border-emerald-600/40 rounded-3xl p-4 sm:p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider block">
              我的即時應付金額
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white">
              {formatCurrency(personalSummary?.totalToPay ?? 0, room.currency)}
            </span>
            <span className="text-[11px] text-emerald-200/80 block mt-0.5">
              已勾選{' '}
              {room.items.filter((i) => (i.splits || []).some((s) => s.memberId === activeCurrentMemberId)).length}{' '}
              / {room.items.length} 項品項
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">餐點小計</span>
            <span className="text-sm font-bold text-slate-200 font-mono">
              {formatCurrency(personalSummary?.subtotal ?? 0, room.currency)}
            </span>
            {(personalSummary?.feesAndDiscounts ?? 0) !== 0 && (
              <span className="text-[10px] text-emerald-400 block">
                +附加費用 {formatCurrency(personalSummary?.feesAndDiscounts ?? 0, room.currency)}
              </span>
            )}
          </div>
        </div>

        {/* Food Items Checklist */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-emerald-400" />
              <span>點選你吃過的品項 (即時同步)</span>
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">
              共 {room.items.length} 項
            </span>
          </div>

          {room.items.length === 0 ? (
            <div className="p-8 text-center bg-slate-800/40 rounded-2xl border border-slate-800 text-slate-400 space-y-1">
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
                  className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                    isChecked
                      ? 'bg-emerald-950/40 border-emerald-500/70 shadow-md ring-1 ring-emerald-500/40'
                      : 'bg-slate-800/60 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                  } ${isLocked ? 'cursor-not-allowed opacity-90' : 'active:scale-99'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Item Details */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white leading-tight">
                          {item.name}
                        </span>
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                          {formatCurrency(item.price, room.currency)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>由 {payer?.name || '未知'} 墊付</span>
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
                                className="ring-2 ring-slate-900 rounded-full"
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
                        className="w-6 h-6 rounded-lg bg-slate-900 border-slate-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer disabled:cursor-not-allowed"
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
      <footer className="border-t border-slate-800 bg-slate-900/90 py-3 px-4 text-center text-xs text-slate-500 flex items-center justify-between max-w-xl mx-auto w-full">
        <span>聚會短碼: <strong className="text-emerald-400 font-mono">{room.code || 'LOCAL'}</strong></span>
        <button
          type="button"
          onClick={onSwitchToHostView}
          className="text-emerald-400 hover:text-emerald-300 font-medium"
        >
          切換回主揪管理
        </button>
      </footer>
    </div>
  );
};
