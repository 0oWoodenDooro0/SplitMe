import React, { useState } from 'react';
import {
  Calculator,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Receipt,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  Users,
} from 'lucide-react';
import { Member, RoundingMode, SettlementResult } from '../types/models';
import { formatCurrency, formatNumber } from '../utils/formatters';

interface SettlementDashboardProps {
  settlement: SettlementResult;
  members: Member[];
  roundingMode: RoundingMode;
  onRoundingModeChange: (mode: RoundingMode) => void;
  onOpenFeeModal: () => void;
  onOpenExportModal?: () => void;
}

export const SettlementDashboard: React.FC<SettlementDashboardProps> = ({
  settlement,
  members,
  roundingMode,
  onRoundingModeChange,
  onOpenFeeModal,
  onOpenExportModal,
}) => {
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const memberMap = new Map<string, Member>(members.map((m) => [m.id, m]));

  const toggleExpand = (id: string) => {
    setExpandedMemberId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      {/* Header Summary Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">結算總覽儀表板</h2>
              <p className="text-xs text-slate-400">即時多角債務精簡與收支平衡試算</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {onOpenExportModal && (
              <button
                type="button"
                onClick={onOpenExportModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>匯出收據</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenFeeModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-emerald-300 border border-white/15 transition-all shadow-xs"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>附加費與折扣 ({formatCurrency(settlement.totalFeeAmount)})</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <span className="text-xs text-slate-400 font-medium">總支出 (Grand Total)</span>
            <div className="text-2xl font-black text-emerald-400 tracking-tight mt-0.5">
              {formatCurrency(settlement.grandTotal)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              餐點 {formatCurrency(settlement.totalItemAmount)} + 費用 {formatCurrency(settlement.totalFeeAmount)}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <span className="text-xs text-slate-400 font-medium">平衡狀態</span>
            <div className="flex items-center gap-1.5 mt-1.5">
              {settlement.isBalanced ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400">收支完全平衡</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400">差額未平衡</span>
                </>
              )}
            </div>
            {settlement.roundingRemainder !== undefined && Math.abs(settlement.roundingRemainder) > 0.001 && (
              <span className="text-[10px] text-slate-400">
                調差餘數: {settlement.roundingRemainder > 0 ? '+' : ''}
                {formatNumber(settlement.roundingRemainder)}
              </span>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-medium">取整捨入模式</span>
            <div className="mt-1">
              <select
                aria-label="捨入模式"
                value={roundingMode}
                onChange={(e) => onRoundingModeChange(e.target.value as RoundingMode)}
                className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
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

      {/* Debt Simplification Transfers Section */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">最簡轉帳指南</h3>
              <p className="text-[11px] text-slate-400">
                貪婪演算法精簡多角借貸，僅需 {settlement.transfers.length} 筆轉帳即可結清
              </p>
            </div>
          </div>
        </div>

        {settlement.transfers.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
            目前已完全收支平衡，無需任何轉帳！
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
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 border border-slate-200 gap-3"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {/* Debtor */}
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-2xs"
                        style={{ backgroundColor: fromMember.avatarColor }}
                      >
                        {fromMember.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-slate-800">{fromMember.name}</span>
                    </div>

                    <div className="flex items-center gap-1 text-indigo-500 font-medium text-xs px-2">
                      <span>應轉帳給</span>
                      <ArrowRight className="w-4 h-4 animate-pulse" />
                    </div>

                    {/* Creditor */}
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-2xs"
                        style={{ backgroundColor: toMember.avatarColor }}
                      >
                        {toMember.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-slate-800">{toMember.name}</span>
                    </div>
                  </div>

                  {/* Transfer Amount */}
                  <div className="text-right ml-auto sm:ml-0">
                    <span className="text-base font-black text-indigo-600 tracking-tight">
                      {formatCurrency(t.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Member Balances Section */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              各夥伴收支明細表
            </h3>
            <p className="text-[11px] text-slate-400">
              個別分攤與墊付收支狀態
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {members.map((member, idx) => {
            const summary = settlement.memberSummaries[member.id];
            if (!summary) return null;

            const isCreditor = summary.netBalance > 0.01;
            const isDebtor = summary.netBalance < -0.01;
            const isSettled = !isCreditor && !isDebtor;
            const isExpanded = expandedMemberId === member.id;

            return (
              <div
                key={member.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-2xs"
                      style={{ backgroundColor: member.avatarColor }}
                    >
                      {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <span className="text-xs font-semibold text-slate-700">
                      {member.isHost ? '主揪' : `夥伴 #${idx + 1}`}
                    </span>
                  </div>

                  {/* Net status badge */}
                  <div className="text-right">
                    {isCreditor && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        需收款
                      </span>
                    )}
                    {isDebtor && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                        需支付
                      </span>
                    )}
                    {isSettled && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-600">
                        已完全平衡
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
                {(summary.itemBreakdown && summary.itemBreakdown.length > 0) && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => toggleExpand(member.id)}
                      className="w-full flex items-center justify-between text-[11px] text-slate-500 hover:text-slate-800 font-medium py-1 transition-colors"
                    >
                      <span>消費品項明細 ({summary.itemBreakdown.length})</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-1 space-y-1 bg-white p-2 rounded-xl border border-slate-200 text-[11px]">
                        {summary.itemBreakdown.map((ib, bIdx) => (
                          <div key={bIdx} className="flex items-center justify-between text-slate-600">
                            <span className="truncate pr-2">{ib.itemName}</span>
                            <span className="font-medium shrink-0">{formatCurrency(ib.shareAmount)}</span>
                          </div>
                        ))}
                        {summary.feesAndDiscounts !== 0 && (
                          <div className="flex items-center justify-between text-amber-700 pt-1 border-t border-slate-100 font-medium">
                            <span>附加費用 / 折扣攤提</span>
                            <span>{formatCurrency(summary.feesAndDiscounts)}</span>
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
