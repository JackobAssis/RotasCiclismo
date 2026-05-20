import create from 'zustand';
import type { RoutePoint } from '../../../../packages/types/src/index';
import { eventBus } from '../lib/eventBus';

/**
 * GPS module store skeleton
 * Responsibilities:
 * - own raw geolocation state and watchPosition lifecycle
 * - buffer RoutePoint updates and flush them via eventBus
 * - manage status, accuracy and errors
 * - provide lightweight API for UI to start/stop tracking
 */

export type GPSStatus = 'idle' | 'watching' | 'error';

type GPSState = {
  lastPosition?: RoutePoint | null;
  status: GPSStatus;
  watchId?: number | null;
  buffer: RoutePoint[];
  // config
  flushIntervalMs: number;
  flushBatchSize: number;
  // actions
  startTracking: (options?: PositionOptions) => void;
  stopTracking: () => void;
  handlePosition: (p: RoutePoint) => void;
  flushBuffer: () => void;
};

export const useGPSStore = create<GPSState>((set, get) => ({
  lastPosition: null,
  status: 'idle',
  watchId: null,
  buffer: [],
  flushIntervalMs: 1000, // flush every 1s by default
  flushBatchSize: 10,

  startTracking: (options) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      set({ status: 'error' });
      return;
    }

    if (get().watchId != null) return; // already watching

    // battery/performance note: choose accuracy based on app mode; highAccuracy is expensive
    const posOptions: PositionOptions = {
      enableHighAccuracy: options?.enableHighAccuracy ?? false,
      maximumAge: options?.maximumAge ?? 0,
      timeout: options?.timeout ?? Infinity
    };

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        try {
          const point: RoutePoint = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            speed: pos.coords.speed ?? null,
            altitude: pos.coords.altitude ?? null,
            heading: (pos.coords as any).heading ?? null,
            accuracy: pos.coords.accuracy ?? null,
            timestamp: new Date(pos.timestamp).toISOString()
          };
          // lightweight local update
          get().handlePosition(point);
        } catch (err) {
          // error converting point, mark status
          set({ status: 'error' });
        }
      },
      (err) => {
        set({ status: 'error' });
        // In future: emit typed error events
        // eventBus.emit('gps:error', { code: err.code, message: err.message });
      },
      posOptions
    );

    // setup periodic flush
    const interval = window.setInterval(() => {
      get().flushBuffer();
    }, get().flushIntervalMs);

    // store watchId as interval id for cleanup grouping (we keep both IDs)
    // keep watchId numeric (geolocation returns number)
    set({ watchId: id as unknown as number, status: 'watching' });

    // store cleanup hook on window for safety (in case stopTracking not called)
    (window as any).__gps_cleanup = () => {
      try {
        navigator.geolocation.clearWatch(id as number);
      } catch (e) {
        /* ignore */
      }
      window.clearInterval(interval);
    };
  },

  stopTracking: () => {
    const w = get().watchId;
    if (w != null && typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        navigator.geolocation.clearWatch(w as number);
      } catch (e) {
        // ignore
      }
    }
    // flush remaining
    get().flushBuffer();
    set({ watchId: null, status: 'idle' });
  },

  handlePosition: (p) => {
    // placeholder for filtering, smoothing, throttling
    // e.g., drop low-accuracy fixes: if (p.accuracy && p.accuracy > threshold) return
    const buffer = get().buffer;
    buffer.push(p);
    set({ lastPosition: p, buffer });
    // optionally trigger immediate flush if batch size reached
    if (buffer.length >= get().flushBatchSize) get().flushBuffer();
  },

  flushBuffer: () => {
    const buf = get().buffer.slice();
    if (buf.length === 0) return;
    // Emit buffered points via typed event bus. Emitting one-by-one preserves existing contracts
    // while allowing future switch to batch events like 'points:batch'. Emission is decoupled
    // from direct store writes — ride.store listens and appends points.
    for (const pt of buf) {
      try {
        eventBus.emit('point:received', pt);
      } catch (e) {
        // swallow to keep pipeline resilient
      }
    }
    // Emit a diagnostic event indicating a flush occurred. Consumers (debug UI, workers)
    // can listen to this event to monitor flush frequency and buffer behavior.
    try {
      eventBus.emit('gps:flushed', { count: buf.length, at: new Date().toISOString() });
    } catch (e) {
      // ignore
    }
    // Clear buffer
    set({ buffer: [] });
  }
}));

// Notes:
// - This store intentionally does NOT write to `ride.store` directly. It only emits events.
// - For battery optimization: callers should choose suitable PositionOptions (enableHighAccuracy false for GPS-only mode by default).
// - For future worker integration, consider moving smoothing/throttling logic into a Web Worker and pushing processed points back via eventBus.
