import { eventBus } from '../lib/eventBus';
import type { RoutePoint, RideSession, Snapshot, SyncTask } from '../../../../packages/types/src/index';

const DB_NAME = 'cycling_system_v1';
const DB_VERSION = 2;
const STORE_SESSIONS = 'sessions';
const STORE_POINTS = 'route_points';
const STORE_SNAPSHOTS = 'snapshots';
const STORE_SYNC = 'sync_queue';
const STORE_RIDES_CACHE = 'rides_cache';

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
      if (!db.objectStoreNames.contains(STORE_RIDES_CACHE)) {
        const s = db.createObjectStore(STORE_RIDES_CACHE, { keyPath: 'id' });
        s.createIndex('createdAt_idx', 'createdAt');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db: IDBDatabase, storeNames: string[], mode: IDBTransactionMode = 'readwrite') {
  return db.transaction(storeNames, mode);
}

const pointQueue: Array<{ rideId: string; point: RoutePoint }> = [];
let flushTimer: number | null = null;
let isFlushing = false;

async function flushPointsBatch() {
  if (isFlushing) return;
  if (pointQueue.length === 0) return;
  isFlushing = true;
  const batch = pointQueue.splice(0, 500);
  try {
    const db = await openDB();
    const transaction = tx(db, [STORE_POINTS]);
    const store = transaction.objectStore(STORE_POINTS);
    for (const item of batch) {
      try {
        store.put({ rideId: item.rideId, ts: item.point.timestamp, point: item.point });
      } catch (e) {
        // ignore individual errors
      }
    }
    eventBus.emit('gps:flushed', { count: batch.length, at: new Date().toISOString() });
    console.log(`[Storage] Flushed ${batch.length} route points to IndexedDB`);
  } catch (e) {
    pointQueue.unshift(...batch);
    console.warn('[Storage] DB write failed, re-enqueued batch');
  } finally {
    isFlushing = false;
  }
}

function scheduleFlush(delay = 1000) {
  if (flushTimer != null) return;
  flushTimer = window.setTimeout(async () => {
    flushTimer = null;
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(async () => {
        await flushPointsBatch();
      });
    } else {
      await flushPointsBatch();
    }
  }, delay);
}

const LOG_PREFIX = '[SyncQueue]';

function logQueue(action: string, detail: Record<string, unknown>) {
  console.log(`${LOG_PREFIX} ${action}`, {
    timestamp: new Date().toISOString(),
    ...detail,
  });
}

