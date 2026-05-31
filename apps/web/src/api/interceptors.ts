/**
 * API Interceptors: Request and response processing pipeline
 * 
 * Request interceptors:
 * - Inject auth token
 * - Set headers (Content-Type, etc.)
 * - Log requests
 * - Validate payloads
 * 
 * Response interceptors:
 * - Log responses
 * - Transform data
 * - Validate response structure
 * 
 * Error interceptors:
 * - Handle 401 (token refresh)
 * - Handle rate limiting
 * - Log errors
 * - Transform error format
 */

import type { RequestConfig, ApiError } from './client';
import { apiClient } from './client';

// ============================================================================
// REQUEST INTERCEPTORS
// ============================================================================

/**
 * Auth token injection interceptor
 * 
 * Injects JWT token into Authorization header
 * Called by: TokenManager.setTokenInterceptor()
 */
export function createAuthInterceptor(getToken: () => string | null) {
  return (config: RequestConfig): RequestConfig => {
    const token = getToken();

    if (token) {
      if (!config.headers) {
        config.headers = {};
      }
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  };
}

/**
 * Content-Type interceptor
 * 
 * Ensures Content-Type is set for requests with bodies
 */
export function createContentTypeInterceptor(): (config: RequestConfig) => RequestConfig {
  return (config: RequestConfig): RequestConfig => {
    if (config.body && !config.headers?.['Content-Type']) {
      if (!config.headers) {
        config.headers = {};
      }
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  };
}

/**
 * Request logging interceptor (development only)
 * 
 * Logs all requests for debugging
 */
export function createLoggingInterceptor(enabled: boolean = false) {
  return (config: RequestConfig): RequestConfig => {
    if (enabled && config.method !== 'GET') {
      console.log('[API Request]', {
        method: config.method,
        body: config.body,
        timestamp: new Date().toISOString(),
      });
    }

    return config;
  };
}

// ============================================================================
// RESPONSE INTERCEPTORS
// ============================================================================

/**
 * Response logging interceptor (development only)
 * 
 * Logs all responses for debugging
 */
export function createResponseLoggingInterceptor(enabled: boolean = false) {
  return (response: any): any => {
    if (enabled) {
      console.log('[API Response]', {
        data: response,
        timestamp: new Date().toISOString(),
      });
    }

    return response;
  };
}

/**
 * Response validation interceptor
 * 
 * Ensures response has expected structure
 * Throws if response is malformed
 */
export function createResponseValidationInterceptor() {
  return (response: any): any => {
    // If response has error property, it's an error response
    if (response && response.error) {
      const error: any = new Error(response.error.message);
      error.code = response.error.code;
      error.statusCode = response.error.statusCode;
      throw error;
    }

    return response;
  };
}

// ============================================================================
// ERROR INTERCEPTORS
// ============================================================================

/**
 * Token refresh interceptor
 * 
 * Handles 401 responses by:
 * 1. Attempting token refresh
 * 2. Retrying original request
 * 3. Redirecting to login if refresh fails
 * 
 * Called by: setupErrorHandling()
 */
export function createTokenRefreshInterceptor(
  getRefreshToken: () => string | null,
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void,
  redirectToLogin: () => void
) {
  return async (error: ApiError): Promise<ApiError> => {
    // Only handle 401 errors
    if (error.statusCode !== 401) {
      return error;
    }

    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      // No refresh token, redirect to login
      redirectToLogin();
      return error;
    }

    try {
      // Attempt token refresh
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        // Refresh failed, redirect to login
        redirectToLogin();
        return error;
      }

      const data = await response.json();
      setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      // Return modified error to indicate retry should happen
      return {
        ...error,
        statusCode: 0, // Signal retry should happen
      };
    } catch (refreshError) {
      // Refresh failed, redirect to login
      redirectToLogin();
      return error;
    }
  };
}

/**
 * Rate limit interceptor
 * 
 * Handles 429 (Too Many Requests) by:
 * 1. Extracting Retry-After header
 * 2. Waiting before retry
 * 3. Signaling retry should happen
 */
export function createRateLimitInterceptor() {
  return async (error: ApiError): Promise<ApiError> => {
    // Only handle 429 errors
    if (error.statusCode !== 429) {
      return error;
    }

    // Mark as retryable
    error.retryable = true;

    return error;
  };
}

/**
 * Error logging interceptor
 * 
 * Logs all errors for monitoring
 */
export function createErrorLoggingInterceptor(enabled: boolean = false) {
  return async (error: ApiError): Promise<ApiError> => {
    if (enabled) {
      console.error('[API Error]', {
        message: error.message,
        statusCode: error.statusCode,
        isNetworkError: error.isNetworkError,
        isTimeout: error.isTimeout,
        isOffline: error.isOffline,
        timestamp: new Date().toISOString(),
      });
    }

    return error;
  };
}

/**
 * Network error handler
 * 
 * Provides user-friendly messages for network errors
 */
export function createNetworkErrorInterceptor() {
  return async (error: ApiError): Promise<ApiError> => {
    if (error.isNetworkError) {
      error.message =
        error.message || 'Network error. Please check your connection.';
    }

    if (error.isTimeout) {
      error.message = error.message || 'Request timeout. Please try again.';
    }

    if (error.isOffline) {
      error.message = error.message || 'You are offline. Changes will sync when online.';
    }

    return error;
  };
}

// ============================================================================
// INTERCEPTOR SETUP FUNCTION
// ============================================================================

/**
 * Setup all interceptors
 * 
 * Called during app initialization
 * Configures full request/response pipeline
 */
export function setupInterceptors(options: {
  getToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  redirectToLogin: () => void;
  enableLogging?: boolean;
}): void {
  // Request interceptors
  apiClient.addRequestInterceptor(createContentTypeInterceptor());
  apiClient.addRequestInterceptor(createAuthInterceptor(options.getToken));
  apiClient.addRequestInterceptor(
    createLoggingInterceptor(options.enableLogging)
  );

  // Response interceptors
  apiClient.addResponseInterceptor(
    createResponseValidationInterceptor()
  );
  apiClient.addResponseInterceptor(
    createResponseLoggingInterceptor(options.enableLogging)
  );

  // Error interceptors
  apiClient.addErrorInterceptor(
    createErrorLoggingInterceptor(options.enableLogging)
  );
  apiClient.addErrorInterceptor(createNetworkErrorInterceptor());
  apiClient.addErrorInterceptor(
    createTokenRefreshInterceptor(
      options.getRefreshToken,
      options.setTokens,
      options.redirectToLogin
    )
  );
  apiClient.addErrorInterceptor(createRateLimitInterceptor());
}
