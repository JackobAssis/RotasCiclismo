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

export type SyncTaskType =
  | 'RIDE_CREATE'
  | 'RIDE_UPDATE'
  | 'RIDE_FINISH'
  | 'ROUTE_POINTS_UPLOAD'
  | 'SNAPSHOT_UPLOAD';

export type SyncTask = {
  id?: number | string;
  type: SyncTaskType;
  rideId: string;
  payload?: any;
  attempts?: number;
  status?: SyncStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type SyncWorkerStatus = 'initializing' | 'idle' | 'busy' | 'error' | 'terminated';

export type SyncWorkerCommand =
  | { type: 'processTasks'; tasks: SyncTask[] }
  | { type: 'cancelTasks'; taskIds: Array<number | string> }
  | { type: 'setAccessToken'; token: string }
  | { type: 'ping' }
  | { type: 'terminate' };

export type SyncWorkerResponse =
  | { type: 'status'; status: SyncWorkerStatus }
  | { type: 'started'; taskId: number | string; rideId: string }
  | { type: 'progress'; taskId: number | string; progress: number; message?: string }
  | { type: 'success'; taskId: number | string; rideId: string }
  | { type: 'failure'; taskId: number | string; rideId: string; error?: string; recoverable?: boolean };
