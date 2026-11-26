import type { ForecastView } from '../dashboard/dashboardHelpers';

interface CurrentWeatherPanelProps {
  forecast: ForecastView;
  onAddCurrent?: () => void;
}

export function CurrentWeatherPanel({ forecast, onAddCurrent }: CurrentWeatherPanelProps) {
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
      {onAddCurrent && (
        <button type="button" onClick={onAddCurrent}>
          Add
        </button>
      )}
    </div>
  );
}
