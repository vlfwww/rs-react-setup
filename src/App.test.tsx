import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { App } from './App';
import { FORECAST_URL, GEOCODING_URL } from './api/consts';

const server = setupServer();

const MINSK_CITY = {
  id: 625144,
  name: 'Minsk',
  latitude: 53.9,
  longitude: 27.56667,
  country: 'Belarus',
  admin1: 'Minsk City',
};

const PARIS_CITY = {
  id: 2988507,
  name: 'Paris',
  latitude: 48.85341,
  longitude: 2.3488,
  country: 'France',
  admin1: 'Ile-de-France',
};

const LYON_CITY = {
  id: 2996944,
  name: 'Lyon',
  latitude: 45.74846,
  longitude: 4.84671,
  country: 'France',
  admin1: 'Auvergne-Rhone-Alpes',
};

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

async function submitCityQuery(cityName: string, units: 'metric' | 'imperial' = 'metric') {
  const user = userEvent.setup();
  render(<App />);
  if (units === 'imperial') {
    await user.click(screen.getByRole('radio', { name: /imperial/iu }));
  }
  await user.type(screen.getByRole('searchbox', { name: 'City' }), cityName);
  await user.click(screen.getByRole('button', { name: /search/iu }));
  return user;
}

async function selectFirstMatchingCity(cityName: string) {
  await submitCityQuery(cityName);
  await userEvent.setup().click(await screen.findByRole('button', { name: /select/iu }));
}

async function selectCityMatch(labelText: string) {
  const item = (await screen.findByText(labelText)).closest('li');
  expect(item).not.toBeNull();
  await userEvent
    .setup()
    .click(within(item as HTMLElement).getByRole('button', { name: /select/iu }));
}

describe('App — city search flow', () => {
  it('searches cities via Open-Meteo client and renders matches in results area', async () => {
    server.use(
      http.get(GEOCODING_URL, ({ request }) => {
        expect(new URL(request.url).searchParams.get('name')).toBe('Minsk');
        return HttpResponse.json({ results: [MINSK_CITY] });
      }),
    );

    await submitCityQuery('Minsk');
    expect(await screen.findByText('Minsk, Minsk City, Belarus')).toBeInTheDocument();
  });

  it('displays a human-readable error message when geocoding request fails', async () => {
    server.use(http.get(GEOCODING_URL, () => HttpResponse.json({ error: true }, { status: 500 })));

    await submitCityQuery('Berlin');
    const errorMessage = await screen.findByText('Geocoding request failed with status 500');
    expect(errorMessage).toBeVisible();
  });
});

describe('App — selected city weather flow', () => {
  it('fetches and displays current weather after selecting a matching city', async () => {
    server.use(
      http.get(GEOCODING_URL, () => HttpResponse.json({ results: [MINSK_CITY] })),
      http.get(FORECAST_URL, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('latitude')).toBe(String(MINSK_CITY.latitude));
        expect(url.searchParams.get('longitude')).toBe(String(MINSK_CITY.longitude));
        return HttpResponse.json({ current: { temperature_2m: 14 } });
      }),
    );

    await selectFirstMatchingCity('Minsk');
    expect(await screen.findByText(/14\s*°C/u)).toBeInTheDocument();
    expect(screen.queryByText(/loading weather for/iu)).not.toBeInTheDocument();
  });

  it('shows a human-readable error when weather fetch fails after city selection', async () => {
    server.use(
      http.get(GEOCODING_URL, () => HttpResponse.json({ results: [MINSK_CITY] })),
      http.get(FORECAST_URL, () => HttpResponse.json({ error: true }, { status: 503 })),
    );

    await selectFirstMatchingCity('Minsk');
    expect(await screen.findByText(/forecast/iu)).toBeVisible();
    expect(screen.queryByText(/loading weather for/iu)).not.toBeInTheDocument();
  });
});

describe('App — non-first match and units', () => {
  it('selects a non-first match and requests weather with its coordinates and fahrenheit units', async () => {
    let forecastRequestUrl: string | null = null;
    server.use(
      http.get(GEOCODING_URL, () => HttpResponse.json({ results: [PARIS_CITY, LYON_CITY] })),
      http.get(FORECAST_URL, ({ request }) => {
        forecastRequestUrl = request.url;
        return HttpResponse.json({ current: { temperature_2m: 66 } });
      }),
    );

    await submitCityQuery('Lyon', 'imperial');
    await selectCityMatch('Lyon, Auvergne-Rhone-Alpes, France');

    expect(await screen.findByText(/66\s*°F/u)).toBeInTheDocument();
    expect(forecastRequestUrl).not.toBeNull();
    const url = new URL(forecastRequestUrl!);
    expect(url.searchParams.get('latitude')).toBe(String(LYON_CITY.latitude));
    expect(url.searchParams.get('longitude')).toBe(String(LYON_CITY.longitude));
    expect(url.searchParams.get('temperature_unit')).toBe('fahrenheit');
  });
});
