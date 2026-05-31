/**
 * Auth Service: Handles authentication flows
 * 
 * Operations:
 * - Signup
 * - Signin
 * - Logout
 * - Token refresh
 * - Session restoration
 * 
 * Coordinates between:
 * - apiService (API calls)
 * - authStore (state)
 * - tokenManager (token storage)
 * 
 * ISOLATION PRINCIPLE:
 * Auth service knows about auth only.
 * Doesn't directly affect runtime systems.
 * Runtime responds to auth events via event bus (future).
 */

import { apiService } from './api.service';
import { useAuthStore } from '../stores/auth.store';
import { tokenManager } from '../utils/tokenManager';
import type { SignUpRequestDto, SignInRequestDto, UserProfileDto } from '../api/types';

// ============================================================================
// ERROR TYPES
// ============================================================================

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string = 'AUTH_ERROR',
    public isRecoverable: boolean = false
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// ============================================================================
// AUTH SERVICE
// ============================================================================

export class AuthService {
  private refreshPromise: Promise<boolean> | null = null;

  /**
   * Sign up new user
   */
  async signup(dto: SignUpRequestDto): Promise<UserProfileDto> {
    try {
      // Mark as authenticating
      useAuthStore.setState((state) => ({
        ...state,
        status: 'authenticating',
        isLoading: true,
        error: null,
      }));

      // Call API
      const response = await apiService.signup(dto);

      // Store tokens
      tokenManager.setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });

      // Update auth store
      useAuthStore.setState((state) => ({
        ...state,
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        status: 'authenticated',
        isAuthenticated: true,
        isLoading: false,
        error: null,
        lastAuthAt: Date.now(),
      }));

      return response.user;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Signup failed';

      useAuthStore.setState((state) => ({
        ...state,
        status: 'error',
        isLoading: false,
        error: message,
      }));

      throw new AuthError(message, 'SIGNUP_FAILED', true);
    }
  }

  /**
   * Sign in existing user
   */
  async signin(dto: SignInRequestDto): Promise<UserProfileDto> {
    try {
      // Mark as authenticating
      useAuthStore.setState((state) => ({
        ...state,
        status: 'authenticating',
        isLoading: true,
        error: null,
      }));

      // Call API
      const response = await apiService.signin(dto);

      // Store tokens
      tokenManager.setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });

      // Update auth store
      useAuthStore.setState((state) => ({
        ...state,
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        status: 'authenticated',
        isAuthenticated: true,
        isLoading: false,
        error: null,
        lastAuthAt: Date.now(),
      }));

      return response.user;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Signin failed';

      useAuthStore.setState((state) => ({
        ...state,
        status: 'error',
        isLoading: false,
        error: message,
      }));

      throw new AuthError(message, 'SIGNIN_FAILED', true);
    }
  }

  /**
   * Log out current user
   */
  async logout(): Promise<void> {
    try {
      // Clear auth state
      tokenManager.clear();

      useAuthStore.setState((state) => ({
        ...state,
        user: null,
        accessToken: null,
        refreshToken: null,
        status: 'unauthenticated',
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      // Logout should always succeed even if API fails
      console.error('Logout error:', error);

      tokenManager.clear();
      useAuthStore.setState((state) => ({
        ...state,
        user: null,
        accessToken: null,
        refreshToken: null,
        status: 'unauthenticated',
        isAuthenticated: false,
      }));
    }
  }

  /**
   * Refresh access token using refresh token
   * 
   * Prevents concurrent refresh requests
   */
  async refreshAccessToken(): Promise<boolean> {
    // Prevent concurrent refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this._performTokenRefresh();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Perform actual token refresh
   */
  private async _performTokenRefresh(): Promise<boolean> {
    try {
      const refreshToken = tokenManager.getRefreshToken();

      if (!refreshToken) {
        // No refresh token available
        await this.logout();
        return false;
      }

      // Call API to refresh
      const response = await apiService.refreshToken(refreshToken);

      // Store new tokens
      tokenManager.setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });

      // Update store
      useAuthStore.setState((state) => ({
        ...state,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      }));

      return true;
    } catch (error) {
      // Refresh failed, logout user
      console.error('Token refresh failed:', error);
      await this.logout();
      return false;
    }
  }

  /**
   * Restore session from storage
   * 
   * Called on app startup to check if user is already logged in
   */
  async restoreSession(): Promise<boolean> {
    try {
      // Mark as hydrating
      useAuthStore.setState((state) => ({
        ...state,
        status: 'hydrating',
        isLoading: true,
        error: null,
      }));

      // Check if we have tokens in storage
      const storedTokens = tokenManager.getTokens();

      if (!storedTokens) {
        // No stored tokens, user not authenticated
        useAuthStore.setState((state) => ({
          ...state,
          status: 'unauthenticated',
          isAuthenticated: false,
          isLoading: false,
        }));

        return false;
      }

      // Check if access token is still valid
      if (!tokenManager.isAccessTokenExpired()) {
        // Token still valid, load user profile
        try {
          const profile = await apiService.getProfile();

          useAuthStore.setState((state) => ({
            ...state,
            user: profile,
            status: 'authenticated',
            isAuthenticated: true,
            isLoading: false,
            lastAuthAt: Date.now(),
          }));

          return true;
        } catch (error) {
          // Profile load failed, try refresh
          console.warn('Failed to load profile:', error);

          const refreshed = await this.refreshAccessToken();

          if (refreshed) {
            try {
              const profile = await apiService.getProfile();

              useAuthStore.setState((state) => ({
                ...state,
                user: profile,
                status: 'authenticated',
                isAuthenticated: true,
                isLoading: false,
                lastAuthAt: Date.now(),
              }));

              return true;
            } catch (profileError) {
              // Profile still fails, logout
              console.error('Profile load failed after refresh:', profileError);
              await this.logout();
              return false;
            }
          } else {
            // Refresh failed, logout
            return false;
          }
        }
      } else {
        // Access token expired, try refresh
        const refreshed = await this.refreshAccessToken();

        if (refreshed) {
          // Refresh succeeded, load profile
          try {
            const profile = await apiService.getProfile();

            useAuthStore.setState((state) => ({
              ...state,
              user: profile,
              status: 'authenticated',
              isAuthenticated: true,
              isLoading: false,
              lastAuthAt: Date.now(),
            }));

            return true;
          } catch (error) {
            // Profile load failed, logout
            console.error('Failed to load profile after refresh:', error);
            await this.logout();
            return false;
          }
        } else {
          // Refresh failed, logout
          return false;
        }
      }
    } catch (error) {
      // Unexpected error during restoration
      console.error('Session restoration error:', error);

      useAuthStore.setState((state) => ({
        ...state,
        status: 'error',
        isLoading: false,
        error: 'Session restoration failed',
      }));

      return false;
    }
  }

  /**
   * Check if authentication is needed
   * 
   * Returns true if user needs to log in
   */
  isAuthenticationNeeded(): boolean {
    const state = useAuthStore.getState();
    return !state.isAuthenticated;
  }

  /**
   * Get current user (or null if not authenticated)
   */
  getCurrentUser(): UserProfileDto | null {
    return useAuthStore.getState().user;
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return useAuthStore.getState().accessToken;
  }
}

// Export singleton instance
export const authService = new AuthService();
