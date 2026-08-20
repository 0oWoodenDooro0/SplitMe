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

  // Mock HTMLCanvasElement.prototype.getContext to eliminate jsdom canvas warnings
  if (typeof HTMLCanvasElement !== 'undefined') {
    HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((contextType: string) => {
      if (contextType === '2d') {
        return {
          fillStyle: '',
          strokeStyle: '',
          fillRect: vi.fn(),
          clearRect: vi.fn(),
          getImageData: vi.fn((x, y, w, h) => ({
            data: new Uint8ClampedArray(w * h * 4),
            width: w,
            height: h,
          })),
          putImageData: vi.fn(),
          createImageData: vi.fn((w: number, h: number) => ({
            data: new Uint8ClampedArray(w * h * 4),
            width: w,
            height: h,
          })),
          setTransform: vi.fn(),
          drawImage: vi.fn(),
          save: vi.fn(),
          fillText: vi.fn(),
          restore: vi.fn(),
          beginPath: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          closePath: vi.fn(),
          stroke: vi.fn(),
          translate: vi.fn(),
          scale: vi.fn(),
          rotate: vi.fn(),
          arc: vi.fn(),
          fill: vi.fn(),
          measureText: vi.fn(() => ({ width: 0 })),
          transform: vi.fn(),
          rect: vi.fn(),
          clip: vi.fn(),
        } as any;
      }
      return null;
    });

    HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mockcanvasdata');
  }
}

afterEach(() => {
  cleanup();
});
