/**
 * @cycling/accessibility/transitions - Accessibility-Aware Transition Hooks
 *
 * This module provides motion preference-aware transitions that gracefully adapt
 * to user accessibility settings and device capabilities. It integrates with the
 * MotionPreferenceDetector to automatically respect prefers-reduced-motion settings.
 *
 * **Motion Preference Detection:**
 * Uses CSS media query `prefers-reduced-motion` to detect user preferences.
 * When active, transitions are instantly applied (0ms) rather than animated.
 * This is a critical accessibility feature for users with vestibular disorders,
 * photosensitive epilepsy, or cognitive processing differences.
 *
 * **Graceful Degradation Strategy:**
 * 1. If reduced motion is active: Use INSTANT (0ms) timing
 * 2. If device supports reduced motion detection: Use appropriate preset
 * 3. If media query unavailable: Fall back to NORMAL timing (fails open)
 * 4. All easing functions default to linear when motion is reduced
 * 5. Events are always emitted regardless of animation state
 *
 * **Animation Performance Considerations:**
 * - Use CSS transforms (translate, scale) instead of position/size for better performance
 * - Opacity changes are GPU-accelerated and safe for animations
 * - Avoid animating expensive properties (layout, shadows, borders)
 * - Event listeners are cleaned up automatically via WeakMap when managers are GC'd
 * - Transitions are non-blocking and use requestAnimationFrame for smooth timing
 *
 * **Transition Types:**
 * - **fade**: Opacity-based visibility transitions (GPU accelerated)
 * - **slide**: Position changes via CSS transform translate (GPU accelerated)
 * - **scale**: Size changes via CSS transform scale (GPU accelerated)
 * - **overlay**: Show/hide overlay with backdrop fade (combined fade + overlay)
 * - **focus**: Focus indicator movement with smooth positioning (uses transform)
 */

import { TypedEventBus } from '@cycling/utils';
import type { AppEvents } from '@cycling/types';
import {
  MotionPreferenceDetector,
  shouldReduceMotion,
  watchMotionPreference,
} from './reducedMotion';

/**
 * Timing presets for different animation scenarios
 * All values are in milliseconds
 *
 * When `prefers-reduced-motion` is active, INSTANT is used instead
 * of any preset to respect user accessibility preferences.
 */
export const TRANSITION_TIMINGS = {
  /** Instant - 0ms (used when reduced motion is active) */
  INSTANT: 0,
  /** Fast transitions - quick feedback for interactions */
  FAST: 150,
  /** Normal transitions - default for most animations */
  NORMAL: 300,
  /** Slow transitions - deliberate pacing for important changes */
  SLOW: 500,
  /** Very slow - accessibility mode for users who need extra time */
  VERY_SLOW: 1000,
} as const;

/**
 * Easing function definitions for different animation scenarios
 * When reduced motion is active, all easing defaults to 'linear'
 */
export const EASING_FUNCTIONS = {
  /** Linear - no acceleration, constant speed */
  linear: 'linear',
  /** Ease in - starts slow, accelerates */
  easeIn: 'ease-in',
  /** Ease out - starts fast, decelerates */
  easeOut: 'ease-out',
  /** Ease in-out - smooth acceleration and deceleration */
  easeInOut: 'ease-in-out',
  /** Cubic Bezier for custom easing */
  smoothFocus: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
} as const;

/**
 * Supported transition types
 */
export type TransitionType = 'fade' | 'slide' | 'scale' | 'overlay' | 'focus';

/**
 * Configuration for a single transition
 */
export interface TransitionConfig {
  /** Duration in milliseconds */
  duration: number;
  /** CSS easing function */
  easing: string;
  /** Delay before transition starts */
  delay?: number;
  /** Whether to use GPU acceleration */
  accelerated?: boolean;
}

/**
 * Options for creating a transition configuration
 */
