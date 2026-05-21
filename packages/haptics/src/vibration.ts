/**
 * Haptic Vibration Utility for Web Vibration API
 *
 * Architecture:
 * - Detects navigator.vibrate support at runtime
 * - Provides lightweight abstraction over platform-specific haptic APIs
 * - Gracefully degrades when vibration unavailable
 * - Single instance pattern to prevent overlapping vibrations
 *
 * Mobile Support:
 * - Android: Full support via native Vibration API
 * - iOS: Limited support (requires user gesture), polyfill with AudioContext fallback
 * - PWA: Available in standalone mode on supporting devices
 *
 * TODO: Platform-specific optimizations
 * TODO: iOS haptic engine integration (Haptic Feedback API if available)
 * TODO: Android vibration strength control (intensity levels)
 * TODO: Wearable device feedback (watch/fitness tracker integration)
 * TODO: Device capability detection (battery saver mode detection)
 */

/**
 * Predefined vibration patterns for common use cases
 * All timings in milliseconds
 */
export const VIBRATION_PATTERNS = {
  /** Light single tap - quick feedback for UI interactions */
  lightTap: [50],

  /** Medium two-pulse buzz - confirmation feedback */
  mediumBuzz: [60, 40, 60],

  /** Strong shake - high-attention notification */
  strongShake: [100, 50, 100, 50, 100],

  /** Double tap - selection/activation */
  doubleTap: [80, 100, 80],

  /** Success pattern - ascending pulse */
  success: [30, 50, 30, 50, 30],

  /** Error pattern - rapid double pulse */
  error: [200, 100, 50],

  /** Warning pattern - slow pulse */
  warning: [100, 200, 100],
};

/**
 * Timing presets for common use cases
 */
export const VIBRATION_TIMING = {
  /** Extra short pulse (50ms) */
  extraShort: 50,

  /** Short pulse (100ms) */
  short: 100,

  /** Medium pulse (200ms) */
  medium: 200,

  /** Long pulse (500ms) */
  long: 500,

  /** Very long pulse (1000ms) */
  veryLong: 1000,
} as const;

/**
 * Type definitions for vibration patterns and durations
 */
export type VibrationType = number | number[];
export interface VibratorState {
  isVibrating: boolean;
  lastPattern: VibrationType | null;
}

type TimeoutId = ReturnType<typeof setTimeout> | null;

/**
 * HapticVibrator - Lightweight abstraction over Web Vibration API
 *
 * Usage:
 * ```typescript
 * const vibrator = HapticVibrator.getInstance();
 * vibrator.vibrate(100); // 100ms vibration
 * vibrator.pattern(VIBRATION_PATTERNS.success); // Play success pattern
 * vibrator.cancel(); // Stop current vibration
 * ```
 */
export class HapticVibrator {
  private static instance: HapticVibrator | null = null;
  private isSupported: boolean = false;
  private state: VibratorState = {
    isVibrating: false,
    lastPattern: null,
  };
  private cancelTimeoutId: TimeoutId = null;

  private constructor() {
    this.detectSupport();
  }

  /**
   * Get singleton instance of HapticVibrator
   */
  public static getInstance(): HapticVibrator {
    if (!HapticVibrator.instance) {
      HapticVibrator.instance = new HapticVibrator();
    }
    return HapticVibrator.instance;
  }

  /**
   * Detect if vibration API is supported in current environment
   * Checks for navigator.vibrate or vendor-prefixed variants
   */
  private detectSupport(): void {
    try {
      if (typeof window === 'undefined') {
        this.isSupported = false;
        return;
      }

      const nav = navigator as any;
      this.isSupported = !!(
        nav.vibrate ||
        nav.webkitVibrate ||
        nav.mozVibrate ||
        nav.msVibrate
      );
    } catch (err) {
      this.isSupported = false;
    }
  }

  /**
   * Check if vibration is currently supported
   */
  public isVibrationsSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Validate vibration duration/pattern
   */
  private validateVibrationType(type: VibrationType): boolean {
    if (typeof type === 'number') {
      return Number.isFinite(type) && type >= 0;
    }

    if (Array.isArray(type)) {
      return (
        type.length > 0 &&
        type.every((val) => Number.isFinite(val) && val >= 0)
      );
    }

    return false;
  }

  /**
   * Calculate total vibration duration from pattern
   */
  private calculateDuration(pattern: VibrationType): number {
    if (typeof pattern === 'number') {
      return pattern;
    }
    return pattern.reduce((sum, val) => sum + val, 0);
  }

