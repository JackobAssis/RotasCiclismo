import create from 'zustand';
import {
  RuntimeMode,
  RuntimeState,
  ModeCapabilities,
  RenderingProfile,
  DeviceCapabilities,
  detectDeviceCapabilities,
  getRenderingProfile,
  getModeCapabilities,
  isValidModeTransition,
  findApplicableTransitions
} from '../modules/runtime/types';

/**
 * Runtime Mode Store
 *
 * Centralized store for managing application runtime modes and rendering orchestration.
 *
 * Responsibilities:
 * - Track current rendering mode
 * - Manage mode transitions
 * - Provide rendering profiles for components
 * - Track device capabilities
 * - Provide battery/thermal state
 * - Coordinate adaptive rendering
 *
 * Architectural Intent:
 * - Runtime modes are completely isolated from business logic
 * - Store only manages rendering orchestration
 * - Components query this store for rendering decisions
 * - Ride lifecycle is independent of runtime mode
 * - Future: Automatic adaptation to device state
 *
 * Data Flow:
 * Device State (battery, thermal, etc.)
 *   ↓
 * RuntimeModeStore
 *   ↓
 * Components query for rendering profile
 *   ↓
 * UI renders based on profile (visibility, sizing, etc.)
 */

type RuntimeStoreState = {
  // Current mode and state
  currentMode: RuntimeMode;
  runtimeState: RuntimeState;

  // Cached rendering data
  _cachedProfile: RenderingProfile | null;
  _cachedCapabilities: ModeCapabilities | null;

  // Actions: Mode management
  setMode: (mode: RuntimeMode) => void;
  transitionMode: (toMode: RuntimeMode) => boolean;
  attemptAutomaticModeTransition: () => void;

  // Actions: Device state
  updateBatteryStatus: (percent: number, isLowPower: boolean) => void;
  updateThermalState: (isThermalThrottling: boolean) => void;
  setAdaptToLowBattery: (adapt: boolean) => void;

  // Queries: Rendering profiles
  getRenderingProfile: () => RenderingProfile;
  getModeCapabilities: () => ModeCapabilities;
  shouldShowMap: () => boolean;
  shouldShowCamera: () => boolean;
  shouldShowMinimap: () => boolean;
  shouldShowHud: () => boolean;
  getHudDensity: () => 'full' | 'normal' | 'minimal';

  // Queries: Device capabilities
  getDeviceCapabilities: () => DeviceCapabilities;
  isBatteryLow: () => boolean;
  isHighBattery: () => boolean;

  // Debugging
  getDebugInfo: () => {
    mode: RuntimeMode;
    battery: number;
    isLowPowerMode: boolean;
    isThermalThrottling: boolean;
    profile: RenderingProfile;
  };
};

/**
 * Create runtime mode store with persistence
 * Manages all rendering orchestration decisions
 */