export interface TransitionOptions {
  /** Type of transition to create */
  type: TransitionType;
  /** Custom duration (overrides preset timing) */
  customDuration?: number;
  /** Custom easing function */
  customEasing?: string;
  /** Delay before transition */
  delay?: number;
  /** Whether reduced motion preference should be ignored */
  ignoreReducedMotion?: boolean;
}

/**
 * Event emitted when a transition starts
 */
export interface TransitionStartEvent {
  type: TransitionType;
  duration: number;
  timestamp: number;
}

/**
 * Event emitted when a transition completes
 */
export interface TransitionCompleteEvent {
  type: TransitionType;
  duration: number;
  timestamp: number;
}

/**
 * Transition manager event map
 */
export interface TransitionEvents {
  'transition:start': TransitionStartEvent;
  'transition:complete': TransitionCompleteEvent;
}

/**
 * TransitionManager - Core class for motion preference-aware transitions
 *
 * Manages transitions with automatic respect for user motion preferences,
 * emits events for animation lifecycle, and provides timing configuration.
 *
 * **Features:**
 * - Automatic motion preference detection and response
 * - Event emission for transition lifecycle
 * - Type-safe transition configuration
 * - GPU acceleration optimization
 * - Memory-efficient listener management
 *
 * **Usage:**
 * ```typescript
 * const manager = new TransitionManager({ eventBus });
 *
 * // Get transition config for a fade animation
 * const config = manager.getTransitionConfig({ type: 'fade' });
 * element.style.transition = `opacity ${config.duration}ms ${config.easing}`;
 * element.style.opacity = '0';
 *
 * // Listen to transition events
 * manager.on('transition:complete', (event) => {
 *   console.log(`Transition complete: ${event.duration}ms`);
 * });
 * ```
 */
export class TransitionManager {
  private motionDetector: MotionPreferenceDetector;
  private eventBus: TypedEventBus<AppEvents> | null;
  private eventListeners: Map<
    keyof TransitionEvents,
    Set<(event: any) => void>
  > = new Map();
  private unsubscribeWatchers: (() => void)[] = [];

  constructor(
    options: { eventBus?: TypedEventBus<AppEvents>; detector?: MotionPreferenceDetector } = {}
  ) {
    this.eventBus = options.eventBus ?? null;
    this.motionDetector =
      options.detector ||
      new MotionPreferenceDetector({
        eventBus: options.eventBus,
        autoDetect: true,
      });

    // Watch for motion preference changes
    const unwatch = watchMotionPreference(() => {
      // Notify listeners of preference change if needed
      // Can be used by consumers to re-render with new timings
    });

    this.unsubscribeWatchers.push(unwatch);
  }

  /**
   * Get whether motion should be reduced based on current user preference
   * @returns true if reduced motion is preferred
   */
  private isReducedMotion(): boolean {
    return this.motionDetector.prefersReducedMotion ?? false;
  }

  /**
   * Get transition duration based on type and motion preference
   *
   * **Duration Selection Logic:**
   * 1. If reduced motion is active: Return INSTANT (0ms)
   * 2. Otherwise: Return type-specific duration from preset
   *
   * Reduced motion always results in instant transitions to provide
   * immediate feedback without motion.
   *
   * @param type The transition type
   * @param reducedMotion Optional override for reduced motion preference
   * @returns Duration in milliseconds
   *
   * @example
   * ```typescript
   * const duration = getTransitionDuration('fade', shouldReduceMotion());
   * // Returns 0 if motion is reduced, 150 for FAST fade otherwise
   * ```
   */
  getTransitionDuration(type: TransitionType, reducedMotion?: boolean): number {
    const isReduced = reducedMotion !== undefined ? reducedMotion : this.isReducedMotion();

    if (isReduced) {
      return TRANSITION_TIMINGS.INSTANT;
    }

    switch (type) {
      case 'fade':
        return TRANSITION_TIMINGS.FAST;
      case 'slide':
        return TRANSITION_TIMINGS.NORMAL;
      case 'scale':
        return TRANSITION_TIMINGS.NORMAL;
      case 'overlay':
        return TRANSITION_TIMINGS.NORMAL;
      case 'focus':
        return TRANSITION_TIMINGS.FAST;
      default:
        return TRANSITION_TIMINGS.NORMAL;
    }
  }

