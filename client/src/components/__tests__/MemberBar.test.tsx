import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemberBar } from '../MemberBar';
import { Member } from '../../types/models';

const mockMembers: Member[] = [
  { id: 'm1', name: 'Alice', avatarColor: '#10B981', isHost: true },
  { id: 'm2', name: 'Bob', avatarColor: '#3B82F6', isHost: false },
];

describe('MemberBar Component', () => {
  it('renders list of member avatars with names and host badge', () => {
    render(
      <MemberBar
        members={mockMembers}
        onAddMember={vi.fn()}
        onUpdateMember={vi.fn()}
        onRemoveMember={vi.fn()}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getAllByTitle(/主揪/i).length).toBeGreaterThan(0);
  });

  it('adds a new member with custom name and random color', () => {
    const handleAddMember = vi.fn();
    render(
      <MemberBar
        members={mockMembers}
        onAddMember={handleAddMember}
        onUpdateMember={vi.fn()}
        onRemoveMember={vi.fn()}
      />
    );

    const addBtn = screen.getByRole('button', { name: /新增成員|新增|add/i });
    fireEvent.click(addBtn);

    const input = screen.getByLabelText(/新增成員暱稱/i);
    fireEvent.change(input, { target: { value: 'Charlie' } });

    const submitBtn = screen.getByRole('button', { name: /確認新增|add/i });
    fireEvent.click(submitBtn);

    expect(handleAddMember).toHaveBeenCalledWith('Charlie', expect.any(String));
  });

  it('allows editing an existing member name', () => {
    const handleUpdate = vi.fn();
    render(
      <MemberBar
        members={mockMembers}
        onAddMember={vi.fn()}
        onUpdateMember={handleUpdate}
        onRemoveMember={vi.fn()}
      />
    );

    const editBtn = screen.getAllByRole('button', { name: /編輯|edit/i })[1];
    fireEvent.click(editBtn);

    const input = screen.getByDisplayValue('Bob');
    fireEvent.change(input, { target: { value: 'Bobby' } });

    const saveBtn = screen.getByRole('button', { name: /儲存|save/i });
    fireEvent.click(saveBtn);

    expect(handleUpdate).toHaveBeenCalledWith('m2', { name: 'Bobby' });
  });

  it('allows deleting a non-host member', () => {
    const handleRemove = vi.fn();
    render(
      <MemberBar
        members={mockMembers}
        onAddMember={vi.fn()}
        onUpdateMember={vi.fn()}
        onRemoveMember={handleRemove}
      />
    );

    const deleteBtn = screen.getAllByRole('button', { name: /刪除|delete|remove/i })[1];
    fireEvent.click(deleteBtn);

    expect(handleRemove).toHaveBeenCalledWith('m2');
  });

  it('sets dataTransfer on drag start for member badge', () => {
    render(
      <MemberBar
        members={mockMembers}
        onAddMember={vi.fn()}
        onUpdateMember={vi.fn()}
        onRemoveMember={vi.fn()}
      />
    );

    const memberBadge = screen.getByTestId('member-avatar-m1');
    const setData = vi.fn();

    fireEvent.dragStart(memberBadge, {
      dataTransfer: { setData, effectAllowed: '' },
    });

    expect(setData).toHaveBeenCalledWith('text/plain', 'm1');
  });
});
