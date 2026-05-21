/**
 * Runtime Mode System Types
 *
 * Defines the different rendering modes the application can operate in,
 * along with their rendering profiles, capabilities, and behavior.
 *
 * Architectural Intent:
 * - Runtime modes control rendering orchestration only
 * - Completely isolated from business logic (rides, GPS, camera services)
 * - Modes coordinate what's visible, sizes, and update frequencies
 * - Future: Adapt to device capabilities and battery state
 * - Prepare foundation for AR, advanced animations, adaptive rendering
 */

/**
 * Runtime modes represent different visual compositions and rendering strategies
 *
 * GPS_ONLY: Default mode - fullscreen map, lightweight HUD
 * - Optimized for solo tracking and navigation
 * - Minimal HUD overhead
 * - Battery efficient (no camera processing)
 *
 * CAMERA_RECORD: Camera-primary mode - camera becomes main layer
 * - Camera feed as primary (when implemented)
 * - HUD overlays on camera
 * - Minimap in corner
 * - Recording indicators prominent
 *
 * MAP_FOCUS: Map-emphasis mode - larger map, reduced HUD
 * - Useful for route planning while riding
 * - Emphasizes navigation
 * - Simplified HUD layout
 * - Fewer widget overlays
 *
 * LOW_BATTERY: Battery-saving mode - minimal rendering
 * - Reduced GPS frequency
 * - Simplified HUD
 * - Fewer overlays
 * - Optimized for battery life
 * - Disables expensive features
 *
 * FUTURE_AR_MODE: Placeholder for AR/advanced mode
 * - Reserved for future AR integration
 * - Would layer AR elements over camera
 * - Navigation overlays
 * - Real-time guidance
 */
export enum RuntimeMode {
  GPS_ONLY = 'GPS_ONLY',
  CAMERA_RECORD = 'CAMERA_RECORD',
  MAP_FOCUS = 'MAP_FOCUS',
  LOW_BATTERY = 'LOW_BATTERY',
  FUTURE_AR_MODE = 'FUTURE_AR_MODE'
}

/**
 * Rendering profile defines what and how to render in a given mode
 *
 * Controls:
 * - Map visibility and sizing
 * - Camera visibility and sizing
 * - HUD widget visibility and layout
 * - Minimap visibility
 * - Recording indicators
 * - Update frequencies
 */
export type RenderingProfile = {
  mode: RuntimeMode;

  // Layer visibility
  map: {
    visible: boolean;
    scale: 'fullscreen' | 'large' | 'medium' | 'small' | 'minimal';
    // Z-index relative to other elements
    zIndex: number;
  };

  camera: {
    visible: boolean;
    scale: 'fullscreen' | 'large' | 'medium' | 'small' | 'minimal';
    zIndex: number;
  };

  minimap: {
    visible: boolean;
    scale: 'large' | 'medium' | 'small';
    position: 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left';
    zIndex: number;
  };

  // HUD widget behavior
  hud: {
    visible: boolean;
    // Density: how many widgets to show
    density: 'full' | 'normal' | 'minimal';
    // Opacity for low-visibility environments
    opacity: 0.8 | 0.9 | 1.0;
    // Size multiplier for widgets
    scale: 0.8 | 0.9 | 1.0 | 1.1;
    // Position override for tight spaces
    compact: boolean;
  };

  // Recording indicator styling
  recording: {
    visible: boolean;
    prominence: 'subtle' | 'normal' | 'prominent';
  };

  // Performance settings
  performance: {
    // GPS update frequency (Hz)
    gpsFrequency: 1 | 2; // 1Hz or 2Hz
    // Map rendering optimization
    routeSampling: 300 | 500 | 1000; // max route points
    // Widget update batching
    hudUpdateBatching: boolean;
    // Camera frame rate (if enabled)
    cameraFps?: 15 | 30 | 60;
  };
};

/**
 * Rendering profiles for each mode
 *
 * These define the exact rendering behavior for each mode,
 * ensuring consistent visual behavior across the app
 */
