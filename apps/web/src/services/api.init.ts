/**
 * API Initialization: Bootstrap the API layer on app startup
 *
 * Called from main.tsx to initialize:
 * - Interceptors
 * - Token management
 * - Connectivity monitoring
 * - Error handling
 */

import { setupInterceptors } from '../api/interceptors';
import { tokenManager } from '../utils/tokenManager';
import { connectivityService } from './connectivity.service';

/**
 * Initialize API layer
 *
 * Called once during app startup
 */
export function initializeApiLayer(options: {
  redirectToLogin: () => void;
  enableLogging?: boolean;
}): void {
  // Setup interceptors with token management
  setupInterceptors({
    getToken: () => tokenManager.getAccessToken(),
    getRefreshToken: () => tokenManager.getRefreshToken(),
    setTokens: (tokens) => tokenManager.setTokens(tokens),
    redirectToLogin: options.redirectToLogin,
    enableLogging: options.enableLogging || false,
  });

  // Start connectivity monitoring
  // (already started in ConnectivityService.initialize())

  // Log initialization (development only)
  if (options.enableLogging) {
    console.log('[API] Layer initialized');
    console.log('[Connectivity] Monitoring started');
  }
}

/**
 * Cleanup API layer on app shutdown
 */
export function cleanupApiLayer(): void {
  connectivityService.destroy();
}
