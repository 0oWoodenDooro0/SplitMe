import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ItemList } from '../ItemList';
import { Item, Member, SplitType } from '../../types/models';

const mockMembers: Member[] = [
  { id: 'm1', name: 'Alice', avatarColor: '#10B981', isHost: true },
  { id: 'm2', name: 'Bob', avatarColor: '#3B82F6', isHost: false },
  { id: 'm3', name: 'Charlie', avatarColor: '#F59E0B', isHost: false },
];

const mockItems: Item[] = [
  {
    id: 'item-1',
    name: '麻辣鍋底',
    price: 450,
    paidByMemberId: 'm1',
    splits: [
      { memberId: 'm1', splitType: SplitType.EQUAL },
      { memberId: 'm2', splitType: SplitType.EQUAL },
    ],
  },
];

describe('ItemList and ItemCard Components', () => {
  it('renders item list and displays existing items with payers and splits', () => {
    render(
      <ItemList
        items={mockItems}
        members={mockMembers}
        onAddItem={vi.fn()}
        onUpdateItem={vi.fn()}
        onRemoveItem={vi.fn()}
        onToggleSplit={vi.fn()}
        onSetAllSplit={vi.fn()}
        onClearSplit={vi.fn()}
        onOpenWeightModal={vi.fn()}
      />
    );

    expect(screen.getByText('麻辣鍋底')).toBeInTheDocument();
    expect(screen.getByText(/450/)).toBeInTheDocument();
    expect(screen.getByText(/Alice 墊付/)).toBeInTheDocument();
  });

  it('adds a new item through the quick add form', () => {
    const handleAddItem = vi.fn();
    render(
      <ItemList
        items={mockItems}
        members={mockMembers}
        onAddItem={handleAddItem}
        onUpdateItem={vi.fn()}
        onRemoveItem={vi.fn()}
        onToggleSplit={vi.fn()}
        onSetAllSplit={vi.fn()}
        onClearSplit={vi.fn()}
        onOpenWeightModal={vi.fn()}
      />
    );

    const nameInput = screen.getByLabelText(/餐點品項名稱/i);
    const priceInput = screen.getByLabelText(/金額/i);

    fireEvent.change(nameInput, { target: { value: '手切牛肉盤' } });
    fireEvent.change(priceInput, { target: { value: '380' } });

    const submitBtn = screen.getByRole('button', { name: /新增品項|新增|add/i });
    fireEvent.click(submitBtn);

    expect(handleAddItem).toHaveBeenCalledWith('手切牛肉盤', 380, 'm1', ['m1', 'm2', 'm3']);
  });

  it('allows changing item payer', () => {
    const handleUpdateItem = vi.fn();
    render(
      <ItemList
        items={mockItems}
        members={mockMembers}
        onAddItem={vi.fn()}
        onUpdateItem={handleUpdateItem}
        onRemoveItem={vi.fn()}
        onToggleSplit={vi.fn()}
        onSetAllSplit={vi.fn()}
        onClearSplit={vi.fn()}
        onOpenWeightModal={vi.fn()}
      />
    );

    const payerSelects = screen.getAllByRole('combobox', { name: /墊付人/i });
    fireEvent.change(payerSelects[1], { target: { value: 'm2' } });

    expect(handleUpdateItem).toHaveBeenCalledWith('item-1', { paidByMemberId: 'm2' });
  });

  it('handles drag-and-drop member badge onto item dropzone', () => {
    const handleToggleSplit = vi.fn();
    render(
      <ItemList
        items={mockItems}
        members={mockMembers}
        onAddItem={vi.fn()}
        onUpdateItem={vi.fn()}
        onRemoveItem={vi.fn()}
        onToggleSplit={handleToggleSplit}
        onSetAllSplit={vi.fn()}
        onClearSplit={vi.fn()}
        onOpenWeightModal={vi.fn()}
      />
    );

    const itemCard = screen.getByTestId('item-card-item-1');
    fireEvent.dragOver(itemCard, { preventDefault: vi.fn() });
    fireEvent.drop(itemCard, {
      preventDefault: vi.fn(),
      dataTransfer: { getData: () => 'm3' },
    });

    expect(handleToggleSplit).toHaveBeenCalledWith('item-1', 'm3');
  });

  it('toggles member split via 1-click toggle buttons', () => {
    const handleToggleSplit = vi.fn();
    render(
      <ItemList
        items={mockItems}
        members={mockMembers}
        onAddItem={vi.fn()}
        onUpdateItem={vi.fn()}
        onRemoveItem={vi.fn()}
        onToggleSplit={handleToggleSplit}
        onSetAllSplit={vi.fn()}
        onClearSplit={vi.fn()}
        onOpenWeightModal={vi.fn()}
      />
    );

    const toggleM3Btn = screen.getByTestId('toggle-split-item-1-m3');
    fireEvent.click(toggleM3Btn);

    expect(handleToggleSplit).toHaveBeenCalledWith('item-1', 'm3');
  });

  it('triggers quick 全員 and 清空 split buttons', () => {
    const handleSetAll = vi.fn();
    const handleClear = vi.fn();
    render(
      <ItemList
        items={mockItems}
        members={mockMembers}
        onAddItem={vi.fn()}
        onUpdateItem={vi.fn()}
        onRemoveItem={vi.fn()}
        onToggleSplit={vi.fn()}
        onSetAllSplit={handleSetAll}
        onClearSplit={handleClear}
        onOpenWeightModal={vi.fn()}
      />
    );

    const allBtn = screen.getByRole('button', { name: /全員|all/i });
    fireEvent.click(allBtn);
    expect(handleSetAll).toHaveBeenCalledWith('item-1');

    const clearBtn = screen.getByRole('button', { name: /清空|clear/i });
    fireEvent.click(clearBtn);
    expect(handleClear).toHaveBeenCalledWith('item-1');
  });

  it('opens weight/amount modal when clicking an active member split chip', () => {
    const handleOpenWeightModal = vi.fn();
    render(
      <ItemList
        items={mockItems}
        members={mockMembers}
        onAddItem={vi.fn()}
        onUpdateItem={vi.fn()}
        onRemoveItem={vi.fn()}
        onToggleSplit={vi.fn()}
        onSetAllSplit={vi.fn()}
        onClearSplit={vi.fn()}
        onOpenWeightModal={handleOpenWeightModal}
      />
    );

    const chipM1 = screen.getByTestId('split-chip-item-1-m1');
    fireEvent.click(chipM1);

    expect(handleOpenWeightModal).toHaveBeenCalledWith('item-1', 'm1');
  });
});
