/**
 * App Root: Routing and Authentication Bootstrap
 *
 * Route Structure:
 *   /login    — Public (redirects to / if authenticated)
 *   /signup   — Public (redirects to / if authenticated)
 *   /         — Protected home (landing + "Start Ride")
 *   /ride     — Protected ride session (realtime GPS + HUD + maps)
 *   /debug    — Protected realtime event debug panel
 *   *         — Catch-all redirect to /
 *
 * Auth Flow:
 *   1. AuthBootstrap initializes API layer (interceptors, connectivity)
 *   2. AuthBootstrap restores session from localStorage (tokens + profile)
 *   3. ProtectedRoute guards ride/home pages; redirects to /login if unauthenticated
 *   4. PublicRoute guards login/signup; redirects to / if already authenticated
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthBootstrap } from './components/AuthBootstrap';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import RidePage from './pages/Ride';
import Home from './pages/Home';
import { LoginPage } from './pages/Login';
import { SignupPage } from './pages/Signup';
import Debug from './pages/Debug';

export default function App() {
  return (
    <BrowserRouter>
      <AuthBootstrap>
        <Routes>
          {/* ── Public Routes (redirect to / if already authenticated) ── */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignupPage />
              </PublicRoute>
            }
          />

          {/* ── Protected Routes (redirect to /login if unauthenticated) ── */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ride"
            element={
              <ProtectedRoute>
                <RidePage enableMockGPS={true} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/debug"
            element={
              <ProtectedRoute>
                <Debug />
              </ProtectedRoute>
            }
          />

          {/* ── Catch-all ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthBootstrap>
    </BrowserRouter>
  );
}
