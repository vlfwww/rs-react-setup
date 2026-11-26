import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

describe('App — ErrorBoundary integration', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('keeps header and trigger accessible, renders fallback on crash, logs error, and recovers', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Weather Dashboard' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: /simulate error/iu }));

    const fallback = screen.getByRole('alert', { name: /render error fallback/iu });
    expect(fallback).toHaveTextContent('Simulated render crash');
    expect(screen.getByRole('heading', { name: 'Weather Dashboard' })).toBeVisible();
    expect(consoleErrorSpy).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /try again/iu }));

    expect(
      screen.queryByRole('alert', { name: /render error fallback/iu }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: /search area/iu })).toBeVisible();
  });
});
