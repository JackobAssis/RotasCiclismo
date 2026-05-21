/**
 * @cycling/accessibility/reducedMotion - Reduced Motion Detection & Preferences
 *
 * This module provides detection and management of user motion preferences,
 * integrating system-level accessibility settings with the application's
 * animation and motion systems.
 *
 * **CSS Media Query Detection:**
 * Uses the `prefers-reduced-motion` CSS media query to detect user preferences.
 * This is reflected in browser settings and OS-level accessibility configurations.
 *
 * **Mobile/System-Level Settings:**
 * On mobile devices, this integrates with:
 * - iOS: Motion & Fitness settings, Reduce Motion accessibility setting
 * - Android: Animation scale settings in Developer Options or A11y settings
 * - System respects user preferences for battery efficiency and accessibility
 *
 * **Battery/Low-Power Mode Awareness:**
 * Devices in low-power/battery-saver modes often automatically trigger
 * reduced motion to conserve energy. This detector responds to those changes
 * and can coordinate with performance monitoring systems.
 *
 * **Architecture Notes:**
 * - Detector uses MediaQueryList listener pattern for efficient change detection
 * - Emits events via TypedEventBus for reactive motion preference updates
 * - Provides synchronous getter for immediate preference checks
 * - Gracefully handles browsers without media query support
 * - Thread-safe initialization and state management
 */

import { TypedEventBus } from '@cycling/utils';
import type { AppEvents } from '@cycling/types';

/**
 * Preference value indicating whether motion should be reduced
 * - `true`: User prefers reduced motion
 * - `false`: User allows full motion
 * - `null`: Browser doesn't support media query detection
 */
export type MotionPreference = boolean | null;

/**
 * Motion profile configuration placeholder
 * TODO: Implement motion profiles system for different animation scenarios:
 * - 'smooth': Full motion with smooth transitions
 * - 'gentle': Reduced motion for subtle feedback
 * - 'minimal': Absolute minimum motion (near-static)
 * - 'battery-saver': Motion reduction for low-power scenarios
 */
export interface MotionProfile {
  animationDuration: number;
  transitionTiming: string;
  reduceParticles: boolean;
  // TODO: Add device-specific profiles for different capabilities
  // TODO: Add performance tier awareness (30fps, 60fps, 120fps targets)
}

/**
 * Options for configuring MotionPreferenceDetector
 */
export interface MotionDetectorOptions {
  /** Optional event bus for emitting motion preference changes */
  eventBus?: TypedEventBus<AppEvents>;
  /** Whether to automatically detect media query changes */
  autoDetect?: boolean;
}

/**
 * MotionPreferenceDetector - Core class for motion preference detection
 *
 * Detects CSS media query `prefers-reduced-motion` and emits events
 * when user preferences change. Works with OS accessibility settings.
 *
 * **Usage:**
 * ```typescript
 * const detector = new MotionPreferenceDetector({ eventBus, autoDetect: true });
 * console.log(detector.prefersReducedMotion); // boolean | null
 *
 * detector.on((prefers) => {
 *   console.log('Motion preference changed:', prefers);
 * });
 * ```
 */
export class MotionPreferenceDetector {
  private mediaQueryList: MediaQueryList | null = null;
  private listeners: Set<(prefers: MotionPreference) => void> = new Set();
  private eventBus: TypedEventBus<AppEvents> | null;
  private currentPreference: MotionPreference = null;
  private mediaQueryHandler: ((e: MediaQueryListEvent) => void) | null = null;

  constructor(options: MotionDetectorOptions = {}) {
    this.eventBus = options.eventBus || null;

    try {
      // Edge case: Browser doesn't support matchMedia API
      if (typeof window !== 'undefined' && window.matchMedia) {
        this.mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');

        // Initialize current preference from media query
        this.currentPreference = this.mediaQueryList.matches;

        if (options.autoDetect !== false) {
          this.setupMediaQueryListener();
        }
      }
    } catch (error) {
      // Gracefully handle errors in media query detection
      // (e.g., in non-browser environments)
      this.currentPreference = null;
    }
  }

  /**
   * Sets up listener for media query changes
   * Called automatically if autoDetect is true
   */
  private setupMediaQueryListener(): void {
    if (!this.mediaQueryList) return;

    this.mediaQueryHandler = (event: MediaQueryListEvent) => {
      this.currentPreference = event.matches;
      this.notifyListeners(event.matches);

      // Emit event via event bus if configured
      if (this.eventBus) {
        this.eventBus.emit('motion:preference:changed', {
          prefersReducedMotion: event.matches,
          timestamp: new Date().toISOString(),
        });
      }
    };

    // addEventListener is preferred over addListener for modern browsers
    this.mediaQueryList.addEventListener('change', this.mediaQueryHandler);
  }

  /**
   * Get the current motion preference synchronously
   * Returns true if user prefers reduced motion, false otherwise, or null if unavailable
   */
  get prefersReducedMotion(): MotionPreference {
    return this.currentPreference;
  }

