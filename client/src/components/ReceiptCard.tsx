import { forwardRef } from 'react';
import {
  Receipt as ReceiptIcon,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  CreditCard,
  Building2,
  FileText,
} from 'lucide-react';
import { Room, SettlementResult } from '../types/models';
import { formatCurrency } from '../utils/formatters';

interface ReceiptCardProps {
  room: Room;
  settlement: SettlementResult;
  className?: string;
}

export const ReceiptCard = forwardRef<HTMLDivElement, ReceiptCardProps>(
  ({ room, settlement, className = '' }, ref) => {
    const currency = room.currency || 'NT$';
    const memberMap = new Map(room.members.map((m) => [m.id, m]));
    const formattedDate = new Date(room.createdAt || Date.now()).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const paymentInfo = room.paymentInfo;
    const hasPaymentDetails = Boolean(
      paymentInfo && (paymentInfo.bankCode || paymentInfo.bankAccount || paymentInfo.note || paymentInfo.customQrUrl)
    );

    return (
      <div
        ref={ref}
        data-testid="receipt-card"
        className={`bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 max-w-lg mx-auto relative overflow-hidden font-sans ${className}`}
        style={{
          backgroundImage: 'radial-gradient(#f1f5f9 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >
        {/* Receipt Top Header */}
        <div className="text-center pb-6 border-b-2 border-dashed border-slate-300 space-y-2 relative">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center border border-emerald-200 shadow-2xs">
            <ReceiptIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              {room.title || '聚餐分帳收據'}
            </h2>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-1">
              <span className="font-mono">單號: {room.code || 'LOCAL'}</span>
              <span>•</span>
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Grand Total Hero Banner */}
        <div className="py-5 border-b-2 border-dashed border-slate-300 text-center space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            總計金額 (Grand Total)
          </span>
          <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-mono">
            {formatCurrency(settlement.grandTotal, currency)}
          </div>
          <div className="flex items-center justify-center gap-3 text-xs text-slate-500 pt-1">
            <span>餐點小計 {formatCurrency(settlement.totalItemAmount, currency)}</span>
            {settlement.totalFeeAmount > 0 && (
              <>
                <span>•</span>
                <span>附加費用 {formatCurrency(settlement.totalFeeAmount, currency)}</span>
              </>
            )}
          </div>
        </div>

        {/* Balance Status Banner */}
        <div className="py-3 border-b-2 border-dashed border-slate-300">
          <div
            className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl text-xs font-bold ${
              settlement.isBalanced
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {settlement.isBalanced ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>收支完全平衡 (帳目已平)</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>
                  帳目試算中 (差額: {formatCurrency(Math.abs(settlement.roundingRemainder || 0), currency)})
                </span>
              </>
            )}
          </div>
        </div>

        {/* Member Summaries Breakdown */}
        <div className="py-5 border-b-2 border-dashed border-slate-300 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
            <span>成員分攤明細</span>
            <span className="text-[11px] text-slate-400 font-normal">共 {room.members.length} 位成員</span>
          </div>

          <div className="space-y-2.5">
            {room.members.map((member) => {
              const summary = settlement.memberSummaries[member.id];
              if (!summary) return null;

              const isCreditor = summary.netBalance > 0.001;
              const isDebtor = summary.netBalance < -0.001;
              const isSettled = !isCreditor && !isDebtor;

              return (
                <div
                  key={member.id}
                  className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-2xs shrink-0"
                        style={{ backgroundColor: member.avatarColor }}
                      >
                        {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        {member.name}
                        {member.isHost && (
                          <span className="ml-1 text-[10px] text-emerald-600 font-semibold">(主揪)</span>
                        )}
                      </span>
                    </div>

                    <div className="text-right">
                      {isCreditor && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          需收款 {formatCurrency(summary.netBalance, currency)}
                        </span>
                      )}
                      {isDebtor && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                          需支付 {formatCurrency(Math.abs(summary.netBalance), currency)}
                        </span>
                      )}
                      {isSettled && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                          已平衡
                        </span>
                      )}
                    </div>
                  </div>

                  {summary.itemBreakdown && summary.itemBreakdown.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {summary.itemBreakdown.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700"
                        >
                          {item.itemName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Debt Simplification Transfers */}
        <div className="py-5 border-b-2 border-dashed border-slate-300 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>最簡轉帳指南</span>
          </div>

          {settlement.transfers.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
              目前已收支平衡，無需任何轉帳！
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
                    className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span className="text-slate-900">{`${fromMember.name}（轉出）`}</span>
                      <span className="inline-flex items-center gap-1 text-indigo-600 font-medium text-[11px]">
                        應轉帳給 <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-slate-900">{`${toMember.name}（轉入）`}</span>
                    </div>
                    <div className="font-black text-indigo-600 font-mono text-sm">
                      {formatCurrency(t.amount, currency)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment Info Section (Bank / QR) */}
        {hasPaymentDetails && paymentInfo && (
          <div className="py-5 border-b-2 border-dashed border-slate-300 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
              <span>收款資訊</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              {(paymentInfo.bankCode || paymentInfo.bankAccount) && (
                <div className="space-y-1">
                  {paymentInfo.bankCode && (
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-800">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        銀行代碼: <strong className="font-bold text-slate-900">{paymentInfo.bankCode}</strong>
                      </span>
                    </div>
                  )}
                  {paymentInfo.bankAccount && (
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-800">
                      <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        銀行帳號: <strong className="font-bold text-slate-900">{paymentInfo.bankAccount}</strong>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {paymentInfo.note && (
                <div className="flex items-start gap-1.5 text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                  <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{paymentInfo.note}</span>
                </div>
              )}

              {paymentInfo.customQrUrl && (
                <div className="pt-2 flex flex-col items-center justify-center">
                  <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <img
                      src={paymentInfo.customQrUrl}
                      alt="收款 QR Code"
                      className="w-36 h-36 object-contain rounded-lg"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">掃描上方 QR Code 直接付款</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Branding */}
        <div className="pt-4 text-center space-y-1">
          <div className="text-[11px] font-bold text-slate-400 tracking-wider">
            SplitMe — 極速聚餐分帳與即時協作
          </div>
          <div className="text-[10px] text-slate-300 font-mono">
            Generated with precision • splitme.app
          </div>
        </div>
      </div>
    );
  }
);

ReceiptCard.displayName = 'ReceiptCard';
