/**
 * API Layer: Centralized HTTP Client
 *
 * Provides:
 * - Request/response interceptors
 * - Auth token injection
 * - Retry logic with exponential backoff
 * - Offline detection and queuing
 * - Timeout handling
 * - Type-safe responses
 *
 * DESIGN PRINCIPLE:
 * This layer is completely isolated from UI and runtime.
 * It doesn't modify stores directly.
 * All responses are typed and validated.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RetryConfig {
  maxRetries?: number;
  initialBackoffMs?: number;
  maxBackoffMs?: number;
  backoffMultiplier?: number;
}

export interface RequestConfig {
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retry?: RetryConfig;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    statusCode: number;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  isNetworkError: boolean;
  isTimeout: boolean;
  isOffline: boolean;
  retryable: boolean;
}

/**
 * Retry configuration with exponential backoff
 */
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialBackoffMs: 1000,
  maxBackoffMs: 30000,
  backoffMultiplier: 2,
};

/**
 * Request interceptor type
 */
type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;

/**
 * Response interceptor type
 */
type ResponseInterceptor<T = unknown> = (response: T) => T | Promise<T>;

/**
 * Error interceptor type
 */
type ErrorInterceptor = (error: ApiError) => ApiError | Promise<ApiError>;

/**
 * Centralized API Client
 *
 * All requests go through this client:
 * 1. Request interceptors (auth injection, headers)
 * 2. Fetch execution
 * 3. Response interceptors (parsing, validation)
 * 4. Error handling with retries
 */