  /**
   * Subscribe to motion preference changes
   * Returns unsubscribe function
   */
  on(callback: (prefers: MotionPreference) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Remove a listener
   */
  off(callback: (prefers: MotionPreference) => void): void {
    this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of preference change
   */
  private notifyListeners(preference: MotionPreference): void {
    for (const listener of this.listeners) {
      try {
        listener(preference);
      } catch (error) {
        // Swallow errors from listeners to keep detector resilient
        // In future, add optional error handler for debugging
      }
    }
  }

  /**
   * Force re-check of media query (useful for testing or manual refresh)
   */
  refresh(): void {
    if (this.mediaQueryList) {
      const newPreference = this.mediaQueryList.matches;
      if (newPreference !== this.currentPreference) {
        this.currentPreference = newPreference;
        this.notifyListeners(newPreference);

        if (this.eventBus) {
          this.eventBus.emit('motion:preference:changed', {
            prefersReducedMotion: newPreference,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }
  }

  /**
   * Clean up listener resources
   */
  destroy(): void {
    if (this.mediaQueryList && this.mediaQueryHandler) {
      this.mediaQueryList.removeEventListener('change', this.mediaQueryHandler);
    }
    this.listeners.clear();
  }
}

/**
 * Global detector instance
 * Lazily initialized on first use
 */
let globalDetector: MotionPreferenceDetector | null = null;

/**
 * Initialize the global detector with optional event bus
 * @param eventBus Optional TypedEventBus for motion events
 */
export function initializeMotionDetector(
  eventBus?: TypedEventBus<AppEvents>
): MotionPreferenceDetector {
  if (!globalDetector) {
    globalDetector = new MotionPreferenceDetector({
      eventBus,
      autoDetect: true,
    });
  }
  return globalDetector;
}

/**
 * Helper function: Check if motion should be reduced
 * Convenience getter for quick checks in components
 *
 * @returns true if reduced motion is preferred, false otherwise
 * Returns false if media query is not supported (fails open)
 *
 * **Usage:**
 * ```typescript
 * const shouldReduce = shouldReduceMotion();
 * const duration = shouldReduce ? 0 : 300;
 * ```
 */
export function shouldReduceMotion(): boolean {
  if (!globalDetector) {
    globalDetector = new MotionPreferenceDetector({ autoDetect: true });
  }
  return globalDetector.prefersReducedMotion ?? false;
}

/**
 * Helper function: Watch for motion preference changes
 * Sets up a callback that fires whenever the preference changes
 *
 * @param callback Function called with new preference value
 * @returns Unsubscribe function
 *
 * **Usage:**
 * ```typescript
 * const unwatch = watchMotionPreference((prefers) => {
 *   console.log('Motion reduced:', prefers);
 * });
 *
 * // Later, unsubscribe:
 * unwatch();
 * ```
 */
export function watchMotionPreference(
  callback: (prefers: MotionPreference) => void
): () => void {
  if (!globalDetector) {
    globalDetector = new MotionPreferenceDetector({ autoDetect: true });
  }
  return globalDetector.on(callback);
}

/**
 * Helper function: Get motion profile based on current preferences
 *
 * TODO: Implement comprehensive motion profile system:
 * - Different animation profiles for different use cases
 * - Adapt to device capabilities (hardware accelerated vs software rendering)
 * - Performance-aware profiles based on frame rate targets
 * - Battery/low-power mode awareness
 * - Wearable device motion preferences for haptic feedback coordination
 *
 * @returns MotionProfile configuration object
 *
 * **Future Usage:**
 * ```typescript
 * const profile = getMotionProfile();
 * const animation = {
 *   duration: profile.animationDuration,
 *   timing: profile.transitionTiming,
 * };
 * ```
 */
export function getMotionProfile(): MotionProfile {
  const prefers = shouldReduceMotion();

  // Placeholder implementation
  return {
    animationDuration: prefers ? 0 : 300,
    transitionTiming: prefers ? 'linear' : 'ease-in-out',
    reduceParticles: prefers,
  };

  // TODO: Motion profile system features to implement:
  // 1. Multiple profiles: smooth, gentle, minimal, battery-saver
  // 2. Device capability detection:
  //    - Check for GPU acceleration support
  //    - Detect refresh rate capabilities
  //    - Measure available device memory
  // 3. Performance-aware profiles:
  //    - Adjust animation counts based on FPS targets
  //    - Reduce particle counts on low-end devices
  //    - Disable parallax on devices with limited GPU
  // 4. Battery-aware profiles:
  //    - Detect low-power mode (via Battery Status API)
  //    - Coordinate with system theme for optimal power usage
  //    - Optional: Alert component of battery constraints
  // 5. Wearable device integration:
  //    - Query wearable device motion capabilities
  //    - Coordinate haptic feedback duration with motion reduction
  //    - Synchronize animation timing with haptic patterns
  // 6. Accessibility testing profiles:
  //    - Strict profile for accessibility compliance testing
  //    - Debugging profile with visual indicators
  //    - Performance profiling instrumentation
}

/**
 * TODO: Advanced motion detection features for future implementation
 *
 * 1. **Low-Power Mode Detection:**
 *    - Use Battery Status API to detect low-power mode
 *    - Coordinate motion reduction with battery conservation
 *    - Events: motion:lowpower:detected
 *    ```typescript
 *    navigator.getBattery?.().then(battery => {
 *      if (battery.level < 0.2) triggerReducedMotion();
 *    });
 *    ```
 *
 * 2. **Device Capability Profiles:**
 *    - Detect hardware acceleration (WebGL context)
 *    - Measure animation frame rates
 *    - Test transform and opacity performance
 *    - Tailor motion based on device tier
 *
 * 3. **Wearable Device Motion Preferences:**
 *    - Query connected wearables for motion preferences
 *    - Coordinate haptic patterns with motion reduction
 *    - Synchronize animation timing with device capabilities
 *    - Integrate with haptic feedback system for seamless experience
 *
 * 4. **Performance-Aware Motion System:**
 *    - Monitor actual frame rates during animations
 *    - Automatically reduce motion if frame rate drops
 *    - Restore full motion when performance improves
 *    - Emit performance-related motion events
 *
 * 5. **Accessibility Testing Utilities:**
 *    - Provide override mechanism for testing
 *    - Visual debugging indicators for motion reduction
 *    - Telemetry for accessibility validation
 *    - Screen reader announcements for motion changes
 */
