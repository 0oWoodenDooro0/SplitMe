import React from 'react';
import { Trash2, Users, DollarSign } from 'lucide-react';
import { Item, Member, SplitType } from '../types/models';
import { formatCurrency } from '../utils/formatters';

interface ItemCardProps {
  item: Item;
  members: Member[];
  onUpdateItem: (id: string, updates: Partial<Item>) => void;
  onRemoveItem: (id: string) => void;
  onToggleSplit: (itemId: string, memberId: string) => void;
  onSetAllSplit: (itemId: string) => void;
  onClearSplit: (itemId: string) => void;
  onOpenWeightModal: (itemId: string, memberId: string) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  members,
  onUpdateItem,
  onRemoveItem,
  onToggleSplit,
  onSetAllSplit,
  onClearSplit,
  onOpenWeightModal,
}) => {
  const memberMap = new Map<string, Member>(members.map((m) => [m.id, m]));
  const splits = item.splits || [];
  const activeMemberIds = new Set(splits.map((s) => s.memberId));
  const payer = memberMap.get(item.paidByMemberId);

  // Drag & drop dropzone handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!e.dataTransfer) return;
    const memberId = e.dataTransfer.getData('text/plain');
    if (memberId && memberMap.has(memberId)) {
      onToggleSplit(item.id, memberId);
    }
  };

  return (
    <div
      data-testid={`item-card-${item.id}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="group bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-emerald-300 transition-all space-y-3 relative"
    >
      {/* Top row: Name, Price, Payer, Delete */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex-1 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 leading-snug">{item.name}</h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-extrabold text-emerald-600 text-sm">
                {formatCurrency(item.price)}
              </span>
              <span>•</span>
              <span className="text-slate-600">
                {payer ? `${payer.name} 墊付` : '未指定墊付人'}
              </span>
            </div>
          </div>
        </div>

        {/* Payer selector & Delete */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
            <span className="text-[11px] text-slate-400">墊付:</span>
            <select
              aria-label="墊付人"
              value={item.paidByMemberId}
              onChange={(e) => onUpdateItem(item.id, { paidByMemberId: e.target.value })}
              className="bg-transparent text-xs text-slate-700 font-medium focus:outline-hidden cursor-pointer"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.isHost ? '(主揪)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => onRemoveItem(item.id)}
            aria-label="刪除品項"
            title="刪除品項"
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Split members section */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>分攤對象 ({splits.length} 人)：</span>
          </span>

          {/* Quick actions */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSetAllSplit(item.id)}
              className="px-2 py-0.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors"
            >
              + 全員
            </button>
            <button
              type="button"
              onClick={() => onClearSplit(item.id)}
              className="px-2 py-0.5 text-[11px] font-medium text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              - 清空
            </button>
          </div>
        </div>

        {/* 1-Click quick toggle member buttons for mobile/touch */}
        <div className="flex flex-wrap items-center gap-1.5">
          {members.map((m) => {
            const isIncluded = activeMemberIds.has(m.id);
            const split = splits.find((s) => s.memberId === m.id);

            return (
              <div key={m.id} className="relative inline-flex items-center">
                {/* 1-Click toggle button */}
                <button
                  type="button"
                  data-testid={`toggle-split-${item.id}-${m.id}`}
                  onClick={() => onToggleSplit(item.id, m.id)}
                  title={isIncluded ? `點擊將 ${m.name} 移出分攤` : `點擊加入 ${m.name} 分攤`}
                  className={`inline-flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    isIncluded
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs'
                      : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60 hover:opacity-90'
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
                    style={{ backgroundColor: m.avatarColor }}
                  >
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{m.name}</span>
                </button>

                {/* If active, split weight badge chip allowing open weight modal */}
                {isIncluded && split && (
                  <button
                    type="button"
                    data-testid={`split-chip-${item.id}-${m.id}`}
                    onClick={() => onOpenWeightModal(item.id, m.id)}
                    title="調整分攤份數或指定金額"
                    className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100 hover:scale-105 transition-transform"
                  >
                    {split.splitType === SplitType.EXACT_AMOUNT
                      ? `$${split.value || 0}`
                      : split.splitType === SplitType.WEIGHTED && split.value && split.value !== 1
                      ? `${split.value}x`
                      : '1x'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
