import React, { useState } from 'react';
import { UserPlus, Edit2, Trash2, Check, X, Users } from 'lucide-react';
import { Member } from '../types/models';
import { MemberAvatar } from './MemberAvatar';
import { AVATAR_PALETTE, getRandomAvatarColor } from '../utils/colors';

interface MemberBarProps {
  members: Member[];
  onAddMember: (name: string, avatarColor?: string) => void;
  onUpdateMember: (id: string, updates: Partial<Member>) => void;
  onRemoveMember: (id: string) => void;
}

export const MemberBar: React.FC<MemberBarProps> = ({
  members,
  onAddMember,
  onUpdateMember,
  onRemoveMember,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVATAR_PALETTE[0]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleStartAdd = () => {
    const usedColors = members.map((m) => m.avatarColor);
    setSelectedColor(getRandomAvatarColor(usedColors));
    setNewName('');
    setIsAdding(true);
  };

  const handleConfirmAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddMember(newName.trim(), selectedColor);
    setNewName('');
    setIsAdding(false);
  };

  const handleStartEdit = (m: Member) => {
    setEditingId(m.id);
    setEditingName(m.name);
  };

  const handleSaveEdit = (id: string) => {
    if (editingName.trim()) {
      onUpdateMember(id, { name: editingName.trim() });
    }
    setEditingId(null);
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>成員名單</span>
              <span className="text-xs font-normal text-slate-400">({members.length} 人)</span>
            </h2>
            <p className="text-[11px] text-slate-400">💡 提示：可直接拖曳頭像至下方餐點快速分攤</p>
          </div>
        </div>

        {!isAdding && (
          <button
            type="button"
            onClick={handleStartAdd}
            aria-label="新增成員"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-95 transition-all border border-emerald-200"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>新增</span>
          </button>
        )}
      </div>

      {/* Add Member Form */}
      {isAdding && (
        <form
          onSubmit={handleConfirmAdd}
          className="mb-4 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 animate-fadeIn"
        >
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs"
              style={{ backgroundColor: selectedColor }}
            >
              {newName ? newName.charAt(0).toUpperCase() : '?'}
            </div>
            <input
              type="text"
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="輸入成員暱稱 (如：Alice)"
              className="flex-1 sm:w-44 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Color swatches */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {AVATAR_PALETTE.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`w-5 h-5 rounded-full transition-transform ${
                  selectedColor === color ? 'ring-2 ring-offset-1 ring-slate-700 scale-110' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="submit"
              aria-label="確認新增"
              disabled={!newName.trim()}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>確認新增</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              aria-label="取消"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Member Avatar Badges List */}
      <div className="flex flex-wrap items-center gap-2.5">
        {members.map((member) => (
          <div
            key={member.id}
            className="group relative inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-200 transition-all shadow-2xs"
          >
            {editingId === member.id ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="w-24 px-2 py-0.5 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(member.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleSaveEdit(member.id)}
                  aria-label="儲存"
                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  aria-label="取消"
                  className="p-1 text-slate-400 hover:bg-slate-200 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <MemberAvatar member={member} size="sm" isDraggable={true} />

                <div className="flex items-center space-x-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(member)}
                    aria-label="編輯"
                    title="編輯暱稱"
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-white"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => !member.isHost && onRemoveMember(member.id)}
                    disabled={member.isHost}
                    aria-label="刪除"
                    title={member.isHost ? '主揪不可刪除' : '刪除成員'}
                    className={`p-1 rounded-full hover:bg-white ${
                      member.isHost ? 'text-slate-300 opacity-30 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600'
                    }`}
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
