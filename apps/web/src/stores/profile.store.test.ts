import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useProfileStore } from './profile.store';
import { useAuthStore } from './auth.store';

vi.mock('../services/api.service', () => ({
  apiService: {
    updateProfile: vi.fn(),
  },
}));

import { apiService } from '../services/api.service';

describe('ProfileStore', () => {
  beforeEach(() => {
    useProfileStore.getState().reset();
    useAuthStore.getState().reset();
    vi.clearAllMocks();
  });

  it('starts with idle state', () => {
    const state = useProfileStore.getState();
    expect(state.status).toBe('idle');
    expect(state.error).toBeNull();
  });

  it('updateProfile saves optimistically', async () => {
    const mockUser = { id: 'user-1', email: 'a@b.com', username: 'u', displayName: 'Old', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };
    useAuthStore.setState({ user: mockUser });

    (apiService.updateProfile as any).mockResolvedValue({
      ...mockUser,
      displayName: 'New Name',
    });

    await useProfileStore.getState().updateProfile({ displayName: 'New Name' });

    expect(useProfileStore.getState().status).toBe('loaded');
    expect(apiService.updateProfile).toHaveBeenCalledWith('user-1', { displayName: 'New Name' });
  });

  it('updateProfile handles error and rolls back', async () => {
    useAuthStore.setState({
      user: { id: 'user-1', email: 'a@b.com', username: 'u', displayName: 'Old', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
    });

    (apiService.updateProfile as any).mockRejectedValue(new Error('Update failed'));

    await expect(
      useProfileStore.getState().updateProfile({ displayName: 'New Name' }),
    ).rejects.toThrow('Update failed');

    expect(useProfileStore.getState().status).toBe('error');
    expect(useProfileStore.getState().error).toBe('Update failed');
  });

  it('reset clears error', () => {
    useProfileStore.setState({ status: 'error', error: 'Some error' });
    useProfileStore.getState().reset();
    expect(useProfileStore.getState().status).toBe('idle');
    expect(useProfileStore.getState().error).toBeNull();
  });
});
