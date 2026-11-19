import { formatTemperature } from '../dashboard/temperatureHelpers';
import type { SavedLocation } from '../types/weather';

interface SavedLocationsListProps {
  locations: SavedLocation[];
  onRemove: (id: string) => void;
}

function SavedLocationItem({
  location,
  onRemove,
}: {
  location: SavedLocation;
  onRemove: (id: string) => void;
}) {
  return (
    <li>
      <span>{location.name}</span>
      <span> ({location.units})</span>
      {location.weather && (
        <span> — {formatTemperature(location.weather.tempC, location.units)}</span>
      )}
      {location.status === 'loading' && <span> — Updating...</span>}
      {location.error && <span role="alert"> — {location.error}</span>}
      <button
        type="button"
        aria-label={`Remove ${location.name} (${location.units})`}
        onClick={() => onRemove(location.id)}
      >
        Remove
      </button>
    </li>
  );
}

export function SavedLocationsList({ locations, onRemove }: SavedLocationsListProps) {
  if (locations.length === 0) {
    return <p>No saved locations yet.</p>;
  }

  return (
    <ul>
      {locations.map((location) => (
        <SavedLocationItem key={location.id} location={location} onRemove={onRemove} />
      ))}
    </ul>
  );
}
