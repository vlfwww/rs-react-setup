import type { CurrentWeatherData, GeocodingResult, WeatherUnits } from '../api/openMeteo';
import type { SavedLocation } from '../types/weather';

export function fahrenheitToCelsius(tempF: number): number {
  return ((tempF - 32) * 5) / 9;
}

export function celsiusToFahrenheit(tempC: number): number {
  return (tempC * 9) / 5 + 32;
}

export function formatTemperature(tempC: number, units: WeatherUnits): string {
  const value = units === 'imperial' ? celsiusToFahrenheit(tempC) : tempC;
  const rounded = Math.round(value * 10) / 10;
  return `${rounded} ${units === 'metric' ? '°C' : '°F'}`;
}

export function buildSavedLocation(params: {
  city: GeocodingResult;
  cityLabel: string;
  units: WeatherUnits;
  weather: CurrentWeatherData;
}): SavedLocation {
  const { city, cityLabel, units, weather } = params;
  const tempC =
    units === 'imperial' ? fahrenheitToCelsius(weather.temperature) : weather.temperature;

  return {
    id: `${city.id}:${units}`,
    name: cityLabel,
    latitude: city.latitude,
    longitude: city.longitude,
    units,
    weather: {
      tempC,
      code: weather.weatherCode ?? 0,
      fetchedAt: Date.now(),
    },
    status: 'success',
  };
}
