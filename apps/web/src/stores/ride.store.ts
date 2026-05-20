import create from 'zustand';
import type { RideSession, RoutePoint, Snapshot } from '../../../../packages/types/src/index';
import { eventBus } from '../lib/eventBus';

/**
 * Ride store skeleton — owns RideSession lifecycle and persistence orchestration.
 * Architectural intent:
 * - `rides` module is the single owner of RideSession
 * - other modules (gps, camera) emit events which `rides` consumes
 * - store exposes clear lifecycle methods used by UI and other services
 * - state is minimal and optimized for mobile realtime usage
 */

type RideStatus = 'idle' | 'active' | 'paused' | 'finished';

type RideState = {
  active: RideSession | null;
  status: RideStatus;
  // lifecycle actions
  startRide: (session: Partial<RideSession> & { id: string; mode: RideSession['mode'] }) => void;
  pauseRide: () => void;
  resumeRide: () => void;
  finishRide: (meta?: Partial<RideSession>) => void;
  // updates
  addPoint: (point: RoutePoint) => void;
  addSnapshot: (snapshot: Snapshot) => void;
  // Silent/hydration APIs (do not emit events)
  hydrateSession: (session: RideSession) => void;
  appendPointsSilent: (points: RoutePoint[]) => void;
  appendSnapshotsSilent: (snapshots: Snapshot[]) => void;
};

export const useRideStore = create<RideState>((set, get) => ({
  active: null,
  status: 'idle',

  startRide: (session) => {
    const now = new Date().toISOString();
    const initial: RideSession = {
      id: session.id,
      userId: session.userId ?? null,
      mode: session.mode,
      startedAt: now,
      finishedAt: null,
      duration: 0,
      distance: 0,
      averageSpeed: 0,
      maxSpeed: 0,
      calories: 0,
      elevation: 0,
      route: [],
      snapshots: []
    };
    set({ active: initial, status: 'active' });
    // emit typed event for other modules
    eventBus.emit('ride:started', initial);
    // Note: persistence to IndexedDB and sync enqueuing should be handled by rides services
  },

  pauseRide: () => {
    const s = get().active;
    if (!s) return;
    const at = new Date().toISOString();
    set({ status: 'paused' });
    eventBus.emit('ride:paused', { rideId: s.id, at });
  },

  resumeRide: () => {
    const s = get().active;
    if (!s) return;
    const at = new Date().toISOString();
    set({ status: 'active' });
    eventBus.emit('ride:resumed', { rideId: s.id, at });
  },

  finishRide: (meta) => {
    const s = get().active;
    if (!s) return;
    const at = new Date().toISOString();
    const summary: Partial<RideSession> = {
      finishedAt: at,
      ...meta
    };
    // update active session minimally
    set({ active: { ...s, ...summary }, status: 'finished' });
    eventBus.emit('ride:finished', { rideId: s.id, at, summary });
    // Note: actual persistence, summary calculations and upload handled by services
  },

  addPoint: (point) => {
    const s = get().active;
    if (!s) return;
    // lightweight append to route buffer in memory; persistence is batched by services
    s.route = s.route ?? [];
    s.route.push(point as RoutePoint);
    // update minimal derived fields (placeholders)
    // e.g., distance/speed calculations are deferred to analytics worker
    set({ active: s });
    // Emit authoritative append event so storage layer can persist the point.
    // This keeps `rides` as the single source of truth while decoupling persistence.
    try {
      eventBus.emit('ride:point:added', { rideId: s.id, point });
    } catch (e) {
      // ignore
    }
  },

  addSnapshot: (snapshot) => {
    const s = get().active;
    if (!s) return;
    s.snapshots = s.snapshots ?? [];
    s.snapshots.push(snapshot);
    set({ active: s });
    // Notify storage/persistence about the new snapshot entry
    try {
      eventBus.emit('ride:snapshot:added', { rideId: s.id, snapshot });
    } catch (e) {
      // ignore
    }
  }
  ,

  // Hydration API: set active session without emitting lifecycle events.
  hydrateSession: (session) => {
    // replace active session entirely with provided session object
    set({ active: { ...session }, status: session.finishedAt ? 'finished' : 'active' });
  },

  // Append points without emitting persistence events. Used during restore.
  appendPointsSilent: (points) => {
    const s = get().active;
    if (!s) return;
    s.route = s.route ?? [];
    s.route.push(...points);
    set({ active: s });
  },

  appendSnapshotsSilent: (snapshots) => {
    const s = get().active;
    if (!s) return;
    s.snapshots = s.snapshots ?? [];
    s.snapshots.push(...snapshots);
    set({ active: s });
  }
}));

// Subscribe to typed events from the app-wide eventBus. This wiring ensures
// the `rides` module consumes `point:received` emitted by `gps` and remains
// authoritative for appending route points.
// We set up subscriptions once (module init). Consumers may call `eventBus.off` if needed.
{
  // ensure we don't duplicate subscriptions if this file is re-imported
  const unsubPoint = eventBus.on('point:received', (point) => {
    const state = useRideStore.getState();
    if (state.status === 'active') {
      state.addPoint(point);
    }
  });

  const unsubSnapshot = eventBus.on('snapshot:taken', (snapshot) => {
    const state = useRideStore.getState();
    if (state.status === 'active') {
      state.addSnapshot(snapshot);
    }
  });

  // Keep unsub functions reachable if needed in future (not exposed now).
}
