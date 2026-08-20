import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Setup robust localStorage mock for jsdom environment if missing
if (typeof window !== 'undefined') {
  let store: Record<string, string> = {};
  const localStorageMock: Storage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  // Mock global fetch for test environment
  globalThis.fetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ status: 'ok' }),
    })
  );

  // Link globalThis.navigator to window.navigator and make clipboard writable
  if (window.navigator) {
    try {
      globalThis.navigator = window.navigator;
    } catch {
      // ignore
    }

    try {
      let clip: any = {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue(''),
      };
      Object.defineProperty(window.navigator, 'clipboard', {
        get() {
          return this._clipboard || clip;
        },
        set(val) {
          this._clipboard = val;
          clip = val;
        },
        configurable: true,
      });
    } catch {
      // ignore
    }
  }
}

afterEach(() => {
  cleanup();
});
