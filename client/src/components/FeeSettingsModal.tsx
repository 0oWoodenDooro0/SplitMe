import React, { useState } from 'react';
import { X, Trash2, Receipt } from 'lucide-react';
import { ExtraFee, FeeAllocationMethod, FeeType, Member } from '../types/models';

interface FeeSettingsModalProps {
  isOpen: boolean;
  fees: ExtraFee[];
  members: Member[];
  onClose: () => void;
  onAddFee: (fee: Omit<ExtraFee, 'id'>) => void;
  onUpdateFee: (id: string, updates: Partial<ExtraFee>) => void;
  onRemoveFee: (id: string) => void;
}

export const FeeSettingsModal: React.FC<FeeSettingsModalProps> = ({
  isOpen,
  fees,
  members,
  onClose,
  onAddFee,
  onRemoveFee,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [feeType, setFeeType] = useState<FeeType>(FeeType.PERCENTAGE);
  const [valueInput, setValueInput] = useState('10');
  const [allocation, setAllocation] = useState<FeeAllocationMethod>(
    FeeAllocationMethod.PROPORTIONAL_SUBTOTAL
  );
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    members.map((m) => m.id)
  );

  const handleAddPreset10 = () => {
    onAddFee({
      name: '服務費 10%',
      feeType: FeeType.PERCENTAGE,
      rate: 0.1,
      allocationMethod: FeeAllocationMethod.PROPORTIONAL_SUBTOTAL,
    });
  };

  const handleAddPresetCoupon = () => {
    onAddFee({
      name: '滿千折百券',
      feeType: FeeType.FIXED_AMOUNT,
      amount: -100,
      allocationMethod: FeeAllocationMethod.EQUAL_MEMBERS,
    });
  };

  const handleAddCustomFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !valueInput) return;

    const numVal = parseFloat(valueInput);
    if (isNaN(numVal)) return;

    if (feeType === FeeType.PERCENTAGE) {
      onAddFee({
        name: name.trim(),
        feeType: FeeType.PERCENTAGE,
        rate: numVal / 100,
        allocationMethod: allocation,
        targetMemberIds:
          allocation === FeeAllocationMethod.SELECTED_MEMBERS ? selectedMemberIds : undefined,
      });
    } else {
      onAddFee({
        name: name.trim(),
        feeType: FeeType.FIXED_AMOUNT,
        amount: numVal,
        allocationMethod: allocation,
        targetMemberIds:
          allocation === FeeAllocationMethod.SELECTED_MEMBERS ? selectedMemberIds : undefined,
      });
    }

    setName('');
    setValueInput('');
  };

  const toggleMemberSelection = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">附加費用與折扣攤提</h3>
              <p className="text-[11px] text-slate-500">設定服務費、折價券或自訂附加費分攤方式</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Presets (when empty) */}
        {fees.length === 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">常用快捷：</span>
            <button
              type="button"
              onClick={handleAddPreset10}
              className="px-2.5 py-1 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
            >
              + 10% 服務費
            </button>
            <button
              type="button"
              onClick={handleAddPresetCoupon}
              className="px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
            >
              - $100 折價券 (全員平分)
            </button>
          </div>
        )}

        {/* Current Fees List */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            目前已套用項目 ({fees.length})
          </label>
          {fees.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
              尚未加入任何服務費或折扣
            </div>
          ) : (
            <div className="space-y-2">
              {fees.map((fee) => (
                <div
                  key={fee.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{fee.name}</h4>
                    <p className="text-[11px] text-slate-500">
                      {fee.allocationMethod === FeeAllocationMethod.PROPORTIONAL_SUBTOTAL
                        ? '依消費比例攤提'
                        : fee.allocationMethod === FeeAllocationMethod.EQUAL_MEMBERS
                        ? '全員平分'
                        : `指定 ${fee.targetMemberIds?.length || 0} 人平分`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveFee(fee.id)}
                    aria-label="刪除費用"
                    title="刪除費用"
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Custom Fee Form */}
        <form
          onSubmit={handleAddCustomFee}
          className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
        >
          <span className="block text-xs font-bold text-slate-700">新增自訂費用 / 折扣</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="費用/折扣名稱 (如：外送費)"
              className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
            <input
              type="number"
              step="any"
              value={valueInput}
              onChange={(e) => setValueInput(e.target.value)}
              placeholder="數值 (% 或 $)"
              className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Fee Type Radio */}
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-500 font-medium">類型：</span>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="feeType"
                checked={feeType === FeeType.PERCENTAGE}
                onChange={() => setFeeType(FeeType.PERCENTAGE)}
                className="text-amber-600 focus:ring-amber-500"
              />
              <span>百分比 (%)</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="feeType"
                checked={feeType === FeeType.FIXED_AMOUNT}
                onChange={() => setFeeType(FeeType.FIXED_AMOUNT)}
                className="text-amber-600 focus:ring-amber-500"
              />
              <span>固定金額 ($)</span>
            </label>
          </div>

          {/* Allocation Method Radio */}
          <div className="space-y-1.5 text-xs">
            <span className="text-slate-500 font-medium">分攤方式：</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="allocation"
                  checked={allocation === FeeAllocationMethod.PROPORTIONAL_SUBTOTAL}
                  onChange={() => setAllocation(FeeAllocationMethod.PROPORTIONAL_SUBTOTAL)}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <span className="text-[11px]">依消費比例</span>
              </label>
              <label className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="allocation"
                  checked={allocation === FeeAllocationMethod.EQUAL_MEMBERS}
                  onChange={() => setAllocation(FeeAllocationMethod.EQUAL_MEMBERS)}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <span className="text-[11px]">全員平分</span>
              </label>
              <label className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="allocation"
                  checked={allocation === FeeAllocationMethod.SELECTED_MEMBERS}
                  onChange={() => setAllocation(FeeAllocationMethod.SELECTED_MEMBERS)}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <span className="text-[11px]">指定成員平分</span>
              </label>
            </div>
          </div>

          {/* Selected members checkbox picker if SELECTED_MEMBERS */}
          {allocation === FeeAllocationMethod.SELECTED_MEMBERS && (
            <div className="p-2 bg-white rounded-lg border border-slate-200 space-y-1">
              <span className="text-[11px] text-slate-500">選擇分攤成員：</span>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMemberSelection(m.id)}
                    className={`px-2 py-1 rounded-md text-xs font-medium border ${
                      selectedMemberIds.includes(m.id)
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!name.trim() || !valueInput}
            aria-label="新增費用項目"
            className="w-full py-2 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors shadow-xs"
          >
            新增費用項目
          </button>
        </form>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