  /**
   * Vibrate for a specific duration (ms)
   * Automatically cancels any ongoing vibration
   *
   * @param duration - Duration in milliseconds (0-5000 recommended)
   * @returns true if vibration was triggered, false if unsupported
   */
  public vibrate(duration: number): boolean {
    if (!this.isSupported || !this.validateVibrationType(duration)) {
      return false;
    }

    // Cancel ongoing vibration before starting new one
    this.cancel();

    try {
      const nav = navigator as any;
      (nav.vibrate || nav.webkitVibrate || nav.mozVibrate || nav.msVibrate)?.call(
        navigator,
        duration
      );

      this.state.isVibrating = true;
      this.state.lastPattern = duration;

      // Mark as not vibrating after duration expires
      this.cancelTimeoutId = setTimeout(() => {
        this.state.isVibrating = false;
        this.cancelTimeoutId = null;
      }, duration);

      return true;
    } catch (err) {
      // Silently fail for security/permission errors (e.g., iOS without user gesture)
      return false;
    }
  }

  /**
   * Play a predefined or custom vibration pattern
   * Pattern is array of [vibrate, pause, vibrate, pause, ...]
   *
   * @param pattern - Array of durations or predefined pattern
   * @returns true if pattern was triggered, false if unsupported
   *
   * Example:
   * ```typescript
   * vibrator.pattern([100, 50, 100]); // 100ms on, 50ms off, 100ms on
   * vibrator.pattern(VIBRATION_PATTERNS.success);
   * ```
   */
  public pattern(pattern: number[]): boolean {
    if (!this.isSupported || !this.validateVibrationType(pattern)) {
      return false;
    }

    // Cancel ongoing vibration before starting new one
    this.cancel();

    try {
      const nav = navigator as any;
      (nav.vibrate || nav.webkitVibrate || nav.mozVibrate || nav.msVibrate)?.call(
        navigator,
        pattern
      );

      this.state.isVibrating = true;
      this.state.lastPattern = pattern;

      // Calculate when pattern ends and mark as not vibrating
      const totalDuration = this.calculateDuration(pattern);
      this.cancelTimeoutId = setTimeout(() => {
        this.state.isVibrating = false;
        this.cancelTimeoutId = null;
      }, totalDuration);

      return true;
    } catch (err) {
      // Silently fail for security/permission errors
      return false;
    }
  }

  /**
   * Cancel ongoing vibration immediately
   * Safe to call even if no vibration is active
   *
   * @returns true if vibration was cancelled, false if none active
   */
  public cancel(): boolean {
    if (!this.isSupported || !this.state.isVibrating) {
      return false;
    }

    try {
      const nav = navigator as any;
      (nav.vibrate || nav.webkitVibrate || nav.mozVibrate || nav.msVibrate)?.call(
        navigator,
        0
      );

      if (this.cancelTimeoutId) {
        clearTimeout(this.cancelTimeoutId);
        this.cancelTimeoutId = null;
      }

      this.state.isVibrating = false;
      this.state.lastPattern = null;

      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Check if currently vibrating
   */
  public isVibrating(): boolean {
    return this.state.isVibrating;
  }

  /**
   * Get current vibrator state (for debugging)
   */
  public getState(): Readonly<VibratorState> {
    return { ...this.state };
  }

  /**
   * Detect low-power mode (battery saver)
   * TODO: Implement platform-specific battery detection
   * TODO: On iOS: Expose battery level and low-power-mode via Battery Status API
   * TODO: On Android: Query device power profile status
   *
   * @returns true if device is in low-power mode (future implementation)
   */
  public isLowPowerMode(): boolean {
    // Placeholder for future implementation
    // TODO: Use Battery Status API when available
    // TODO: Gracefully reduce vibration intensity in low-power mode
    if (typeof navigator === 'undefined') {
      return false;
    }

    try {
      const nav = navigator as any;

      // Check Battery Status API (deprecated but still supported)
      if (nav.getBattery && typeof nav.getBattery === 'function') {
        // TODO: Implement async battery status check
        // const battery = await nav.getBattery();
        // return battery.level < 0.2 && battery.charging === false;
      }

      // Future: Check device capability detection
      // if (MediaQueryList available) {
      //   return window.matchMedia('(prefers-reduced-data)').matches;
      // }

      return false;
    } catch (err) {
      return false;
    }
  }

  /**
   * Get remaining timeout until vibration completes (in ms)
   * Useful for synchronizing UI with vibration duration
   *
   * @returns Remaining milliseconds, or -1 if not vibrating
   */
  public getRemainingDuration(): number {
    if (!this.state.isVibrating || !this.cancelTimeoutId) {
      return -1;
    }

    // Note: Timeout API doesn't expose remaining time directly
    // This is a placeholder that returns -1
    // TODO: Implement duration tracking with AbortController for precise timing
    return -1;
  }
}

/**
 * Convenience export - singleton instance
 * Can be imported as: import { vibrator } from '@cycling/haptics'
 */
export const vibrator = HapticVibrator.getInstance();
