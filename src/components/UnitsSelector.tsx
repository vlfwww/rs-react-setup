import type { WeatherUnits } from '../api/openMeteo';

export interface UnitsSelectorProps {
  value: WeatherUnits;
  onChange: (units: WeatherUnits) => void;
  disabled?: boolean;
}

export function UnitsSelector({ value, onChange, disabled = false }: UnitsSelectorProps) {
  return (
    <fieldset disabled={disabled}>
      <legend>Units</legend>
      <label>
        <input
          type="radio"
          name="weather-units"
          value="metric"
          checked={value === 'metric'}
          onChange={() => onChange('metric')}
        />
        Metric (°C, km/h)
      </label>
      <label>
        <input
          type="radio"
          name="weather-units"
          value="imperial"
          checked={value === 'imperial'}
          onChange={() => onChange('imperial')}
        />
        Imperial (°F, mph)
      </label>
    </fieldset>
  );
}
