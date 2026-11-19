import { useMemo } from 'react';
import {
  createOpenMeteoClient,
  type CurrentWeatherData,
  type GeocodingResult,
  type WeatherUnits,
} from './api/openMeteo';
import { CurrentWeatherPanel } from './components/CurrentWeatherPanel';
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

interface DashboardContentProps {
  searchView: SearchView;
  forecastView: ForecastView;
  locations: SavedLocation[];
  storageError: unknown;
  onSearchSubmit: (params: SearchBarSubmitParams) => void;
  onSelectCity: (city: GeocodingResult, units: WeatherUnits) => void;
  onAddCurrent: () => void;
  onRemoveLocation: (id: string) => void;
}

function DashboardContent({
  searchView,
  forecastView,
  locations,
  storageError,
  onSearchSubmit,
  onSelectCity,
  onAddCurrent,
  onRemoveLocation,
}: DashboardContentProps) {
  return (
    <main>
      <header>
        <h1>Weather Dashboard</h1>
      </header>
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
        <SavedLocationsList locations={locations} onRemove={onRemoveLocation} />
      </section>
    </main>
  );
}

export function App({ weatherClient }: AppProps) {
  const client = useMemo(() => weatherClient ?? createOpenMeteoClient(), [weatherClient]);
  const state = useWeatherDashboardState(client);

  return (
    <DashboardContent
      searchView={state.searchView}
      forecastView={state.forecastView}
      locations={state.locations}
      storageError={state.storageError}
      onSearchSubmit={state.handleSearchSubmit}
      onSelectCity={state.handleSelectCity}
      onAddCurrent={state.handleAddCurrent}
      onRemoveLocation={state.handleRemoveLocation}
    />
  );
}

export default App;
