import React, { useState } from 'react';
import { Plus, Utensils, ReceiptText } from 'lucide-react';
import { Item, Member } from '../types/models';
import { ItemCard } from './ItemCard';

interface ItemListProps {
  items: Item[];
  members: Member[];
  onAddItem: (name: string, price: number, paidByMemberId: string, splitMemberIds?: string[]) => void;
  onUpdateItem: (id: string, updates: Partial<Item>) => void;
  onRemoveItem: (id: string) => void;
  onToggleSplit: (itemId: string, memberId: string) => void;
  onSetAllSplit: (itemId: string) => void;
  onClearSplit: (itemId: string) => void;
  onOpenWeightModal: (itemId: string, memberId: string) => void;
}

export const ItemList: React.FC<ItemListProps> = ({
  items,
  members,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onToggleSplit,
  onSetAllSplit,
  onClearSplit,
  onOpenWeightModal,
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [payerId, setPayerId] = useState<string>(members[0]?.id || '');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseFloat(price);
    if (!name.trim() || isNaN(numPrice) || numPrice <= 0) return;

    const chosenPayer = payerId || (members[0]?.id ?? '');
    const allMemberIds = members.map((m) => m.id);

    onAddItem(name.trim(), numPrice, chosenPayer, allMemberIds);
    setName('');
    setPrice('');
  };

  return (
    <div className="space-y-4">
      {/* Header & Quick Add Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <span>餐點清單</span>
                <span className="text-xs font-normal text-slate-400">({items.length} 項)</span>
              </h2>
              <p className="text-[11px] text-slate-400">新增餐點並點選頭像指派分攤對象</p>
            </div>
          </div>
        </div>

        {/* Add item input form */}
        <form
          onSubmit={handleAddItem}
          className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="餐點品項名稱 (如：松阪豬肉盤)"
            className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />

          <div className="flex items-center gap-2">
            <div className="relative w-28">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs text-slate-400">$</span>
              <input
                type="number"
                min="0"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="金額 (如：380)"
                className="w-full pl-6 pr-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <select
              value={payerId || (members[0]?.id ?? '')}
              onChange={(e) => setPayerId(e.target.value)}
              className="px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-700 cursor-pointer"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={!name.trim() || !price || parseFloat(price) <= 0}
              aria-label="新增品項"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shrink-0 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新增品項</span>
            </button>
          </div>
        </form>
      </div>

      {/* Items list */}
      {items.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <ReceiptText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700">尚未新增任何餐點品項</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            在上方輸入餐點名稱與金額，即可開始拖拉或點選頭像進行分帳。
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              members={members}
              onUpdateItem={onUpdateItem}
              onRemoveItem={onRemoveItem}
              onToggleSplit={onToggleSplit}
              onSetAllSplit={onSetAllSplit}
              onClearSplit={onClearSplit}
              onOpenWeightModal={onOpenWeightModal}
            />
          ))}
        </div>
      )}
    </div>
  );
};
