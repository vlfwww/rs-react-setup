import { useEffect, useRef, useState } from 'react';
import type { CurrentWeatherData, GeocodingResult, WeatherUnits } from '../api/openMeteo';
import type { WeatherDashboardClient } from '../App';
import type { SearchBarSubmitParams } from '../components/SearchBar';
import { usePersistedLocations, useSavedLocationsActions } from './savedLocationsState';

export interface PendingQuery {
  query: string;
  units: WeatherUnits;
  seq: number;
}

export interface SettledSearch {
  seq: number;
  status: 'success' | 'error';
  results: GeocodingResult[];
  units: WeatherUnits;
  error: string | null;
  lastQuery: string;
}

export interface SelectedForecastRequest {
  city: GeocodingResult;
  units: WeatherUnits;
  seq: number;
}

export interface SettledForecast {
  seq: number;
  status: 'success' | 'error';
  cityLabel: string;
  units: WeatherUnits;
  weather: CurrentWeatherData | null;
  error: string | null;
}

export type SearchView = ReturnType<typeof deriveSearchView>;
export type ForecastView = ReturnType<typeof deriveForecastView>;

export const isAbortError = (error: unknown) =>
  error instanceof Error && error.name === 'AbortError';
export const toErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;
export const formatCityLabel = (city: GeocodingResult) =>
  [city.name, city.admin1, city.country].filter(Boolean).join(', ');

export function deriveSearchView(pending: PendingQuery | null, settled: SettledSearch | null) {
  if (!pending) {
    return {
      status: 'idle' as const,
      results: [],
      units: 'metric' as const,
      error: null,
      lastQuery: '',
    };
  }
  return settled?.seq === pending.seq
    ? settled
    : {
        status: 'loading' as const,
        results: [],
        units: pending.units,
        error: null,
        lastQuery: pending.query,
      };
}

export function deriveForecastView(
  selected: SelectedForecastRequest | null,
  settled: SettledForecast | null,
) {
  if (!selected) {
    return null;
  }
  const label = formatCityLabel(selected.city);
  return settled?.seq === selected.seq
    ? settled
    : {
        seq: selected.seq,
        status: 'loading' as const,
        cityLabel: label,
        units: selected.units,
        weather: null,
        error: null,
      };
}

export function startSearchEffect(
  client: WeatherDashboardClient,
  pending: PendingQuery,
  onSettled: (next: SettledSearch) => void,
) {
  let cancelled = false;
  const controller = new AbortController();
  const { query, units, seq } = pending;

  client
    .searchCity(query, { signal: controller.signal })
    .then((results) => {
      if (!cancelled) {
        onSettled({
          seq,
          status: 'success',
          results,
          units,
          error: null,
          lastQuery: query,
        });
      }
    })
    .catch((err: unknown) => {
      if (!cancelled && !isAbortError(err)) {
        const error = toErrorMessage(err, 'Failed to search cities');
        onSettled({
          seq,
          status: 'error',
          results: [],
          units,
          error,
          lastQuery: query,
        });
      }
    });

  return () => {
    cancelled = true;
    controller.abort();
  };
}

export function startForecastEffect(
  client: WeatherDashboardClient,
  selected: SelectedForecastRequest,
  onSettled: (next: SettledForecast) => void,
) {
  let cancelled = false;
  const controller = new AbortController();
  const { city, units, seq } = selected;
  const cityLabel = formatCityLabel(city);

  client
    .fetchCurrentWeather(
      { latitude: city.latitude, longitude: city.longitude, units },
      { signal: controller.signal },
    )
    .then((weather) => {
      if (!cancelled) {
        onSettled({
          seq,
          status: 'success',
          cityLabel,
          units,
          weather,
          error: null,
        });
      }
    })
    .catch((err: unknown) => {
      if (!cancelled && !isAbortError(err)) {
        const error = toErrorMessage(err, 'Failed to load weather');
        onSettled({
          seq,
          status: 'error',
          cityLabel,
          units,
          weather: null,
          error,
        });
      }
    });

  return () => {
    cancelled = true;
    controller.abort();
  };
}

function useSearchAndForecastState(client: WeatherDashboardClient) {
  const [pendingQuery, setPendingQuery] = useState<PendingQuery | null>(null);
  const [settledSearch, setSettledSearch] = useState<SettledSearch | null>(null);
  const [selectedForecast, setSelectedForecast] = useState<SelectedForecastRequest | null>(null);
  const [settledForecast, setSettledForecast] = useState<SettledForecast | null>(null);
  const seqRef = useRef(0);

  useEffect(
    () => (pendingQuery ? startSearchEffect(client, pendingQuery, setSettledSearch) : undefined),
    [client, pendingQuery],
  );
  useEffect(
    () =>
      selectedForecast
        ? startForecastEffect(client, selectedForecast, setSettledForecast)
        : undefined,
    [client, selectedForecast],
  );

  function handleSearchSubmit({ query, units }: SearchBarSubmitParams) {
    const trimmed = query.trim();
    if (trimmed) {
      seqRef.current += 1;
      setPendingQuery({ query: trimmed, units, seq: seqRef.current });
    }
  }

  function handleSelectCity(city: GeocodingResult, units: WeatherUnits) {
    seqRef.current += 1;
    setSelectedForecast({ city, units, seq: seqRef.current });
  }

  return {
    searchView: deriveSearchView(pendingQuery, settledSearch),
    forecastView: deriveForecastView(selectedForecast, settledForecast),
    selectedForecast,
    settledForecast,
    handleSearchSubmit,
    handleSelectCity,
  };
}

export function useWeatherDashboardState(client: WeatherDashboardClient) {
  const { locations, dispatchLocations, storageError } = usePersistedLocations();
  const { addLocation, removeLocation } = useSavedLocationsActions(locations, dispatchLocations);
  const flow = useSearchAndForecastState(client);

  function handleAddCurrent() {
    if (flow.selectedForecast && flow.settledForecast?.weather) {
      addLocation({
        city: flow.selectedForecast.city,
        cityLabel: flow.settledForecast.cityLabel,
        units: flow.selectedForecast.units,
        weather: flow.settledForecast.weather,
      });
    }
  }

  return {
    searchView: flow.searchView,
    forecastView: flow.forecastView,
    locations,
    storageError,
    handleSearchSubmit: flow.handleSearchSubmit,
    handleSelectCity: flow.handleSelectCity,
    handleAddCurrent,
    handleRemoveLocation: removeLocation,
  };
}
