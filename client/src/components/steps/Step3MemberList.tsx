import React, { useState } from 'react';
import { UserPlus, Edit2, Trash2, Check, X, Users, Crown } from 'lucide-react';
import { Member } from '../../types/models';
import { MemberAvatar } from '../MemberAvatar';
import { getRandomAvatarColor } from '../../utils/colors';

interface Step3MemberListProps {
  members: Member[];
  activeMemberIds?: string[];
  onAddMember: (name: string, avatarColor?: string) => void;
  onUpdateMember: (id: string, updates: Partial<Member>) => void;
  onRemoveMember: (id: string) => void;
}

export const Step3MemberList: React.FC<Step3MemberListProps> = ({
  members,
  activeMemberIds = [],
  onAddMember,
  onUpdateMember,
  onRemoveMember,
}) => {
  const [nameInput, setNameInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;

    const usedColors = members.map((m) => m.avatarColor);
    const color = getRandomAvatarColor(usedColors);
    onAddMember(trimmed, color);
    setNameInput('');
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
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900">成員名單</h2>
        <p className="text-xs text-slate-500 mt-0.5">輸入聚餐夥伴姓名</p>
      </div>

      {/* Main Member Input & List Container */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5">
        {/* Quick Add Input */}
        <form onSubmit={handleAdd} className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                id="member-name-input"
                aria-label="成員姓名"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="成員姓名"
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-hidden transition-all text-slate-900 font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={!nameInput.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>新增</span>
            </button>
          </div>
        </form>

        {/* Member Badges List */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>已加入成員 ({members.length} 人)</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {members.map((member, index) => {
              const isOnline = activeMemberIds.includes(member.id);
              const showHostBadge = member.isHost && !member.name.includes('主揪');

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all shadow-2xs"
                >
                  {editingId === member.id ? (
                    <div className="flex items-center gap-1 w-full">
                      <input
                        type="text"
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        placeholder="成員姓名"
                        className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(member.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(member.id)}
                        aria-label="儲存"
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        aria-label="取消"
                        className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <MemberAvatar member={member} size="md" showName={false} />
                          {isOnline && (
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {member.name}
                            </span>
                            {showHostBadge && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                <Crown className="w-2.5 h-2.5 text-amber-600" />
                                <span>主揪</span>
                              </span>
                            )}
                            {member.isHost && member.name.includes('主揪') && (
                              <span title="主揪">
                                <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            #{index + 1}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(member)}
                          aria-label="編輯"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => !member.isHost && onRemoveMember(member.id)}
                          disabled={member.isHost}
                          aria-label="刪除"
                          title={member.isHost ? '主揪不可刪除' : '刪除成員'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            member.isHost
                              ? 'text-slate-300 opacity-40 cursor-not-allowed'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-white cursor-pointer'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
