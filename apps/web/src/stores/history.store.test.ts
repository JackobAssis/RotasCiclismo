import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useHistoryStore } from './history.store';
import type { PaginatedResponseDto, RideDto } from '../api/types';

vi.mock('../services/api.service', () => ({
  apiService: {
    listRides: vi.fn(),
  },
}));

vi.mock('../services/storage.service', () => ({
  storageService: {
    cacheRides: vi.fn().mockResolvedValue(undefined),
    getCachedRides: vi.fn().mockResolvedValue([]),
  },
}));

import { apiService } from '../services/api.service';

function makeRide(id: string, overrides: Partial<RideDto> = {}): RideDto {
  return {
    id,
    userId: 'user-1',
    mode: 'GPS_ONLY',
    status: 'FINISHED',
    startedAt: '2026-01-01T00:00:00.000Z',
    distance: 0,
    duration: 0,
    averageSpeed: 0,
    maxSpeed: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('HistoryStore', () => {
  beforeEach(() => {
    useHistoryStore.getState().reset();
    vi.clearAllMocks();
  });

  it('starts with default state', () => {
    const state = useHistoryStore.getState();
    expect(state.rides).toEqual([]);
    expect(state.status).toBe('idle');
    expect(state.page).toBe(1);
    expect(state.total).toBe(0);
    expect(state.hasMore).toBe(false);
  });

  it('fetchRides loads rides and updates state', async () => {
    const mockResponse: PaginatedResponseDto<RideDto> = {
      data: [
        makeRide('ride-1', { title: 'Morning Ride', status: 'FINISHED', distance: 10000 }),
        makeRide('ride-2', { title: 'Evening Ride', status: 'FINISHED', distance: 5000 }),
      ],
      total: 2,
      page: 1,
      limit: 20,
      hasMore: false,
    };

    vi.mocked(apiService.listRides).mockResolvedValue(mockResponse);

    await useHistoryStore.getState().fetchRides();

    const state = useHistoryStore.getState();
    expect(state.status).toBe('loaded');
    expect(state.rides).toHaveLength(2);
    expect(state.total).toBe(2);
    expect(state.hasMore).toBe(false);
  });

  it('fetchRides handles error', async () => {
    vi.mocked(apiService.listRides).mockRejectedValue(new Error('Network error'));

    await useHistoryStore.getState().fetchRides();

    const state = useHistoryStore.getState();
    expect(state.status).toBe('error');
    expect(state.error).toBe('Network error');
  });

  it('loadMore loads next page', async () => {
    const page1: PaginatedResponseDto<RideDto> = {
      data: [makeRide('ride-1')],
      total: 3,
      page: 1,
      limit: 1,
      hasMore: true,
    };
    const page2: PaginatedResponseDto<RideDto> = {
      data: [makeRide('ride-2')],
      total: 3,
      page: 2,
      limit: 1,
      hasMore: true,
    };

    vi.mocked(apiService.listRides).mockResolvedValueOnce(page1).mockResolvedValueOnce(page2);

    await useHistoryStore.getState().fetchRides(1);
    expect(useHistoryStore.getState().rides).toHaveLength(1);

    await useHistoryStore.getState().loadMore();
    expect(useHistoryStore.getState().rides).toHaveLength(2);
  });

  it('reset clears all state', () => {
    useHistoryStore.setState({ rides: [{ id: 'test' } as RideDto], status: 'loaded', total: 1 });
    useHistoryStore.getState().reset();
    const state = useHistoryStore.getState();
    expect(state.rides).toEqual([]);
    expect(state.status).toBe('idle');
    expect(state.page).toBe(1);
    expect(state.error).toBeNull();
  });
});
