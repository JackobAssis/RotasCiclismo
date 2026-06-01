import { create } from 'zustand';
import type { RideDto, PaginatedResponseDto } from '../api/types';
import { apiService } from '../services/api.service';
import { storageService } from '../services/storage.service';
import { eventBus } from '../lib/eventBus';

export type HistoryStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface HistoryState {
  rides: RideDto[];
  status: HistoryStatus;
  error: string | null;
  page: number;
  total: number;
  hasMore: boolean;

  fetchRides: (page?: number) => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  reset: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  rides: [],
  status: 'idle',
  error: null,
  page: 1,
  total: 0,
  hasMore: false,

  fetchRides: async (page = 1) => {
    try {
      set({ status: 'loading', error: null });

      const result: PaginatedResponseDto<RideDto> =
        await apiService.listRides(page, 20);

      set({
        rides: result.data ?? [],
        status: 'loaded',
        total: result.total ?? 0,
        page,
        hasMore: result.hasMore ?? false,
      });

      if (page === 1 && result.data) {
        storageService.cacheRides(result.data).catch(() => {});
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Falha ao carregar histórico';

      const cached = await storageService.getCachedRides();
      if (cached.length > 0) {
        set({
          rides: cached,
          status: 'loaded',
          total: cached.length,
          page: 1,
          hasMore: false,
          error: null,
        });
      } else {
        set({ status: 'error', error: message });
      }
    }
  },

  refresh: async () => {
    const { page } = get();
    return get().fetchRides(page);
  },

  loadMore: async () => {
    const { page, hasMore, status } = get();
    if (!hasMore || status === 'loading') return;

    const nextPage = page + 1;
    try {
      set({ status: 'loading' });

      const result: PaginatedResponseDto<RideDto> =
        await apiService.listRides(nextPage, 20);

      set((state) => ({
        rides: [...state.rides, ...(result.data ?? [])],
        status: 'loaded',
        total: result.total ?? state.total,
        page: nextPage,
        hasMore: result.hasMore ?? false,
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Falha ao carregar mais';
      set({ status: 'error', error: message });
    }
  },

  reset: () => {
    set({
      rides: [],
      status: 'idle',
      error: null,
      page: 1,
      total: 0,
      hasMore: false,
    });
  },
}));

eventBus.on('sync:task:finished', ({ rideId }: { taskId: number | string; rideId: string }) => {
  const state = useHistoryStore.getState();
  if (state.status === 'loaded') {
    state.fetchRides(1).catch(() => {});
  }
});
