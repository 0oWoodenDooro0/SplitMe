import React from 'react';
import {
  Check,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { Room, Item } from '../../types/models';
import { formatCurrency } from '../../utils/formatters';
import { MemberAvatar } from '../MemberAvatar';
import { HostCollabProgress } from '../HostCollabProgress';

interface Step5SplitAssignProps {
  room: Room;
  activeMemberIds?: string[];
  mode?: 'live' | 'offline';
  onToggleSplit: (itemId: string, memberId: string) => void;
  onSetAllSplit: (itemId: string) => void;
  onClearSplit: (itemId: string) => void;
  onOpenWeightModal: (itemId: string, memberId: string) => void;
  onToggleLock: (isLocked: boolean) => void;
  onOpenShare: () => void;
  onUpdateItem: (id: string, updates: Partial<Item>) => void;
  onRemoveItem: (id: string) => void;
}

export const Step5SplitAssign: React.FC<Step5SplitAssignProps> = ({
  room,
  activeMemberIds = [],
  mode = 'live',
  onToggleSplit,
  onSetAllSplit,
  onClearSplit,
  onOpenWeightModal,
  onToggleLock,
  onOpenShare,
}) => {
  const memberMap = new Map(room.members.map((m) => [m.id, m]));

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900">品項分攤確認</h2>
        <p className="text-xs text-slate-500 mt-0.5">點擊成員頭像切換分攤或排除</p>
      </div>

      {/* Collaboration Status Card (In Live Mode) */}
      {mode === 'live' && (
        <HostCollabProgress
          room={room}
          activeMemberIds={activeMemberIds}
          onToggleLock={onToggleLock}
          onOpenShare={onOpenShare}
        />
      )}

      {/* Item Split Assignment Cards */}
      <div className="space-y-3">
        {room.items.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-xs text-slate-400">
            尚未新增任何餐點，請先返回上一步輸入餐點。
          </div>
        ) : (
          <div className="space-y-3">
            {room.items.map((item) => {
              const payer = memberMap.get(item.paidByMemberId);
              const splitMemberIds = new Set((item.splits || []).map((s) => s.memberId));

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition-all"
                >
                  {/* Item Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {splitMemberIds.size} 人分攤
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        由 <strong className="text-slate-700 font-medium">{payer?.name || '主揪'}</strong> 墊付
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-bold text-slate-900 font-mono">
                        {formatCurrency(item.price)}
                      </span>

                      {/* Quick action buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onSetAllSplit(item.id)}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                        >
                          全員均分
                        </button>
                        <button
                          type="button"
                          onClick={() => onClearSplit(item.id)}
                          className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors cursor-pointer"
                        >
                          清除
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Member Split Chips Bar */}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {room.members.map((member) => {
                      const isIncluded = splitMemberIds.has(member.id);
                      const splitShare = (item.splits || []).find((s) => s.memberId === member.id);
                      const isWeighted = splitShare && splitShare.splitType !== 'EQUAL';

                      return (
                        <div key={member.id} className="relative inline-flex items-center">
                          <button
                            type="button"
                            aria-label={`切換分攤: ${member.name}`}
                            onClick={() => onToggleSplit(item.id, member.id)}
                            className={`inline-flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                              isIncluded
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs'
                                : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <MemberAvatar member={member} size="sm" showName={false} />
                            <span>{member.name}</span>
                            {isIncluded ? (
                              <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                            ) : (
                              <X className="w-3 h-3 text-slate-400" />
                            )}
                          </button>

                          {/* Weighted split settings trigger */}
                          {isIncluded && (
                            <button
                              type="button"
                              onClick={() => onOpenWeightModal(item.id, member.id)}
                              aria-label={`自訂比例: ${member.name}`}
                              title="設定分攤權重 / 金額"
                              className={`p-1 rounded-full ml-0.5 hover:bg-slate-200 transition-colors ${
                                isWeighted ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-700'
                              }`}
                            >
                              <SlidersHorizontal className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
