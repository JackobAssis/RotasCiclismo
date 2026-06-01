import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useHistoryStore } from './history.store';

vi.mock('../services/api.service', () => ({
  apiService: {
    listRides: vi.fn(),
  },
}));

import { apiService } from '../services/api.service';

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
    const mockResponse = {
      data: [
        { id: 'ride-1', title: 'Morning Ride', status: 'FINISHED', distance: 10000 },
        { id: 'ride-2', title: 'Evening Ride', status: 'FINISHED', distance: 5000 },
      ],
      total: 2,
      page: 1,
      limit: 20,
      hasMore: false,
    };

    (apiService.listRides as any).mockResolvedValue(mockResponse);

    await useHistoryStore.getState().fetchRides();

    const state = useHistoryStore.getState();
    expect(state.status).toBe('loaded');
    expect(state.rides).toHaveLength(2);
    expect(state.total).toBe(2);
    expect(state.hasMore).toBe(false);
  });

  it('fetchRides handles error', async () => {
    (apiService.listRides as any).mockRejectedValue(new Error('Network error'));

    await useHistoryStore.getState().fetchRides();

    const state = useHistoryStore.getState();
    expect(state.status).toBe('error');
    expect(state.error).toBe('Network error');
  });

  it('loadMore loads next page', async () => {
    const page1 = {
      data: [{ id: 'ride-1' }],
      total: 3,
      page: 1,
      limit: 1,
      hasMore: true,
    };
    const page2 = {
      data: [{ id: 'ride-2' }],
      total: 3,
      page: 2,
      limit: 1,
      hasMore: true,
    };

    (apiService.listRides as any)
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2);

    await useHistoryStore.getState().fetchRides(1);
    expect(useHistoryStore.getState().rides).toHaveLength(1);

    await useHistoryStore.getState().loadMore();
    expect(useHistoryStore.getState().rides).toHaveLength(2);
  });

  it('reset clears all state', () => {
    useHistoryStore.setState({ rides: [{ id: 'test' } as any], status: 'loaded', total: 1 });
    useHistoryStore.getState().reset();
    const state = useHistoryStore.getState();
    expect(state.rides).toEqual([]);
    expect(state.status).toBe('idle');
    expect(state.page).toBe(1);
    expect(state.error).toBeNull();
  });
});
