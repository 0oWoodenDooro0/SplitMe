import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShareWeightModal } from '../ShareWeightModal';
import { Item, Member, SplitType } from '../../types/models';

const mockMember: Member = {
  id: 'm1',
  name: 'Alice',
  avatarColor: '#10B981',
  isHost: true,
};

const mockItem: Item = {
  id: 'item-1',
  name: '麻辣鍋底',
  price: 600,
  paidByMemberId: 'm1',
  splits: [{ memberId: 'm1', splitType: SplitType.EQUAL, value: 1 }],
};

describe('ShareWeightModal Component', () => {
  it('renders modal with item and member details', () => {
    render(
      <ShareWeightModal
        isOpen={true}
        item={mockItem}
        member={mockMember}
        currentSplit={{ memberId: 'm1', splitType: SplitType.EQUAL, value: 1 }}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onRemoveFromSplit={vi.fn()}
      />
    );

    expect(screen.getByText(/設定分攤份數與金額/i)).toBeInTheDocument();
    expect(screen.getByText('麻辣鍋底')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('allows switching to weighted multiplier mode and selecting 2x preset', () => {
    const handleSave = vi.fn();
    render(
      <ShareWeightModal
        isOpen={true}
        item={mockItem}
        member={mockMember}
        currentSplit={{ memberId: 'm1', splitType: SplitType.EQUAL, value: 1 }}
        onClose={vi.fn()}
        onSave={handleSave}
        onRemoveFromSplit={vi.fn()}
      />
    );

    const btn2x = screen.getByRole('button', { name: '2x' });
    fireEvent.click(btn2x);

    const saveBtn = screen.getByRole('button', { name: /儲存設定|儲存/i });
    fireEvent.click(saveBtn);

    expect(handleSave).toHaveBeenCalledWith({
      memberId: 'm1',
      splitType: SplitType.WEIGHTED,
      value: 2,
    });
  });

  it('allows switching to exact amount mode and specifying 250 NTD', () => {
    const handleSave = vi.fn();
    render(
      <ShareWeightModal
        isOpen={true}
        item={mockItem}
        member={mockMember}
        currentSplit={{ memberId: 'm1', splitType: SplitType.EQUAL, value: 1 }}
        onClose={vi.fn()}
        onSave={handleSave}
        onRemoveFromSplit={vi.fn()}
      />
    );

    const exactModeTab = screen.getByRole('button', { name: /自訂指定金額|指定金額/i });
    fireEvent.click(exactModeTab);

    const amountInput = screen.getByLabelText(/指定金額/i);
    fireEvent.change(amountInput, { target: { value: '250' } });

    const saveBtn = screen.getByRole('button', { name: /儲存設定|儲存/i });
    fireEvent.click(saveBtn);

    expect(handleSave).toHaveBeenCalledWith({
      memberId: 'm1',
      splitType: SplitType.EXACT_AMOUNT,
      value: 250,
    });
  });

  it('removes member from split when clicking remove button', () => {
    const handleRemove = vi.fn();
    render(
      <ShareWeightModal
        isOpen={true}
        item={mockItem}
        member={mockMember}
        currentSplit={{ memberId: 'm1', splitType: SplitType.EQUAL, value: 1 }}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onRemoveFromSplit={handleRemove}
      />
    );

    const removeBtn = screen.getByRole('button', { name: /移出分攤|移除/i });
    fireEvent.click(removeBtn);

    expect(handleRemove).toHaveBeenCalledWith('item-1', 'm1');
  });
});