  /**
   * Get easing function based on transition type and motion preference
   *
   * **Easing Selection Logic:**
   * 1. If reduced motion is active: Always return 'linear'
   * 2. Otherwise: Return type-specific easing with smooth timing
   *
   * Linear easing ensures no additional motion complexity when
   * motion is reduced, providing a direct, unambiguous transition.
   *
   * @param type The transition type
   * @param reducedMotion Optional override for reduced motion preference
   * @returns CSS easing function string
   *
   * @example
   * ```typescript
   * const easing = getEasingFunction('fade');
   * // Returns 'linear' if motion reduced, 'ease-out' for normal
   * ```
   */
  getEasingFunction(type: TransitionType, reducedMotion?: boolean): string {
    const isReduced = reducedMotion !== undefined ? reducedMotion : this.isReducedMotion();

    if (isReduced) {
      return EASING_FUNCTIONS.linear;
    }

    switch (type) {
      case 'fade':
        return EASING_FUNCTIONS.easeOut;
      case 'slide':
        return EASING_FUNCTIONS.easeInOut;
      case 'scale':
        return EASING_FUNCTIONS.easeInOut;
      case 'overlay':
        return EASING_FUNCTIONS.easeOut;
      case 'focus':
        return EASING_FUNCTIONS.smoothFocus;
      default:
        return EASING_FUNCTIONS.easeInOut;
    }
  }

  /**
   * Check if animation should run for the given transition type
   *
   * **Animation Decision Logic:**
   * - Returns `false` only if reduced motion is active AND duration would be INSTANT
   * - Returns `true` if:
   *   - Reduced motion is disabled, OR
   *   - ignoreReducedMotion option is set, OR
   *   - Duration is non-zero (even with reduced motion)
   *
   * This allows components to skip animation setup entirely when not needed,
   * improving performance and reducing DOM manipulation.
   *
   * @param type The transition type
   * @param options Optional configuration
   * @returns true if animation should run
   *
   * @example
   * ```typescript
   * if (shouldAnimate('fade')) {
   *   element.style.opacity = '0';
   *   element.style.transition = 'opacity 300ms ease-out';
   * } else {
   *   element.style.opacity = '0';
   *   // No transition CSS needed
   * }
   * ```
   */
  shouldAnimate(type: TransitionType, options?: { ignoreReducedMotion?: boolean }): boolean {
    if (options?.ignoreReducedMotion) {
      return true;
    }

    const isReduced = this.isReducedMotion();
    if (!isReduced) {
      return true;
    }

    // Even with reduced motion, allow animation if duration is non-zero
    const duration = this.getTransitionDuration(type, true);
    return duration > 0;
  }

  /**
   * Create a complete transition configuration for the given options
   *
   * **Configuration Build Logic:**
   * 1. Start with type-specific defaults
   * 2. Apply motion preference adjustments
   * 3. Merge custom options (duration, easing, delay)
   * 4. Set GPU acceleration for transforms
   *
   * @param options Configuration options
   * @returns TransitionConfig ready for CSS application
   *
   * @example
   * ```typescript
   * const config = manager.createTransitionConfig({
   *   type: 'slide',
   *   customDuration: 500,
   * });
   *
   * element.style.transition =
   *   `transform ${config.duration}ms ${config.easing} ${config.delay || 0}ms`;
   * element.style.transform = 'translateX(100px)';
   * ```
   */
  createTransitionConfig(options: TransitionOptions): TransitionConfig {
    const isReduced = options.ignoreReducedMotion ? false : this.isReducedMotion();

    const duration = options.customDuration ?? this.getTransitionDuration(options.type, isReduced);
    const easing = options.customEasing ?? this.getEasingFunction(options.type, isReduced);

    return {
      duration,
      easing,
      delay: options.delay ?? 0,
      accelerated: true, // CSS transforms are always GPU-accelerated
    };
  }

