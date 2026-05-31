/**
 * Sync API Helper
 * 
 * Função helper para fazer requisições de API dentro do Web Worker.
 * Utilizamos fetch diretamente em vez de apiService (que não está disponível no worker context).
 * 
 * IMPORTANTE: O worker não tem acesso a localStorage ou sessionStorage diretamente.
 * O token será passado via message do main thread.
 */

interface FetchOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Executa uma requisição HTTP no worker
 */
export async function workerFetch<T = any>(
  endpoint: string,
  options: FetchOptions,
  accessToken?: string
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
      throw new Error(
        `HTTP ${response.status}: ${errorData.message || response.statusText}`
      );
    }

    const data: T = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Tipos de requisições para sync
 */
export async function uploadRoutePoints(
  rideId: string,
  points: any[],
  accessToken?: string
): Promise<any> {
  return workerFetch(
    `/route-points/bulk`,
    {
      method: 'POST',
      body: { rideId, points },
    },
    accessToken
  );
}

export async function finishRide(
  rideId: string,
  data: any,
  accessToken?: string
): Promise<any> {
  return workerFetch(
    `/rides/${rideId}/finish`,
    {
      method: 'POST',
      body: data,
    },
    accessToken
  );
}

export async function uploadSnapshot(
  rideId: string,
  data: any,
  accessToken?: string
): Promise<any> {
  return workerFetch(
    `/snapshots`,
    {
      method: 'POST',
      body: { rideId, ...data },
    },
    accessToken
  );
}
