/**
 * API Endpoints: Centralized route definitions
 *
 * All backend API endpoints defined here for:
 * - Type safety
 * - Easy refactoring
 * - Documentation
 */

// Auth endpoints
export const AUTH_ENDPOINTS = {
  SIGNUP: '/auth/signup',
  SIGNIN: '/auth/signin',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout', // Optional: backend logout
} as const;

// User endpoints
export const USER_ENDPOINTS = {
  GET_PROFILE: '/users/me/profile',
  GET_BY_ID: (id: string) => `/users/${id}`,
  UPDATE_PROFILE: (id: string) => `/users/${id}`,
  GET_STATS: (id: string) => `/users/${id}/stats`,
} as const;

// Rides endpoints
export const RIDES_ENDPOINTS = {
  CREATE: '/rides',
  LIST: '/rides',
  GET: (id: string) => `/rides/${id}`,
  GET_WITH_ROUTE: (id: string) => `/rides/${id}/with-route`,
  UPDATE: (id: string) => `/rides/${id}`,
  FINISH: (id: string) => `/rides/${id}/finish`,
  DELETE: (id: string) => `/rides/${id}`,
} as const;

// Route points endpoints
export const ROUTE_POINTS_ENDPOINTS = {
  CREATE: (rideId: string) => `/rides/${rideId}/points`,
  CREATE_BULK: (rideId: string) => `/rides/${rideId}/points/bulk`,
  LIST: (rideId: string) => `/rides/${rideId}/points`,
  DELETE: (rideId: string) => `/rides/${rideId}/points`,
} as const;

// Snapshots endpoints
export const SNAPSHOTS_ENDPOINTS = {
  CREATE: (rideId: string) => `/rides/${rideId}/snapshots`,
  LIST: (rideId: string) => `/rides/${rideId}/snapshots`,
  GET: (id: string) => `/snapshots/${id}`,
  UPDATE_STATUS: (id: string) => `/snapshots/${id}/status`,
  DELETE: (id: string) => `/snapshots/${id}`,
} as const;

// Sync endpoints
export const SYNC_ENDPOINTS = {
  CREATE_TASK: '/sync/tasks',
  GET_TASK: (id: string) => `/sync/tasks/${id}`,
  GET_PENDING: '/sync/tasks',
  GET_STATUS: (id: string) => `/sync/tasks/${id}/status`,
  MARK_COMPLETED: (id: string) => `/sync/tasks/${id}/complete`,
  MARK_FAILED: (id: string) => `/sync/tasks/${id}/failed`,
  RETRY: (id: string) => `/sync/tasks/${id}/retry`,
  GET_STATS: '/sync/stats',
} as const;

// Uploads endpoints
export const UPLOADS_ENDPOINTS = {
  GET_URL: '/uploads/url',
  GET_STATS: '/uploads/stats',
} as const;

// Analytics endpoints
export const ANALYTICS_ENDPOINTS = {
  GET: '/analytics',
} as const;

// Health endpoints
export const HEALTH_ENDPOINTS = {
  HEALTH: '/health',
  READY: '/ready',
  ALIVE: '/alive',
} as const;

// All endpoints combined
export const API_ENDPOINTS = {
  AUTH: AUTH_ENDPOINTS,
  USER: USER_ENDPOINTS,
  RIDES: RIDES_ENDPOINTS,
  ROUTE_POINTS: ROUTE_POINTS_ENDPOINTS,
  SNAPSHOTS: SNAPSHOTS_ENDPOINTS,
  SYNC: SYNC_ENDPOINTS,
  UPLOADS: UPLOADS_ENDPOINTS,
  ANALYTICS: ANALYTICS_ENDPOINTS,
  HEALTH: HEALTH_ENDPOINTS,
} as const;
