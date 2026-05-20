import { eventBus } from '../lib/eventBus';
import type { RoutePoint, RideSession, Snapshot, SyncTask } from '../../../../packages/types/src/index';

/**
 * IndexedDB storage service for offline-first persistence.
 * Responsibilities:
 * - Persist RideSession metadata
 * - Persist RoutePoints in batches
 * - Persist Snapshot metadata
 * - Maintain a sync queue for future uploads
 * - Support recovery/restore of sessions after reload/crash
 *
 * Architectural notes:
 * - This service subscribes to typed events emitted by `rides` (authoritative)
 *   and `gps` for diagnostics. UI must not access IndexedDB directly.
 * - Writes are batched and non-blocking to avoid main-thread stalls.
 * - DB schema uses versioning strategy to support future migrations.
 */

const DB_NAME = 'cycling_system_v1';
const DB_VERSION = 1;
const STORE_SESSIONS = 'sessions';
const STORE_POINTS = 'route_points';
const STORE_SNAPSHOTS = 'snapshots';
const STORE_SYNC = 'sync_queue';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (ev) => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_POINTS)) {
        const s = db.createObjectStore(STORE_POINTS, { keyPath: ['rideId', 'ts'] });
        s.createIndex('rideId_idx', 'rideId');
      }
      if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
        db.createObjectStore(STORE_SNAPSHOTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SYNC)) {
        db.createObjectStore(STORE_SYNC, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Simple helper to run a transaction
function tx(db: IDBDatabase, storeNames: string[], mode: IDBTransactionMode = 'readwrite') {
  return db.transaction(storeNames, mode);
}

// In-memory batching queue to collect points before writing to IndexedDB
const pointQueue: Array<{ rideId: string; point: RoutePoint }> = [];
let flushTimer: number | null = null;
let isFlushing = false;

async function flushPointsBatch() {
  if (isFlushing) return;
  if (pointQueue.length === 0) return;
  isFlushing = true;
  const batch = pointQueue.splice(0, 500); // up to 500 points per batch
  try {
    const db = await openDB();
    const transaction = tx(db, [STORE_POINTS]);
    const store = transaction.objectStore(STORE_POINTS);
    for (const item of batch) {
      // key: [rideId, ts]
      try {
        store.put({ rideId: item.rideId, ts: item.point.timestamp, point: item.point });
      } catch (e) {
        // ignore individual errors
      }
    }
    // notify diagnostics
    eventBus.emit('gps:flushed', { count: batch.length, at: new Date().toISOString() });
  } catch (e) {
    // If DB write fails, re-enqueue batch at front
    pointQueue.unshift(...batch);
  } finally {
    isFlushing = false;
  }
}

function scheduleFlush(delay = 1000) {
  if (flushTimer != null) return;
  flushTimer = window.setTimeout(async () => {
    flushTimer = null;
    // Use requestIdleCallback when available to avoid blocking UI
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(async () => {
        await flushPointsBatch();
      });
    } else {
      await flushPointsBatch();
    }
  }, delay);
}

// Public storage API
export const storageService = {
  async init() {
    await openDB();
    // subscribe to ride events
    eventBus.on('ride:started', async (session: RideSession) => {
      try {
        const db = await openDB();
        const store = tx(db, [STORE_SESSIONS]).objectStore(STORE_SESSIONS);
        store.put(session);
      } catch (e) {
        // ignore for now
      }
    });

    eventBus.on('ride:point:added', (p) => {
      // enqueue for batch persistence
      pointQueue.push({ rideId: p.rideId, point: p.point });
      // schedule batched flush
      scheduleFlush();
    });

    eventBus.on('ride:snapshot:added', async ({ rideId, snapshot }) => {
      try {
        const db = await openDB();
        const store = tx(db, [STORE_SNAPSHOTS]).objectStore(STORE_SNAPSHOTS);
        store.put({ ...snapshot, rideId });
      } catch (e) {
        // ignore
      }
    });

    eventBus.on('ride:finished', async ({ rideId, at, summary }) => {
      try {
        const db = await openDB();
        const store = tx(db, [STORE_SESSIONS]).objectStore(STORE_SESSIONS);
        // update session finishedAt and summary fields
        const req = store.get(rideId);
        req.onsuccess = () => {
          const s = req.result || {};
          s.finishedAt = at;
          Object.assign(s, summary ?? {});
          store.put(s);
        };
      } catch (e) {
        // ignore
      }
      // enqueue a sync task to upload this ride later
      try {
        await storageService.enqueueSyncTask({
          type: 'ride_upload',
          rideId,
          payload: null,
          attempts: 0,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
      } catch (e) {
        // ignore enqueue errors
      }
    });
  },

  async getSession(id: string): Promise<RideSession | null> {
    const db = await openDB();
    return new Promise((resolve) => {
      const store = tx(db, [STORE_SESSIONS], 'readonly').objectStore(STORE_SESSIONS);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  },

  async getPointsForRide(rideId: string): Promise<RoutePoint[]> {
    const db = await openDB();
    return new Promise((resolve) => {
      const store = tx(db, [STORE_POINTS], 'readonly').objectStore(STORE_POINTS);
      const index = store.index('rideId_idx');
      const req = index.getAll(IDBKeyRange.only(rideId));
      req.onsuccess = () => resolve((req.result || []).map((r: any) => r.point));
      req.onerror = () => resolve([]);
    });
  },

  async enqueueSyncTask(task: Partial<SyncTask>): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      try {
        const store = tx(db, [STORE_SYNC]).objectStore(STORE_SYNC);
        const obj = { ...task, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        const req = store.add(obj as any);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (e) {
        reject(e);
      }
    });
  },

  async getPendingSyncTasks(limit = 50): Promise<any[]> {
    const db = await openDB();
    return new Promise((resolve) => {
      const store = tx(db, [STORE_SYNC], 'readonly').objectStore(STORE_SYNC);
      const req = store.getAll();
      req.onsuccess = () => {
        const all = req.result || [];
        const pending = all.filter((t: any) => t.status === 'pending' || t.status === 'failed').slice(0, limit);
        resolve(pending);
      };
      req.onerror = () => resolve([]);
    });
  },

  async getAllSyncTasks(): Promise<any[]> {
    const db = await openDB();
    return new Promise((resolve) => {
      const store = tx(db, [STORE_SYNC], 'readonly').objectStore(STORE_SYNC);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  },

  async updateSyncTask(taskId: any, updates: Partial<any>): Promise<void> {
    const db = await openDB();
    return new Promise((resolve) => {
      const store = tx(db, [STORE_SYNC]).objectStore(STORE_SYNC);
      const req = store.get(taskId as any);
      req.onsuccess = () => {
        const t = req.result;
        if (!t) return resolve();
        Object.assign(t, updates, { updatedAt: new Date().toISOString() });
        store.put(t);
        resolve();
      };
      req.onerror = () => resolve();
    });
  },

  async removeSyncTask(taskId: any): Promise<void> {
    const db = await openDB();
    return new Promise((resolve) => {
      const store = tx(db, [STORE_SYNC]).objectStore(STORE_SYNC);
      const req = store.delete(taskId as any);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  },

  async getSnapshotsForRide(rideId: string): Promise<Snapshot[]> {
    const db = await openDB();
    return new Promise((resolve) => {
      const store = tx(db, [STORE_SNAPSHOTS], 'readonly').objectStore(STORE_SNAPSHOTS);
      const req = store.getAll(IDBKeyRange.only(rideId));
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  },

  async getUnfinishedSessions(): Promise<RideSession[]> {
    const db = await openDB();
    return new Promise((resolve) => {
      const store = tx(db, [STORE_SESSIONS], 'readonly').objectStore(STORE_SESSIONS);
      const req = store.getAll();
      req.onsuccess = () => {
        const all = req.result || [];
        const unfinished = all.filter((s: any) => !s.finishedAt);
        resolve(unfinished);
      };
      req.onerror = () => resolve([]);
    });
  },

  /**
   * Stream points for a ride using a cursor and call `onChunk` with arrays of points.
   * This avoids loading all points into memory for very large sessions.
   */
  async streamPointsForRide(rideId: string, onChunk: (points: RoutePoint[]) => Promise<void> | void, chunkSize = 500) {
    const db = await openDB();
    return new Promise<void>((resolve) => {
      const store = tx(db, [STORE_POINTS], 'readonly').objectStore(STORE_POINTS);
      const index = store.index('rideId_idx');
      const request = index.openCursor(IDBKeyRange.only(rideId));
      const buffer: RoutePoint[] = [];
      request.onsuccess = async (ev) => {
        const cursor = (ev.target as any).result as IDBCursorWithValue | null;
        if (cursor) {
          buffer.push(cursor.value.point);
          if (buffer.length >= chunkSize) {
            // pause cursor and process chunk
            const chunk = buffer.splice(0, buffer.length);
            await onChunk(chunk);
          }
          cursor.continue();
        } else {
          // no more
          if (buffer.length > 0) {
            await onChunk(buffer.splice(0, buffer.length));
          }
          resolve();
        }
      };
      request.onerror = () => resolve();
    });
  },

  async clearAll() {
    const db = await openDB();
    for (const name of [STORE_POINTS, STORE_SESSIONS, STORE_SNAPSHOTS, STORE_SYNC]) {
      const store = tx(db, [name]).objectStore(name);
      store.clear();
    }
  },

  // Expose a manual flush for debugging/validation
  manualFlush() {
    return flushPointsBatch();
  }
};

// Initialize the service immediately so it starts listening to events.
// Consumers may import storageService and await storageService.init() if they need guarantee.
storageService.init().catch(() => {});
