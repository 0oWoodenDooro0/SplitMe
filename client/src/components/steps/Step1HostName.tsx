import React, { useState, useEffect } from 'react';
import { Sparkles, RotateCcw, User, UtensilsCrossed, Hash, DollarSign } from 'lucide-react';
import { Room } from '../../types/models';

interface Step1HostNameProps {
  room: Room;
  onUpdateTitle: (title: string) => void;
  onUpdateHostName?: (name: string) => void;
  onLoadSampleData: () => void;
  onResetRoom: () => void;
}

export const Step1HostName: React.FC<Step1HostNameProps> = ({
  room,
  onUpdateTitle,
  onUpdateHostName,
  onLoadSampleData,
  onResetRoom,
}) => {
  const hostMember = room.members.find((m) => m.isHost) || room.members[0];

  const [titleInput, setTitleInput] = useState(room.title || '聚餐分帳');
  const [hostInput, setHostInput] = useState(hostMember?.name || '主揪');

  useEffect(() => {
    setTitleInput(room.title);
  }, [room.title]);

  useEffect(() => {
    if (hostMember?.name) {
      setHostInput(hostMember.name);
    }
  }, [hostMember?.name]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitleInput(val);
    if (val.trim()) {
      onUpdateTitle(val.trim());
    }
  };

  const handleHostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHostInput(val);
    if (val.trim() && onUpdateHostName) {
      onUpdateHostName(val.trim());
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Top Action & Title Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">主揪與聚餐名稱</h2>
          <p className="text-xs text-slate-500 mt-0.5">設定活動主題與主揪暱稱</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLoadSampleData}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>載入示範</span>
          </button>
          <button
            type="button"
            onClick={onResetRoom}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>清空重設</span>
          </button>
        </div>
      </div>

      {/* Input Form Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title Input */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <UtensilsCrossed className="w-4 h-4" />
            </span>
            <input
              id="activity-title"
              aria-label="聚餐名稱"
              type="text"
              value={titleInput}
              onChange={handleTitleChange}
              placeholder="聚餐名稱"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-hidden transition-all text-slate-900 font-medium"
            />
          </div>

          {/* Host Name Input */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </span>
            <input
              id="host-name"
              aria-label="主揪姓名"
              type="text"
              value={hostInput}
              onChange={handleHostChange}
              placeholder="主揪姓名"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-hidden transition-all text-slate-900 font-medium"
            />
          </div>
        </div>

        {/* Quick Room Snapshot Grid */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
            <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
              <Hash className="w-3.5 h-3.5" />
              <span>房間代碼</span>
            </div>
            <div className="text-sm font-bold text-slate-800 mt-0.5 font-mono">
              {room.code || 'LOCAL'}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
            <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
              <DollarSign className="w-3.5 h-3.5" />
              <span>幣別</span>
            </div>
            <div className="text-sm font-bold text-slate-800 mt-0.5">
              {room.currency || 'NT$'}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
            <div className="text-slate-400 text-xs font-medium">成員數</div>
            <div className="text-sm font-bold text-emerald-700 mt-0.5">
              {room.members.length} 人
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
            <div className="text-slate-400 text-xs font-medium">餐點數</div>
            <div className="text-sm font-bold text-teal-700 mt-0.5">
              {room.items.length} 項
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
