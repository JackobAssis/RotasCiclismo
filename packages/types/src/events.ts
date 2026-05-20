import { RideSession, RoutePoint, Snapshot, SyncWorkerStatus } from './index';

// App-wide typed events map
export type AppEvents = {
  'ride:started': RideSession;
  'ride:paused': { rideId: string; at: string };
  'ride:resumed': { rideId: string; at: string };
  'ride:finished': { rideId: string; at: string; summary?: Partial<RideSession> };
  'point:received': RoutePoint;
  'ride:point:added': { rideId: string; point: RoutePoint };
  'snapshot:taken': Snapshot;
  'gps:flushed': { count: number; at: string };
  'ride:snapshot:added': { rideId: string; snapshot: Snapshot };
  'analytics:update': { rideId: string; metrics: Record<string, any> };
  'safety:sos': { rideId?: string | null; latitude?: number; longitude?: number };
  'sync:task:started': { taskId: number | string; rideId: string };
  'sync:task:progress': { taskId: number | string; progress: number; message?: string };
  'sync:task:finished': { taskId: number | string; rideId: string; ok: true };
  'sync:task:failed': { taskId: number | string; rideId: string; attempts?: number; error?: string };
  'sync:worker:status': { status: SyncWorkerStatus };
  'sync:manual:trigger': {};
  'sync:manual:cancel': { taskId: number | string };
  'sync:manual:clearCompleted': {};
};