export const RENDERING_PROFILES: Record<RuntimeMode, RenderingProfile> = {
  [RuntimeMode.GPS_ONLY]: {
    mode: RuntimeMode.GPS_ONLY,
    map: {
      visible: true,
      scale: 'fullscreen',
      zIndex: 0
    },
    camera: {
      visible: false,
      scale: 'minimal',
      zIndex: -1
    },
    minimap: {
      visible: false,
      scale: 'small',
      position: 'bottom-right',
      zIndex: 50
    },
    hud: {
      visible: true,
      density: 'normal',
      opacity: 0.9,
      scale: 1.0,
      compact: false
    },
    recording: {
      visible: true,
      prominence: 'normal'
    },
    performance: {
      gpsFrequency: 1,
      routeSampling: 500,
      hudUpdateBatching: true
    }
  },

  [RuntimeMode.CAMERA_RECORD]: {
    mode: RuntimeMode.CAMERA_RECORD,
    map: {
      visible: false,
      scale: 'minimal',
      zIndex: 10 // Behind camera
    },
    camera: {
      visible: true,
      scale: 'fullscreen',
      zIndex: 0 // Primary layer
    },
    minimap: {
      visible: true,
      scale: 'small',
      position: 'bottom-right',
      zIndex: 100 // On top of camera
    },
    hud: {
      visible: true,
      density: 'minimal',
      opacity: 0.8,
      scale: 0.9,
      compact: true
    },
    recording: {
      visible: true,
      prominence: 'prominent' // Very visible when recording
    },
    performance: {
      gpsFrequency: 1,
      routeSampling: 300, // More aggressive sampling with camera
      hudUpdateBatching: true,
      cameraFps: 30 // Reasonable frame rate
    }
  },

  [RuntimeMode.MAP_FOCUS]: {
    mode: RuntimeMode.MAP_FOCUS,
    map: {
      visible: true,
      scale: 'large',
      zIndex: 0
    },
    camera: {
      visible: false,
      scale: 'minimal',
      zIndex: -1
    },
    minimap: {
      visible: false,
      scale: 'small',
      position: 'top-right',
      zIndex: 50
    },
    hud: {
      visible: true,
      density: 'minimal',
      opacity: 0.85,
      scale: 0.9,
      compact: true
    },
    recording: {
      visible: true,
      prominence: 'subtle'
    },
    performance: {
      gpsFrequency: 1,
      routeSampling: 500,
      hudUpdateBatching: true
    }
  },

  [RuntimeMode.LOW_BATTERY]: {
    mode: RuntimeMode.LOW_BATTERY,
    map: {
      visible: true,
      scale: 'large',
      zIndex: 0
    },
    camera: {
      visible: false,
      scale: 'minimal',
      zIndex: -1
    },
    minimap: {
      visible: false,
      scale: 'small',
      position: 'bottom-right',
      zIndex: 50
    },
    hud: {
      visible: true,
      density: 'minimal',
      opacity: 0.8,
      scale: 0.85,
      compact: true
    },
    recording: {
      visible: true,
      prominence: 'subtle'
    },
    performance: {
      gpsFrequency: 1, // Could be reduced to 0.5 (every 2s) in future
      routeSampling: 300, // Aggressive sampling to save memory
      hudUpdateBatching: true
      // Note: Future optimization - disable expensive effects
    }
  },

  [RuntimeMode.FUTURE_AR_MODE]: {
    mode: RuntimeMode.FUTURE_AR_MODE,
    map: {
      visible: false,
      scale: 'minimal',
      zIndex: 10
    },
    camera: {
      visible: true,
      scale: 'fullscreen',
      zIndex: 0
    },
    minimap: {
      visible: true,
      scale: 'small',
      position: 'top-right',
      zIndex: 100
    },
    hud: {
      visible: true,
      density: 'minimal',
      opacity: 1.0,
      scale: 0.9,
      compact: true
    },
    recording: {
      visible: true,
      prominence: 'normal'
    },
    performance: {
      gpsFrequency: 2, // Higher frequency for AR navigation
      routeSampling: 500,
      hudUpdateBatching: false, // Real-time updates for AR
      cameraFps: 60 // High FPS for smooth AR rendering
    }
  }
};

