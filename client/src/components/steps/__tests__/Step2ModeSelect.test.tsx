import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step2ModeSelect } from '../Step2ModeSelect';

describe('Step2ModeSelect Component', () => {
  it('renders mode options for live room and fast standalone mode', () => {
    render(
      <Step2ModeSelect
        selectedMode="live"
        onSelectMode={vi.fn()}
        roomCode="ROOM99"
      />
    );

    expect(screen.getByText(/即時連線模式/i)).toBeInTheDocument();
    expect(screen.getByText(/主揪速算模式/i)).toBeInTheDocument();
    expect(screen.getByText(/ROOM99/i)).toBeInTheDocument();
  });

  it('selects mode when clicking mode card', async () => {
    const user = userEvent.setup();
    const handleSelectMode = vi.fn();

    render(
      <Step2ModeSelect
        selectedMode="live"
        onSelectMode={handleSelectMode}
        roomCode="ROOM99"
      />
    );

    const offlineCard = screen.getByTestId('mode-card-offline');
    await user.click(offlineCard);

    expect(handleSelectMode).toHaveBeenCalledWith('offline');
  });
});