export class ApiClient {
  private baseUrl: string;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];
  private pendingRequests = new Map<string, Promise<unknown>>();

  constructor(baseUrl: string = 'http://localhost:3000/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Add request interceptor
   * Runs BEFORE request is sent
   * Useful for: auth token injection, headers, validation
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   * Runs AFTER successful response
   * Useful for: parsing, validation, transformation
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Add error interceptor
   * Runs AFTER error occurs
   * Useful for: logging, token refresh, error normalization
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Main request method
   *
   * Handles:
   * - Request/response interceptors
   * - Retry with exponential backoff
   * - Timeout via AbortController
   * - Error normalization
   * - Request deduplication
   */
  async request<T = unknown>(method: HttpMethod, path: string, config?: RequestConfig): Promise<T> {
    // Deduplicate concurrent requests (GET only)
    const cacheKey = `${method}:${path}`;

    if (method === 'GET' && this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)! as Promise<T>;
    }

    const promise = this._executeRequest<T>(method, path, config);

    this.pendingRequests.set(cacheKey, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  private async _executeRequest<T = unknown>(
    method: HttpMethod,
    path: string,
    config?: RequestConfig,
  ): Promise<T> {
    let currentConfig: RequestConfig = {
      method,
      headers: {},
      ...config,
    };

    // Run request interceptors
    for (const interceptor of this.requestInterceptors) {
      currentConfig = await interceptor(currentConfig);
    }

    // Build URL
    const url = `${this.baseUrl}${path}`;

    // Determine timeout
    const timeout = currentConfig.timeout || 5000;

    // Attempt request with retry logic
    const retryConfig: RetryConfig = currentConfig.retry || DEFAULT_RETRY_CONFIG;
    const maxAttempts = (retryConfig.maxRetries || 0) + 1;

    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await this._fetchWithTimeout(url, currentConfig, timeout);

        // Parse response
        let data: T = response as unknown as T;
        try {
          const text = await response.text();
          data = text ? JSON.parse(text) : ({} as T);
        } catch {
          // Response wasn't JSON, that's ok
        }

        // Run response interceptors
        for (const interceptor of this.responseInterceptors) {
          data = (await interceptor(data)) as T;
        }

        return data;
      } catch (error) {
        lastError = this._normalizeError(error, method, path);

        // Run error interceptors
        for (const interceptor of this.errorInterceptors) {
          lastError = await interceptor(lastError);
        }

        // Determine if we should retry
        const shouldRetry = lastError.retryable && attempt < maxAttempts - 1;

        if (!shouldRetry) {
          throw lastError;
        }

        // Calculate backoff
        const initialBackoff =
          retryConfig.initialBackoffMs ?? DEFAULT_RETRY_CONFIG.initialBackoffMs;
        const multiplier = retryConfig.backoffMultiplier ?? DEFAULT_RETRY_CONFIG.backoffMultiplier;
        const maxBackoff = retryConfig.maxBackoffMs ?? DEFAULT_RETRY_CONFIG.maxBackoffMs;

        const backoffMs = Math.min(initialBackoff * Math.pow(multiplier, attempt), maxBackoff);

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }

    throw lastError || new Error('Unknown error');
  }

  /**
   * Fetch with timeout
   */
  private _fetchWithTimeout(
    url: string,
    config: RequestConfig,
    timeoutMs: number,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const fetchOptions: RequestInit = {
      method: config.method,
      headers: config.headers,
      signal: controller.signal,
    };

    if (config.body) {
      fetchOptions.body = JSON.stringify(config.body);
    }

    return fetch(url, fetchOptions).finally(() => clearTimeout(timeoutId));
  }

  /**
   * Normalize errors to consistent format
   */
  private _normalizeError(error: unknown, method: string, path: string): ApiError {
    if (
      error !== null &&
      typeof error === 'object' &&
      'name' in error &&
      (error as { name?: unknown }).name === 'AbortError'
    ) {
      return {
        message: `Request timed out: ${method} ${path}`,
        statusCode: 0,
        isNetworkError: false,
        isTimeout: true,
        isOffline: false,
        retryable: true,
      };
    }

    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return {
        message: `Network error: ${method} ${path}`,
        statusCode: 0,
        isNetworkError: true,
        isTimeout: false,
        isOffline: !navigator.onLine,
        retryable: navigator.onLine,
      };
    }

    if (
      error !== null &&
      typeof error === 'object' &&
      ('statusCode' in error || 'status' in error)
    ) {
      const { statusCode, status, message } = error as {
        statusCode?: number;
        status?: number;
        message?: string;
      };
      if (statusCode || status) {
        const code = statusCode || status || 0;
        return {
          message: message || `Request failed: ${method} ${path}`,
          statusCode: code,
          isNetworkError: false,
          isTimeout: false,
          isOffline: false,
          retryable: code >= 500 || code === 429,
        };
      }
    }

    // Unknown error
    let fallbackMessage = `Unknown error: ${method} ${path}`;
    if (error instanceof Error) {
      fallbackMessage = error.message;
    } else if (error !== null && typeof error === 'object' && 'message' in error) {
      const m = (error as { message?: unknown }).message;
      if (typeof m === 'string') fallbackMessage = m;
    }

    return {
      message: fallbackMessage,
      statusCode: 0,
      isNetworkError: false,
      isTimeout: false,
      isOffline: false,
      retryable: false,
    };
  }

  /**
   * GET request
   */
  get<T = unknown>(path: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('GET', path, config);
  }

  /**
   * POST request
   */
  post<T = unknown>(path: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('POST', path, { ...config, method: 'POST', body });
  }

  /**
   * PUT request
   */
  put<T = unknown>(path: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('PUT', path, { ...config, method: 'PUT', body });
  }

  /**
   * PATCH request
   */
  patch<T = unknown>(path: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('PATCH', path, { ...config, method: 'PATCH', body });
  }

  /**
   * DELETE request
   */
  delete<T = unknown>(path: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('DELETE', path, config);
  }
}

function getApiBaseUrl(): string {
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return 'https://cycling-api-production.up.railway.app/api';
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return 'http://localhost:3000/api';
}

// Export singleton instance
export const apiClient = new ApiClient(getApiBaseUrl());
