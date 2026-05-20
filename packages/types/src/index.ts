export type Mode = 'GPS_ONLY' | 'GPS_CAMERA';

export type RoutePoint = {
  latitude: number;
  longitude: number;
  speed?: number | null;
  altitude?: number | null;
  heading?: number | null;
  accuracy?: number | null;
  timestamp: string;
};

export type Snapshot = {
  id: string;
  rideId: string;
  imageUrl: string;
  latitude?: number;
  longitude?: number;
  timestamp: string;
};

export type RideSession = {
  id: string;
  userId?: string | null;
  mode: Mode;
  startedAt: string;
  finishedAt?: string | null;
  duration?: number;
  distance?: number;
  averageSpeed?: number;
  maxSpeed?: number;
  calories?: number;
  elevation?: number;
  route?: RoutePoint[];
  snapshots?: Snapshot[];
};

export * from './events';

export type SyncStatus = 'pending' | 'in_progress' | 'failed' | 'completed';

export type SyncTask = {
  id?: number | string;
  type: 'ride_upload' | 'snapshot_upload' | 'route_points_upload';
  rideId: string;
  payload?: any; // placeholder for data or references
  attempts?: number;
  status?: SyncStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type SyncWorkerStatus = 'initializing' | 'idle' | 'busy' | 'error' | 'terminated';

export type SyncWorkerCommand =
  | { type: 'processTasks'; tasks: SyncTask[] }
  | { type: 'cancelTasks'; taskIds: Array<number | string> }
  | { type: 'ping' }
  | { type: 'terminate' };

export type SyncWorkerResponse =
  | { type: 'status'; status: SyncWorkerStatus }
  | { type: 'started'; taskId: number | string; rideId: string }
  | { type: 'progress'; taskId: number | string; progress: number; message?: string }
  | { type: 'success'; taskId: number | string; rideId: string }
  | { type: 'failure'; taskId: number | string; rideId: string; error?: string; recoverable?: boolean };