/**
 * Mode capabilities define what features are enabled in each mode
 *
 * Used to coordinate feature availability and rendering decisions
 */
export type ModeCapabilities = {
  mode: RuntimeMode;
  hasMap: boolean;
  hasCamera: boolean;
  hasMinimap: boolean;
  canRecordVideo: boolean;
  canTakeLivePhotos: boolean;
  supportsAR: boolean;
  supportsNavigation: boolean;
  supportsLiveMetrics: boolean;
  estimatedBatteryDrain: 'low' | 'medium' | 'high';
};

/**
 * Capability definitions per mode
 *
 * Used by rendering components to determine feature availability
 */
export const MODE_CAPABILITIES: Record<RuntimeMode, ModeCapabilities> = {
  [RuntimeMode.GPS_ONLY]: {
    mode: RuntimeMode.GPS_ONLY,
    hasMap: true,
    hasCamera: false,
    hasMinimap: false,
    canRecordVideo: false,
    canTakeLivePhotos: false,
    supportsAR: false,
    supportsNavigation: true,
    supportsLiveMetrics: true,
    estimatedBatteryDrain: 'low'
  },

  [RuntimeMode.CAMERA_RECORD]: {
    mode: RuntimeMode.CAMERA_RECORD,
    hasMap: false, // In minimap only
    hasCamera: true,
    hasMinimap: true,
    canRecordVideo: true,
    canTakeLivePhotos: true,
    supportsAR: false,
    supportsNavigation: true,
    supportsLiveMetrics: true,
    estimatedBatteryDrain: 'high'
  },

  [RuntimeMode.MAP_FOCUS]: {
    mode: RuntimeMode.MAP_FOCUS,
    hasMap: true,
    hasCamera: false,
    hasMinimap: false,
    canRecordVideo: false,
    canTakeLivePhotos: false,
    supportsAR: false,
    supportsNavigation: true,
    supportsLiveMetrics: true,
    estimatedBatteryDrain: 'low'
  },

  [RuntimeMode.LOW_BATTERY]: {
    mode: RuntimeMode.LOW_BATTERY,
    hasMap: true,
    hasCamera: false,
    hasMinimap: false,
    canRecordVideo: false,
    canTakeLivePhotos: false,
    supportsAR: false,
    supportsNavigation: true,
    supportsLiveMetrics: true,
    estimatedBatteryDrain: 'low'
  },

  [RuntimeMode.FUTURE_AR_MODE]: {
    mode: RuntimeMode.FUTURE_AR_MODE,
    hasMap: false,
    hasCamera: true,
    hasMinimap: true,
    canRecordVideo: true,
    canTakeLivePhotos: true,
    supportsAR: true,
    supportsNavigation: true,
    supportsLiveMetrics: true,
    estimatedBatteryDrain: 'high'
  }
};

/**
 * Device capability detection placeholders
 *
 * Future: Detect actual device capabilities for adaptive rendering
 * - Device GPU tier (low, mid, high)
 * - Memory available
 * - Battery health
 * - Processor capability
 * - Display properties (AMOLED, LCD, refresh rate)
 * - Thermal state
 */
export type DeviceCapabilities = {
  // GPU capability tier
  gpuTier: 'low' | 'mid' | 'high';
  // Available memory in MB
  memoryMb: number;
  // Battery percentage
  batteryPercent: number;
  // Is battery in low power mode
  isLowPowerMode: boolean;
  // CPU performance tier (placeholder)
  cpuTier: 'low' | 'mid' | 'high';
  // Display properties
  displayDpi: number;
  displayRefreshRate: 60 | 90 | 120 | 144;
  // Is device thermal throttling (placeholder)
  isThermalThrottling: boolean;
  // Network quality (placeholder)
  networkQuality: 'poor' | 'fair' | 'good' | 'excellent';
};

