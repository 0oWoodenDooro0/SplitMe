import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { App } from '../../App';

describe('App Splitting Workspace Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders split workspace with member bar, item list, and settlement dashboard', async () => {
    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText(/SplitMe/i)).toBeInTheDocument();
    expect(screen.getByText(/成員名單|成員/i)).toBeInTheDocument();
    expect(screen.getByText(/消費品項清單|餐點清單/i)).toBeInTheDocument();
    expect(screen.getByText(/結算儀表板|結算總覽/i)).toBeInTheDocument();
  });

  it('loads sample preset and recalculates settlement across all cards', async () => {
    await act(async () => {
      render(<App />);
    });

    const loadSampleBtn = screen.getByRole('button', { name: /載入示範帳單|載入示範/i });
    act(() => {
      fireEvent.click(loadSampleBtn);
    });

    // Should have multiple items and calculated grand total
    expect(screen.getByText(/最簡轉帳指南/i)).toBeInTheDocument();
    expect(screen.getByText(/收支完全平衡/i)).toBeInTheDocument();
  });
});
