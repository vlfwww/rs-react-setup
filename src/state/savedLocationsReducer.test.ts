import { describe, expect, it } from 'vitest';
import { savedLocationsReducer } from './savedLocationsReducer';
import type { SavedLocation } from '../types/weather';

const minsk: SavedLocation = {
  id: 'minsk-metric',
  name: 'Minsk',
  latitude: 53.9,
  longitude: 27.5667,
  units: 'metric',
  status: 'idle',
};

const london: SavedLocation = {
  id: 'london-metric',
  name: 'London',
  latitude: 51.5072,
  longitude: -0.1276,
  units: 'metric',
  status: 'idle',
};

const SAMPLE_WEATHER = { tempC: 18.5, code: 2, fetchedAt: 1732010000 };

describe('savedLocationsReducer — collection mutations', () => {
  it('adds a location without mutating previous state', () => {
    const initial: SavedLocation[] = [];
    const next = savedLocationsReducer(initial, {
      type: 'ADD',
      payload: minsk,
    });

    expect(next).toEqual([minsk]);
    expect(initial).toEqual([]);
  });

  it('removes a location by id without mutating previous state', () => {
    const initial = [minsk, london];
    const next = savedLocationsReducer(initial, {
      type: 'REMOVE',
      payload: { id: minsk.id },
    });

    expect(next).toEqual([london]);
    expect(initial).toHaveLength(2);
  });
});

describe('savedLocationsReducer — fetch lifecycle', () => {
  it('resets previous error when refetch starts', () => {
    const withError: SavedLocation[] = [
      {
        ...minsk,
        status: 'error',
        error: 'Network error',
        weather: { tempC: 10, code: 1, fetchedAt: 1000 },
      },
    ];

    const next = savedLocationsReducer(withError, {
      type: 'FETCH_START',
      payload: { id: minsk.id },
    });

    expect(next[0]).toEqual({
      ...minsk,
      status: 'loading',
      error: undefined,
      weather: { tempC: 10, code: 1, fetchedAt: 1000 },
    });
  });

  it('updates weather and transitions status to success on FETCH_SUCCESS', () => {
    const loadingState: SavedLocation[] = [
      { ...minsk, status: 'loading', error: 'Previous error' },
    ];

    const next = savedLocationsReducer(loadingState, {
      type: 'FETCH_SUCCESS',
      payload: { id: minsk.id, weather: SAMPLE_WEATHER },
    });

    expect(next[0]).toEqual({
      ...minsk,
      status: 'success',
      weather: SAMPLE_WEATHER,
      error: undefined,
    });
  });
});

describe('savedLocationsReducer — item isolation and stale events', () => {
  it('keeps other locations unaffected during per-item updates', () => {
    const next = savedLocationsReducer([minsk, london], {
      type: 'FETCH_ERROR',
      payload: { id: minsk.id, error: 'Failed to load' },
    });

    expect(next[0]).toMatchObject({ status: 'error', error: 'Failed to load' });
    expect(next[1]).toEqual(london);
  });

  it('ignores stale success or error after location is removed', () => {
    const afterAdd = savedLocationsReducer([], { type: 'ADD', payload: minsk });
    const afterRemove = savedLocationsReducer(afterAdd, {
      type: 'REMOVE',
      payload: { id: minsk.id },
    });

    const afterLateSuccess = savedLocationsReducer(afterRemove, {
      type: 'FETCH_SUCCESS',
      payload: { id: minsk.id, weather: SAMPLE_WEATHER },
    });
    const afterLateError = savedLocationsReducer(afterRemove, {
      type: 'FETCH_ERROR',
      payload: { id: minsk.id, error: 'Timeout' },
    });

    expect(afterLateSuccess).toEqual([]);
    expect(afterLateError).toEqual([]);
  });
});
