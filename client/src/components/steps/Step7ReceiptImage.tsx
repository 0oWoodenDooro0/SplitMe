import React, { useState, useRef } from 'react';
import {
  Download,
  Copy,
  Check,
  Share2,
  Image as ImageIcon,
  FileText,
  CreditCard,
  RotateCcw,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { Room, SettlementResult, PaymentInfo } from '../../types/models';
import { ReceiptCard } from '../ReceiptCard';
import { PaymentInfoEditor } from '../PaymentInfoEditor';
import { formatLineSummary, getLineShareUrl } from '../../utils/lineFormatter';

interface Step7ReceiptImageProps {
  room: Room;
  settlement: SettlementResult;
  onUpdatePaymentInfo?: (info: PaymentInfo) => void;
  onResetRoom: () => void;
}

export const Step7ReceiptImage: React.FC<Step7ReceiptImageProps> = ({
  room,
  settlement,
  onUpdatePaymentInfo,
  onResetRoom,
}) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'text'>('visual');
  const [isPaymentEditorOpen, setIsPaymentEditorOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const receiptRef = useRef<HTMLDivElement | null>(null);
  const summaryText = formatLineSummary(room, settlement);

  const handleCopyText = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(summaryText);
      }
      if (typeof navigator !== 'undefined' && (navigator as any)._clipboard?.writeText) {
        (navigator as any)._clipboard.writeText(summaryText);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy summary:', e);
    }
  };

  const handleDownloadPng = async () => {
    if (!receiptRef.current) return;
    try {
      setIsDownloading(true);
      const dataUrl = await toPng(receiptRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        fetchRequestInit: {
          mode: 'cors',
          cache: 'no-cache',
        },
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
          text: summaryText,
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback: Copy to clipboard or open web share
    handleCopyText();
    window.open(getLineShareUrl(summaryText), '_blank');
  };

  const handleSavePaymentInfo = (info: PaymentInfo) => {
    if (onUpdatePaymentInfo) {
      onUpdatePaymentInfo(info);
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">收據與匯出分享</h2>
          <p className="text-xs text-slate-500 mt-0.5">下載收據長圖或複製文字明細分享至群組</p>
        </div>

        <div className="flex items-center gap-2">
          {onUpdatePaymentInfo && (
            <button
              type="button"
              onClick={() => setIsPaymentEditorOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
              <span>設定收款資訊</span>
            </button>
          )}

          <button
            type="button"
            onClick={onResetRoom}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>建立新聚餐</span>
          </button>
        </div>
      </div>

      {/* Tabs & Receipt View Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Tab Selection */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-4">
          <div className="flex gap-2">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'visual'}
              onClick={() => setActiveTab('visual')}
              className={`flex items-center gap-1.5 py-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
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
              className={`flex items-center gap-1.5 py-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'text'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>文字明細</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>分享結算</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5">
          {activeTab === 'visual' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center p-2 bg-slate-100/60 rounded-xl border border-slate-200">
                <div className="max-w-md w-full">
                  <ReceiptCard ref={receiptRef} room={room} settlement={settlement} />
                </div>
              </div>

              {/* Action Buttons Bar */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={isDownloading}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isDownloading ? '生成中...' : '下載 PNG 長圖'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyText}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 border border-slate-300 rounded-xl shadow-2xs transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? '已複製明細！' : '複製文字明細'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <pre className="w-full p-4 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed shadow-inner max-h-[50vh] overflow-y-auto select-all">
                  {summaryText}
                </pre>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyText}
                  aria-live="polite"
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? '已複製明細！' : '複製文字明細'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 border border-slate-300 rounded-xl shadow-2xs transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-slate-600" />
                  <span>社群分享</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Info Editor Modal */}
      <PaymentInfoEditor
        isOpen={isPaymentEditorOpen}
        paymentInfo={room.paymentInfo}
        onSave={handleSavePaymentInfo}
        onClose={() => setIsPaymentEditorOpen(false)}
      />
    </div>
  );
};
