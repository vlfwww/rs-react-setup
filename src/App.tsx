import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createOpenMeteoClient,
  type CurrentWeatherData,
  type GeocodingResult,
  type WeatherUnits,
} from './api/openMeteo';
import { SearchBar, type SearchBarSubmitParams } from './components/SearchBar';
import { SearchResultsList } from './components/SearchResultsList';

export interface WeatherDashboardClient {
  searchCity: (
    query: string,
    options?: { signal?: AbortSignal; count?: number },
  ) => Promise<GeocodingResult[]>;
  fetchCurrentWeather: (
    params: {
      latitude: number;
      longitude: number;
      units: WeatherUnits;
    },
    options?: { signal?: AbortSignal },
  ) => Promise<CurrentWeatherData>;
}

export interface AppProps {
  weatherClient?: WeatherDashboardClient;
}

interface PendingQuery {
  query: string;
  units: WeatherUnits;
  seq: number;
}

interface SettledSearch {
  seq: number;
  status: 'success' | 'error';
  results: GeocodingResult[];
  units: WeatherUnits;
  error: string | null;
  lastQuery: string;
}

interface SelectedForecastRequest {
  city: GeocodingResult;
  units: WeatherUnits;
  seq: number;
}

interface SettledForecast {
  seq: number;
  status: 'success' | 'error';
  cityLabel: string;
  units: WeatherUnits;
  weather: CurrentWeatherData | null;
  error: string | null;
}

type SearchView = ReturnType<typeof deriveSearchView>;
type ForecastView = ReturnType<typeof deriveForecastView>;

const isAbortError = (error: unknown) => error instanceof Error && error.name === 'AbortError';
const toErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;
const formatCityLabel = (city: GeocodingResult) =>
  [city.name, city.admin1, city.country].filter(Boolean).join(', ');

function deriveSearchView(pending: PendingQuery | null, settled: SettledSearch | null) {
  if (pending) {
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
  return {
    status: 'idle' as const,
    results: [],
    units: 'metric' as const,
    error: null,
    lastQuery: '',
  };
}

function deriveForecastView(
  selected: SelectedForecastRequest | null,
  settled: SettledForecast | null,
) {
  if (selected) {
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
  return null;
}

function startSearchEffect(
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

function startForecastEffect(
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

function CurrentWeatherPanel({ forecast }: { forecast: ForecastView }) {
  if (!forecast) {
    return null;
  }
  if (forecast.status === 'loading') {
    return <output>Loading weather for {forecast.cityLabel}...</output>;
  }
  if (forecast.status === 'error') {
    return <output>{forecast.error ?? 'Failed to load weather'}</output>;
  }
  if (!forecast.weather) {
    return null;
  }
  return (
    <div>
      <h2>{forecast.cityLabel}</h2>
      <p>
        {forecast.weather.temperature}
        {forecast.units === 'metric' ? ' °C' : ' °F'}
      </p>
    </div>
  );
}

function DashboardContent({
  searchView,
  forecastView,
  onSearchSubmit,
  onSelectCity,
}: {
  searchView: SearchView;
  forecastView: ForecastView;
  onSearchSubmit: (params: SearchBarSubmitParams) => void;
  onSelectCity: (city: GeocodingResult, units: WeatherUnits) => void;
}) {
  return (
    <main>
      <header>
        <h1>Weather Dashboard</h1>
      </header>
      <section aria-label="Search area">
        <SearchBar onSubmit={onSearchSubmit} disabled={searchView.status === 'loading'} />
      </section>
      <section aria-label="Results area">
        <SearchResultsList {...searchView} onSelectCity={onSelectCity} />
      </section>
      <section aria-label="Current weather">
        <CurrentWeatherPanel forecast={forecastView} />
      </section>
    </main>
  );
}

export function App({ weatherClient }: AppProps) {
  const client = useMemo(() => weatherClient ?? createOpenMeteoClient(), [weatherClient]);
  const [pendingQuery, setPendingQuery] = useState<PendingQuery | null>(null);
  const [settledSearch, setSettledSearch] = useState<SettledSearch | null>(null);
  const [selectedForecast, setSelectedForecast] = useState<SelectedForecastRequest | null>(null);
  const [settledForecast, setSettledForecast] = useState<SettledForecast | null>(null);
  const seqRef = useRef(0);

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

  return (
    <DashboardContent
      searchView={deriveSearchView(pendingQuery, settledSearch)}
      forecastView={deriveForecastView(selectedForecast, settledForecast)}
      onSearchSubmit={handleSearchSubmit}
      onSelectCity={handleSelectCity}
    />
  );
}

export default App;
