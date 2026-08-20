import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step1HostName } from '../Step1HostName';
import { Room } from '../../../types/models';

describe('Step1HostName Component', () => {
  const mockRoom: Room = {
    id: 'room-1',
    code: 'TEST01',
    title: '週五聚餐',
    currency: 'NT$',
    members: [
      { id: 'm-1', name: '主揪小王', avatarColor: '#10B981', isHost: true },
      { id: 'm-2', name: '小明', avatarColor: '#3B82F6', isHost: false },
    ],
    items: [],
    extraFees: [],
  };

  it('renders room title, host name, and quick summary info', () => {
    render(
      <Step1HostName
        room={mockRoom}
        onUpdateTitle={vi.fn()}
        onUpdateHostName={vi.fn()}
        onLoadSampleData={vi.fn()}
        onResetRoom={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue('週五聚餐')).toBeInTheDocument();
    expect(screen.getByDisplayValue('主揪小王')).toBeInTheDocument();
    expect(screen.getByText(/代碼: TEST01|TEST01/i)).toBeInTheDocument();
  });

  it('triggers onUpdateTitle when user modifies title input', async () => {
    const user = userEvent.setup();
    const handleUpdateTitle = vi.fn();

    render(
      <Step1HostName
        room={mockRoom}
        onUpdateTitle={handleUpdateTitle}
        onUpdateHostName={vi.fn()}
        onLoadSampleData={vi.fn()}
        onResetRoom={vi.fn()}
      />
    );

    const titleInput = screen.getByLabelText(/聚餐名稱|活動主題/i);
    await user.clear(titleInput);
    await user.type(titleInput, '週末海底撈');

    expect(handleUpdateTitle).toHaveBeenCalled();
  });

  it('triggers onUpdateHostName when user modifies host name input', async () => {
    const user = userEvent.setup();
    const handleUpdateHostName = vi.fn();

    render(
      <Step1HostName
        room={mockRoom}
        onUpdateTitle={vi.fn()}
        onUpdateHostName={handleUpdateHostName}
        onLoadSampleData={vi.fn()}
        onResetRoom={vi.fn()}
      />
    );

    const hostInput = screen.getByLabelText(/主揪暱稱|主揪姓名/i);
    await user.clear(hostInput);
    await user.type(hostInput, '大隊長');

    expect(handleUpdateHostName).toHaveBeenCalled();
  });

  it('triggers onLoadSampleData and onResetRoom on button clicks', async () => {
    const user = userEvent.setup();
    const handleLoadSample = vi.fn();
    const handleReset = vi.fn();

    render(
      <Step1HostName
        room={mockRoom}
        onUpdateTitle={vi.fn()}
        onUpdateHostName={vi.fn()}
        onLoadSampleData={handleLoadSample}
        onResetRoom={handleReset}
      />
    );

    const loadBtn = screen.getByRole('button', { name: /載入示範帳單|載入示範/i });
    await user.click(loadBtn);
    expect(handleLoadSample).toHaveBeenCalledTimes(1);

    const resetBtn = screen.getByRole('button', { name: /清空聚餐|重設/i });
    await user.click(resetBtn);
    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});
