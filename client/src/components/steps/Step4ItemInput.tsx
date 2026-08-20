import React, { useState } from 'react';
import { Plus, Utensils, Trash2, ReceiptText, Sparkles } from 'lucide-react';
import { Item, Member } from '../../types/models';
import { formatCurrency } from '../../utils/formatters';

interface Step4ItemInputProps {
  items: Item[];
  members: Member[];
  onAddItem: (name: string, price: number, paidByMemberId: string, splitMemberIds?: string[]) => void;
  onUpdateItem?: (id: string, updates: Partial<Item>) => void;
  onRemoveItem: (id: string) => void;
  onOpenFeeModal: () => void;
  totalFeeAmount?: number;
}

export const Step4ItemInput: React.FC<Step4ItemInputProps> = ({
  items,
  members,
  onAddItem,
  onUpdateItem: _onUpdateItem,
  onRemoveItem,
  onOpenFeeModal,
  totalFeeAmount = 0,
}) => {
  const hostMember = members.find((m) => m.isHost) || members[0];
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [payerId, setPayerId] = useState<string>(hostMember?.id || '');

  const memberMap = new Map(members.map((m) => [m.id, m]));
  const totalItemAmount = items.reduce((sum, item) => sum + Number(item.price || 0), 0);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseFloat(price);
    if (!name.trim() || isNaN(numPrice) || numPrice <= 0) return;

    const chosenPayer = payerId || hostMember?.id || (members[0]?.id ?? '');
    const allMemberIds = members.map((m) => m.id);

    onAddItem(name.trim(), numPrice, chosenPayer, allMemberIds);
    setName('');
    setPrice('');
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">餐點品項與金額</h2>
          <p className="text-xs text-slate-500 mt-0.5">輸入消費項目、金額與付款人</p>
        </div>

        <button
          type="button"
          onClick={onOpenFeeModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>附加費與折扣 ({formatCurrency(totalFeeAmount)})</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5">
        {/* Quick Add Form */}
        <form
          onSubmit={handleAdd}
          className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
        >
          <div className="flex-1">
            <input
              id="item-name-input"
              aria-label="餐點品項名稱"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="餐點品項"
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-28 sm:w-32">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 font-bold">$</span>
              <input
                id="item-price-input"
                aria-label="金額"
                type="number"
                min="0"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="金額"
                className="w-full pl-6 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
              />
            </div>

            <select
              aria-label="墊付人"
              value={payerId || hostMember?.id || ''}
              onChange={(e) => setPayerId(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-700 cursor-pointer font-medium"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.isHost ? '主揪墊付' : '墊付'}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={!name.trim() || !price || parseFloat(price) <= 0}
              aria-label="新增品項"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>新增</span>
            </button>
          </div>
        </form>

        {/* Running Summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Utensils className="w-4 h-4 text-emerald-600" />
            <span>已輸入品項 ({items.length} 項)</span>
          </div>

          {items.length > 1 && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-500">
                餐點累計: <strong className="text-slate-900 font-mono text-sm">{formatCurrency(totalItemAmount)}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Items List */}
        {items.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center space-y-1.5">
            <ReceiptText className="w-6 h-6 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">尚未新增餐點品項</h3>
            <p className="text-xs text-slate-400">在上方輸入餐點與金額開始建立清單</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, idx) => {
              const payer = memberMap.get(item.paidByMemberId);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-600 flex items-center justify-center text-[11px] font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{item.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <span>由 <strong className="text-slate-700 font-medium">{payer?.name || '未知'}</strong> 墊付</span>
                        <span>•</span>
                        <span>{item.splits?.length || 0} 人分攤</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      {formatCurrency(item.price)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      aria-label="刪除品項"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
