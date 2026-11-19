import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { FORECAST_URL, GEOCODING_URL } from './consts';
import { createOpenMeteoClient } from './openMeteo';

const server = setupServer();
let client = createOpenMeteoClient();

const MINSK_RAW_RESULT = {
  id: 625144,
  name: 'Minsk',
  latitude: 53.9,
  longitude: 27.56667,
  country: 'Belarus',
  admin1: 'Minsk City',
  timezone: 'Europe/Minsk',
};

const METRIC_CURRENT_RAW = {
  time: '2026-11-19T11:00',
  temperature_2m: 4.5,
  apparent_temperature: 1.2,
  relative_humidity_2m: 82,
  wind_speed_10m: 14.4,
  weather_code: 3,
  is_day: 1,
};

const IMPERIAL_CURRENT_RAW = {
  time: '2026-11-19T11:00',
  temperature_2m: 40.1,
  apparent_temperature: 34.2,
  relative_humidity_2m: 82,
  wind_speed_10m: 8.9,
  weather_code: 1,
  is_day: 1,
};

function mockForecastSuccess(current: Record<string, unknown>) {
  server.use(http.get(FORECAST_URL, () => HttpResponse.json({ current })));
}

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});

beforeEach(() => {
  client = createOpenMeteoClient();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

describe('createOpenMeteoClient — searchCity', () => {
  it('returns normalized city matches for a valid query', async () => {
    server.use(
      http.get(GEOCODING_URL, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('name')).toBe('Minsk');
        expect(url.searchParams.get('count')).toBe('5');
        return HttpResponse.json({ results: [MINSK_RAW_RESULT] });
      }),
    );

    await expect(client.searchCity('  Minsk  ')).resolves.toEqual([MINSK_RAW_RESULT]);
  });

  it('returns an empty array for blank query without making a network request', async () => {
    await expect(client.searchCity('   ')).resolves.toEqual([]);
  });

  it('throws an error when geocoding responds with non-ok status', async () => {
    server.use(http.get(GEOCODING_URL, () => HttpResponse.json({ error: true }, { status: 500 })));
    await expect(client.searchCity('Berlin')).rejects.toThrow(
      'Geocoding request failed with status 500',
    );
  });
});

describe('fetchCurrentWeather — units and normalization', () => {
  it('fetches and normalizes current weather with metric units', async () => {
    mockForecastSuccess(METRIC_CURRENT_RAW);

    const weather = await client.fetchCurrentWeather({
      latitude: 53.9,
      longitude: 27.56667,
      units: 'metric',
    });

    expect(weather).toEqual({
      temperature: 4.5,
      apparentTemperature: 1.2,
      humidity: 82,
      windSpeed: 14.4,
      weatherCode: 3,
      isDay: true,
      time: '2026-11-19T11:00',
      units: 'metric',
    });
  });

  it('fetches current weather with imperial units', async () => {
    mockForecastSuccess(IMPERIAL_CURRENT_RAW);

    const weather = await client.fetchCurrentWeather({
      latitude: 53.9,
      longitude: 27.56667,
      units: 'imperial',
    });

    expect(weather.units).toBe('imperial');
    expect(weather.temperature).toBe(40.1);
    expect(weather.windSpeed).toBe(8.9);
  });
});

describe('fetchCurrentWeather — errors and cancellation', () => {
  it('throws when forecast response lacks current data', async () => {
    server.use(http.get(FORECAST_URL, () => HttpResponse.json({})));

    await expect(
      client.fetchCurrentWeather({
        latitude: 53.9,
        longitude: 27.56667,
        units: 'metric',
      }),
    ).rejects.toThrow('Forecast response missing current weather data');
  });

  it('aborts in-flight request when AbortController aborts signal', async () => {
    server.use(
      http.get(FORECAST_URL, async () => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 100);
        });
        return HttpResponse.json({});
      }),
    );

    const controller = new AbortController();
    const promise = client.fetchCurrentWeather(
      { latitude: 53.9, longitude: 27.56667, units: 'metric' },
      { signal: controller.signal },
    );
    controller.abort();

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });
});
