function getWorkerApiUrl(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (
    typeof self !== 'undefined' &&
    self.location &&
    self.location.hostname !== 'localhost' &&
    self.location.hostname !== '127.0.0.1'
  ) {
    return 'https://cycling-api-hiqq.onrender.com/api';
  }
  return 'http://localhost:3000/api';
}

const API_BASE_URL = getWorkerApiUrl();

interface FetchOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

export async function workerFetch<T = unknown>(
  endpoint: string,
  options: FetchOptions,
  accessToken?: string,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30_000);

  try {
    const response = await fetch(url, {
      method: options.method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
    }

    const data: T = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function createRide(
  rideId: string,
  data: { id: string; mode: string; startedAt: string },
  accessToken?: string,
): Promise<unknown> {
  return workerFetch('/rides', { method: 'POST', body: data }, accessToken);
}

export async function uploadRoutePoints(
  rideId: string,
  points: unknown[],
  accessToken?: string,
): Promise<unknown> {
  return workerFetch(
    `/rides/${rideId}/points/bulk`,
    { method: 'POST', body: { points } },
    accessToken,
  );
}

export async function finishRide(
  rideId: string,
  data: unknown,
  accessToken?: string,
): Promise<unknown> {
  return workerFetch(`/rides/${rideId}/finish`, { method: 'POST', body: data }, accessToken);
}

export async function uploadSnapshot(
  rideId: string,
  data: unknown,
  accessToken?: string,
): Promise<unknown> {
  return workerFetch(`/rides/${rideId}/snapshots`, { method: 'POST', body: data }, accessToken);
}
