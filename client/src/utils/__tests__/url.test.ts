import { describe, it, expect } from 'vitest';
import { buildFriendShareUrl } from '../url';

describe('buildFriendShareUrl utility', () => {
  it('returns empty string if roomCodeOrId is falsy', () => {
    expect(buildFriendShareUrl('')).toBe('');
  });

  it('builds share URL correctly with custom origin', () => {
    const url = buildFriendShareUrl('HOTPOT', 'https://splitme.app');
    expect(url).toBe('https://splitme.app?room=HOTPOT&view=friend');
  });

  it('escapes special characters in room code', () => {
    const url = buildFriendShareUrl('ROOM#123', 'https://splitme.app');
    expect(url).toBe('https://splitme.app?room=ROOM%23123&view=friend');
  });
});
