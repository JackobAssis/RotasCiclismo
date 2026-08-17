/**
 * Auth Store: Zustand store for authentication state
 *
 * Manages:
 * - User information
 * - Authentication tokens
 * - Session status
 * - Auth loading/error states
 * - Session persistence
 * - Auto-hydration on app boot
 *
 * ISOLATION PRINCIPLE:
 * This store is completely independent of runtime systems.
 * It doesn't interact with GPS, motion, or ride stores.
 * Auth is a boundary layer between UI and API.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfileDto } from '../api/types';

// ============================================================================
// TYPES
// ============================================================================

export type AuthStatus =
  'idle' | 'authenticating' | 'hydrating' | 'authenticated' | 'unauthenticated' | 'error';

export interface AuthState {
  // User data
  user: UserProfileDto | null;

  // Tokens
  accessToken: string | null;
  refreshToken: string | null;

  // Status
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Last sync
  lastAuthAt: number | null;
  sessionExpiresAt: number | null;

  // Actions
  setUser: (user: UserProfileDto | null) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  setStatus: (status: AuthStatus) => void;
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;

  // Auth flows
  setAuthenticating: () => void;
  setAuthenticated: (
    user: UserProfileDto,
    tokens: { accessToken: string; refreshToken: string },
  ) => void;
  setUnauthenticated: () => void;

  // Session management
  startHydration: () => void;
  completeHydration: (
    user: UserProfileDto | null,
    tokens: { accessToken: string; refreshToken: string } | null,
  ) => void;

  // Logout
  logout: () => void;

  // Reset
  reset: () => void;
}

// ============================================================================
// STORE
// ============================================================================

/**
 * Auth Store
 *
 * Persisted to localStorage:
 * - accessToken
 * - refreshToken
 * - user (basic info)
 *
 * Memory only:
 * - status
 * - error
 * - loading state
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      status: 'idle',
      isAuthenticated: false,
      isLoading: false,
      error: null,
      lastAuthAt: null,
      sessionExpiresAt: null,

      // ====================================================================
      // BASIC SETTERS
      // ====================================================================

      setUser: (user) => {
        set({ user });
      },

      setTokens: (tokens) => {
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
      },

      setStatus: (status) => {
        set({ status });
      },

      setError: (error) => {
        set({ error });
      },

      setIsLoading: (loading) => {
        set({ isLoading: loading });
      },

      // ====================================================================
      // AUTH FLOW STATES
      // ====================================================================

      /**
       * Mark as authenticating (signin/signup in progress)
       */
      setAuthenticating: () => {
        set({
          status: 'authenticating',
          isLoading: true,
          error: null,
        });
      },

      /**
       * Mark as authenticated (signin/signup succeeded)
       */
      setAuthenticated: (user, tokens) => {
        set({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          status: 'authenticated',
          isAuthenticated: true,
          isLoading: false,
          error: null,
          lastAuthAt: Date.now(),
        });
      },

      /**
       * Mark as unauthenticated (logout or session expired)
       */
      setUnauthenticated: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          status: 'unauthenticated',
          isAuthenticated: false,
          isLoading: false,
          error: null,
          lastAuthAt: null,
          sessionExpiresAt: null,
        });
      },

      // ====================================================================
      // HYDRATION (Session Restoration)
      // ====================================================================

      /**
       * Mark hydration as in-progress
       * Called when app starts to check if user is already logged in
       */
      startHydration: () => {
        set({
          status: 'hydrating',
          isLoading: true,
          error: null,
        });
      },

      /**
       * Complete hydration
       * Set authenticated/unauthenticated based on restoration result
       */
      completeHydration: (user, tokens) => {
        if (user && tokens) {
          set({
            user,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            status: 'authenticated',
            isAuthenticated: true,
            isLoading: false,
            error: null,
            lastAuthAt: Date.now(),
          });
        } else {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            status: 'unauthenticated',
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      // ====================================================================
      // LOGOUT
      // ====================================================================

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          status: 'unauthenticated',
          isAuthenticated: false,
          isLoading: false,
          error: null,
          lastAuthAt: null,
          sessionExpiresAt: null,
        });
      },

      // ====================================================================
      // RESET (for cleanup/testing)
      // ====================================================================

      reset: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          status: 'idle',
          isAuthenticated: false,
          isLoading: false,
          error: null,
          lastAuthAt: null,
          sessionExpiresAt: null,
        });
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        // Only persist these fields to localStorage
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        lastAuthAt: state.lastAuthAt,
      }),
    },
  ),
);

// ============================================================================
// SELECTORS (for efficient re-renders)
// ============================================================================

/**
 * Selector: Is user authenticated?
 */
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;

/**
 * Selector: User object
 */
export const selectUser = (state: AuthState) => state.user;

/**
 * Selector: User ID
 */
export const selectUserId = (state: AuthState) => state.user?.id || null;

/**
 * Selector: User email
 */
export const selectUserEmail = (state: AuthState) => state.user?.email || null;

/**
 * Selector: User display name
 */
export const selectUserName = (state: AuthState) => state.user?.displayName || null;

/**
 * Selector: Access token
 */
export const selectAccessToken = (state: AuthState) => state.accessToken;

/**
 * Selector: Refresh token
 */
export const selectRefreshToken = (state: AuthState) => state.refreshToken;

/**
 * Selector: Auth status
 */
export const selectAuthStatus = (state: AuthState) => state.status;

/**
 * Selector: Is loading
 */
export const selectIsLoading = (state: AuthState) => state.isLoading;

/**
 * Selector: Error message
 */
export const selectError = (state: AuthState) => state.error;

/**
 * Selector: Is hydrating
 */
export const selectIsHydrating = (state: AuthState) => state.status === 'hydrating';

/**
 * Selector: User stats
 */
export const selectUserStats = (state: AuthState) => state.user?.stats || null;

// ============================================================================
// HOOKS (for component usage)
// ============================================================================

/**
 * Use auth status
 */
export function useAuthStatus() {
  return useAuthStore((state) => state.status);
}

/**
 * Use current user
 */
export function useCurrentUser() {
  return useAuthStore(selectUser);
}

/**
 * Use auth loading state
 */
export function useAuthLoading() {
  return useAuthStore(selectIsLoading);
}

/**
 * Use auth error
 */
export function useAuthError() {
  return useAuthStore(selectError);
}

/**
 * Use is authenticated
 */
export function useIsAuthenticated() {
  return useAuthStore(selectIsAuthenticated);
}

/**
 * Use tokens
 */
export function useAuthTokens() {
  return useAuthStore((state) => ({
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
  }));
}
