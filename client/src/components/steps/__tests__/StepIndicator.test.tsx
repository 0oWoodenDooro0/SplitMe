import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepIndicator } from '../StepIndicator';

describe('StepIndicator Component', () => {
  const steps = [
    { number: 1, title: '主揪與主題' },
    { number: 2, title: '模式選擇' },
    { number: 3, title: '成員名單' },
    { number: 4, title: '餐點輸入' },
    { number: 5, title: '分攤分配' },
    { number: 6, title: '結算計算' },
    { number: 7, title: '收據匯出' },
  ];

  it('renders all 7 numbered steps with correct titles', () => {
    render(<StepIndicator currentStep={1} onSelectStep={vi.fn()} />);

    steps.forEach((step) => {
      expect(screen.getByText(step.title)).toBeInTheDocument();
      expect(screen.getByText(step.number.toString())).toBeInTheDocument();
    });
  });

  it('highlights the current active step', () => {
    render(<StepIndicator currentStep={3} onSelectStep={vi.fn()} />);

    const step3Button = screen.getByRole('button', { name: /3.*成員名單/i });
    expect(step3Button).toHaveAttribute('aria-current', 'step');
  });

  it('calls onSelectStep when clicking on a step button', () => {
    const handleSelectStep = vi.fn();
    render(<StepIndicator currentStep={2} onSelectStep={handleSelectStep} />);

    const step5Button = screen.getByRole('button', { name: /5.*分攤分配/i });
    fireEvent.click(step5Button);

    expect(handleSelectStep).toHaveBeenCalledWith(5);
  });
});
