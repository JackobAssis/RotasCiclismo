import { create } from 'zustand';
import type { AnalyticsResponseDto } from '../api/types';
import { apiService } from '../services/api.service';
import { eventBus } from '../lib/eventBus';

export type AnalyticsStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface AnalyticsState {
  data: AnalyticsResponseDto | null;
  status: AnalyticsStatus;
  error: string | null;

  fetch: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  data: null,
  status: 'idle',
  error: null,

  fetch: async () => {
    try {
      set({ status: 'loading', error: null });
      const data = await apiService.getAnalytics();
      set({ data, status: 'loaded' });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Falha ao carregar analytics';
      set({ status: 'error', error: message });
    }
  },

  refresh: async () => {
    return get().fetch();
  },

  reset: () => {
    set({ data: null, status: 'idle', error: null });
  },
}));

eventBus.on('sync:task:finished', () => {
  const state = useAnalyticsStore.getState();
  if (state.status === 'loaded') {
    state.fetch().catch(() => {});
  }
});
