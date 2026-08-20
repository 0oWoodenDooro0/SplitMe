import React from 'react';
import { Users, Lock, Unlock, Share2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Room } from '../types/models';
import { MemberAvatar } from './MemberAvatar';

interface HostCollabProgressProps {
  room: Room;
  activeMemberIds?: string[];
  onToggleLock: (isLocked: boolean) => void;
  onOpenShare: () => void;
}

export const HostCollabProgress: React.FC<HostCollabProgressProps> = ({
  room,
  activeMemberIds = [],
  onToggleLock,
  onOpenShare,
}) => {
  const isLocked = Boolean(room.isLocked);

  // Compute check count for each member
  const memberProgress = room.members.map((member) => {
    const checkedCount = room.items.filter((item) =>
      (item.splits || []).some((s) => s.memberId === member.id)
    ).length;
    const isOnline = activeMemberIds.includes(member.id);
    return {
      member,
      checkedCount,
      isOnline,
    };
  });

  const unselectedMembers = memberProgress.filter((p) => p.checkedCount === 0);

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-none">多人協作勾選進度</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              在線協作者: {activeMemberIds.length} 人 • {room.members.length} 位參與者
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-xs active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>邀請朋友協作</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleLock(!isLocked)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs active:scale-95 ${
              isLocked
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-slate-800 hover:bg-slate-900 text-white'
            }`}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{isLocked ? '已鎖定結算 (點擊解鎖)' : '鎖定結算'}</span>
          </button>
        </div>
      </div>

      {/* Unselected Reminder Banner */}
      {unselectedMembers.length > 0 && room.items.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-amber-800 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">未勾選提醒：</span>
            <span>
              尚有 {unselectedMembers.length} 位成員尚未完成餐點勾選
            </span>
          </div>
        </div>
      )}

      {/* Member Progress Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {memberProgress.map(({ member, checkedCount, isOnline }) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="relative">
                <MemberAvatar member={member} size="sm" showName={false} />
                {isOnline && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 block truncate">
                  {member.name}{member.isHost ? ' (主揪)' : ''}
                </span>
                <span
                  data-testid={`presence-badge-${member.id}`}
                  className={`text-[10px] font-medium ${
                    isOnline ? 'text-emerald-600 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {isOnline ? '🟢 線上' : '離線'}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              {checkedCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  <span>{checkedCount} 項</span>
                </span>
              ) : (
                <span className="inline-flex items-center text-[10px] font-bold text-slate-400 bg-slate-200/80 px-2 py-0.5 rounded-full">
                  0 項
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
