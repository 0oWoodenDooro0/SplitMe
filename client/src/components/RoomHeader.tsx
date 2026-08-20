import React, { useState } from 'react';
import { Sparkles, RotateCcw, Edit3, Check, X } from 'lucide-react';
import { Room } from '../types/models';

interface RoomHeaderProps {
  room: Room;
  onUpdateTitle: (title: string) => void;
  onLoadSampleData: () => void;
  onResetRoom: () => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  room,
  onUpdateTitle,
  onLoadSampleData,
  onResetRoom,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(room.title);

  const handleSaveTitle = () => {
    if (titleInput.trim()) {
      onUpdateTitle(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Title & Status */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                autoFocus
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                className="px-3 py-1 text-base font-bold text-slate-900 border border-emerald-400 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
              />
              <button
                type="button"
                onClick={handleSaveTitle}
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsEditingTitle(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingTitle(true)}>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{room.title}</h2>
              <button
                type="button"
                className="p-1 text-slate-400 group-hover:text-emerald-600 rounded-lg group-hover:bg-slate-100 transition-colors"
                title="修改聚餐主題"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            代碼: {room.code || 'LOCAL'}
          </span>
        </div>

        <p className="text-xs text-slate-500">
          共 {room.members.length} 位參與者 • {room.items.length} 筆消費項目 • {room.currency || 'NT$'} 幣別
        </p>
      </div>

      {/* Preset & Reset Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onLoadSampleData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl shadow-xs transition-all active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>載入示範帳單</span>
        </button>

        <button
          type="button"
          onClick={onResetRoom}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>清空聚餐</span>
        </button>
      </div>
    </div>
  );
};
