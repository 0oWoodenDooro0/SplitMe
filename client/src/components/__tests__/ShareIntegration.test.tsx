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

  it('allows host to view receipt card in step 7 and verify sample items', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Load sample preset to have items and settlement
    const loadSampleBtn = screen.getByRole('button', { name: /示範/i });
    await user.click(loadSampleBtn);

    // Navigate Step 1 -> Step 7
    for (let i = 1; i <= 6; i++) {
      await user.click(screen.getByRole('button', { name: /下一步/i }));
    }

    // Receipt card should be visible in Step 7
    expect(screen.getByTestId('receipt-card')).toBeInTheDocument();

    // Verify sample items in receipt
    expect(screen.getAllByText('麻辣鴛鴦鍋底').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/最簡轉帳指南/i).length).toBeGreaterThan(0);
  });
});
