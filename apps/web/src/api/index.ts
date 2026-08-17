/**
 * API Layer Index: Export all API utilities
 *
 * Usage:
 * import { apiService, apiClient, tokenManager, connectivityService } from '@/api'
 */

// API Client
export {
  apiClient,
  type HttpMethod,
  type RequestConfig,
  type ApiResponse,
  type ApiError,
} from './client';

// Endpoints
export * from './endpoints';

// Types
export * from './types';

// Interceptors
export {
  setupInterceptors,
  createAuthInterceptor,
  createContentTypeInterceptor,
  createLoggingInterceptor,
  createResponseLoggingInterceptor,
  createResponseValidationInterceptor,
  createTokenRefreshInterceptor,
  createRateLimitInterceptor,
  createErrorLoggingInterceptor,
  createNetworkErrorInterceptor,
} from './interceptors';

// Services
export { apiService } from '../services/api.service';
export { tokenManager, type TokenPair, type TokenPayload } from '../utils/tokenManager';
export {
  connectivityService,
  type ConnectivityStatus,
  type ConnectivityState,
} from '../services/connectivity.service';
export { initializeApiLayer, cleanupApiLayer } from '../services/api.init';
