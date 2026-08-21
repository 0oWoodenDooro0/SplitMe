import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, QrCode, Sparkles } from 'lucide-react';
import { Room } from '../types/models';


interface ShareModalProps {
  isOpen: boolean;
  room: Room;
  onClose: () => void;
  onSwitchToFriendView?: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  room,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : 'http://localhost:5173';
  const shareCode = room.code || room.id;
  const shareUrl = `${baseUrl}?room=${encodeURIComponent(shareCode)}&view=friend`;

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        shareUrl,
        {
          width: 180,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('Error rendering QR code:', error);
        }
      );
    }
  }, [isOpen, shareUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      console.error('Failed to copy share url:', e);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(shareCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch (e) {
      console.error('Failed to copy room code:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">邀請朋友協作勾選</h3>
              <p className="text-xs text-slate-500">{room.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="取消彈窗"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* QR Code Card */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="bg-white p-2.5 rounded-xl shadow-xs border border-slate-200">
              <canvas ref={canvasRef} data-testid="qr-code-canvas" className="w-40 h-40" />
            </div>
            <p className="mt-3 text-xs text-slate-500 flex items-center gap-1.5 text-center font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>使用手機相機掃描 QR Code，免註冊直接點選餐點</span>
            </p>
          </div>

          {/* Short Code Block */}
          <div className="flex items-center justify-between p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
            <div>
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
                短碼代號
              </span>
              <span className="text-2xl font-black text-emerald-950 font-mono tracking-widest">
                {shareCode}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              aria-label="複製代碼"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 bg-white hover:bg-emerald-100/80 border border-emerald-300 rounded-xl transition-all shadow-xs active:scale-95"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? '已複製代碼！' : '複製代碼'}</span>
            </button>
          </div>

          {/* Share URL Block */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">分享連結</label>
            <div className="flex items-center gap-2">

              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 text-xs text-slate-600 bg-slate-100 border border-slate-200 rounded-xl select-all focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                aria-label="複製連結"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? '已複製！' : '複製連結'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};

