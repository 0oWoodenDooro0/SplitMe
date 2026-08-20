import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../App';

describe('App 7-Step Wizard Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok' }),
    } as any);
  });

  it('renders step 1 by default with title and host inputs', async () => {
    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText(/SplitMe/i)).toBeInTheDocument();
    expect(screen.getByText(/主揪與聚餐名稱/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/聚餐名稱/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/主揪姓名/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /下一步/i })).toBeInTheDocument();
  });

  it('allows navigating forward and backward through steps', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Step 1: Click Next
    const nextBtn = screen.getByRole('button', { name: /下一步/i });
    await user.click(nextBtn);

    // Step 2: Mode Selection
    expect(screen.getByText(/即時連線模式/i)).toBeInTheDocument();
    expect(screen.getByText(/主揪速算模式/i)).toBeInTheDocument();

    // Step 2: Click Next -> Step 3
    await user.click(screen.getByRole('button', { name: /下一步/i }));
    expect(screen.getByText(/成員名單/i)).toBeInTheDocument();

    // Click Previous -> Step 2
    const prevBtn = screen.getByRole('button', { name: /上一步/i });
    await user.click(prevBtn);
    expect(screen.getByText(/即時連線模式/i)).toBeInTheDocument();
  });

  it('loads sample data and can navigate through all steps to receipt export', async () => {
    const user = userEvent.setup();
    render(<App />);

    // In Step 1: Load sample data
    const loadSampleBtn = screen.getByRole('button', { name: /載入示範/i });
    await user.click(loadSampleBtn);

    // Step 1 -> Step 2 (Mode)
    await user.click(screen.getByRole('button', { name: /下一步/i }));
    expect(screen.getByText(/選擇分帳模式/i)).toBeInTheDocument();

    // Step 2 -> Step 3 (Members)
    await user.click(screen.getByRole('button', { name: /下一步/i }));
    expect(screen.getByText(/成員名單/i)).toBeInTheDocument();

    // Step 3 -> Step 4 (Items)
    await user.click(screen.getByRole('button', { name: /下一步/i }));
    expect(screen.getByText(/餐點品項與金額/i)).toBeInTheDocument();

    // Step 4 -> Step 5 (Split)
    await user.click(screen.getByRole('button', { name: /下一步/i }));
    expect(screen.getByText(/品項分攤確認/i)).toBeInTheDocument();

    // Step 5 -> Step 6 (Settlement)
    await user.click(screen.getByRole('button', { name: /下一步/i }));
    expect(screen.getByText(/最簡轉帳指南/i)).toBeInTheDocument();
    expect(screen.getByText(/收支完全平衡/i)).toBeInTheDocument();

    // Step 6 -> Step 7 (Receipt)
    await user.click(screen.getByRole('button', { name: /下一步/i }));
    expect(screen.getByTestId('receipt-card')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /下載 PNG 長圖/i })).toBeInTheDocument();
  });
});
