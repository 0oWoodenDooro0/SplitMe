import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step3MemberList } from '../Step3MemberList';
import { Member } from '../../../types/models';

describe('Step3MemberList Component', () => {
  const mockMembers: Member[] = [
    { id: 'm-1', name: '主揪小王', avatarColor: '#10B981', isHost: true },
    { id: 'm-2', name: '小明', avatarColor: '#3B82F6', isHost: false },
  ];

  it('renders member list with host badge', () => {
    render(
      <Step3MemberList
        members={mockMembers}
        onAddMember={vi.fn()}
        onUpdateMember={vi.fn()}
        onRemoveMember={vi.fn()}
      />
    );

    expect(screen.getByText('主揪小王')).toBeInTheDocument();
    expect(screen.getByText('小明')).toBeInTheDocument();
    expect(screen.getByText(/主揪/i)).toBeInTheDocument();
  });

  it('adds a new member when typing name and pressing Enter or clicking Add button', async () => {
    const user = userEvent.setup();
    const handleAddMember = vi.fn();

    render(
      <Step3MemberList
        members={mockMembers}
        onAddMember={handleAddMember}
        onUpdateMember={vi.fn()}
        onRemoveMember={vi.fn()}
      />
    );

    const input = screen.getByLabelText(/成員姓名/i);
    await user.type(input, '小華{enter}');

    expect(handleAddMember).toHaveBeenCalledWith('小華', expect.any(String));
  });

  it('allows editing member name', async () => {
    const user = userEvent.setup();
    const handleUpdateMember = vi.fn();

    render(
      <Step3MemberList
        members={mockMembers}
        onAddMember={vi.fn()}
        onUpdateMember={handleUpdateMember}
        onRemoveMember={vi.fn()}
      />
    );

    const editBtns = screen.getAllByRole('button', { name: /編輯/i });
    await user.click(editBtns[0]);

    const editInput = screen.getByDisplayValue('主揪小王');
    await user.clear(editInput);
    await user.type(editInput, '主揪老王{enter}');

    expect(handleUpdateMember).toHaveBeenCalledWith('m-1', { name: '主揪老王' });
  });

  it('prevents deleting the host but allows deleting other members', async () => {
    const user = userEvent.setup();
    const handleRemoveMember = vi.fn();

    render(
      <Step3MemberList
        members={mockMembers}
        onAddMember={vi.fn()}
        onUpdateMember={vi.fn()}
        onRemoveMember={handleRemoveMember}
      />
    );

    const deleteBtns = screen.getAllByRole('button', { name: /刪除/i });
    // Host delete button should be disabled
    expect(deleteBtns[0]).toBeDisabled();

    // Member 2 delete button should be enabled
    await user.click(deleteBtns[1]);
    expect(handleRemoveMember).toHaveBeenCalledWith('m-2');
  });
});
