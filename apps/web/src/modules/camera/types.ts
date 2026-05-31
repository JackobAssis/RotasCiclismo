/**
 * Camera Runtime Types
 *
 * Defines enums and types for camera runtime lifecycle and permissions.
 * This module is intentionally small and designed to evolve as recording
 * and snapshot capabilities are added.
 */
export enum CameraPermissionState {
  UNKNOWN = 'UNKNOWN',
  GRANTED = 'GRANTED',
  DENIED = 'DENIED'
}

export enum CameraStatus {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  STREAMING = 'STREAMING',
  ERROR = 'ERROR',
  STOPPED = 'STOPPED'
}

export type CameraStreamState = {
  permission: CameraPermissionState;
  status: CameraStatus;
  error?: string | null;
  // MediaStream object when available
  stream?: MediaStream | null;
  // Future: recording placeholders
  isRecording?: boolean;
};

// Stream lifecycle events (for future eventing hooks)
export enum CameraEvent {
  STREAM_STARTED = 'STREAM_STARTED',
  STREAM_STOPPED = 'STREAM_STOPPED',
  PERMISSION_CHANGED = 'PERMISSION_CHANGED',
  ERROR = 'ERROR'
}

// Export for public consumption
export default CameraStreamState;
export type CameraState = {
  isAvailable: boolean;
  facingMode?: 'user' | 'environment';
};
