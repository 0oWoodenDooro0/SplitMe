import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../App';

vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,mockpng'),
}));

describe('Share & Receipt Export Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok' }),
    } as any);
  });

  it('allows host to open receipt export modal from settlement dashboard and view receipt card', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Load sample preset to have items and settlement
    const loadSampleBtn = screen.getByRole('button', { name: /示範/i });
    await user.click(loadSampleBtn);

    // Open receipt export modal from Settlement Dashboard
    const exportBtn = screen.getByRole('button', { name: /匯出收據與分享|匯出收據/i });
    await user.click(exportBtn);

    // Modal should be open
    expect(screen.getByText(/結算收據與匯出分享/i)).toBeInTheDocument();
    expect(screen.getByTestId('receipt-card')).toBeInTheDocument();

    // Verify sample items in receipt
    expect(screen.getAllByText('麻辣鴛鴦鍋底').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/最簡轉帳指南/i).length).toBeGreaterThan(0);
  });
});
