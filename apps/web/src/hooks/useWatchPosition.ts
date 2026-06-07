import { useEffect, useRef } from 'react';
import { useGPSStore } from '../stores/gps.store';

/**
 * useWatchPosition hook
 * - Starts/stops gps watch via `gps` store
 * - Reacts to options changes (restarts GPS if options.accuracy or timeout change)
 * - Designed to be imported in top-level pages (e.g., Record / GPS screens)
 */
export function useWatchPosition(autoStart = false, options?: PositionOptions) {
  const start = useGPSStore((s) => s.startTracking);
  const stop = useGPSStore((s) => s.stopTracking);
  const startedRef = useRef(false);
  const optionsRef = useRef(options);

  useEffect(() => {
    if (!autoStart) return;

    const prevOpts = optionsRef.current;
    const accuracyChanged = prevOpts?.enableHighAccuracy !== options?.enableHighAccuracy;
    const maxAgeChanged = prevOpts?.maximumAge !== options?.maximumAge;

    if (!startedRef.current) {
      start(options);
      startedRef.current = true;
    } else if (accuracyChanged || maxAgeChanged) {
      // Restart GPS with new options
      stop();
      start(options);
    }

    optionsRef.current = options;
  }, [autoStart, options?.enableHighAccuracy, options?.maximumAge, options?.timeout, start, stop]);

  return { start, stop };
}