/**
 * Placeholder for device capability detection
 * Future: Implement actual detection using Web APIs
 *
 * Example implementation:
 * - navigator.deviceMemory
 * - navigator.hardwareConcurrency
 * - Battery Status API (deprecated, need alternative)
 * - Performance Observer API
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  // Placeholder implementation
  // Future: Replace with actual detection logic
  return {
    gpuTier: 'mid', // Assume mid-tier GPU
    memoryMb: 4096, // 4GB - typical smartphone
    batteryPercent: 100, // Will be updated from Battery API or alternatives
    isLowPowerMode: false,
    cpuTier: 'mid',
    displayDpi: 400,
    displayRefreshRate: 60,
    isThermalThrottling: false,
    networkQuality: 'good'
  };
}

/**
 * Runtime state that changes during operation
 */
export type RuntimeState = {
  // Current mode
  currentMode: RuntimeMode;
  // Device capabilities detected at startup
  deviceCapabilities: DeviceCapabilities;
  // Whether the app should adapt to low battery
  adaptToLowBattery: boolean;
  // Current battery percentage
  batteryPercent: number;
  // Whether thermal throttling is active
  isThermalThrottling: boolean;
};

/**
 * Runtime mode transition rules
 *
 * Defines which mode transitions are valid
 * and what conditions should trigger transitions
 */
export type ModeTransitionRule = {
  fromMode: RuntimeMode;
  toMode: RuntimeMode;
  condition: (state: RuntimeState) => boolean;
  label: string;
};

/**
 * Automatic mode transition rules
 *
 * These define when the system should automatically switch modes
 * based on device state or environmental conditions
 */
export const MODE_TRANSITION_RULES: ModeTransitionRule[] = [
  {
    fromMode: RuntimeMode.GPS_ONLY,
    toMode: RuntimeMode.LOW_BATTERY,
    condition: (state) => state.batteryPercent < 15 && state.adaptToLowBattery,
    label: 'GPS_ONLY → LOW_BATTERY (battery < 15%)'
  },
  {
    fromMode: RuntimeMode.MAP_FOCUS,
    toMode: RuntimeMode.LOW_BATTERY,
    condition: (state) => state.batteryPercent < 15 && state.adaptToLowBattery,
    label: 'MAP_FOCUS → LOW_BATTERY (battery < 15%)'
  },
  {
    fromMode: RuntimeMode.LOW_BATTERY,
    toMode: RuntimeMode.GPS_ONLY,
    condition: (state) => state.batteryPercent > 25,
    label: 'LOW_BATTERY → GPS_ONLY (battery > 25%)'
  },
  {
    fromMode: RuntimeMode.CAMERA_RECORD,
    toMode: RuntimeMode.LOW_BATTERY,
    condition: (state) => state.batteryPercent < 10,
    label: 'CAMERA_RECORD → LOW_BATTERY (critical battery)'
  },
  // Future: AR mode transitions when AR capability detected
  {
    fromMode: RuntimeMode.GPS_ONLY,
    toMode: RuntimeMode.FUTURE_AR_MODE,
    condition: () => false, // Disabled until AR implementation
    label: 'GPS_ONLY → FUTURE_AR_MODE (AR ready)'
  }
];

/**
 * Gets the rendering profile for a given mode
 */
export function getRenderingProfile(mode: RuntimeMode): RenderingProfile {
  return RENDERING_PROFILES[mode];
}

/**
 * Gets the capabilities for a given mode
 */
export function getModeCapabilities(mode: RuntimeMode): ModeCapabilities {
  return MODE_CAPABILITIES[mode];
}

/**
 * Checks if a mode transition is valid
 */
export function isValidModeTransition(fromMode: RuntimeMode, toMode: RuntimeMode): boolean {
  if (fromMode === toMode) return true;
  // Future: Could implement a transition graph for more complex rules
  return true; // For now, all transitions are valid
}

/**
 * Finds applicable mode transitions based on current state
 */
export function findApplicableTransitions(
  fromMode: RuntimeMode,
  state: RuntimeState
): ModeTransitionRule[] {
  return MODE_TRANSITION_RULES.filter(
    (rule) => rule.fromMode === fromMode && rule.condition(state)
  );
}
