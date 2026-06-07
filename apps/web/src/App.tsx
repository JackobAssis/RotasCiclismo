import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthBootstrap } from './components/AuthBootstrap';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { OfflineIndicator } from './components/OfflineIndicator';
import { InstallPwaBanner } from './components/InstallPwaBanner';
import RidePage from './pages/Ride';
import Home from './pages/Home';
import { LoginPage } from './pages/Login';
import { SignupPage } from './pages/Signup';
import Debug from './pages/Debug';
import History from './pages/History';
import RideDetails from './pages/RideDetails';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';

export default function App() {
  return (
    <BrowserRouter>
      <OfflineIndicator />
      <InstallPwaBanner />
      <AuthBootstrap>
        <Routes>
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

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Home />} />
            <Route path="/history" element={<History />} />
            <Route path="/history/:rideId" element={<RideDetails />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/debug" element={<Debug />} />
          </Route>

          <Route
            path="/ride"
            element={
              <ProtectedRoute>
                <RidePage enableMockGPS={import.meta.env.DEV} />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthBootstrap>
    </BrowserRouter>
  );
}
