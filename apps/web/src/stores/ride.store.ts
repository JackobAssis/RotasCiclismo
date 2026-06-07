import create from 'zustand';
import type { RideSession, RoutePoint, Snapshot } from '../../../../packages/types/src/index';
import { eventBus } from '../lib/eventBus';

/**
 * Ride store — owns RideSession lifecycle and realtime updates
 *
 * Architectural intent:
 * - `rides` module is the single owner of RideSession
 * - GPS and camera modules emit events which `rides` consumes
 * - Store exposes clear lifecycle methods used by UI and services
 * - State is optimized for mobile realtime usage and HUD subscriptions
 * - Distance calculated using Haversine formula for GPS accuracy
 * - Duration, speed, and elevation updates on point addition
 *
 * Realtime Rendering:
 * - addPoint() triggers store updates which propagate to Map and Widgets
 * - Map uses memoized selectors to detect polyline changes
 * - Widgets use granular selectors (speed, distance, duration)
 * - No unnecessary re-renders via selector isolation
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

/**
 * Haversine formula to calculate distance between two GPS points
 * Returns distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate duration in milliseconds
 */
function calculateDuration(startedAt: string): number {
  const now = new Date();
  const start = new Date(startedAt);
  return Math.floor((now.getTime() - start.getTime()) / 1000); // in seconds
}

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
    set({ active: { ...s, ...summary }, status: 'finished' });
    eventBus.emit('ride:finished', { rideId: s.id, at, summary });
  },

  addPoint: (point) => {
    const s = get().active;
    if (!s) return;

    // Initialize route array if needed
    s.route = s.route ?? [];

    // Calculate additional metrics from the new point
    let newDistance = s.distance ?? 0;
    let maxSpeed = s.maxSpeed ?? 0;
    let elevation = s.elevation ?? 0;

    // Calculate distance from previous point if route is not empty
    if (s.route.length > 0) {
      const prevPoint = s.route[s.route.length - 1];
      const distanceToPoint = calculateDistance(
        prevPoint.latitude,
        prevPoint.longitude,
        point.latitude,
        point.longitude
      );
      newDistance += distanceToPoint;
    }

    // Update max speed
    const currentSpeed = point.speed ?? 0;
    maxSpeed = Math.max(maxSpeed, currentSpeed);

    // Calculate elevation change (simplified - just track last elevation)
    elevation = point.altitude ?? elevation;

    // Calculate duration
    const duration = calculateDuration(s.startedAt);

    // Calculate average speed (km/h)
    const durationHours = duration / 3600;
    const averageSpeed = durationHours > 0 ? newDistance / durationHours : 0;

    // Add point to route
    s.route.push(point as RoutePoint);

    // Update active session with calculated metrics
    set({
      active: {
        ...s,
        distance: newDistance,
        maxSpeed,
        elevation,
        duration,
        averageSpeed
      }
    });

    // Emit event for persistence layer
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
    try {
      eventBus.emit('ride:snapshot:added', { rideId: s.id, snapshot });
    } catch (e) {
      // ignore
    }
  },

  hydrateSession: (session) => {
    set({ active: { ...session }, status: session.finishedAt ? 'finished' : 'active' });
  },

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

let unsubPointRide: (() => void) | null = null;
let unsubPointsBatch: (() => void) | null = null;
let unsubSnapshotRide: (() => void) | null = null;

function subscribeToEvents() {
  unsubPointRide?.();
  unsubPointsBatch?.();
  unsubSnapshotRide?.();

  unsubPointRide = eventBus.on('point:received', (point) => {
    const state = useRideStore.getState();
    if (state.status === 'active') state.addPoint(point);
  });

  unsubPointsBatch = eventBus.on('points:received', (points) => {
    const state = useRideStore.getState();
    if (state.status !== 'active' || !state.active) return;
    const s = state.active;
    s.route = s.route ?? [];
    for (const point of points) {
      const prev = s.route.length > 0 ? s.route[s.route.length - 1] : null;
      if (prev) {
        const dLat = ((point.latitude - prev.latitude) * Math.PI) / 180;
        const dLon = ((point.longitude - prev.longitude) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((prev.latitude * Math.PI) / 180) *
            Math.cos((point.latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
        s.distance = (s.distance ?? 0) + 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      }
      s.route.push(point);
      s.maxSpeed = Math.max(s.maxSpeed ?? 0, point.speed ?? 0);
      s.elevation = point.altitude ?? s.elevation ?? 0;
    }
    const duration = Math.floor((Date.now() - new Date(s.startedAt).getTime()) / 1000);
    const hours = duration / 3600;
    s.duration = duration;
    s.averageSpeed = hours > 0 ? (s.distance ?? 0) / hours : 0;
    useRideStore.setState({ active: { ...s } });
    for (const point of points) {
      try { eventBus.emit('ride:point:added', { rideId: s.id, point }); } catch {}
    }
  });

  unsubSnapshotRide = eventBus.on('snapshot:taken', (snapshot) => {
    const state = useRideStore.getState();
    if (state.status === 'active') state.addSnapshot(snapshot);
  });
}

subscribeToEvents();

if (typeof import.meta !== 'undefined' && import.meta.hot) {
  import.meta.hot.dispose(() => {
    unsubPointRide?.();
    unsubPointsBatch?.();
    unsubSnapshotRide?.();
  });
}
