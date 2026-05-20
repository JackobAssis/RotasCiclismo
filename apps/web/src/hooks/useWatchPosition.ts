import { useEffect, useRef } from 'react';
import { useGPSStore } from '../stores/gps.store';

/**
 * useWatchPosition hook skeleton
 * - Starts/stops gps watch via `gps` store
 * - Exposes minimal API via gps store; keeps heavy logic in store or workers
 * - Designed to be imported in top-level pages (e.g., Record / GPS screens)
 */
export function useWatchPosition(autoStart = false, options?: PositionOptions) {
  const startedRef = useRef(false);
  const start = useGPSStore((s) => s.startTracking);
  const stop = useGPSStore((s) => s.stopTracking);

  useEffect(() => {
    if (autoStart && !startedRef.current) {
      start(options);
      startedRef.current = true;
    }
    return () => {
      // cleanup on unmount
      stop();
    };
  }, [autoStart]);

  return {
    start,
    stop
  };
}
