import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Share2,
  Image as ImageIcon,
  MessageSquare,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { Room, SettlementResult, PaymentInfo } from '../types/models';
import { ReceiptCard } from './ReceiptCard';
import { PaymentInfoEditor } from './PaymentInfoEditor';
import { formatLineSummary, getLineShareUrl } from '../utils/lineFormatter';

interface ReceiptExportModalProps {
  isOpen: boolean;
  room: Room;
  settlement: SettlementResult;
  onClose: () => void;
  onUpdatePaymentInfo?: (info: PaymentInfo) => void;
}

export const ReceiptExportModal: React.FC<ReceiptExportModalProps> = ({
  isOpen,
  room,
  settlement,
  onClose,
  onUpdatePaymentInfo,
}) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'text'>('visual');
  const [isPaymentEditorOpen, setIsPaymentEditorOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const receiptRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const lineSummaryText = formatLineSummary(room, settlement);

  const handleCopyLine = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(lineSummaryText);
      }
      if (typeof navigator !== 'undefined' && (navigator as any)._clipboard?.writeText) {
        (navigator as any)._clipboard.writeText(lineSummaryText);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy LINE summary:', e);
    }
  };

  const handleDownloadPng = async () => {
    if (!receiptRef.current) return;
    try {
      setIsDownloading(true);
      const dataUrl = await toPng(receiptRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });

      const link = document.createElement('a');
      const filename = `splitme-receipt-${(room.title || 'settlement').replace(/\s+/g, '_')}.png`;
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate receipt image:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    const nav = (typeof navigator !== 'undefined' && navigator) || (typeof window !== 'undefined' && window.navigator);
    if (nav && nav.share) {
      try {
        await nav.share({
          title: `SplitMe 結算收據 - ${room.title || '聚餐分帳'}`,
          text: lineSummaryText,
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback: Open LINE Web Intent
    window.open(getLineShareUrl(lineSummaryText), '_blank');
  };

  const handleSavePaymentInfo = (info: PaymentInfo) => {
    if (onUpdatePaymentInfo) {
      onUpdatePaymentInfo(info);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div
          role="dialog"
          aria-label="結算收據與匯出分享"
          className="relative w-full max-w-xl bg-slate-50 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 bg-white">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">結算收據與匯出分享</h3>
                <p className="text-xs text-slate-500 font-medium">即時收據長圖與 LINE 排版懶人包</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {onUpdatePaymentInfo && (
                <button
                  type="button"
                  onClick={() => setIsPaymentEditorOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>設定收款資訊</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="關閉"
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex border-b border-slate-200 bg-white px-5 sm:px-6 gap-2">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'visual'}
              onClick={() => setActiveTab('visual')}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'visual'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>收據長圖</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'text'}
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'text'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>LINE 文字</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
            {activeTab === 'visual' ? (
              <div className="space-y-4">
                {/* Visual Receipt Preview */}
                <div className="overflow-hidden p-1 rounded-2xl">
                  <ReceiptCard ref={receiptRef} room={room} settlement={settlement} />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <pre className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed shadow-2xs max-h-[50vh] overflow-y-auto select-all">
                    {lineSummaryText}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
            {activeTab === 'visual' ? (
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={isDownloading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-xs transition-all"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? '生成長圖中...' : '下載 PNG 長圖'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCopyLine}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-xs transition-all"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '已複製 LINE 懶人包！' : '複製 LINE 懶人包'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 border border-slate-300 rounded-xl transition-all shadow-2xs"
            >
              <Share2 className="w-4 h-4 text-slate-600" />
              <span>發送至 LINE / 社群分享</span>
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Payment Info Editor */}
      <PaymentInfoEditor
        isOpen={isPaymentEditorOpen}
        paymentInfo={room.paymentInfo}
        onSave={handleSavePaymentInfo}
        onClose={() => setIsPaymentEditorOpen(false)}
      />
    </>
  );
};
