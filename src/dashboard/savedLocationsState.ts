import { type ActionDispatch, useEffect, useReducer, useState } from 'react';
import type { CurrentWeatherData, GeocodingResult, WeatherUnits } from '../api/openMeteo';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { savedLocationsReducer, type SavedLocationsAction } from '../state/savedLocationsReducer';
import type { SavedLocation } from '../types/weather';
import { buildSavedLocation } from './temperatureHelpers';

const SAVED_LOCATIONS_STORAGE_KEY = 'weather-dashboard:saved-locations';

export function usePersistedLocations() {
  const { initialValue, saveValue, storageError } = useLocalStorage<SavedLocation[]>({
    key: SAVED_LOCATIONS_STORAGE_KEY,
    initialValue: [],
  });
  const [locations, dispatchLocations] = useReducer(savedLocationsReducer, initialValue);
  const [latchedReadError, setLatchedReadError] = useState<unknown>(() => storageError ?? null);

  const activeError = storageError ?? latchedReadError;

  useEffect(() => {
    saveValue(locations);
  }, [locations, saveValue]);

  function clearLatchedError() {
    setLatchedReadError(null);
  }

  return {
    locations,
    dispatchLocations,
    storageError: activeError,
    clearLatchedError,
  };
}

export function useSavedLocationsActions(
  locations: SavedLocation[],
  dispatchLocations: ActionDispatch<[action: SavedLocationsAction]>,
  onMutate?: () => void,
) {
  function removeLocation(id: string) {
    dispatchLocations({ type: 'REMOVE', payload: { id } });
    onMutate?.();
  }

  function addLocation(params: {
    city: GeocodingResult;
    cityLabel: string;
    units: WeatherUnits;
    weather: CurrentWeatherData;
  }) {
    const item = buildSavedLocation(params);
    if (locations.some((entry) => entry.id === item.id)) {
      dispatchLocations({ type: 'REMOVE', payload: { id: item.id } });
    }
    dispatchLocations({ type: 'ADD', payload: item } as SavedLocationsAction);
    onMutate?.();
  }

  return { addLocation, removeLocation };
}
