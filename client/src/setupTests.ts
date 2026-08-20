import '@testing-library/jest-dom/vitest';
import { beforeEach, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

const mockCanvasContext = {
  fillStyle: '',
  strokeStyle: '',
  fillRect: () => {},
  clearRect: () => {},
  getImageData: (_x: number, _y: number, w: number, h: number) => ({
    data: new Uint8ClampedArray(w * h * 4),
    width: w,
    height: h,
  }),
  putImageData: () => {},
  createImageData: (w: number, h: number) => ({
    data: new Uint8ClampedArray(w * h * 4),
    width: w,
    height: h,
  }),
  setTransform: () => {},
  drawImage: () => {},
  save: () => {},
  fillText: () => {},
  restore: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  closePath: () => {},
  stroke: () => {},
  translate: () => {},
  scale: () => {},
  rotate: () => {},
  arc: () => {},
  fill: () => {},
  measureText: () => ({ width: 0 }),
  transform: () => {},
  rect: () => {},
  clip: () => {},
};

function setupCanvasMock() {
  if (typeof HTMLCanvasElement !== 'undefined') {
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: function (contextType: string) {
        if (contextType === '2d') {
          return mockCanvasContext;
        }
        return null;
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
      value: function () {
        return 'data:image/png;base64,mockcanvasdata';
      },
      writable: true,
      configurable: true,
    });
  }
}

// Initial setup
setupCanvasMock();

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

beforeEach(() => {
  setupCanvasMock();
});

afterEach(() => {
  cleanup();
  setupCanvasMock();
});
