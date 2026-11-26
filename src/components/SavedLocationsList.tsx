import { formatTemperature } from '../dashboard/temperatureHelpers';
import type { SavedLocation } from '../types/weather';

interface SavedLocationItemProps {
  location: SavedLocation;
  onRemove: (id: string) => void;
  onRefetch: (id: string) => void;
}

function SavedLocationItem({ location, onRemove, onRefetch }: SavedLocationItemProps) {
  const isLoading = location.status === 'loading';

  return (
    <li>
      <span>{location.name}</span>
      <span>{location.units}</span>
      {location.weather && <span>{formatTemperature(location.weather.tempC, location.units)}</span>}
      {isLoading && <span>Refreshing...</span>}
      {location.error && <span role="alert">{location.error}</span>}
      <button
        type="button"
        aria-label={`Refetch ${location.name}`}
        onClick={() => onRefetch(location.id)}
      >
        Refetch
      </button>
      <button
        type="button"
        aria-label={`Remove ${location.name}`}
        onClick={() => onRemove(location.id)}
      >
        Remove
      </button>
    </li>
  );
}

interface SavedLocationsListProps {
  locations: SavedLocation[];
  onRemove: (id: string) => void;
  onRefetch: (id: string) => void;
}

export function SavedLocationsList({ locations, onRemove, onRefetch }: SavedLocationsListProps) {
  if (locations.length === 0) {
    return <p>No saved locations yet.</p>;
  }

  return (
    <div>
      <ul>
        {locations.map((location) => (
          <SavedLocationItem
            key={location.id}
            location={location}
            onRemove={onRemove}
            onRefetch={onRefetch}
          />
        ))}
      </ul>
    </div>
  );
}
