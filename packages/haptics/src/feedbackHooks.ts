import { HapticVibrator, VIBRATION_PATTERNS, VIBRATION_TIMING } from './vibration';
import { TypedEventBus } from '@cycling/utils';
import { AppEvents } from '@cycling/types';

/**
 * Haptic Feedback Hooks System
 *
 * Provides interaction-specific haptic feedback emitters that coordinate between:
 * 1. Haptic vibration triggers (via HapticVibrator)
 * 2. App-wide event bus (for UI state coordination)
 * 3. Interaction lifecycle management (start→complete/cancel)
 *
 * Mobile-First Design:
 * - Patterns are optimized for touch interactions
 * - Supports fallback for devices without vibration API
 * - Respects low-power mode detection
 * - Accessibility-aware: doesn't interfere with screen readers
 *
 * Event Emission Pattern:
 * Each feedback emitter follows this lifecycle:
 * 1. Emit haptic trigger to vibrate device
 * 2. Emit corresponding app event with timestamp
 * 3. Allow consumers to track completion or cancellation
 *
 * TODO: Recording feedback visualizations and progress indication
 * TODO: Platform-specific haptics (iOS Haptic Engine, Android VibrationEffect)
 * TODO: Wearable device coordination (watch notifications, fitness tracker integration)
 * TODO: Safety feedback system with intensity adaptation and battery awareness
 */

/**
 * Creates a minimap expand feedback emitter
 *
 * Emits:
 * - Light double-tap haptic to indicate UI expansion
 * - haptic:minimap:expanded event with timestamp
 *
 * Use case:
 * When user taps to expand the minimap overlay, providing haptic confirmation
 * of the interaction and state change.
 *
 * @param vibrator HapticVibrator instance for haptic triggers
 * @param eventBus TypedEventBus for app-wide event coordination
 * @returns Feedback emitter function
 */
export function createMinimapExpandFeedback(
  vibrator: HapticVibrator,
  eventBus: TypedEventBus<AppEvents>
) {
  return {
    trigger: () => {
      // Double-tap pattern for expansion feedback
      if (vibrator.isVibrationsSupported()) {
        vibrator.pattern(VIBRATION_PATTERNS.doubleTap);
      }

      // Emit app event for UI coordination
      eventBus.emit('haptic:minimap:expanded', {
        expandedAt: new Date().toISOString(),
      });
    },

    /**
     * Check if haptic is currently playing
     */
    isActive: () => vibrator.isVibrating(),

    /**
     * Cancel ongoing feedback
     */
    cancel: () => {
      vibrator.cancel();
    },
  };
}

/**
 * Creates a minimap collapse feedback emitter
 *
 * Emits:
 * - Light single-tap haptic to indicate UI collapse
 * - haptic:minimap:collapsed event with timestamp
 *
 * Use case:
 * When user taps to collapse the minimap overlay, providing haptic confirmation
 * of the interaction and state change.
 *
 * @param vibrator HapticVibrator instance for haptic triggers
 * @param eventBus TypedEventBus for app-wide event coordination
 * @returns Feedback emitter function
 */
export function createMinimapCollapseFeedback(
  vibrator: HapticVibrator,
  eventBus: TypedEventBus<AppEvents>
) {
  return {
    trigger: () => {
      // Single tap pattern for collapse feedback
      if (vibrator.isVibrationsSupported()) {
        vibrator.vibrate(VIBRATION_TIMING.short);
      }

      // Emit app event for UI coordination
      eventBus.emit('haptic:minimap:collapsed', {
        collapsedAt: new Date().toISOString(),
      });
    },

    /**
     * Check if haptic is currently playing
     */
    isActive: () => vibrator.isVibrating(),

    /**
     * Cancel ongoing feedback
     */
    cancel: () => {
      vibrator.cancel();
    },
  };
}

/**
 * Creates a mode switch feedback emitter
 *
 * Emits:
 * - Medium buzz pattern to indicate significant state change
 * - haptic:mode:switched event with new mode and timestamp
 *
 * Use case:
 * When user switches between ride modes (e.g., normal → performance → eco),
 * providing haptic confirmation of the mode change with more prominent feedback
 * than UI toggles.
 *
 * @param vibrator HapticVibrator instance for haptic triggers
 * @param eventBus TypedEventBus for app-wide event coordination
 * @returns Feedback emitter function with newMode parameter
 */
export function createModeSwitchFeedback(
  vibrator: HapticVibrator,
  eventBus: TypedEventBus<AppEvents>
) {
  return {
    trigger: (newMode: string) => {
      // Medium buzz for mode switch (more prominent than UI interactions)
      if (vibrator.isVibrationsSupported()) {
        vibrator.pattern(VIBRATION_PATTERNS.mediumBuzz);
      }

      // Emit app event with new mode for UI coordination
      eventBus.emit('haptic:mode:switched', {
        newMode,
        switchedAt: new Date().toISOString(),
      });
    },

    /**
     * Check if haptic is currently playing
     */
    isActive: () => vibrator.isVibrating(),

    /**
     * Cancel ongoing feedback
     */
    cancel: () => {
      vibrator.cancel();
    },
  };
}

/**
 * Creates a recording start feedback emitter
 *
 * Emits:
 * - Success pattern (ascending pulses) to indicate recording initiated
 * - haptic:recording:started event with timestamp
 *
 * Use case:
 * When user starts a new ride recording, providing distinctive haptic feedback
 * that confirms the critical action of starting data collection. Uses ascending
 * pulse pattern to convey "beginning" semantics.
 *
 * Lifecycle:
 * - Start: User taps "Start Recording"
 * - Feedback: Success pattern plays + event emitted
 * - Duration: ~150ms total (feel of action completion)
 *
 * TODO: Add progress indication for recording duration
 * TODO: Integrate with recording UI state (pulse during active recording)
 * TODO: Coordinate with safety system to disable during critical moments
 *
 * @param vibrator HapticVibrator instance for haptic triggers
 * @param eventBus TypedEventBus for app-wide event coordination
 * @returns Feedback emitter function
 */
