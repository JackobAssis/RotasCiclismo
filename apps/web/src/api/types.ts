/**
 * API Response Types: Type-safe backend communication
 *
 * All API responses are strongly typed here.
 * Ensures compile-time safety for all backend calls.
 */

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface SignUpRequestDto {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

export interface SignInRequestDto {
  email: string;
  password: string;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface UserDto {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface UserProfileDto extends UserDto {
  stats?: {
    totalRides: number;
    totalDistance: number;
    totalDuration: number;
  };
}

export interface UpdateProfileDto {
  displayName?: string;
  bio?: string;
  avatar?: string;
  theme?: 'light' | 'dark';
  language?: string;
}

// ============================================================================
// RIDE TYPES
// ============================================================================

export type RideMode = 'GPS_ONLY' | 'GPS_CAMERA';
export type RideStatus = 'ACTIVE' | 'PAUSED' | 'FINISHED' | 'SYNCED';

export interface CreateRideDto {
  id: string; // Frontend-generated for offline consistency
  mode: RideMode;
  startedAt: string;
  title?: string;
  description?: string;
  tags?: string[];
}

export interface UpdateRideDto {
  title?: string;
  description?: string;
  distance?: number;
  duration?: number;
  averageSpeed?: number;
  maxSpeed?: number;
  elevationGain?: number;
  calories?: number;
}

export interface FinishRideDto {
  finishedAt: string;
  distance: number;
  duration: number;
  averageSpeed: number;
  maxSpeed: number;
  elevationGain?: number;
  calories?: number;
}

export interface RideDto {
  id: string;
  userId: string;
  mode: RideMode;
  status: RideStatus;
  startedAt: string;
  finishedAt?: string;
  title?: string;
  description?: string;
  tags?: string[];
  distance: number;
  duration: number;
  averageSpeed: number;
  maxSpeed: number;
  elevationGain?: number;
  calories?: number;
  createdAt: string;
  updatedAt: string;
  isPublic?: boolean;
  likes?: number;
}

export interface RideDetailDto extends RideDto {
  route: RoutePointDto[];
  snapshots: SnapshotDto[];
}

// ============================================================================
// ROUTE POINT TYPES
// ============================================================================

export interface CreateRoutePointDto {
  latitude: number;
  longitude: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp: string;
}

export interface CreateBulkRoutePointsDto {
  points: CreateRoutePointDto[];
}

export interface RoutePointDto extends CreateRoutePointDto {
  id: string;
  rideId: string;
}

// ============================================================================
// SNAPSHOT TYPES
// ============================================================================

export type UploadStatus = 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'FAILED';

export interface CreateSnapshotDto {
  imageUrl: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  timestamp: string;
}

export interface SnapshotDto extends CreateSnapshotDto {
  id: string;
  rideId: string;
  userId: string;
  uploadStatus: UploadStatus;
  thumbnailUrl?: string;
  uploadedAt?: string;
  storageUrl?: string;
}

export interface UpdateSnapshotStatusDto {
  status: UploadStatus;
  storageUrl?: string;
}

// ============================================================================
// SYNC TASK TYPES
// ============================================================================

export type SyncTaskType =
  | 'RIDE_CREATE'
  | 'RIDE_UPDATE'
  | 'RIDE_FINISH'
  | 'ROUTE_POINTS_UPLOAD'
  | 'SNAPSHOT_UPLOAD'
  | 'VIDEO_UPLOAD';

export type SyncTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface CreateSyncTaskDto {
  type: SyncTaskType;
  rideId: string;
  payload: unknown;
  priority?: number;
}

export interface SyncTaskDto {
  id: string;
  userId: string;
  type: SyncTaskType;
  rideId: string;
  status: SyncTaskStatus;
  payload?: unknown;
  attempts: number;
  maxAttempts: number;
  error?: string;
  priority: number;
  scheduledFor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncStatsDto {
  pending: number;
  completed: number;
  failed: number;
  total: number;
}

// ============================================================================
// UPLOAD TYPES
// ============================================================================

export interface GetUploadUrlDto {
  fileType: 'snapshot' | 'video';
  fileSize: number;
  filename?: string;
}

export interface UploadUrlResponseDto {
  uploadId: string;
  uploadUrl: string;
  method: 'PUT' | 'POST';
  expiresIn: number;
  headers?: Record<string, string>;
}

export interface StorageStatsDto {
  userId: string;
  usedBytes: number;
  quotaBytes: number;
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

export interface PaginatedResponseDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface WeeklyData {
  weekStart: string;
  distance: number;
  duration: number;
  rides: number;
  averageSpeed: number;
}

export interface MonthlyData {
  month: string;
  distance: number;
  duration: number;
  rides: number;
  averageSpeed: number;
}

export interface AnalyticsResponseDto {
  totalRides: number;
  totalDistance: number;
  totalDuration: number;
  averageSpeed: number;
  maxSpeed: number;
  averageDistance: number;
  weekly: WeeklyData[];
  monthly: MonthlyData[];
}

// ============================================================================
// HEALTH TYPES
// ============================================================================

export interface HealthResponseDto {
  status: 'ok' | 'degraded' | 'unhealthy';
  timestamp: string;
  database: 'connected' | 'disconnected';
}

export interface ReadyResponseDto {
  ready: boolean;
}

export interface AliveResponseDto {
  alive: boolean;
}

// ============================================================================
// GENERIC RESPONSE TYPES
// ============================================================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// REQUEST/RESPONSE CONTEXT TYPES
// ============================================================================

export interface RequestContext {
  method: string;
  path: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  statusCode?: number;
}

export interface ResponseContext {
  statusCode: number;
  duration: number;
  cached: boolean;
  size: number;
}
