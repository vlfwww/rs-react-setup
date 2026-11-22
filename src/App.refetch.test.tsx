import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FORECAST_URL } from './api/consts';
import { App } from './App';

const server = setupServer();
const STORAGE_KEY = 'weather-dashboard:saved-locations';
const MINSK_LABEL = 'Minsk, Minsk City, Belarus';
const PARIS_LABEL = 'Paris, Ile-de-France, France';
const LYON_LABEL = 'Lyon, Auvergne-Rhone-Alpes, France';

const MINSK_ENTRY = {
  id: '625144:metric',
  name: MINSK_LABEL,
  latitude: 53.9,
  longitude: 27.56667,
  units: 'metric',
  weather: { tempC: 14, code: 0, fetchedAt: 1700000000000 },
  status: 'success',
};

const PARIS_ENTRY = {
  id: '2988507:metric',
  name: PARIS_LABEL,
  latitude: 48.85341,
  longitude: 2.3488,
  units: 'metric',
  weather: { tempC: 12, code: 0, fetchedAt: 1700000000000 },
  status: 'success',
};

const LYON_IMPERIAL_ENTRY = {
  id: '2996944:imperial',
  name: LYON_LABEL,
  latitude: 45.74846,
  longitude: 4.84671,
  units: 'imperial',
  weather: { tempC: 10, code: 1, fetchedAt: 1700000000000 },
  status: 'success',
};

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());

function createGate() {
  let release!: () => void;
  const promise = new Promise<void>((r) => {
    release = r;
  });
  return { promise, release };
}

function getLocationItem(label: string) {
  const section = screen.getByRole('region', { name: /saved locations/iu });
  const item = within(section).getByText(label).closest('li');
  expect(item).not.toBeNull();
  return { section, item: item as HTMLElement };
}

