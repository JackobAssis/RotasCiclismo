/**
 * Protected Route: Route guard for authenticated pages
 * 
 * Ensures:
 * - User is authenticated before accessing protected pages
 * - Smooth loading state during session restoration
 * - Redirect to login if authentication fails
 * - No runtime flickering during auth checks
 * 
 * Usage:
 * <Routes>
 *   <Route path="/login" element={<Login />} />
 *   <Route path="/ride" element={<ProtectedRoute><Ride /></ProtectedRoute>} />
 * </Routes>
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useIsAuthenticated, selectIsHydrating } from '../stores/auth.store';
import { useAuthStore } from '../stores/auth.store';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Protected Route Component
 * 
 * Handles three states:
 * 1. Hydrating: Show loading (restoration in progress)
 * 2. Not authenticated: Redirect to login
 * 3. Authenticated: Show component
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useIsAuthenticated();
  const isHydrating = useAuthStore(selectIsHydrating);

  // Show loading while hydrating
  if (isHydrating) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-white dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Restoring session...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated, show component
  return <>{children}</>;
}

/**
 * Public Route: Route for pages accessible without authentication
 * 
 * Ensures auth pages are only shown when not authenticated
 */
interface PublicRouteProps {
  children: ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const isAuthenticated = useIsAuthenticated();
  const isHydrating = useAuthStore(selectIsHydrating);

  // Show loading while hydrating
  if (isHydrating) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-white dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Checking session...
          </p>
        </div>
      </div>
    );
  }

  // Already authenticated, redirect to home
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Not authenticated, show page
  return <>{children}</>;
}
