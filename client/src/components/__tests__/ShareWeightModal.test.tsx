import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShareWeightModal } from '../ShareWeightModal';
import { Item, Member, SplitType } from '../../types/models';

const mockMember: Member = { id: 'm1', name: 'Alice', avatarColor: '#10B981' };
const mockItem: Item = {
  id: 'item-1',
  name: '招牌生魚片',
  price: 600,
  paidByMemberId: 'm1',
  splits: [{ memberId: 'm1', splitType: SplitType.EQUAL, value: 1 }],
};

describe('ShareWeightModal Component', () => {
  it('renders modal with member and item info', () => {
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
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText(/招牌生魚片/i)).toBeInTheDocument();
  });

  it('selects preset multiplier 1.5x and saves', () => {
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

    const btn15x = screen.getByRole('button', { name: '1.5x' });
    fireEvent.click(btn15x);

    const saveBtn = screen.getByRole('button', { name: /儲存設定|確認|save/i });
    fireEvent.click(saveBtn);

    expect(handleSave).toHaveBeenCalledWith({
      memberId: 'm1',
      splitType: SplitType.WEIGHTED,
      value: 1.5,
    });
  });

  it('switches to exact amount mode, enters amount and saves', () => {
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

    const exactModeTab = screen.getByRole('button', { name: /自訂指定金額|指定金額|exact/i });
    fireEvent.click(exactModeTab);

    const amountInput = screen.getByPlaceholderText(/輸入指定分攤金額/i);
    fireEvent.change(amountInput, { target: { value: '250' } });

    const saveBtn = screen.getByRole('button', { name: /儲存設定|確認|save/i });
    fireEvent.click(saveBtn);

    expect(handleSave).toHaveBeenCalledWith({
      memberId: 'm1',
      splitType: SplitType.EXACT_AMOUNT,
      value: 250,
    });
  });

  it('removes member from split when delete/remove button clicked', () => {
    const handleRemoveFromSplit = vi.fn();
    render(
      <ShareWeightModal
        isOpen={true}
        item={mockItem}
        member={mockMember}
        currentSplit={{ memberId: 'm1', splitType: SplitType.EQUAL, value: 1 }}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onRemoveFromSplit={handleRemoveFromSplit}
      />
    );

    const removeBtn = screen.getByRole('button', { name: /移出分攤|移除|remove/i });
    fireEvent.click(removeBtn);

    expect(handleRemoveFromSplit).toHaveBeenCalledWith('item-1', 'm1');
  });
});
