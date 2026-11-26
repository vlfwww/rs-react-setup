import { FORECAST_URL, GEOCODING_URL } from './consts';

export type WeatherUnits = 'metric' | 'imperial';

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  timezone?: string;
}

interface RawGeocodingItem {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  timezone?: string;
}

interface OpenMeteoGeocodingResponse {
  results?: RawGeocodingItem[];
}

export interface CurrentWeatherData {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
  time: string;
  units: WeatherUnits;
}

interface OpenMeteoCurrentRaw {
  time: string;
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  wind_speed_10m: number;
  weather_code: number;
  is_day: number;
}

interface OpenMeteoForecastResponse {
  current?: OpenMeteoCurrentRaw;
}

export interface OpenMeteoClientOptions {
  geocodingBaseUrl?: string;
  forecastBaseUrl?: string;
  fetchFn?: typeof fetch;
}

const CURRENT_WEATHER_FIELDS = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'wind_speed_10m',
  'weather_code',
  'is_day',
].join(',');

function getUnitQueryParams(units: WeatherUnits): Record<string, string> {
  if (units === 'imperial') {
    return {
      temperature_unit: 'fahrenheit',
      wind_speed_unit: 'mph',
    };
  }

  return {
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
  };
}

function buildGeocodingUrl(baseUrl: string, query: string, count: number): string {
  const url = new URL(baseUrl);
  url.searchParams.set('name', query);
  url.searchParams.set('count', String(count));
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');
  return url.toString();
}

function mapGeocodingResults(results: RawGeocodingItem[] = []): GeocodingResult[] {
  return results.map((item) => ({
    id: item.id,
    name: item.name,
    latitude: item.latitude,
    longitude: item.longitude,
    country: item.country,
    admin1: item.admin1,
    timezone: item.timezone,
  }));
}

function buildForecastUrl(
  baseUrl: string,
  params: { latitude: number; longitude: number; units: WeatherUnits },
): string {
  const url = new URL(baseUrl);
  url.searchParams.set('latitude', String(params.latitude));
  url.searchParams.set('longitude', String(params.longitude));
  url.searchParams.set('current', CURRENT_WEATHER_FIELDS);

  for (const [key, value] of Object.entries(getUnitQueryParams(params.units))) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

function mapCurrentWeather(raw: OpenMeteoCurrentRaw, units: WeatherUnits): CurrentWeatherData {
  return {
    temperature: raw.temperature_2m,
    apparentTemperature: raw.apparent_temperature,
    humidity: raw.relative_humidity_2m,
    windSpeed: raw.wind_speed_10m,
    weatherCode: raw.weather_code,
    isDay: raw.is_day === 1,
    time: raw.time,
    units,
  };
}

async function requestGeocoding(
  baseUrl: string,
  query: string,
  options: { signal?: AbortSignal; count?: number } | undefined,
  fetchFn: typeof fetch,
): Promise<GeocodingResult[]> {
  const url = buildGeocodingUrl(baseUrl, query, options?.count ?? 5);
  const response = await fetchFn(url, { signal: options?.signal });

  if (!response.ok) {
    throw new Error(`Geocoding request failed with status ${response.status}`);
  }

  const data = (await response.json()) as OpenMeteoGeocodingResponse;
  return mapGeocodingResults(data.results);
}

async function requestForecast(
  baseUrl: string,
  params: { latitude: number; longitude: number; units: WeatherUnits },
  signal: AbortSignal | undefined,
  fetchFn: typeof fetch,
): Promise<CurrentWeatherData> {
  const url = buildForecastUrl(baseUrl, params);
  const response = await fetchFn(url, { signal });

  if (!response.ok) {
    throw new Error(`Forecast request failed with status ${response.status}`);
  }

  const data = (await response.json()) as OpenMeteoForecastResponse;
  if (!data.current) {
    throw new Error('Forecast response missing current weather data');
  }

  return mapCurrentWeather(data.current, params.units);
}

export function createOpenMeteoClient({
  geocodingBaseUrl = GEOCODING_URL,
  forecastBaseUrl = FORECAST_URL,
  fetchFn = (...args) => globalThis.fetch(...args),
}: OpenMeteoClientOptions = {}) {
  return {
    searchCity(query: string, options?: { signal?: AbortSignal; count?: number }) {
      const trimmed = query.trim();
      if (!trimmed) {
        return Promise.resolve([]);
      }
      return requestGeocoding(geocodingBaseUrl, trimmed, options, fetchFn);
    },
    fetchCurrentWeather(
      params: { latitude: number; longitude: number; units: WeatherUnits },
      options?: { signal?: AbortSignal },
    ) {
      return requestForecast(forecastBaseUrl, params, options?.signal, fetchFn);
    },
  };
}
