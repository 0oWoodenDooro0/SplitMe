import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step4ItemInput } from '../Step4ItemInput';
import { Item, Member } from '../../../types/models';

describe('Step4ItemInput Component', () => {
  const mockMembers: Member[] = [
    { id: 'm-1', name: '主揪小王', avatarColor: '#10B981', isHost: true },
    { id: 'm-2', name: '小明', avatarColor: '#3B82F6', isHost: false },
  ];

  const mockItems: Item[] = [
    {
      id: 'i-1',
      name: '麻辣鍋底',
      price: 350,
      paidByMemberId: 'm-1',
      splits: [
        { memberId: 'm-1', splitType: 'EQUAL', value: 1 },
        { memberId: 'm-2', splitType: 'EQUAL', value: 1 },
      ],
    },
  ];

  it('renders item list, total amount, and quick add inputs', () => {
    render(
      <Step4ItemInput
        items={mockItems}
        members={mockMembers}
        onAddItem={vi.fn()}
        onUpdateItem={vi.fn()}
        onRemoveItem={vi.fn()}
        onOpenFeeModal={vi.fn()}
        totalFeeAmount={0}
      />
    );

    expect(screen.getByText('麻辣鍋底')).toBeInTheDocument();
    expect(screen.getByText(/350/)).toBeInTheDocument();
    expect(screen.getByLabelText(/餐點品項名稱/i)).toBeInTheDocument();
  });

  it('adds an item when filling name, price and submitting', async () => {
    const user = userEvent.setup();
    const handleAddItem = vi.fn();

    render(
      <Step4ItemInput
        items={mockItems}
        members={mockMembers}
        onAddItem={handleAddItem}
        onUpdateItem={vi.fn()}
        onRemoveItem={vi.fn()}
        onOpenFeeModal={vi.fn()}
        totalFeeAmount={0}
      />
    );

    const nameInput = screen.getByLabelText(/餐點品項名稱/i);
    const priceInput = screen.getByLabelText(/金額/i);

    await user.type(nameInput, '牛肉盤');
    await user.type(priceInput, '420');

    const addBtn = screen.getByRole('button', { name: /新增/i });
    await user.click(addBtn);

    expect(handleAddItem).toHaveBeenCalledWith(
      '牛肉盤',
      420,
      'm-1',
      expect.arrayContaining(['m-1', 'm-2'])
    );
  });

  it('triggers onOpenFeeModal when clicking extra fee button', async () => {
    const user = userEvent.setup();
    const handleOpenFeeModal = vi.fn();

    render(
      <Step4ItemInput
        items={mockItems}
        members={mockMembers}
        onAddItem={vi.fn()}
        onUpdateItem={vi.fn()}
        onRemoveItem={vi.fn()}
        onOpenFeeModal={handleOpenFeeModal}
        totalFeeAmount={50}
      />
    );

    const feeBtn = screen.getByRole('button', { name: /附加費|服務費|折扣/i });
    await user.click(feeBtn);

    expect(handleOpenFeeModal).toHaveBeenCalledTimes(1);
  });
});
