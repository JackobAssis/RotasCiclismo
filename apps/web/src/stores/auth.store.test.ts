import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './auth.store';

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().reset();
  });

  it('starts in idle state', () => {
    const state = useAuthStore.getState();
    expect(state.status).toBe('idle');
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it('setAuthenticating transitions to authenticating state', () => {
    useAuthStore.getState().setAuthenticating();
    const state = useAuthStore.getState();
    expect(state.status).toBe('authenticating');
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('setAuthenticated sets user and tokens', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const mockTokens = {
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
    };

    useAuthStore.getState().setAuthenticated(mockUser, mockTokens);
    const state = useAuthStore.getState();

    expect(state.status).toBe('authenticated');
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe('access-123');
    expect(state.refreshToken).toBe('refresh-456');
    expect(state.lastAuthAt).toBeGreaterThan(0);
  });

  it('setUnauthenticated clears auth state', () => {
    // First login
    useAuthStore.getState().setAuthenticated(
      { id: '1', email: 'a@b.com', username: 'u', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      { accessToken: 'at', refreshToken: 'rt' },
    );

    // Then logout
    useAuthStore.getState().setUnauthenticated();
    const state = useAuthStore.getState();

    expect(state.status).toBe('unauthenticated');
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });

  it('logout clears auth state', () => {
    useAuthStore.getState().setAuthenticated(
      { id: '1', email: 'a@b.com', username: 'u', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      { accessToken: 'at', refreshToken: 'rt' },
    );

    useAuthStore.getState().logout();
    const state = useAuthStore.getState();

    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it('startHydration sets hydrating status', () => {
    useAuthStore.getState().startHydration();
    const state = useAuthStore.getState();
    expect(state.status).toBe('hydrating');
    expect(state.isLoading).toBe(true);
  });

  it('completeHydration with data sets authenticated', () => {
    const mockUser = { id: '1', email: 'a@b.com', username: 'u', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };
    const mockTokens = { accessToken: 'at', refreshToken: 'rt' };

    useAuthStore.getState().completeHydration(mockUser, mockTokens);
    const state = useAuthStore.getState();

    expect(state.status).toBe('authenticated');
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
  });

  it('completeHydration without data sets unauthenticated', () => {
    useAuthStore.getState().completeHydration(null, null);
    const state = useAuthStore.getState();

    expect(state.status).toBe('unauthenticated');
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it('setError stores error message', () => {
    useAuthStore.getState().setError('Something went wrong');
    expect(useAuthStore.getState().error).toBe('Something went wrong');
  });

  it('selectIsAuthenticated returns correct value', () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    useAuthStore.getState().setAuthenticated(
      { id: '1', email: 'a@b.com', username: 'u', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      { accessToken: 'at', refreshToken: 'rt' },
    );
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