function seedLocations(entries: unknown[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function setupSequentialRefetchGates() {
  const firstGate = createGate();
  const secondGate = createGate();
  let requestCount = 0;
  let firstSignal: AbortSignal | null = null;

  server.use(
    http.get(FORECAST_URL, async ({ request }) => {
      requestCount += 1;
      if (requestCount === 1) {
        firstSignal = request.signal;
        await firstGate.promise;
        return HttpResponse.json({ current: { temperature_2m: 5 } });
      }
      await secondGate.promise;
      return HttpResponse.json({ current: { temperature_2m: 25 } });
    }),
  );

  return {
    getFirstSignal: () => firstSignal,
    releaseFirst: firstGate.release,
    releaseSecond: secondGate.release,
  };
}

describe('App — refetch single location and units', () => {
  it('updates saved location weather, formats imperial units, and caches Celsius', async () => {
    seedLocations([LYON_IMPERIAL_ENTRY]);
    const gate = createGate();
    server.use(
      http.get(FORECAST_URL, async () => {
        await gate.promise;
        return HttpResponse.json({ current: { temperature_2m: 68 } });
      }),
    );

    render(<App />);
    const { item } = getLocationItem(LYON_LABEL);
    await userEvent.setup().click(within(item).getByRole('button', { name: /refetch/iu }));
    expect(within(item).getByText(/refreshing/iu)).toBeInTheDocument();

    gate.release();
    expect(await within(item).findByText(/68\s*°F/u)).toBeInTheDocument();
    expect(within(item).queryByText(/refreshing/iu)).not.toBeInTheDocument();

    await waitFor(() => {
      const raw = localStorage.getItem(STORAGE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw as string) as Array<{
        id: string;
        weather?: { tempC: number };
      }>;
      const lyon = parsed.find((loc) => loc.id === LYON_IMPERIAL_ENTRY.id);
      expect(lyon?.weather?.tempC).toBe(20);
    });
  });

  it('shows error on saved location when refetch request fails', async () => {
    seedLocations([MINSK_ENTRY]);
    server.use(http.get(FORECAST_URL, () => HttpResponse.json({ error: true }, { status: 500 })));

    render(<App />);
    const { item } = getLocationItem(MINSK_LABEL);
    await userEvent.setup().click(within(item).getByRole('button', { name: /refetch/iu }));
    expect(await within(item).findByRole('alert')).toBeInTheDocument();
  });
});

describe('App — concurrent location refetch', () => {
  it('refetches two locations concurrently without cancelling the first request', async () => {
    seedLocations([MINSK_ENTRY, PARIS_ENTRY]);
    const abortedUrls: string[] = [];
    const minskGate = createGate();
    const parisGate = createGate();
    server.use(
      http.get(FORECAST_URL, async ({ request }) => {
        request.signal.addEventListener('abort', () => abortedUrls.push(request.url));
        const isMinsk = new URL(request.url).searchParams.get('latitude') === '53.9';
        await (isMinsk ? minskGate.promise : parisGate.promise);
        return HttpResponse.json({ current: { temperature_2m: isMinsk ? 19 : 22 } });
      }),
    );

    render(<App />);
    const { item: minskItem } = getLocationItem(MINSK_LABEL);
    const { item: parisItem } = getLocationItem(PARIS_LABEL);
    const user = userEvent.setup();
    await user.click(within(minskItem).getByRole('button', { name: /refetch/iu }));
    await user.click(within(parisItem).getByRole('button', { name: /refetch/iu }));

    parisGate.release();
    expect(await within(parisItem).findByText(/22\s*°C/u)).toBeInTheDocument();
    minskGate.release();
    expect(await within(minskItem).findByText(/19\s*°C/u)).toBeInTheDocument();
    expect(abortedUrls).toHaveLength(0);
  });
});

describe('App — replace in-flight refetch for same location', () => {
  it('aborts first request on second click and uses only the latest response', async () => {
    seedLocations([MINSK_ENTRY]);
    const gates = setupSequentialRefetchGates();

    render(<App />);
    const { item } = getLocationItem(MINSK_LABEL);
    const user = userEvent.setup();
    const refetchBtn = within(item).getByRole('button', { name: /refetch/iu });

    await user.click(refetchBtn);
    await waitFor(() => expect(gates.getFirstSignal()).not.toBeNull());

    await user.click(refetchBtn);
    await waitFor(() => expect(gates.getFirstSignal()?.aborted).toBe(true));

    gates.releaseSecond();
    expect(await within(item).findByText(/25\s*°C/u)).toBeInTheDocument();

    gates.releaseFirst();
    await Promise.resolve();
    await Promise.resolve();

    expect(item).toHaveTextContent(/25\s*°C/u);
    expect(item).not.toHaveTextContent(/\b5\s*°C/u);
  });
});

describe('App — abort refetch on location removal and unmount', () => {
  it('aborts in-flight refetch when location is removed and ignores late response', async () => {
    seedLocations([MINSK_ENTRY]);
    let wasAborted = false;
    const gate = createGate();
    server.use(
      http.get(FORECAST_URL, async ({ request }) => {
        request.signal.addEventListener('abort', () => {
          wasAborted = true;
        });
        await gate.promise;
        return HttpResponse.json({ current: { temperature_2m: 99 } });
      }),
    );

    render(<App />);
    const { section, item } = getLocationItem(MINSK_LABEL);
    const user = userEvent.setup();
    await user.click(within(item).getByRole('button', { name: /refetch/iu }));
    await user.click(within(item).getByRole('button', { name: /remove/iu }));

    expect(wasAborted).toBe(true);
    expect(within(section).queryByText(MINSK_LABEL)).not.toBeInTheDocument();
    gate.release();
    expect(within(section).queryByText(/99/u)).not.toBeInTheDocument();
  });

  it('aborts active refetch requests on component unmount', async () => {
    seedLocations([MINSK_ENTRY]);
    let wasAborted = false;
    const gate = createGate();
    server.use(
      http.get(FORECAST_URL, async ({ request }) => {
        request.signal.addEventListener('abort', () => {
          wasAborted = true;
        });
        await gate.promise;
        return HttpResponse.json({ current: { temperature_2m: 18 } });
      }),
    );

    const { unmount } = render(<App />);
    const { item } = getLocationItem(MINSK_LABEL);
    await userEvent.setup().click(within(item).getByRole('button', { name: /refetch/iu }));
    unmount();

    expect(wasAborted).toBe(true);
    gate.release();
  });
});
