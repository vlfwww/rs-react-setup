import { Component, type ErrorInfo, type ReactNode } from 'react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: ReadonlyArray<unknown>;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

function hasResetKeysChanged(
  prevKeys: ReadonlyArray<unknown> | undefined,
  nextKeys: ReadonlyArray<unknown> | undefined,
): boolean {
  if (!prevKeys || !nextKeys || prevKeys.length !== nextKeys.length) {
    return false;
  }
  return nextKeys.some((key, index) => !Object.is(key, prevKeys[index]));
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
    console.error('ErrorBoundary caught render error:', error, errorInfo);
  }

  public componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.hasError && hasResetKeysChanged(prevProps.resetKeys, this.props.resetKeys)) {
      this.handleReset();
    }
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <section role="alert" aria-label="Render error fallback">
          <h2>Something went wrong while rendering this section.</h2>
          {this.state.error?.message && <p>{this.state.error.message}</p>}
          <button type="button" onClick={this.handleReset}>
            Try again
          </button>
        </section>
      );
    }

    return this.props.children;
  }
}
