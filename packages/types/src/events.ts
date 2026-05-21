import { RideSession, RoutePoint, Snapshot, SyncWorkerStatus } from './index';

/**
 * Haptic feedback types and severity levels
 * Allows different vibration intensities for different interactions
 */
export type HapticIntensity = 'light' | 'medium' | 'strong';
export type HapticFeedbackType = 
  | 'tap' | 'success' | 'warning' | 'error'
  | 'minimap:expand' | 'minimap:collapse'
  | 'mode:switch' | 'recording:start' | 'recording:stop'
  | 'custom';

/**
 * Accessibility state for screen reader and keyboard navigation
 * Used to communicate status changes to assistive technologies
 */
export type A11yState = 'idle' | 'loading' | 'error' | 'success' | 'active' | 'disabled';

/**
 * Interaction feedback trigger types
 * Used for coordinating haptic and accessibility responses
 */
export type InteractionTrigger = 
  | 'user:tap' | 'user:press' | 'user:swipe' | 'user:keyboard'
  | 'overlay:show' | 'overlay:hide' | 'overlay:interaction';

// App-wide typed events map
export type AppEvents = {
  // Ride lifecycle events
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
  
  // Sync events
  'sync:task:started': { taskId: number | string; rideId: string };
  'sync:task:progress': { taskId: number | string; progress: number; message?: string };
  'sync:task:finished': { taskId: number | string; rideId: string; ok: true };
  'sync:task:failed': { taskId: number | string; rideId: string; attempts?: number; error?: string };
  'sync:worker:status': { status: SyncWorkerStatus };
  'sync:manual:trigger': {};
  'sync:manual:cancel': { taskId: number | string };
  'sync:manual:clearCompleted': {};

  // Haptic feedback events
  // Future: platform-specific haptics, wearable device coordination
  'haptic:trigger': { 
    type: HapticFeedbackType; 
    intensity?: HapticIntensity; 
    duration?: number;
    customPattern?: number[];
  };
  'haptic:minimap:expanded': { expandedAt: string };
  'haptic:minimap:collapsed': { collapsedAt: string };
  'haptic:mode:switched': { newMode: string; switchedAt: string };
  'haptic:recording:started': { recordingAt: string };
  'haptic:recording:stopped': { stoppedAt: string };

  // Accessibility events
  // Used to broadcast state changes for screen readers and keyboard navigation
  'a11y:state:changed': { 
    component: string; 
    state: A11yState; 
    message?: string; 
    timestamp: string;
  };
  'a11y:overlay:focused': { overlayId: string; focusedAt: string };
  'a11y:overlay:blurred': { overlayId: string; blurredAt: string };
  'a11y:keyboard:trapped': { overlayId: string; trapActivated: string };
  'a11y:keyboard:released': { overlayId: string; trapReleased: string };

  // Interaction feedback coordination
  // Future: motion orchestration, advanced animation sequences
  'interaction:triggered': { 
    trigger: InteractionTrigger; 
    targetId?: string; 
    timestamp: string;
  };
  'interaction:haptic:ready': { hapticEnabled: boolean; platformCapabilities: string[] };
  'interaction:a11y:ready': { screenReaderEnabled: boolean; keyboardNavEnabled: boolean };
  'interaction:overlay:respond': { 
    overlayId: string; 
    action: 'show' | 'hide' | 'update'; 
    respondedAt: string;
  };

  // Reduced motion and performance events
  'motion:preference:changed': { prefersReducedMotion: boolean; timestamp: string };
  'motion:lowpower:detected': { detected: boolean; timestamp: string };
};
