import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FeeSettingsModal } from '../FeeSettingsModal';
import { ExtraFee, FeeAllocationMethod, FeeType, Member } from '../../types/models';

const mockMembers: Member[] = [
  { id: 'm1', name: 'Alice', avatarColor: '#10B981', isHost: true },
  { id: 'm2', name: 'Bob', avatarColor: '#3B82F6', isHost: false },
];

const mockFees: ExtraFee[] = [
  {
    id: 'fee-1',
    name: '服務費 10%',
    feeType: FeeType.PERCENTAGE,
    rate: 0.1,
    allocationMethod: FeeAllocationMethod.PROPORTIONAL_SUBTOTAL,
  },
];

describe('FeeSettingsModal Component', () => {
  it('renders existing fees and members', () => {
    render(
      <FeeSettingsModal
        isOpen={true}
        fees={mockFees}
        members={mockMembers}
        onClose={vi.fn()}
        onAddFee={vi.fn()}
        onUpdateFee={vi.fn()}
        onRemoveFee={vi.fn()}
      />
    );

    expect(screen.getByText(/附加費用與折扣攤提/i)).toBeInTheDocument();
    expect(screen.getByText('服務費 10%')).toBeInTheDocument();
    expect(screen.getByText(/10%/)).toBeInTheDocument();
  });

  it('adds a percentage service charge with quick preset button', () => {
    const handleAddFee = vi.fn();
    render(
      <FeeSettingsModal
        isOpen={true}
        fees={[]}
        members={mockMembers}
        onClose={vi.fn()}
        onAddFee={handleAddFee}
        onUpdateFee={vi.fn()}
        onRemoveFee={vi.fn()}
      />
    );

    const preset10Btn = screen.getByRole('button', { name: /\+ 10% 服務費/i });
    fireEvent.click(preset10Btn);

    expect(handleAddFee).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '服務費 10%',
        feeType: FeeType.PERCENTAGE,
        rate: 0.1,
        allocationMethod: FeeAllocationMethod.PROPORTIONAL_SUBTOTAL,
      })
    );
  });

  it('adds a fixed discount with custom amount and equal allocation', () => {
    const handleAddFee = vi.fn();
    render(
      <FeeSettingsModal
        isOpen={true}
        fees={[]}
        members={mockMembers}
        onClose={vi.fn()}
        onAddFee={handleAddFee}
        onUpdateFee={vi.fn()}
        onRemoveFee={vi.fn()}
      />
    );

    const nameInput = screen.getByPlaceholderText(/費用\/折扣名稱/i);
    const amountInput = screen.getByPlaceholderText(/數值 \(% 或 \$\)/i);

    fireEvent.change(nameInput, { target: { value: '早鳥折價券' } });
    fireEvent.change(amountInput, { target: { value: '-120' } });

    const fixedTypeRadio = screen.getByLabelText(/固定金額 \(\$\)/i);
    fireEvent.click(fixedTypeRadio);

    const equalRadio = screen.getByLabelText(/全員平分/i);
    fireEvent.click(equalRadio);

    const addBtn = screen.getByRole('button', { name: /新增費用項目|新增/i });
    fireEvent.click(addBtn);

    expect(handleAddFee).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '早鳥折價券',
        feeType: FeeType.FIXED_AMOUNT,
        amount: -120,
        allocationMethod: FeeAllocationMethod.EQUAL_MEMBERS,
      })
    );
  });

  it('deletes an existing fee', () => {
    const handleRemoveFee = vi.fn();
    render(
      <FeeSettingsModal
        isOpen={true}
        fees={mockFees}
        members={mockMembers}
        onClose={vi.fn()}
        onAddFee={vi.fn()}
        onUpdateFee={vi.fn()}
        onRemoveFee={handleRemoveFee}
      />
    );

    const deleteBtn = screen.getByRole('button', { name: /刪除費用|刪除|delete/i });
    fireEvent.click(deleteBtn);

    expect(handleRemoveFee).toHaveBeenCalledWith('fee-1');
  });
});
