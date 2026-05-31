/**
 * Login Page
 * 
 * Sign in existing users with email/password
 * 
 * Features:
 * - Email validation
 * - Password input
 * - Loading state
 * - Error messages
 * - Signup link
 * - Offline-safe
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import type { SignInRequestDto } from '../api/types';

export function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignInRequestDto>({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // ========================================================================
  // VALIDATION
  // ========================================================================

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const errors: Record<string, string | null> = {
    email: touched.email
      ? !formData.email
        ? 'Email is required'
        : !validateEmail(formData.email)
        ? 'Invalid email'
        : null
      : null,
    password: touched.password
      ? !formData.password
        ? 'Password is required'
        : formData.password.length < 6
        ? 'Password must be at least 6 characters'
        : null
      : null,
  };

  const isFormValid =
    formData.email &&
    formData.password &&
    validateEmail(formData.email) &&
    formData.password.length >= 6 &&
    !isLoading;

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched for validation
    setTouched({
      email: true,
      password: true,
    });

    if (!isFormValid) return;

    setIsLoading(true);
    setError(null);

    try {
      await authService.signin(formData);
      navigate('/', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      setIsLoading(false);
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Sign in to continue tracking your rides
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
                errors.email
                  ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20'
                  : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900'
              } text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="your@email.com"
              autoFocus
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
                errors.password
                  ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20'
                  : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900'
              } text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="••••••"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.password}
              </p>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-950 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Signup Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-xs text-neutral-500 dark:text-neutral-500">
          <p>Your data is encrypted and secure.</p>
        </div>
      </div>
    </div>
  );
}
