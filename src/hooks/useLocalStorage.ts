import { useCallback, useState } from 'react';

export interface UseLocalStorageOptions<T> {
  key: string;
  initialValue: T;
  parse?: (raw: unknown) => T;
}

export interface UseLocalStorageResult<T> {
  initialValue: T;
  saveValue: (value: T) => void;
  storageError: string | undefined;
  clearStorageError: () => void;
}

function readInitialValue<T>(
  key: string,
  fallbackValue: T,
  parse?: (raw: unknown) => T,
): { value: T; error?: string } {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return {
        value: fallbackValue,
        error:
          'Unable to read saved data from local storage: local storage is not available in this environment.',
      };
    }

    const rawItem = window.localStorage.getItem(key);
    if (rawItem === null) {
      return { value: fallbackValue };
    }

    const parsedJson: unknown = JSON.parse(rawItem);
    const value = parse ? parse(parsedJson) : (parsedJson as T);

    return { value };
  } catch {
    return {
      value: fallbackValue,
      error: 'Unable to read saved data from local storage.',
    };
  }
}

export function useLocalStorage<T>({
  key,
  initialValue: fallbackValue,
  parse,
}: UseLocalStorageOptions<T>): UseLocalStorageResult<T> {
  const [initialRead] = useState(() => readInitialValue(key, fallbackValue, parse));
  const [storageError, setStorageError] = useState<string | undefined>(initialRead.error);

  const saveValue = useCallback(
    (value: T) => {
      try {
        if (typeof window === 'undefined' || !window.localStorage) {
          setStorageError(
            'Unable to save data to local storage: local storage is not available in this environment.',
          );
          return;
        }

        const serialized = JSON.stringify(value);
        window.localStorage.setItem(key, serialized);
        setStorageError(undefined);
      } catch {
        setStorageError('Unable to save data to local storage.');
      }
    },
    [key],
  );

  const clearStorageError = useCallback(() => {
    setStorageError(undefined);
  }, []);

  return {
    initialValue: initialRead.value,
    saveValue,
    storageError,
    clearStorageError,
  };
}
