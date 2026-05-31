/**
 * Signup Page
 * 
 * Create new user account
 * 
 * Features:
 * - Email validation (unique required by backend)
 * - Username validation
 * - Password validation (strength)
 * - Display name (optional)
 * - Loading state
 * - Error messages
 * - Login link
 * - Offline-safe
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import type { SignUpRequestDto } from '../api/types';

export function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignUpRequestDto>({
    email: '',
    username: '',
    password: '',
    displayName: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // ========================================================================
  // VALIDATION
  // ========================================================================

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateUsername = (username: string): boolean => {
    return username.length >= 3 && /^[a-zA-Z0-9_-]+$/.test(username);
  };

  const validatePassword = (password: string): boolean => {
    // At least 8 characters, letters + numbers
    return password.length >= 8 && /^(?=.*[a-zA-Z])(?=.*\d)/.test(password);
  };

  const errors: Record<string, string | null> = {
    email: touched.email
      ? !formData.email
        ? 'Email is required'
        : !validateEmail(formData.email)
        ? 'Invalid email'
        : null
      : null,
    username: touched.username
      ? !formData.username
        ? 'Username is required'
        : !validateUsername(formData.username)
        ? 'Username must be 3+ characters (letters, numbers, _, -)'
        : null
      : null,
    password: touched.password
      ? !formData.password
        ? 'Password is required'
        : !validatePassword(formData.password)
        ? 'Password must be 8+ characters (letters + numbers)'
        : null
      : null,
    confirmPassword: touched.confirmPassword
      ? !confirmPassword
        ? 'Confirm password'
        : confirmPassword !== formData.password
        ? 'Passwords do not match'
        : null
      : null,
  };

  const isFormValid =
    formData.email &&
    formData.username &&
    formData.password &&
    confirmPassword &&
    validateEmail(formData.email) &&
    validateUsername(formData.username) &&
    validatePassword(formData.password) &&
    confirmPassword === formData.password &&
    !isLoading;

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
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
      username: true,
      password: true,
      confirmPassword: true,
    });

    if (!isFormValid) return;

    setIsLoading(true);
    setError(null);

    try {
      await authService.signup(formData);
      navigate('/', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
      setIsLoading(false);
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950 px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            Create Account
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Start tracking your cycling adventures
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

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
                errors.username
                  ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20'
                  : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900'
              } text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="your_username"
            />
            {errors.username && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.username}
              </p>
            )}
          </div>

          {/* Display Name (Optional) */}
          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              Display Name <span className="text-xs text-neutral-500">(optional)</span>
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              value={formData.displayName || ''}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg text-sm text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your Display Name"
            />
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
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
                errors.confirmPassword
                  ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20'
                  : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900'
              } text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.confirmPassword}
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
                <span>Creating account...</span>
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-xs text-neutral-500 dark:text-neutral-500">
          <p>Your password will be encrypted and never shared.</p>
        </div>
      </div>
    </div>
  );
}