export function createRecordingStartFeedback(
  vibrator: HapticVibrator,
  eventBus: TypedEventBus<AppEvents>
) {
  return {
    trigger: () => {
      // Success pattern for recording start (ascending pulses)
      if (vibrator.isVibrationsSupported()) {
        vibrator.pattern(VIBRATION_PATTERNS.success);
      }

      // Emit app event for UI coordination
      eventBus.emit('haptic:recording:started', {
        recordingAt: new Date().toISOString(),
      });

      // Also emit generic haptic:trigger for tracking
      eventBus.emit('haptic:trigger', {
        type: 'recording:start',
        intensity: 'medium',
        duration: 150,
      });
    },

    /**
     * Check if haptic is currently playing
     */
    isActive: () => vibrator.isVibrating(),

    /**
     * Cancel ongoing feedback
     */
    cancel: () => {
      vibrator.cancel();
    },
  };
}

/**
 * Creates a recording stop feedback emitter
 *
 * Emits:
 * - Error pattern (rapid double pulse) to indicate recording ended
 * - haptic:recording:stopped event with timestamp
 *
 * Use case:
 * When user stops a ride recording, providing distinctive haptic feedback
 * that confirms the critical action of ending data collection. Uses error/alert
 * pattern to convey "stopping" semantics and draw attention.
 *
 * Lifecycle:
 * - Stop: User taps "Stop Recording" or app auto-stops
 * - Feedback: Error pattern plays + event emitted
 * - Duration: ~350ms total (feel of completion/finality)
 *
 * TODO: Add progress visualization during recording finalization
 * TODO: Emit data sync status feedback after recording stops
 * TODO: Coordinate with analytics to capture stop feedback latency
 *
 * @param vibrator HapticVibrator instance for haptic triggers
 * @param eventBus TypedEventBus for app-wide event coordination
 * @returns Feedback emitter function
 */
export function createRecordingStopFeedback(
  vibrator: HapticVibrator,
  eventBus: TypedEventBus<AppEvents>
) {
  return {
    trigger: () => {
      // Error pattern for recording stop (rapid double pulse)
      if (vibrator.isVibrationsSupported()) {
        vibrator.pattern(VIBRATION_PATTERNS.error);
      }

      // Emit app event for UI coordination
      eventBus.emit('haptic:recording:stopped', {
        stoppedAt: new Date().toISOString(),
      });

      // Also emit generic haptic:trigger for tracking
      eventBus.emit('haptic:trigger', {
        type: 'recording:stop',
        intensity: 'medium',
        duration: 350,
      });
    },

    /**
     * Check if haptic is currently playing
     */
    isActive: () => vibrator.isVibrating(),

    /**
     * Cancel ongoing feedback
     */
    cancel: () => {
      vibrator.cancel();
    },
  };
}

/**
 * Haptic Feedback System
 *
 * Central coordinator for all haptic feedback in the application.
 * Aggregates all feedback emitters and manages their lifecycle.
 *
 * Usage:
 * ```typescript
 * const system = createHapticFeedbackSystem(vibrator, eventBus);
 *
 * // Expand minimap with haptic feedback
 * system.minimap.expand.trigger();
 *
 * // Switch mode with haptic feedback
 * system.mode.switch.trigger('performance');
 *
 * // Start recording with haptic feedback
 * system.recording.start.trigger();
 * ```
 *
 * Accessibility & Mobile:
 * - All feedback gracefully degrades on devices without vibration API
 * - Events are always emitted regardless of haptic support
 * - Screen readers can consume events independently of haptics
 *
 * TODO: Add composition patterns for complex interaction sequences
 * TODO: Implement feedback intensity adaptation based on battery level
 * TODO: Add haptic feedback disabled mode (e.g., for accessibility preferences)
 * TODO: Support for custom feedback patterns via factory registration
 *
 * @param vibrator HapticVibrator instance for haptic triggers
 * @param eventBus TypedEventBus for app-wide event coordination
 * @returns Object containing all feedback emitters organized by interaction type
 */
export function createHapticFeedbackSystem(
  vibrator: HapticVibrator,
  eventBus: TypedEventBus<AppEvents>
) {
  return {
    minimap: {
      expand: createMinimapExpandFeedback(vibrator, eventBus),
      collapse: createMinimapCollapseFeedback(vibrator, eventBus),
    },
    mode: {
      switch: createModeSwitchFeedback(vibrator, eventBus),
    },
    recording: {
      start: createRecordingStartFeedback(vibrator, eventBus),
      stop: createRecordingStopFeedback(vibrator, eventBus),
    },

    /**
     * Check if any feedback is currently active
     */
    isActive: () => vibrator.isVibrating(),

    /**
     * Cancel all active feedback
     */
    cancelAll: () => {
      vibrator.cancel();
    },

    /**
     * Check if haptic feedback is supported on this device
     */
    isSupported: () => vibrator.isVibrationsSupported(),

    /**
     * Get current vibrator state for debugging/monitoring
     */
    getVibratorState: () => vibrator.getState(),
  };
}

/**
 * Type definition for the Haptic Feedback System
 * Useful for type checking and IDE autocompletion
 */
export type HapticFeedbackSystem = ReturnType<typeof createHapticFeedbackSystem>;
