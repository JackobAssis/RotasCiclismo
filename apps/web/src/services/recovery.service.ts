import { storageService } from './storage.service';
import { useRideStore } from '../stores/ride.store';

/**
 * Recovery service — restores unfinished RideSession from IndexedDB on startup.
 * - detects unfinished sessions
 * - selects the most recent unfinished session
 * - hydrates ride.store with session metadata
 * - streams route points progressively and appends silently to ride.store
 * - restores snapshots
 *
 * Architectural intent:
 * - rides module remains authoritative; recovery uses silent APIs to avoid emitting persistence events
 * - restoration is incremental to avoid large-memory spikes
 */

export const recoveryService = {
  async init() {
    try {
      await storageService.init();
      const unfinished = await storageService.getUnfinishedSessions();
      if (!unfinished || unfinished.length === 0) return;

      // pick the latest by startedAt
      unfinished.sort((a, b) => (a.startedAt > b.startedAt ? -1 : 1));
      const session = unfinished[0];

      // hydrate session metadata into ride store without emitting lifecycle events
      useRideStore.getState().hydrateSession(session);

      // stream points incrementally to avoid blocking
      await storageService.streamPointsForRide(session.id, async (chunk) => {
        // append silently
        useRideStore.getState().appendPointsSilent(chunk as any);
        // yield to event loop to keep UI responsive
        await new Promise((r) => setTimeout(r, 0));
      });

      // restore snapshots
      const snaps = await storageService.getSnapshotsForRide(session.id);
      if (snaps && snaps.length > 0) {
        useRideStore.getState().appendSnapshotsSilent(snaps as any);
      }

      // After hydration, UI can choose to resume tracking. We leave that decision to UI.
    } catch (e) {
      // detection of corruption or other errors could be handled here
      // For now we fail quietly to avoid blocking app startup
    }
  }
};
