import { type ErrorInfo, useCallback, useMemo, useState } from 'react';
import {
  createOpenMeteoClient,
  type CurrentWeatherData,
  type GeocodingResult,
  type WeatherUnits,
} from './api/openMeteo';
import { CurrentWeatherPanel } from './components/CurrentWeatherPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SavedLocationsList } from './components/SavedLocationsList';
import { SearchBar, type SearchBarSubmitParams } from './components/SearchBar';
import { SearchResultsList } from './components/SearchResultsList';
import {
  type ForecastView,
  type SearchView,
  toErrorMessage,
  useWeatherDashboardState,
} from './dashboard/dashboardHelpers';
import type { SavedLocation } from './types/weather';
import './App.css';

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

interface CrashProbeProps {
  shouldCrash: boolean;
}

function CrashProbe({ shouldCrash }: CrashProbeProps) {
  if (shouldCrash) {
    throw new Error('Simulated render crash');
  }
  return null;
}

interface DashboardMainAreaProps {
  searchView: SearchView;
  forecastView: ForecastView;
  locations: SavedLocation[];
  storageError: unknown;
  shouldCrash: boolean;
  onSearchSubmit: (params: SearchBarSubmitParams) => void;
  onSelectCity: (city: GeocodingResult, units: WeatherUnits) => void;
  onAddCurrent: () => void;
  onRemoveLocation: (id: string) => void;
  onRefetchLocation: (id: string) => void;
}

function DashboardMainArea({
  searchView,
  forecastView,
  locations,
  storageError,
  shouldCrash,
  onSearchSubmit,
  onSelectCity,
  onAddCurrent,
  onRemoveLocation,
  onRefetchLocation,
}: DashboardMainAreaProps) {
  return (
    <main className="dashboard-main">
      <CrashProbe shouldCrash={shouldCrash} />
      {Boolean(storageError) && (
        <output role="alert">
          Storage error: {toErrorMessage(storageError, 'Storage unavailable')}
        </output>
      )}
      <section aria-label="Search area">
        <SearchBar onSubmit={onSearchSubmit} disabled={searchView.status === 'loading'} />
      </section>
      <section aria-label="Results area">
        <SearchResultsList {...searchView} onSelectCity={onSelectCity} />
      </section>
      <section aria-label="Current weather">
        <CurrentWeatherPanel forecast={forecastView} onAddCurrent={onAddCurrent} />
      </section>
      <section aria-label="Saved locations">
        <h2>Saved locations</h2>
        <SavedLocationsList
          locations={locations}
          onRemove={onRemoveLocation}
          onRefetch={onRefetchLocation}
        />
      </section>
    </main>
  );
}

export function App({ weatherClient }: AppProps) {
  const client = useMemo(() => weatherClient ?? createOpenMeteoClient(), [weatherClient]);
  const state = useWeatherDashboardState(client);
  const [shouldCrash, setShouldCrash] = useState(false);

  const handleBoundaryError = useCallback((error: Error, errorInfo: ErrorInfo) => {
    console.error('App error boundary caught error:', error, errorInfo);
  }, []);

  const handleBoundaryReset = useCallback(() => {
    setShouldCrash(false);
  }, []);

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <h1>Weather Dashboard</h1>
        <button type="button" onClick={() => setShouldCrash(true)}>
          Simulate error
        </button>
      </header>
      <ErrorBoundary onError={handleBoundaryError} onReset={handleBoundaryReset}>
        <DashboardMainArea
          searchView={state.searchView}
          forecastView={state.forecastView}
          locations={state.locations}
          storageError={state.storageError}
          shouldCrash={shouldCrash}
          onSearchSubmit={state.handleSearchSubmit}
          onSelectCity={state.handleSelectCity}
          onAddCurrent={state.handleAddCurrent}
          onRemoveLocation={state.handleRemoveLocation}
          onRefetchLocation={state.handleRefetchLocation}
        />
      </ErrorBoundary>
    </div>
  );
}

export default App;
