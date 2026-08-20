import React from 'react';
import { Crown, GripVertical } from 'lucide-react';
import { Member } from '../types/models';

interface MemberAvatarProps {
  member: Member;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  isDraggable?: boolean;
  isSelected?: boolean;
  subText?: string;
  onClick?: () => void;
  className?: string;
}

export const MemberAvatar: React.FC<MemberAvatarProps> = ({
  member,
  size = 'md',
  showName = true,
  isDraggable = false,
  isSelected = false,
  subText,
  onClick,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base font-semibold',
  };

  const initial = member.name ? member.name.trim().charAt(0).toUpperCase() : '?';

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', member.id);
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  return (
    <div
      data-testid={`member-avatar-${member.id}`}
      draggable={isDraggable}
      onDragStart={isDraggable ? handleDragStart : undefined}
      onClick={onClick}
      className={`relative inline-flex items-center gap-1.5 transition-all select-none ${
        isDraggable ? 'cursor-grab active:cursor-grabbing hover:scale-105' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div
        className={`relative flex items-center justify-center rounded-full text-white font-medium shadow-sm transition-transform ${
          sizeClasses[size]
        } ${isSelected ? 'ring-2 ring-offset-2 ring-emerald-500 scale-105' : ''}`}
        style={{ backgroundColor: member.avatarColor || '#64748B' }}
      >
        <span>{initial}</span>

        {member.isHost && (
          <span
            title="主揪 (Host)"
            className="absolute -top-1 -right-1 bg-amber-400 text-amber-950 p-0.5 rounded-full shadow-xs border border-white"
          >
            <Crown className="w-2.5 h-2.5" />
          </span>
        )}
      </div>

      {showName && (
        <div className="flex flex-col text-left">
          <span className="text-xs font-medium text-slate-800 leading-tight flex items-center gap-1">
            {member.name}
            {isDraggable && <GripVertical className="w-2.5 h-2.5 text-slate-400 opacity-40" />}
          </span>
          {subText && <span className="text-[10px] text-slate-500 leading-tight">{subText}</span>}
        </div>
      )}
    </div>
  );
};