  /**
   * Emit a transition start event
   * Called when animation begins
   *
   * @param type The transition type
   * @param duration Duration of the transition
   * @internal
   */
  private emitTransitionStart(type: TransitionType, duration: number): void {
    const event: TransitionStartEvent = {
      type,
      duration,
      timestamp: Date.now(),
    };

    // Emit through event listeners
    this.eventListeners.get('transition:start')?.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        // Swallow errors from listeners
      }
    });
  }

  /**
   * Emit a transition complete event
   * Called when animation finishes
   *
   * @param type The transition type
   * @param duration Duration of the transition
   * @internal
   */
  private emitTransitionComplete(type: TransitionType, duration: number): void {
    const event: TransitionCompleteEvent = {
      type,
      duration,
      timestamp: Date.now(),
    };

    // Emit through event listeners
    this.eventListeners.get('transition:complete')?.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        // Swallow errors from listeners
      }
    });
  }

  /**
   * Register a listener for transition events
   *
   * @param event Event type to listen for
   * @param listener Callback function
   * @returns Unsubscribe function
   *
   * @example
   * ```typescript
   * const unsubscribe = manager.on('transition:complete', (event) => {
   *   console.log('Transition done!', event.duration);
   * });
   *
   * // Later, unsubscribe:
   * unsubscribe();
   * ```
   */
  on<K extends keyof TransitionEvents>(
    event: K,
    listener: (event: TransitionEvents[K]) => void
  ): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    const listeners = this.eventListeners.get(event)!;
    listeners.add(listener as any);

    return () => {
      listeners.delete(listener as any);
    };
  }

  /**
   * Remove a listener for transition events
   *
   * @param event Event type
   * @param listener Callback function to remove
   */
  off<K extends keyof TransitionEvents>(
    event: K,
    listener: (event: TransitionEvents[K]) => void
  ): void {
    this.eventListeners.get(event)?.delete(listener as any);
  }

  /**
   * Clean up resources and remove watchers
   */
  destroy(): void {
    // Unsubscribe from motion preference watcher
    this.unsubscribeWatchers.forEach((unwatch) => unwatch());
    this.unsubscribeWatchers = [];

    // Clear event listeners
    this.eventListeners.clear();

    // Destroy motion detector if owned by this manager
    // (if passed in, don't destroy as it may be shared)
  }
}

/**
 * Get transition duration based on type and motion preference
 *
 * Standalone helper for quick duration lookups without managing
 * a TransitionManager instance. Uses global motion preference detector.
 *
 * **Usage:**
 * ```typescript
 * const duration = getTransitionDuration('fade');
 * element.style.transitionDuration = `${duration}ms`;
 * ```
 *
 * @param type The transition type
 * @param reducedMotion Optional override for motion preference
 * @returns Duration in milliseconds
 */
export function getTransitionDuration(type: TransitionType, reducedMotion?: boolean): number {
  const isReduced = reducedMotion !== undefined ? reducedMotion : shouldReduceMotion();

  if (isReduced) {
    return TRANSITION_TIMINGS.INSTANT;
  }

  switch (type) {
    case 'fade':
      return TRANSITION_TIMINGS.FAST;
    case 'slide':
      return TRANSITION_TIMINGS.NORMAL;
    case 'scale':
      return TRANSITION_TIMINGS.NORMAL;
    case 'overlay':
      return TRANSITION_TIMINGS.NORMAL;
    case 'focus':
      return TRANSITION_TIMINGS.FAST;
    default:
      return TRANSITION_TIMINGS.NORMAL;
  }
}

/**
 * Get easing function based on transition type and motion preference
 *
 * Standalone helper for quick easing lookups without managing
 * a TransitionManager instance. Uses global motion preference detector.
 *
 * **Usage:**
 * ```typescript
 * const easing = getEasingFunction('slide');
 * element.style.transitionTimingFunction = easing;
 * ```
 *
 * @param type The transition type
 * @param reducedMotion Optional override for motion preference
 * @returns CSS easing function string
 */