export const storageService = {
  async init() {
    await openDB();
    logQueue('service:init', {});

    eventBus.on('ride:started', async (session: RideSession) => {
      try {
        const db = await openDB();
        const store = tx(db, [STORE_SESSIONS]).objectStore(STORE_SESSIONS);
        store.put(session);
        logQueue('session:saved', { rideId: session.id, mode: session.mode });
      } catch (e) {
        console.warn('[Storage] Failed to save session', e);
      }

      // Enqueue ride creation sync task
      try {
        await storageService.enqueueSyncTask({
          type: 'RIDE_CREATE',
          rideId: session.id,
          payload: {
            id: session.id,
            mode: session.mode,
            startedAt: session.startedAt,
          },
          status: 'pending',
          attempts: 0,
        });
        logQueue('task:enqueued', { type: 'RIDE_CREATE', rideId: session.id });
      } catch (e) {
        console.warn('[Storage] Failed to enqueue RIDE_CREATE', e);
      }
    });

    eventBus.on('ride:point:added', (p) => {
      pointQueue.push({ rideId: p.rideId, point: p.point });
      scheduleFlush();
    });

    eventBus.on('ride:snapshot:added', async ({ rideId, snapshot }) => {
      try {
        const db = await openDB();
        const store = tx(db, [STORE_SNAPSHOTS]).objectStore(STORE_SNAPSHOTS);
        store.put({ ...snapshot, rideId });
        logQueue('snapshot:saved', { rideId, snapshotId: snapshot.id });
      } catch (e) {
        console.warn('[Storage] Failed to save snapshot', e);
      }
    });

    eventBus.on('ride:finished', async ({ rideId, at, summary }) => {
      try {
        const db = await openDB();
        const store = tx(db, [STORE_SESSIONS]).objectStore(STORE_SESSIONS);
        const req = store.get(rideId);
        req.onsuccess = () => {
          const s = req.result || {};
          s.finishedAt = at;
          Object.assign(s, summary ?? {});
          store.put(s);
        };
      } catch (e) {
        console.warn('[Storage] Failed to update finished session', e);
      }

      logQueue('ride:finished', { rideId, at });

      // Enqueue route points upload
      try {
        const points = await storageService.getPointsForRide(rideId);
        if (points.length > 0) {
          await storageService.enqueueSyncTask({
            type: 'ROUTE_POINTS_UPLOAD',
            rideId,
            payload: { points },
            status: 'pending',
            attempts: 0,
          });
          logQueue('task:enqueued', { type: 'ROUTE_POINTS_UPLOAD', rideId, points: points.length });
        }
      } catch (e) {
        console.warn('[Storage] Failed to enqueue ROUTE_POINTS_UPLOAD', e);
      }

      // Enqueue snapshot uploads
      try {
        const snapshots = await storageService.getSnapshotsForRide(rideId);
        for (const snap of snapshots) {
          await storageService.enqueueSyncTask({
            type: 'SNAPSHOT_UPLOAD',
            rideId,
            payload: {
              id: snap.id,
              imageUrl: snap.imageUrl,
              latitude: snap.latitude,
              longitude: snap.longitude,
              timestamp: snap.timestamp,
            },
            status: 'pending',
            attempts: 0,
          });
          logQueue('task:enqueued', { type: 'SNAPSHOT_UPLOAD', rideId, snapshotId: snap.id });
        }
      } catch (e) {
        console.warn('[Storage] Failed to enqueue SNAPSHOT_UPLOAD', e);
      }

      // Enqueue ride finish
      try {
        await storageService.enqueueSyncTask({
          type: 'RIDE_FINISH',
          rideId,
          payload: {
            finishedAt: at,
            distance: summary?.distance ?? 0,
            duration: summary?.duration ?? 0,
            averageSpeed: summary?.averageSpeed ?? 0,
            maxSpeed: summary?.maxSpeed ?? 0,
            elevation: summary?.elevation ?? 0,
            calories: summary?.calories ?? 0,
          },
          status: 'pending',
          attempts: 0,
        });
        logQueue('task:enqueued', { type: 'RIDE_FINISH', rideId });
      } catch (e) {
        console.warn('[Storage] Failed to enqueue RIDE_FINISH', e);
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
        req.onsuccess = () => {
          logQueue('task:persisted', { type: task.type, rideId: task.rideId });
          resolve();
        };
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
        const pending = all.filter(
          (t: any) => t.status === 'pending' || t.status === 'failed'
        ).slice(0, limit);
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
      const req = store.getAll();
      req.onsuccess = () => {
        const all = req.result || [];
        resolve(all.filter((s: any) => s.rideId === rideId));
      };
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

  async streamPointsForRide(
    rideId: string,
    onChunk: (points: RoutePoint[]) => Promise<void> | void,
    chunkSize = 500
  ) {
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
            const chunk = buffer.splice(0, buffer.length);
            await onChunk(chunk);
          }
          cursor.continue();
        } else {
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
    for (const name of [STORE_POINTS, STORE_SESSIONS, STORE_SNAPSHOTS, STORE_SYNC, STORE_RIDES_CACHE]) {
      const store = tx(db, [name]).objectStore(name);
      store.clear();
    }
    logQueue('service:cleared', {});
  },

  async cacheRides(rides: any[]): Promise<void> {
    const db = await openDB();
    return new Promise((resolve) => {
      const store = tx(db, [STORE_RIDES_CACHE]).objectStore(STORE_RIDES_CACHE);
      const clearReq = store.clear();
      clearReq.onsuccess = () => {
        for (const ride of rides) {
          store.put({ ...ride, createdAt: ride.createdAt || new Date().toISOString() });
        }
        resolve();
      };
      clearReq.onerror = () => resolve();
    });
  },

  async getCachedRides(): Promise<any[]> {
    const db = await openDB();
    return new Promise((resolve) => {
      const store = tx(db, [STORE_RIDES_CACHE], 'readonly').objectStore(STORE_RIDES_CACHE);
      const index = store.index('createdAt_idx');
      const req = index.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  },

  async clearRidesCache(): Promise<void> {
    const db = await openDB();
    return new Promise((resolve) => {
      const store = tx(db, [STORE_RIDES_CACHE]).objectStore(STORE_RIDES_CACHE);
      store.clear();
      resolve();
    });
  },

  manualFlush() {
    return flushPointsBatch();
  },
};

storageService.init().catch(() => {});
