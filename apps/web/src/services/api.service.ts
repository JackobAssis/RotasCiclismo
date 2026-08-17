/**
 * API Service: High-level backend communication
 *
 * Provides typed methods for all backend operations.
 * Uses ApiClient under the hood.
 *
 * DESIGN PRINCIPLE:
 * - No store mutations (only returns data)
 * - Fully typed responses
 * - Error handling
 * - Retry logic built-in
 */

import { apiClient } from '../api/client';
import * as API from '../api/endpoints';
import type {
  // Auth
  SignUpRequestDto,
  SignInRequestDto,
  AuthResponseDto,
  // User
  UserProfileDto,
  UpdateProfileDto,
  // Rides
  CreateRideDto,
  UpdateRideDto,
  FinishRideDto,
  RideDto,
  RideDetailDto,
  PaginatedResponseDto,
  // Route Points
  CreateRoutePointDto,
  CreateBulkRoutePointsDto,
  RoutePointDto,
  // Snapshots
  CreateSnapshotDto,
  SnapshotDto,
  UpdateSnapshotStatusDto,
  // Sync
  CreateSyncTaskDto,
  SyncTaskDto,
  SyncStatsDto,
  // Uploads
  GetUploadUrlDto,
  UploadUrlResponseDto,
  StorageStatsDto,
  // Analytics
  AnalyticsResponseDto,
  // Health
  HealthResponseDto,
} from '../api/types';

/**
 * API Service class
 *
 * Groups all backend operations by domain
 */
export class ApiService {
  // ========================================================================
  // AUTH OPERATIONS
  // ========================================================================

  async signup(dto: SignUpRequestDto): Promise<AuthResponseDto> {
    return apiClient.post<AuthResponseDto>(API.AUTH_ENDPOINTS.SIGNUP, dto);
  }

  async signin(dto: SignInRequestDto): Promise<AuthResponseDto> {
    return apiClient.post<AuthResponseDto>(API.AUTH_ENDPOINTS.SIGNIN, dto);
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    return apiClient.post<AuthResponseDto>(API.AUTH_ENDPOINTS.REFRESH, {
      refreshToken,
    });
  }

  // ========================================================================
  // USER OPERATIONS
  // ========================================================================

  async getProfile(): Promise<UserProfileDto> {
    return apiClient.get<UserProfileDto>(API.USER_ENDPOINTS.GET_PROFILE);
  }

