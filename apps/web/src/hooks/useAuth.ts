/**
 * useAuth Hook: React hook for auth operations
 * 
 * Provides convenient access to:
 * - Auth state
 * - Auth operations (signin, signup, logout)
 * - User info
 * 
 * Usage:
 * const { user, isAuthenticated, signin, logout } = useAuth();
 */

import { useCallback } from 'react';
import {
  useIsAuthenticated,
  useCurrentUser,
  useAuthLoading,
  useAuthError,
} from '../stores/auth.store';
import { authService } from '../services/auth.service';
import type { SignInRequestDto, SignUpRequestDto } from '../api/types';

export function useAuth() {
  const isAuthenticated = useIsAuthenticated();
  const user = useCurrentUser();
  const isLoading = useAuthLoading();
  const error = useAuthError();

  const signin = useCallback(async (dto: SignInRequestDto) => {
    try {
      return await authService.signin(dto);
    } catch (err) {
      throw err;
    }
  }, []);

  const signup = useCallback(async (dto: SignUpRequestDto) => {
    try {
      return await authService.signup(dto);
    } catch (err) {
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      return await authService.logout();
    } catch (err) {
      throw err;
    }
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      return await authService.refreshAccessToken();
    } catch (err) {
      throw err;
    }
  }, []);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,

    // Operations
    signin,
    signup,
    logout,
    refreshToken,
  };
}
