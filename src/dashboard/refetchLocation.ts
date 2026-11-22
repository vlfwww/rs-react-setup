import { type ActionDispatch, useEffect, useRef } from 'react';
import type { CurrentWeatherData, WeatherUnits } from '../api/openMeteo';
import type { WeatherDashboardClient } from '../App';
import type { SavedLocationsAction } from '../state/savedLocationsReducer';
import type { SavedLocation, SavedWeather } from '../types/weather';
import { fahrenheitToCelsius } from './temperatureHelpers';

export interface RefetchIntent {
  locationId: string;
  latitude: number;
  longitude: number;
  units: WeatherUnits;
  seq: number;
}

interface ActiveRefetch {
  seq: number;
  controller: AbortController;
  cancelled: boolean;
}

const isAbortError = (error: unknown) => error instanceof Error && error.name === 'AbortError';

const toErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

export function toSavedWeather(weather: CurrentWeatherData, units: WeatherUnits): SavedWeather {
  const tempC =
    units === 'imperial' ? fahrenheitToCelsius(weather.temperature) : weather.temperature;

  return {
    tempC,
    code: weather.weatherCode,
    fetchedAt: Date.now(),
  };
}

function abortEntry(entry: ActiveRefetch) {
  entry.cancelled = true;
  entry.controller.abort();
}

function runSingleRefetch(params: {
  client: WeatherDashboardClient;
  intent: RefetchIntent;
  entry: ActiveRefetch;
  activeMap: Map<string, ActiveRefetch>;
  dispatchLocations: ActionDispatch<[action: SavedLocationsAction]>;
}) {
  const { client, intent, entry, activeMap, dispatchLocations } = params;
  const { locationId, latitude, longitude, units } = intent;

  dispatchLocations({
    type: 'FETCH_START',
    payload: { id: locationId },
  } as SavedLocationsAction);

  client
    .fetchCurrentWeather({ latitude, longitude, units }, { signal: entry.controller.signal })
    .then((weather) => {
      if (entry.cancelled || entry.controller.signal.aborted) {
        return;
      }
      if (activeMap.get(locationId) === entry) {
        activeMap.delete(locationId);
      }
      dispatchLocations({
        type: 'FETCH_SUCCESS',
        payload: { id: locationId, weather: toSavedWeather(weather, units) },
      } as SavedLocationsAction);
    })
    .catch((error: unknown) => {
      if (entry.cancelled || entry.controller.signal.aborted || isAbortError(error)) {
        return;
      }
      if (activeMap.get(locationId) === entry) {
        activeMap.delete(locationId);
      }
      dispatchLocations({
        type: 'FETCH_ERROR',
        payload: {
          id: locationId,
          error: toErrorMessage(error, 'Failed to refresh weather'),
        },
      } as SavedLocationsAction);
    });
}

function startIntentRefetch(params: {
  activeMap: Map<string, ActiveRefetch>;
  client: WeatherDashboardClient;
  intent: RefetchIntent;
  dispatchLocations: ActionDispatch<[action: SavedLocationsAction]>;
}) {
  const { activeMap, client, intent, dispatchLocations } = params;
  const previous = activeMap.get(intent.locationId);
  if (previous) {
    abortEntry(previous);
  }
  const entry: ActiveRefetch = {
    seq: intent.seq,
    controller: new AbortController(),
    cancelled: false,
  };
  activeMap.set(intent.locationId, entry);
  runSingleRefetch({ client, intent, entry, activeMap, dispatchLocations });
}

function pruneRemovedLocations(activeMap: Map<string, ActiveRefetch>, locations: SavedLocation[]) {
  const validIds = new Set(locations.map((loc) => loc.id));
  for (const [id, entry] of activeMap.entries()) {
    if (!validIds.has(id)) {
      abortEntry(entry);
      activeMap.delete(id);
    }
  }
}

export function useRefetchLocationEffect(params: {
  client: WeatherDashboardClient;
  intent: RefetchIntent | null;
  locations: SavedLocation[];
  dispatchLocations: ActionDispatch<[action: SavedLocationsAction]>;
}) {
  const { client, intent, locations, dispatchLocations } = params;
  const activeRef = useRef(new Map<string, ActiveRefetch>());

  useEffect(() => {
    if (intent) {
      startIntentRefetch({ activeMap: activeRef.current, client, intent, dispatchLocations });
    }
  }, [client, intent, dispatchLocations]);

  useEffect(() => {
    pruneRemovedLocations(activeRef.current, locations);
  }, [locations]);

  useEffect(() => {
    const activeMap = activeRef.current;
    return () => {
      for (const entry of activeMap.values()) {
        abortEntry(entry);
      }
      activeMap.clear();
    };
  }, []);
}