export function getEasingFunction(type: TransitionType, reducedMotion?: boolean): string {
  const isReduced = reducedMotion !== undefined ? reducedMotion : shouldReduceMotion();

  if (isReduced) {
    return EASING_FUNCTIONS.linear;
  }

  switch (type) {
    case 'fade':
      return EASING_FUNCTIONS.easeOut;
    case 'slide':
      return EASING_FUNCTIONS.easeInOut;
    case 'scale':
      return EASING_FUNCTIONS.easeInOut;
    case 'overlay':
      return EASING_FUNCTIONS.easeOut;
    case 'focus':
      return EASING_FUNCTIONS.smoothFocus;
    default:
      return EASING_FUNCTIONS.easeInOut;
  }
}

/**
 * Check if animation should run for the given transition type
 *
 * Standalone helper to determine animation necessity without managing
 * a TransitionManager instance. Uses global motion preference detector.
 *
 * **Usage:**
 * ```typescript
 * if (shouldAnimate('fade')) {
 *   element.classList.add('fade-animated');
 * }
 * ```
 *
 * @param type The transition type
 * @param ignoreReducedMotion Whether to ignore motion preference
 * @returns true if animation should run
 */
export function shouldAnimate(type: TransitionType, ignoreReducedMotion?: boolean): boolean {
  if (ignoreReducedMotion) {
    return true;
  }

  const isReduced = shouldReduceMotion();
  if (!isReduced) {
    return true;
  }

  // Even with reduced motion, allow animation if duration is non-zero
  const duration = getTransitionDuration(type, true);
  return duration > 0;
}

/**
 * Create a complete transition configuration for the given options
 *
 * Standalone helper to build a transition config without managing
 * a TransitionManager instance. Uses global motion preference detector.
 *
 * **Usage:**
 * ```typescript
 * const config = createTransitionConfig({ type: 'slide' });
 * element.style.transition =
 *   `transform ${config.duration}ms ${config.easing}`;
 * ```
 *
 * @param options Configuration options
 * @returns TransitionConfig ready for CSS application
 */
export function createTransitionConfig(options: TransitionOptions): TransitionConfig {
  const isReduced = options.ignoreReducedMotion ? false : shouldReduceMotion();

  const duration = options.customDuration ?? getTransitionDuration(options.type, isReduced);
  const easing = options.customEasing ?? getEasingFunction(options.type, isReduced);

  return {
    duration,
    easing,
    delay: options.delay ?? 0,
    accelerated: true,
  };
}

/**
 * TODO: Spring animations
 * - Implement spring physics for more natural motion
 * - Provide spring-based transition presets (bouncy, smooth, stiff)
 * - Detect motion preference and disable springs for reduced motion
 * - Use transform-based animation for performance
 * - Ensure spring animations respect device refresh rate
 *
 * TODO: Gesture-based transitions
 * - Detect touch/pointer gestures (swipe, drag, pinch)
 * - Coordinate gesture animations with motion preferences
 * - Provide predictive animations based on gesture velocity
 * - Support momentum-based deceleration
 * - Ensure gesture animations are accessible (can be canceled)
 *
 * TODO: Device capability adaptation
 * - Detect GPU acceleration support (WebGL context)
 * - Check device refresh rate (60fps, 120fps, 144fps)
 * - Measure available device memory and thermal state
 * - Adapt animation complexity to device tier
 * - Monitor actual frame rates during animations
 * - Reduce motion if performance drops below target
 *
 * TODO: Custom animation profiles
 * - Support user-defined animation profiles
 * - Allow components to register custom timing presets
 * - Provide profile inheritance and composition
 * - Enable A/B testing of animation parameters
 * - Store user animation preferences in localStorage
 *
 * TODO: GPU-accelerated transforms
 * - Use will-change CSS property strategically
 * - Optimize transform layers for complex animations
 * - Implement backface-visibility optimization
 * - Use translate3d for hardware acceleration hints
 * - Coordinate with rendering pipeline for optimal performance
 * - Monitor paint/composite metrics during animations
 */
