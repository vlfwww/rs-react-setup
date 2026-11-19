import type { GeocodingResult, WeatherUnits } from '../api/openMeteo';

export interface SearchResultsListProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  results: GeocodingResult[];
  units: WeatherUnits;
  error: string | null;
  lastQuery: string;
  onSelectCity?: (city: GeocodingResult, units: WeatherUnits) => void;
}

function formatLocationLabel(city: GeocodingResult): string {
  return [city.name, city.admin1, city.country].filter(Boolean).join(', ');
}

export function SearchResultsList({
  status,
  results,
  units,
  error,
  lastQuery,
  onSelectCity,
}: SearchResultsListProps) {
  if (status === 'idle') {
    return <p>Search for a city to view matching locations.</p>;
  }

  if (status === 'loading') {
    return <output>Searching for &quot;{lastQuery}&quot;...</output>;
  }

  if (status === 'error') {
    return <output>{error ?? 'Search failed'}</output>;
  }

  if (results.length === 0) {
    return <p>No cities found for &quot;{lastQuery}&quot;.</p>;
  }

  return (
    <ul aria-label="Matching cities">
      {results.map((city) => (
        <li key={city.id}>
          <span>{formatLocationLabel(city)}</span>
          {onSelectCity && (
            <button type="button" onClick={() => onSelectCity(city, units)}>
              Select ({units === 'metric' ? '°C' : '°F'})
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
