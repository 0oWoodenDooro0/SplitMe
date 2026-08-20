import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Receipt,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Users,
  Info,
} from 'lucide-react';
import { Member, RoundingMode, SettlementResult } from '../../types/models';
import { formatCurrency, formatNumber } from '../../utils/formatters';

interface Step6SettlementCalcProps {
  settlement: SettlementResult;
  members: Member[];
  roundingMode: RoundingMode;
  onRoundingModeChange: (mode: RoundingMode) => void;
  onOpenFeeModal: () => void;
}

export const Step6SettlementCalc: React.FC<Step6SettlementCalcProps> = ({
  settlement,
  members,
  roundingMode,
  onRoundingModeChange,
  onOpenFeeModal,
}) => {
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const memberMap = new Map<string, Member>(members.map((m) => [m.id, m]));

  const toggleExpand = (id: string) => {
    setExpandedMemberId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header & Metrics Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">結算試算</h2>
            <p className="text-xs text-slate-500 mt-0.5">計算每位成員應付與最少轉帳筆數</p>
          </div>

          <button
            type="button"
            onClick={onOpenFeeModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 transition-all shadow-xs shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-indigo-600" />
            <span>附加費與折扣 ({formatCurrency(settlement.totalFeeAmount)})</span>
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-xs text-slate-500 font-medium">總支出</span>
            <div className="text-xl font-bold text-slate-900 mt-0.5 font-mono">
              {formatCurrency(settlement.grandTotal)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              餐點 {formatCurrency(settlement.totalItemAmount)} + 費用 {formatCurrency(settlement.totalFeeAmount)}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-xs text-slate-500 font-medium">平衡狀態</span>
            <div className="flex items-center gap-1.5 mt-1">
              {settlement.isBalanced ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-600">收支完全平衡</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-amber-600">差額未平衡</span>
                </>
              )}
            </div>
            {settlement.roundingRemainder !== undefined && Math.abs(settlement.roundingRemainder) > 0.001 && (
              <span className="text-[10px] text-slate-400">
                調差: {settlement.roundingRemainder > 0 ? '+' : ''}
                {formatNumber(settlement.roundingRemainder)}
              </span>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-xs text-slate-500 font-medium">捨入模式</span>
            <div className="mt-1">
              <select
                aria-label="捨入模式"
                value={roundingMode}
                onChange={(e) => onRoundingModeChange(e.target.value as RoundingMode)}
                className="w-full bg-white border border-slate-300 text-xs text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value={RoundingMode.NEAREST_INTEGER}>四捨五入 (台幣整數)</option>
                <option value={RoundingMode.ROUND_UP}>無條件進位 (ROUND_UP)</option>
                <option value={RoundingMode.ROUND_DOWN}>無條件捨去 (ROUND_DOWN)</option>
                <option value={RoundingMode.DECIMAL_2}>小數點後兩位 (DECIMAL_2)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Simplified Transfers Guide */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">最簡轉帳指南</h3>
          <span className="text-xs text-slate-400">({settlement.transfers.length} 筆轉帳結清)</span>
        </div>

        {settlement.transfers.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
            收支已完全平衡，無需任何轉帳。
          </div>
        ) : (
          <div className="space-y-2">
            {settlement.transfers.map((t, idx) => {
              const fromMember = memberMap.get(t.fromMemberId);
              const toMember = memberMap.get(t.toMemberId);
              if (!fromMember || !toMember) return null;

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 gap-3"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                        style={{ backgroundColor: fromMember.avatarColor }}
                      >
                        {fromMember.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-slate-800">{fromMember.name}</span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400 text-xs px-1 shrink-0">
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                        style={{ backgroundColor: toMember.avatarColor }}
                      >
                        {toMember.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-slate-800">{toMember.name}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-indigo-600 font-mono">
                      {formatCurrency(t.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Member Balances Breakdown Grid */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">各夥伴收支明細</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {members.map((member) => {
            const summary = settlement.memberSummaries[member.id];
            if (!summary) return null;

            const isCreditor = summary.netBalance > 0.01;
            const isDebtor = summary.netBalance < -0.01;
            const isSettled = !isCreditor && !isDebtor;
            const isExpanded = expandedMemberId === member.id;

            return (
              <div
                key={member.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: member.avatarColor }}
                    >
                      {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {member.name} {member.isHost ? '(主揪)' : ''}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        應付: {formatCurrency(summary.totalToPay)}
                      </div>
                    </div>
                  </div>

                  {/* Net status badge */}
                  <div className="text-right">
                    {isCreditor && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        需收款 {formatCurrency(Math.abs(summary.netBalance))}
                      </span>
                    )}
                    {isDebtor && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                        需支付 {formatCurrency(Math.abs(summary.netBalance))}
                      </span>
                    )}
                    {isSettled && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-600">
                        已結清 $0
                      </span>
                    )}
                  </div>
                </div>

                {/* Adjustment note if any */}
                {summary.adjustmentNote && (
                  <div className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded-lg border border-amber-100 flex items-center gap-1">
                    <Info className="w-3 h-3 shrink-0" />
                    <span>{summary.adjustmentNote}</span>
                  </div>
                )}

                {/* Expand breakdown toggle */}
                {summary.itemBreakdown && summary.itemBreakdown.length > 0 && (
                  <div className="pt-1 border-t border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => toggleExpand(member.id)}
                      className="w-full flex items-center justify-between text-[11px] text-slate-500 hover:text-slate-800 font-medium py-0.5 transition-colors cursor-pointer"
                    >
                      <span>明細 ({summary.itemBreakdown.length})</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-1 space-y-1 bg-white p-2 rounded-lg border border-slate-200 text-[11px]">
                        {summary.itemBreakdown.map((ib, bIdx) => (
                          <div key={bIdx} className="flex items-center justify-between text-slate-600">
                            <span className="truncate pr-2">{ib.itemName}</span>
                            <span className="font-mono font-medium shrink-0">{formatCurrency(ib.shareAmount)}</span>
                          </div>
                        ))}
                        {summary.feesAndDiscounts !== 0 && (
                          <div className="flex items-center justify-between text-amber-700 pt-1 border-t border-slate-100 font-medium">
                            <span>附加費用 / 折扣</span>
                            <span className="font-mono">{formatCurrency(summary.feesAndDiscounts)}</span>
                          </div>
                        )}
                        {summary.totalPaid > 0 && (
                          <div className="flex items-center justify-between text-emerald-700 pt-1 border-t border-slate-100 font-medium">
                            <span>已墊付</span>
                            <span className="font-mono">{formatCurrency(summary.totalPaid)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
