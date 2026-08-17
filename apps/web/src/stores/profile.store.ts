import { create } from 'zustand';
import type { UserProfileDto, UpdateProfileDto } from '../api/types';
import { apiService } from '../services/api.service';
import { useAuthStore } from './auth.store';

export type ProfileStatus = 'idle' | 'loading' | 'loaded' | 'error' | 'saving';

interface ProfileState {
  status: ProfileStatus;
  error: string | null;

  loadProfile: () => Promise<void>;
  updateProfile: (dto: UpdateProfileDto) => Promise<void>;
  reset: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  status: 'idle',
  error: null,

  loadProfile: async () => {
    try {
      set({ status: 'loading', error: null });
      const profile: UserProfileDto = await apiService.getProfile();

      useAuthStore.setState({ user: profile });

      set({ status: 'loaded' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar perfil';
      set({ status: 'error', error: message });
    }
  },

  updateProfile: async (dto: UpdateProfileDto) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    // Optimistic update
    const previousUser = { ...user };
    useAuthStore.setState({
      user: { ...user, ...dto },
    });

    try {
      set({ status: 'saving', error: null });
      const updated = await apiService.updateProfile(user.id, dto);

      useAuthStore.setState({ user: updated });
      set({ status: 'loaded' });
    } catch (err) {
      // Rollback on failure
      useAuthStore.setState({ user: previousUser });

      const message = err instanceof Error ? err.message : 'Falha ao atualizar perfil';
      set({ status: 'error', error: message });
      throw err;
    }
  },

  reset: () => {
    set({ status: 'idle', error: null });
  },
}));
