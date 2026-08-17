/**
 * Auth Bootstrap: Initialize authentication system on app startup
 *
 * Handles:
 * - API layer initialization
 * - Session restoration from localStorage
 * - Token manager integration
 * - Auth interceptor setup
 *
 * Called once during app initialization
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { initializeApiLayer } from '../api';

/**
 * Bootstrap Auth System
 *
 * Call this once in your root component:
 *
 * useEffect(() => {
 *   bootstrapAuth(() => navigate('/login'));
 * }, []);
 */
export async function bootstrapAuth(redirectToLogin: () => void): Promise<void> {
  // Initialize API layer with token management and error handling
  initializeApiLayer({
    redirectToLogin,
    enableLogging: import.meta.env.DEV,
  });

  // Restore session from localStorage
  await authService.restoreSession();
}

/**
 * AuthBootstrap Component
 *
 * Use this component to bootstrap auth during app initialization
 *
 * Usage:
 * <AuthBootstrap>
 *   <App />
 * </AuthBootstrap>
 */
interface AuthBootstrapProps {
  children: React.ReactNode;
}

export function AuthBootstrap({ children }: AuthBootstrapProps) {
  const navigate = useNavigate();
  const [isBootstrapped, setIsBootstrapped] = useState(false);

  useEffect(() => {
    bootstrapAuth(() => navigate('/login', { replace: true }))
      .then(() => setIsBootstrapped(true))
      .catch((err) => {
        console.error('Auth bootstrap failed:', err);
        setIsBootstrapped(true); // Still render, will show login
      });
  }, [navigate]);

  // Don't render children until bootstrap is complete
  // This prevents runtime from initializing before auth is ready
  if (!isBootstrapped) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-white dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Initializing...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
