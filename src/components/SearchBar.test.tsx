import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchBar } from './SearchBar';

function getCityInput() {
  return screen.getByRole('searchbox', { name: 'City' });
}

async function submitSearch(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /search/iu }));
}

describe('SearchBar — city query and submission', () => {
  it('updates city input value and submits trimmed query with default metric units', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SearchBar onSubmit={onSubmit} />);

    const input = getCityInput();
    await user.type(input, '  Minsk  ');
    expect(input).toHaveValue('  Minsk  ');

    await submitSearch(user);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({ query: 'Minsk', units: 'metric' });
  });

  it('does not call onSubmit when query is empty or whitespace only', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SearchBar onSubmit={onSubmit} />);

    await user.type(getCityInput(), '   ');
    await submitSearch(user);

    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('SearchBar — units selection', () => {
  it('allows switching units to imperial and submits with selected units', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SearchBar onSubmit={onSubmit} />);

    await user.type(getCityInput(), 'Chicago');
    await user.click(screen.getByRole('radio', { name: /imperial/iu }));
    await submitSearch(user);

    expect(onSubmit).toHaveBeenCalledWith({
      query: 'Chicago',
      units: 'imperial',
    });
  });

  it('respects defaultUnits prop on initial render', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SearchBar onSubmit={onSubmit} defaultUnits="imperial" />);

    await user.type(getCityInput(), 'London');
    await submitSearch(user);

    expect(onSubmit).toHaveBeenCalledWith({
      query: 'London',
      units: 'imperial',
    });
  });
});
