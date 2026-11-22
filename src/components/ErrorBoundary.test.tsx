import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Simulated render crash');
  }
  return <div>Dashboard content healthy</div>;
}

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders fallback, logs the error, and recovers when reset button is clicked', async () => {
    const onError = vi.fn();
    const onReset = vi.fn();
    let explode = true;

    const { rerender } = render(
      <ErrorBoundary onError={onError} onReset={onReset}>
        <Bomb shouldThrow={explode} />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Simulated render crash');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalled();

    explode = false;
    rerender(
      <ErrorBoundary onError={onError} onReset={onReset}>
        <Bomb shouldThrow={explode} />
      </ErrorBoundary>,
    );

    await userEvent.setup().click(screen.getByRole('button', { name: /try again/iu }));

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Dashboard content healthy')).toBeInTheDocument();
  });
});
