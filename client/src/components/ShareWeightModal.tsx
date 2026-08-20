import React, { useState, useEffect } from 'react';
import { X, Scale, DollarSign, Trash2, Check } from 'lucide-react';
import { Item, Member, SplitShare, SplitType } from '../types/models';
import { MemberAvatar } from './MemberAvatar';
import { formatCurrency } from '../utils/formatters';

interface ShareWeightModalProps {
  isOpen: boolean;
  item: Item | null;
  member: Member | null;
  currentSplit?: SplitShare | null;
  onClose: () => void;
  onSave: (split: SplitShare) => void;
  onRemoveFromSplit: (itemId: string, memberId: string) => void;
}

const PRESET_WEIGHTS = [0.5, 1.0, 1.5, 2.0, 3.0];

export const ShareWeightModal: React.FC<ShareWeightModalProps> = ({
  isOpen,
  item,
  member,
  currentSplit,
  onClose,
  onSave,
  onRemoveFromSplit,
}) => {
  if (!isOpen || !item || !member) return null;

  const [mode, setMode] = useState<SplitType>(
    currentSplit?.splitType || SplitType.EQUAL
  );
  const [weight, setWeight] = useState<number>(
    currentSplit?.splitType === SplitType.WEIGHTED ? (currentSplit.value || 1) : 1
  );
  const [exactAmount, setExactAmount] = useState<string>(
    currentSplit?.splitType === SplitType.EXACT_AMOUNT ? String(currentSplit.value || '') : ''
  );

  useEffect(() => {
    if (currentSplit) {
      setMode(currentSplit.splitType || SplitType.EQUAL);
      if (currentSplit.splitType === SplitType.WEIGHTED) {
        setWeight(currentSplit.value || 1);
      } else if (currentSplit.splitType === SplitType.EXACT_AMOUNT) {
        setExactAmount(String(currentSplit.value || ''));
      }
    } else {
      setMode(SplitType.EQUAL);
      setWeight(1);
      setExactAmount('');
    }
  }, [currentSplit]);

  const handleSave = () => {
    if (mode === SplitType.EXACT_AMOUNT) {
      const numVal = parseFloat(exactAmount);
      onSave({
        memberId: member.id,
        splitType: SplitType.EXACT_AMOUNT,
        value: isNaN(numVal) ? 0 : numVal,
      });
    } else if (mode === SplitType.WEIGHTED) {
      onSave({
        memberId: member.id,
        splitType: SplitType.WEIGHTED,
        value: weight,
      });
    } else {
      onSave({
        memberId: member.id,
        splitType: SplitType.EQUAL,
        value: 1,
      });
    }
    onClose();
  };

  const handleRemove = () => {
    onRemoveFromSplit(item.id, member.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">設定分攤份數與金額</h3>
              <p className="text-[11px] text-slate-500">
                品項：<span className="font-semibold text-slate-700">{item.name}</span> ({formatCurrency(item.price)})
              </p>
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

        {/* Member preview */}
        <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
          <MemberAvatar member={member} size="md" />
          <div className="text-right">
            <span className="text-xs text-slate-500">當前模式</span>
            <p className="text-xs font-bold text-slate-800">
              {mode === SplitType.EXACT_AMOUNT
                ? `指定金額 ${formatCurrency(parseFloat(exactAmount) || 0)}`
                : mode === SplitType.WEIGHTED
                ? `份數倍率 ${weight}x`
                : '一般等額分攤 (1x)'}
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setMode(SplitType.WEIGHTED)}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mode !== SplitType.EXACT_AMOUNT
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>份數倍率 (加權)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode(SplitType.EXACT_AMOUNT)}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mode === SplitType.EXACT_AMOUNT
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>自訂指定金額</span>
          </button>
        </div>

        {/* Mode Content */}
        {mode !== SplitType.EXACT_AMOUNT ? (
          <div className="space-y-3">
            <label className="block text-xs font-medium text-slate-700">
              選擇加權倍率 (例如食量大 2x、只吃半份 0.5x)：
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {PRESET_WEIGHTS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => {
                    setWeight(w);
                    setMode(w === 1.0 ? SplitType.EQUAL : SplitType.WEIGHTED);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                    weight === w
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-105'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {w}x
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-500">自訂倍率：</span>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={weight}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setWeight(isNaN(val) ? 1 : val);
                  setMode(SplitType.WEIGHTED);
                }}
                className="w-20 px-2 py-1 text-xs border border-slate-300 rounded-lg"
              />
              <span className="text-xs text-slate-400">倍</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700">
              輸入固定指定承擔金額 (剩餘金額將由其餘成員平分)：
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
                $
              </div>
              <input
                type="number"
                min="0"
                max={item.price}
                value={exactAmount}
                onChange={(e) => setExactAmount(e.target.value)}
                placeholder="輸入指定分攤金額 (如：250)"
                className="w-full pl-7 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleRemove}
            aria-label="移出分攤"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>移出分攤</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              aria-label="儲存設定"
              className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>儲存設定</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
