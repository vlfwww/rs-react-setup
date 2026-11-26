import { useState, type FormEvent } from 'react';
import type { WeatherUnits } from '../api/openMeteo';
import { UnitsSelector } from './UnitsSelector';

export interface SearchBarSubmitParams {
  query: string;
  units: WeatherUnits;
}

export interface SearchBarProps {
  onSubmit: (params: SearchBarSubmitParams) => void;
  defaultUnits?: WeatherUnits;
  disabled?: boolean;
}

export function SearchBar({ onSubmit, defaultUnits = 'metric', disabled = false }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [units, setUnits] = useState<WeatherUnits>(defaultUnits);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || disabled) {
      return;
    }
    onSubmit({ query: trimmed, units });
  }

  return (
    <form onSubmit={handleSubmit} aria-label="City weather search">
      <label htmlFor="city-search-input">City</label>
      <input
        id="city-search-input"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Enter city name"
        disabled={disabled}
      />
      <UnitsSelector value={units} onChange={setUnits} disabled={disabled} />
      <button type="submit" disabled={disabled}>
        Search
      </button>
    </form>
  );
}
