import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocalStorage } from './useLocalStorage';

interface SampleItem {
  id: string;
  name: string;
}

const STORAGE_KEY = 'weather-dashboard:test-items';

function parseItems(raw: unknown): SampleItem[] {
  if (!Array.isArray(raw)) {
    throw new TypeError('Expected an array');
  }

  return raw.map((entry) => {
    if (
      typeof entry !== 'object' ||
      entry === null ||
      typeof (entry as SampleItem).id !== 'string' ||
      typeof (entry as SampleItem).name !== 'string'
    ) {
      throw new TypeError('Invalid item shape');
    }

    return {
      id: (entry as SampleItem).id,
      name: (entry as SampleItem).name,
    };
  });
}

function renderItemsHook(initialValue: SampleItem[] = []) {
  return renderHook(() =>
    useLocalStorage<SampleItem[]>({
      key: STORAGE_KEY,
      initialValue,
      parse: parseItems,
    }),
  );
}

describe('useLocalStorage — reading stored values', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('reads and parses a valid stored value on initialization', () => {
    const saved: SampleItem[] = [{ id: 'minsk', name: 'Minsk' }];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

    const { result } = renderItemsHook([]);

    expect(result.current.initialValue).toEqual(saved);
    expect(result.current.storageError).toBeUndefined();
  });
});

describe('useLocalStorage — read fallbacks', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('falls back to initialValue and sets storageError on invalid JSON', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not-valid-json');
    const fallback: SampleItem[] = [{ id: 'default', name: 'Default' }];

    const { result } = renderItemsHook(fallback);

    expect(result.current.initialValue).toEqual(fallback);
    expect(result.current.storageError).toBeTruthy();
  });

  it('falls back to initialValue and sets storageError when parse rejects data', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ wrong: true }));
    const fallback: SampleItem[] = [];

    const { result } = renderItemsHook(fallback);

    expect(result.current.initialValue).toEqual(fallback);
    expect(result.current.storageError).toBeTruthy();
  });

  it('falls back when localStorage is unavailable', () => {
    const localStorageSpy = vi
      .spyOn(window, 'localStorage', 'get')
      .mockReturnValue(undefined as unknown as Storage);
    const fallback: SampleItem[] = [{ id: 'fallback', name: 'Fallback' }];

    const { result } = renderItemsHook(fallback);

    expect(result.current.initialValue).toEqual(fallback);
    expect(result.current.storageError).toBeTruthy();

    localStorageSpy.mockRestore();
  });
});

describe('useLocalStorage — saving values', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('reports write failures and succeeds after storage recovers', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('Quota exceeded');
    });
    const { result } = renderItemsHook([]);
    const nextItems: SampleItem[] = [{ id: 'berlin', name: 'Berlin' }];

    act(() => {
      result.current.saveValue(nextItems);
    });
    expect(result.current.storageError).toBeTruthy();

    setItemSpy.mockRestore();

    act(() => {
      result.current.saveValue(nextItems);
    });
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(nextItems));
    expect(result.current.storageError).toBeUndefined();
  });

  it('clears storageError when clearStorageError is called', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('Storage write failed');
    });
    const { result } = renderItemsHook([]);

    act(() => {
      result.current.saveValue([{ id: 'rome', name: 'Rome' }]);
    });

    expect(result.current.storageError).toBeTruthy();

    act(() => {
      result.current.clearStorageError();
    });

    expect(result.current.storageError).toBeUndefined();
  });
});