export const useRuntimeStore = create<RuntimeStoreState>((set, get) => {
  // Initialize device capabilities once at startup
  const initialDeviceCapabilities = detectDeviceCapabilities();

  return {
    // Initial state
    currentMode: RuntimeMode.GPS_ONLY,
    runtimeState: {
      currentMode: RuntimeMode.GPS_ONLY,
      deviceCapabilities: initialDeviceCapabilities,
      adaptToLowBattery: true,
      batteryPercent: 100,
      isThermalThrottling: false
    },

    _cachedProfile: null,
    _cachedCapabilities: null,

    /**
     * Force mode to a specific value
     * Useful for manual mode switching (e.g., user selects camera mode)
     */
    setMode: (mode: RuntimeMode) => {
      const current = get().currentMode;

      if (!isValidModeTransition(current, mode)) {
        console.warn(`Invalid mode transition: ${current} → ${mode}`);
        return;
      }

      set({
        currentMode: mode,
        runtimeState: {
          ...get().runtimeState,
          currentMode: mode
        },
        _cachedProfile: null,
        _cachedCapabilities: null
      });
    },

    /**
     * Transition to a new mode with validation
     * Returns true if transition was successful
     */
    transitionMode: (toMode: RuntimeMode) => {
      const current = get().currentMode;

      if (current === toMode) return true;

      if (!isValidModeTransition(current, toMode)) {
        console.warn(`Invalid mode transition: ${current} → ${toMode}`);
        return false;
      }

      set({
        currentMode: toMode,
        runtimeState: {
          ...get().runtimeState,
          currentMode: toMode
        },
        _cachedProfile: null,
        _cachedCapabilities: null
      });

      return true;
    },

    /**
     * Attempt automatic mode transition based on device state
     *
     * Evaluates all applicable transition rules and applies
     * the first one that matches the current runtime state.
     *
     * Example flow:
     * - Battery drops below 15%
     * - Automatic transition rule triggers
     * - Mode switches to LOW_BATTERY
     * - HUD density reduced, sampling increased
     */
    attemptAutomaticModeTransition: () => {
      const current = get().currentMode;
      const state = get().runtimeState;

      const applicableTransitions = findApplicableTransitions(current, state);

      if (applicableTransitions.length > 0) {
        const transition = applicableTransitions[0];
        const success = get().transitionMode(transition.toMode);

        if (success) {
          console.log(`Automatic mode transition: ${transition.label}`);
        }
      }
    },

    /**
     * Update battery status
     * Triggers automatic mode transition if needed
     */
    updateBatteryStatus: (percent: number, isLowPower: boolean) => {
      set({
        runtimeState: {
          ...get().runtimeState,
          batteryPercent: percent
        }
      });

      // Check if automatic transition should occur
      get().attemptAutomaticModeTransition();
    },

    /**
     * Update thermal state
     * Future: Trigger more aggressive optimizations if throttling detected
     */
    updateThermalState: (isThermalThrottling: boolean) => {
      set({
        runtimeState: {
          ...get().runtimeState,
          isThermalThrottling
        }
      });

      // Future: Additional thermal optimizations
      if (isThermalThrottling) {
        console.warn('Device thermal throttling detected');
        // Could reduce rendering quality, animation frame rates, etc.
      }
    },

    /**
     * Enable/disable automatic adaptation to low battery
     */
    setAdaptToLowBattery: (adapt: boolean) => {
      set({
        runtimeState: {
          ...get().runtimeState,
          adaptToLowBattery: adapt
        }
      });
    },

    /**
     * Get current rendering profile
     * Caches result for performance (only recalculate on mode change)
     */
    getRenderingProfile: () => {
      const cached = get()._cachedProfile;
      const mode = get().currentMode;

      if (cached && cached.mode === mode) {
        return cached;
      }

      const profile = getRenderingProfile(mode);
      set({ _cachedProfile: profile });
      return profile;
    },

    /**
     * Get current mode capabilities
     * Caches result for performance
     */
    getModeCapabilities: () => {
      const cached = get()._cachedCapabilities;
      const mode = get().currentMode;

      if (cached && cached.mode === mode) {
        return cached;
      }

      const capabilities = getModeCapabilities(mode);
      set({ _cachedCapabilities: capabilities });
      return capabilities;
    },

    /**
     * Query: Should map be visible?
     * Used by render components
     */
    shouldShowMap: () => {
      return get().getRenderingProfile().map.visible;
    },

    /**
     * Query: Should camera be visible?
     * Used by render components (future camera implementation)
     */
    shouldShowCamera: () => {
      return get().getRenderingProfile().camera.visible;
    },

    /**
     * Query: Should minimap be visible?
     * Used by render components (future minimap implementation)
     */
    shouldShowMinimap: () => {
      return get().getRenderingProfile().minimap.visible;
    },

    /**
     * Query: Should HUD be visible?
     * Used by overlay manager
     */
    shouldShowHud: () => {
      return get().getRenderingProfile().hud.visible;
    },

    /**
     * Query: What HUD density should be used?
     * Used by overlay manager and widgets
     * 'full' - all widgets, 'normal' - standard layout, 'minimal' - only critical
     */
    getHudDensity: () => {
      return get().getRenderingProfile().hud.density;
    },

    /**
     * Get device capabilities
     */
    getDeviceCapabilities: () => {
      return get().runtimeState.deviceCapabilities;
    },

    /**
     * Query: Is battery low?
     */
    isBatteryLow: () => {
      return get().runtimeState.batteryPercent < 20;
    },

    /**
     * Query: Is battery high?
     */
    isHighBattery: () => {
      return get().runtimeState.batteryPercent > 80;
    },

    /**
     * Get debug information for development/testing
     */
    getDebugInfo: () => ({
      mode: get().currentMode,
      battery: get().runtimeState.batteryPercent,
      isLowPowerMode: false, // TODO: Implement actual battery status detection
      isThermalThrottling: get().runtimeState.isThermalThrottling,
      profile: get().getRenderingProfile()
    })
  };
});

/**
 * Convenience hook for getting rendering profile
 */
export function useRenderingProfile() {
  return useRuntimeStore((state) => state.getRenderingProfile());
}

/**
 * Convenience hook for getting mode capabilities
 */
export function useModeCapabilities() {
  return useRuntimeStore((state) => state.getModeCapabilities());
}

/**
 * Convenience hook for checking if map should be shown
 */
export function useShouldShowMap() {
  return useRuntimeStore((state) => state.shouldShowMap());
}

/**
 * Convenience hook for checking if camera should be shown
 */
export function useShouldShowCamera() {
  return useRuntimeStore((state) => state.shouldShowCamera());
}

/**
 * Convenience hook for checking if minimap should be shown
 */
export function useShouldShowMinimap() {
  return useRuntimeStore((state) => state.shouldShowMinimap());
}

/**
 * Convenience hook for checking if HUD should be shown
 */
export function useShouldShowHud() {
  return useRuntimeStore((state) => state.shouldShowHud());
}

/**
 * Convenience hook for getting HUD density
 */
export function useHudDensity() {
  return useRuntimeStore((state) => state.getHudDensity());
}
