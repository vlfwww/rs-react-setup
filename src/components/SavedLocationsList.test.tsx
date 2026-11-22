import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SavedLocation } from '../types/weather';
import { SavedLocationsList } from './SavedLocationsList';

const LOCATIONS: SavedLocation[] = [
  {
    id: '2988507:metric',
    name: 'Paris, Ile-de-France, France',
    latitude: 48.85341,
    longitude: 2.3488,
    units: 'metric',
    weather: { tempC: 12, code: 0, fetchedAt: 1700000000000 },
    status: 'success',
  },
  {
    id: '2996944:imperial',
    name: 'Lyon, Auvergne-Rhone-Alpes, France',
    latitude: 45.74846,
    longitude: 4.84671,
    units: 'imperial',
    weather: { tempC: 20, code: 1, fetchedAt: 1700000000000 },
    status: 'loading',
    error: 'Previous error',
  },
];

describe('SavedLocationsList — empty state and formatting', () => {
  it('renders empty message when there are no saved locations', () => {
    render(<SavedLocationsList locations={[]} onRemove={vi.fn()} onRefetch={vi.fn()} />);
    expect(screen.getByText('No saved locations yet.')).toBeInTheDocument();
  });

  it('formats metric and imperial temperatures and shows loading and error states', () => {
    render(<SavedLocationsList locations={LOCATIONS} onRemove={vi.fn()} onRefetch={vi.fn()} />);

    const parisItem = screen.getByText('Paris, Ile-de-France, France').closest('li');
    expect(parisItem).not.toBeNull();
    expect(within(parisItem as HTMLElement).getByText('12 °C')).toBeInTheDocument();

    const lyonItem = screen.getByText('Lyon, Auvergne-Rhone-Alpes, France').closest('li');
    expect(lyonItem).not.toBeNull();
    expect(within(lyonItem as HTMLElement).getByText('68 °F')).toBeInTheDocument();
    expect(within(lyonItem as HTMLElement).getByText('Refreshing...')).toBeInTheDocument();
    expect(within(lyonItem as HTMLElement).getByRole('alert')).toHaveTextContent('Previous error');
  });
});

describe('SavedLocationsList — refetch and remove actions', () => {
  it('calls onRefetch with the clicked location id even while loading', async () => {
    const onRefetch = vi.fn();
    render(<SavedLocationsList locations={LOCATIONS} onRemove={vi.fn()} onRefetch={onRefetch} />);

    const lyonItem = screen.getByText('Lyon, Auvergne-Rhone-Alpes, France').closest('li');
    expect(lyonItem).not.toBeNull();
    const refetchBtn = within(lyonItem as HTMLElement).getByRole('button', { name: /refetch/iu });

    await userEvent.setup().click(refetchBtn);
    expect(onRefetch).toHaveBeenCalledTimes(1);
    expect(onRefetch).toHaveBeenCalledWith('2996944:imperial');
  });

  it('calls onRemove with the clicked location id', async () => {
    const onRemove = vi.fn();
    render(<SavedLocationsList locations={LOCATIONS} onRemove={onRemove} onRefetch={vi.fn()} />);

    const parisItem = screen.getByText('Paris, Ile-de-France, France').closest('li');
    expect(parisItem).not.toBeNull();
    const removeBtn = within(parisItem as HTMLElement).getByRole('button', { name: /remove/iu });

    await userEvent.setup().click(removeBtn);
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledWith('2988507:metric');
  });
});
