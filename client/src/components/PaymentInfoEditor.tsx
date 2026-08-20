import React, { useState, useEffect } from 'react';
import { CreditCard, Upload, Trash2, X, Check, Building2, FileText, Image as ImageIcon } from 'lucide-react';
import { PaymentInfo } from '../types/models';

interface PaymentInfoEditorProps {
  isOpen: boolean;
  paymentInfo?: PaymentInfo;
  onSave: (info: PaymentInfo) => void;
  onClose: () => void;
}

const COMMON_BANKS = [
  { code: '822', name: '822 中國信託' },
  { code: '013', name: '013 國泰世華' },
  { code: '012', name: '012 台北富邦' },
  { code: '808', name: '808 玉山銀行' },
  { code: '700', name: '700 中華郵政' },
  { code: '004', name: '004 臺灣銀行' },
  { code: '812', name: '812 台新銀行' },
  { code: '007', name: '007 第一銀行' },
  { code: '008', name: '008 華南銀行' },
  { code: '017', name: '017 兆豐銀行' },
  { code: '824', name: '824 LINE Bank' },
];

export const PaymentInfoEditor: React.FC<PaymentInfoEditorProps> = ({
  isOpen,
  paymentInfo,
  onSave,
  onClose,
}) => {
  const [bankCode, setBankCode] = useState(paymentInfo?.bankCode || '');
  const [bankAccount, setBankAccount] = useState(paymentInfo?.bankAccount || '');
  const [note, setNote] = useState(paymentInfo?.note || '');
  const [customQrUrl, setCustomQrUrl] = useState<string | undefined>(paymentInfo?.customQrUrl);

  useEffect(() => {
    if (isOpen) {
      setBankCode(paymentInfo?.bankCode || '');
      setBankAccount(paymentInfo?.bankAccount || '');
      setNote(paymentInfo?.note || '');
      setCustomQrUrl(paymentInfo?.customQrUrl);
    }
  }, [isOpen, paymentInfo]);

  if (!isOpen) return null;

  const handleBankSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected) {
      setBankCode(selected);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      let reader: any;
      try {
        reader = new FileReader();
      } catch {
        reader = (FileReader as any)();
      }
      if (reader) {
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setCustomQrUrl(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleRemoveQr = () => {
    setCustomQrUrl(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...paymentInfo,
      bankCode: bankCode.trim() || undefined,
      bankAccount: bankAccount.trim() || undefined,
      note: note.trim() || undefined,
      customQrUrl: customQrUrl || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-label="設定收款資訊"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">設定收款資訊</h3>
              <p className="text-xs text-slate-500">提供主揪銀行帳號或 LINE Pay / 街口 QR Code</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Quick Bank Preset */}
          <div className="space-y-1.5">
            <label htmlFor="quick-bank-select" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>常用銀行快速選擇</span>
            </label>
            <select
              id="quick-bank-select"
              aria-label="常用銀行"
              onChange={handleBankSelect}
              defaultValue=""
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-800"
            >
              <option value="">-- 選擇常用銀行代碼 --</option>
              {COMMON_BANKS.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Bank Code & Account */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-1 space-y-1.5">
              <label htmlFor="bank-code-input" className="text-xs font-semibold text-slate-700">
                銀行代碼
              </label>
              <input
                id="bank-code-input"
                type="text"
                maxLength={5}
                placeholder="如 822"
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono text-slate-900"
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <label htmlFor="bank-account-input" className="text-xs font-semibold text-slate-700">
                銀行帳號
              </label>
              <input
                id="bank-account-input"
                type="text"
                placeholder="請輸入銀行帳號"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono text-slate-900"
              />
            </div>
          </div>

          {/* Transfer Note */}
          <div className="space-y-1.5">
            <label htmlFor="payment-note-input" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>轉帳備註事項</span>
            </label>
            <input
              id="payment-note-input"
              type="text"
              placeholder="轉帳備註，例如：轉帳後請告知後五碼"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
            />
          </div>

          {/* QR Code Upload & Preview */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label htmlFor="qr-file-upload" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>上傳收款 QR Code（LINE Pay / 街口 / 自訂）</span>
            </label>

            {customQrUrl ? (
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <img
                  src={customQrUrl}
                  alt="收款 QR Code 預覽"
                  className="w-20 h-20 object-contain rounded-lg border border-slate-200 bg-white"
                />
                <div className="flex-1 space-y-1.5">
                  <span className="text-xs font-medium text-emerald-700 block">已成功上傳收款 QR Code</span>
                  <button
                    type="button"
                    onClick={handleRemoveQr}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>移除 QR Code</span>
                  </button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="qr-file-upload"
                className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/20 rounded-2xl cursor-pointer transition-colors"
              >
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-semibold text-slate-600">點選上傳收款 QR Code 圖片</span>
                <span className="text-[10px] text-slate-400">支援 PNG, JPG, WebP 圖片格式</span>
                <input
                  id="qr-file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-xs transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>儲存收款設定</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