  async getUser(id: string): Promise<UserProfileDto> {
    return apiClient.get<UserProfileDto>(API.USER_ENDPOINTS.GET_BY_ID(id));
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<UserProfileDto> {
    return apiClient.patch<UserProfileDto>(API.USER_ENDPOINTS.UPDATE_PROFILE(id), dto);
  }

  // ========================================================================
  // RIDES OPERATIONS
  // ========================================================================

  async createRide(dto: CreateRideDto): Promise<RideDto> {
    return apiClient.post<RideDto>(API.RIDES_ENDPOINTS.CREATE, dto);
  }

  async listRides(
    page: number = 1,
    limit: number = 20,
    options?: { status?: string; onlyPublic?: boolean },
  ): Promise<PaginatedResponseDto<RideDto>> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(options?.status && { status: options.status }),
      ...(options?.onlyPublic && { onlyPublic: 'true' }),
    });

    return apiClient.get<PaginatedResponseDto<RideDto>>(`${API.RIDES_ENDPOINTS.LIST}?${params}`);
  }

  async getRide(id: string): Promise<RideDto> {
    return apiClient.get<RideDto>(API.RIDES_ENDPOINTS.GET(id));
  }

  async getRideWithRoute(id: string): Promise<RideDetailDto> {
    return apiClient.get<RideDetailDto>(API.RIDES_ENDPOINTS.GET_WITH_ROUTE(id));
  }

  async updateRide(id: string, dto: UpdateRideDto): Promise<RideDto> {
    return apiClient.patch<RideDto>(API.RIDES_ENDPOINTS.UPDATE(id), dto);
  }

  async finishRide(id: string, dto: FinishRideDto): Promise<RideDto> {
    return apiClient.post<RideDto>(API.RIDES_ENDPOINTS.FINISH(id), dto);
  }

  async deleteRide(id: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(API.RIDES_ENDPOINTS.DELETE(id));
  }

  // ========================================================================
  // ROUTE POINTS OPERATIONS
  // ========================================================================

  async createRoutePoint(rideId: string, dto: CreateRoutePointDto): Promise<RoutePointDto> {
    return apiClient.post<RoutePointDto>(API.ROUTE_POINTS_ENDPOINTS.CREATE(rideId), dto);
  }

  async createBulkRoutePoints(
    rideId: string,
    dto: CreateBulkRoutePointsDto,
  ): Promise<{ created: number }> {
    return apiClient.post<{ created: number }>(API.ROUTE_POINTS_ENDPOINTS.CREATE_BULK(rideId), dto);
  }

  async listRoutePoints(
    rideId: string,
    skip: number = 0,
    take: number = 500,
  ): Promise<PaginatedResponseDto<RoutePointDto>> {
    const params = new URLSearchParams({
      skip: String(skip),
      take: String(take),
    });

    return apiClient.get<PaginatedResponseDto<RoutePointDto>>(
      `${API.ROUTE_POINTS_ENDPOINTS.LIST(rideId)}?${params}`,
    );
  }

  async deleteRoutePoints(rideId: string): Promise<{ deleted: number }> {
    return apiClient.delete<{ deleted: number }>(API.ROUTE_POINTS_ENDPOINTS.DELETE(rideId));
  }

  // ========================================================================
  // SNAPSHOTS OPERATIONS
  // ========================================================================

  async createSnapshot(rideId: string, dto: CreateSnapshotDto): Promise<SnapshotDto> {
    return apiClient.post<SnapshotDto>(API.SNAPSHOTS_ENDPOINTS.CREATE(rideId), dto);
  }

  async listSnapshots(
    rideId: string,
    skip: number = 0,
    take: number = 100,
  ): Promise<PaginatedResponseDto<SnapshotDto>> {
    const params = new URLSearchParams({
      skip: String(skip),
      take: String(take),
    });

    return apiClient.get<PaginatedResponseDto<SnapshotDto>>(
      `${API.SNAPSHOTS_ENDPOINTS.LIST(rideId)}?${params}`,
    );
  }

  async updateSnapshotStatus(id: string, dto: UpdateSnapshotStatusDto): Promise<SnapshotDto> {
    return apiClient.patch<SnapshotDto>(API.SNAPSHOTS_ENDPOINTS.UPDATE_STATUS(id), dto);
  }

  async deleteSnapshot(id: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(API.SNAPSHOTS_ENDPOINTS.DELETE(id));
  }

  // ========================================================================
  // SYNC OPERATIONS
  // ========================================================================

  async createSyncTask(dto: CreateSyncTaskDto): Promise<SyncTaskDto> {
    return apiClient.post<SyncTaskDto>(API.SYNC_ENDPOINTS.CREATE_TASK, dto);
  }

  async getSyncTask(id: string): Promise<SyncTaskDto> {
    return apiClient.get<SyncTaskDto>(API.SYNC_ENDPOINTS.GET_TASK(id));
  }

  async getPendingSyncTasks(limit: number = 50): Promise<SyncTaskDto[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    return apiClient.get<SyncTaskDto[]>(`${API.SYNC_ENDPOINTS.GET_PENDING}?${params}`);
  }

  async getSyncTaskStatus(id: string): Promise<SyncTaskDto> {
    return apiClient.get<SyncTaskDto>(API.SYNC_ENDPOINTS.GET_STATUS(id));
  }

  async markSyncTaskCompleted(id: string): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>(API.SYNC_ENDPOINTS.MARK_COMPLETED(id));
  }

  async markSyncTaskFailed(id: string, error: string): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>(API.SYNC_ENDPOINTS.MARK_FAILED(id), { error });
  }

  async retrySyncTask(id: string): Promise<SyncTaskDto> {
    return apiClient.post<SyncTaskDto>(API.SYNC_ENDPOINTS.RETRY(id));
  }

  async getSyncStats(): Promise<SyncStatsDto> {
    return apiClient.get<SyncStatsDto>(API.SYNC_ENDPOINTS.GET_STATS);
  }

  // ========================================================================
  // UPLOADS OPERATIONS
  // ========================================================================

  async getUploadUrl(dto: GetUploadUrlDto): Promise<UploadUrlResponseDto> {
    return apiClient.post<UploadUrlResponseDto>(API.UPLOADS_ENDPOINTS.GET_URL, dto);
  }

  async getStorageStats(): Promise<StorageStatsDto> {
    return apiClient.post<StorageStatsDto>(API.UPLOADS_ENDPOINTS.GET_STATS);
  }

  // ========================================================================
  // ANALYTICS OPERATIONS
  // ========================================================================

  async getAnalytics(): Promise<AnalyticsResponseDto> {
    return apiClient.get<AnalyticsResponseDto>(API.ANALYTICS_ENDPOINTS.GET);
  }

  // ========================================================================
  // HEALTH OPERATIONS
  // ========================================================================

  async checkHealth(): Promise<HealthResponseDto> {
    return apiClient.get<HealthResponseDto>(API.HEALTH_ENDPOINTS.HEALTH);
  }

  async checkReady(): Promise<{ ready: boolean }> {
    return apiClient.get<{ ready: boolean }>(API.HEALTH_ENDPOINTS.READY);
  }

  async checkAlive(): Promise<{ alive: boolean }> {
    return apiClient.get<{ alive: boolean }>(API.HEALTH_ENDPOINTS.ALIVE);
  }
}

// Export singleton instance
export const apiService = new ApiService();
