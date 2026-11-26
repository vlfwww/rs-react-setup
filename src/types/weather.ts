type Units = 'metric' | 'imperial';
type Status = 'idle' | 'loading' | 'success' | 'error';

export interface SavedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  units: Units;
  weather?: { tempC: number; code: number; fetchedAt: number };
  status: Status;
  error?: string;
}

export interface SavedWeather {
  tempC: number;
  code: number;
  fetchedAt: number;
}
