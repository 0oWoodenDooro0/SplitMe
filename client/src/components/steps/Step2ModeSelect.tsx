import React from 'react';
import { Users, Zap, CheckCircle2 } from 'lucide-react';

interface Step2ModeSelectProps {
  selectedMode: 'live' | 'offline';
  onSelectMode: (mode: 'live' | 'offline') => void;
  roomCode?: string;
  serverStatus?: 'checking' | 'connected' | 'offline';
}

export const Step2ModeSelect: React.FC<Step2ModeSelectProps> = ({
  selectedMode,
  onSelectMode,
  roomCode = 'LOCAL',
}) => {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900">選擇分帳模式</h2>
        <p className="text-xs text-slate-500 mt-0.5">選擇適合現場聚餐的分帳方式</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Real-time Live Mode Card */}
        <div
          data-testid="mode-card-live"
          onClick={() => onSelectMode('live')}
          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
            selectedMode === 'live'
              ? 'bg-emerald-50/50 border-emerald-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              {selectedMode === 'live' && (
                <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>已選擇</span>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">即時連線模式</h3>
              <p className="text-xs text-slate-500 mt-1">
                朋友各自掃描 QR Code 進入房間，自選點餐並即時同步。
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <div>
              代碼: <span className="font-mono font-bold text-slate-700">{roomCode}</span>
            </div>
          </div>
        </div>



        {/* Standalone Fast Mode Card */}
        <div
          data-testid="mode-card-offline"
          onClick={() => onSelectMode('offline')}
          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
            selectedMode === 'offline'
              ? 'bg-emerald-50/50 border-emerald-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              {selectedMode === 'offline' && (
                <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>已選擇</span>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">主揪速算模式</h3>
              <p className="text-xs text-slate-500 mt-1">
                主揪一人照收據快速輸入與計算，無需朋友連線。
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs text-slate-400">
            本機速算
          </div>
        </div>
      </div>
    </div>
  );
};
