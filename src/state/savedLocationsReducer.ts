import type { SavedLocation, SavedWeather } from '../types/weather';

export type SavedLocationsAction =
  | { type: 'ADD'; payload: SavedLocation }
  | { type: 'REMOVE'; payload: { id: string } }
  | { type: 'FETCH_START'; payload: { id: string } }
  | { type: 'FETCH_SUCCESS'; payload: { id: string; weather: SavedWeather } }
  | { type: 'FETCH_ERROR'; payload: { id: string; error: string } };

export function savedLocationsReducer(
  state: SavedLocation[],
  action: SavedLocationsAction,
): SavedLocation[] {
  switch (action.type) {
    case 'ADD': {
      const exists = state.some((item) => item.id === action.payload.id);
      if (exists) {
        return state;
      }
      return [...state, action.payload];
    }

    case 'REMOVE':
      return state.filter((item) => item.id !== action.payload.id);

    case 'FETCH_START':
      return state.map((item) =>
        item.id === action.payload.id ? { ...item, status: 'loading', error: undefined } : item,
      );

    case 'FETCH_SUCCESS':
      return state.map((item) =>
        item.id === action.payload.id
          ? {
              ...item,
              status: 'success',
              weather: action.payload.weather,
              error: undefined,
            }
          : item,
      );

    case 'FETCH_ERROR':
      return state.map((item) =>
        item.id === action.payload.id
          ? {
              ...item,
              status: 'error',
              error: action.payload.error,
            }
          : item,
      );

    default:
      return state;
  }
}
