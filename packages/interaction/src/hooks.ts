/**
 * @cycling/interaction/hooks - Unified Interaction Feedback Hooks
 *
 * This module provides unified coordination between haptic and accessibility feedback
 * systems for handling user interactions. It serves as the coordination layer that
 * synchronizes haptic vibrations, accessibility state changes, and overlay management.
 *
 * **Architecture Overview:**
 * ```
 *                    ┌─────────────────────────────────┐
 *                    │   User Interaction Event        │
 *                    │  (tap, press, keyboard, etc.)   │
 *                    └────────────┬────────────────────┘
 *                                 │
 *                    ┌────────────▼─────────────────┐
 *                    │ InteractionFeedbackManager    │
 *                    │  - Coordinates responses      │
 *                    │  - Checks device capabilities │
 *                    │  - Respects a11y preferences  │
 *                    └────────────┬─────────────────┘
 *                                 │
 *                 ┌───────────────┼───────────────┐
 *                 │               │               │
 *        ┌────────▼─────┐  ┌──────▼──────┐  ┌────▼────────────┐
 *        │ HapticVibrator│  │AccessibilityE│  │OverlayCoordinator
 *        │  .vibrate()   │  │ .emit state()│  │  .updateState() │
 *        │  .pattern()   │  │              │  │                 │
 *        └────────────────┘  └──────────────┘  └─────────────────┘
 *                │               │                    │
 *                └───────────────┼────────────────────┘
 *                                │
 *                    ┌───────────▼────────────┐
 *                    │  Event Bus (AppEvents) │
 *                    │  - haptic:trigger      │
 *                    │  - a11y:state:changed  │
 *                    │  - interaction:*       │
 *                    └────────────────────────┘
 * ```
 *
 * **Haptic & Accessibility Coordination Flow:**
 * 1. User triggers interaction (tap, press, keyboard)
 * 2. Hook receives event and checks device capabilities
 * 3. Haptic feedback triggered if:
 *    - Device supports vibration
 *    - Haptics not disabled by user
 *    - Reduced motion preference is respected
 * 4. Accessibility state updated:
 *    - Screen reader announcements queued
 *    - ARIA state changes emitted
 *    - Keyboard navigation state updated
 * 5. Events broadcast via event bus for observers
 *
 * **Mobile-First Design Notes:**
 * - All interactions assume touch-first input model
 * - Fallbacks for keyboard navigation and screen readers
 * - Battery awareness: respects reduced motion on low-power devices
 * - Graceful degradation when features unavailable
 * - Performance optimized for mobile devices with limited resources
 *
 * **Device Capability Detection:**
 * - Haptics: navigator.vibrate support detection
 * - Screen readers: Aria-live region support
 * - Keyboard: Traditional keyboard event handling
 * - Reduced motion: prefers-reduced-motion media query
 * - Motion profiles: Low-power mode awareness
 *
 * TODO: Motion System Integration
 * - Coordinate with CSS animations and transitions
 * - Sync haptic timing with animation durations
 * - Reduce animation intensity based on device capabilities
 * - Implement motion orchestration for complex interactions
 *
 * TODO: Navigation Alert Placeholders
 * - Screen reader announcements for route navigation
 * - Haptic guidance patterns for turn-by-turn navigation
 * - Accessibility-first navigation state management
 * - Integration with route guidance system
 *
 * TODO: Safety Warning Placeholders
 * - SOS button coordination with haptic feedback
 * - Critical alert handling for both haptic and screen readers
 * - Emergency state management and broadcasting
 * - Safety-critical event prioritization in event bus
 *
 * TODO: Performance Profiling
 * - Monitor interaction feedback latency (target: <100ms)
 * - Track haptic API response times
 * - Measure event bus throughput
 * - Profile accessibility state change overhead
 * - Battery impact analysis for extended motion
 */

import { TypedEventBus } from '@cycling/utils';
import { HapticVibrator, VIBRATION_PATTERNS, type VibrationType } from '@cycling/haptics';
import {
  type AccessibilityLabel,
  type OverlayA11y,
} from '@cycling/accessibility';
import {
  shouldReduceMotion,
  type MotionPreference,
} from '@cycling/accessibility';
import type {
  AppEvents,
  HapticFeedbackType,
  HapticIntensity,
  A11yState,
  InteractionTrigger,
} from '@cycling/types';

/**
 * InteractionFeedbackManager - Coordinates haptic and accessibility responses
 *
 * This class manages the unified feedback system for user interactions. It:
 * - Triggers haptic feedback based on device capabilities and preferences
 * - Manages accessibility state changes and announces them
 * - Coordinates overlay show/hide with event bus
 * - Respects reduced motion and other accessibility settings
 * - Emits interaction events for other systems to observe
 *
 * **Usage:**
 * ```typescript
 * const vibrator = HapticVibrator.getInstance();
 * const eventBus = new TypedEventBus<AppEvents>();
 * const manager = new InteractionFeedbackManager(vibrator, eventBus);
 *
 * // Trigger tap feedback
 * manager.triggerTapFeedback('button-id', tapLabel, 'light');
 *
 * // Show overlay with feedback
 * manager.triggerOverlayFeedback('minimap-overlay', 'show');
 * ```
 */
export class InteractionFeedbackManager {
  private vibrator: HapticVibrator;
  private eventBus: TypedEventBus<AppEvents>;
  private hapticsEnabled: boolean = true;
  private currentA11yState: Map<string, A11yState> = new Map();
  private overlayStates: Map<string, 'show' | 'hide'> = new Map();
  private screenReaderActive: boolean = false;
  private motionPreference: MotionPreference = null;

  /**
   * Create a new InteractionFeedbackManager
   * @param vibrator HapticVibrator instance for triggering haptic feedback
   * @param eventBus TypedEventBus instance for event broadcasting
   */
  constructor(vibrator: HapticVibrator, eventBus: TypedEventBus<AppEvents>) {
    this.vibrator = vibrator;
    this.eventBus = eventBus;
    this.detectDeviceCapabilities();
  }

  /**
   * Detect and initialize device capabilities
   * Checks for haptic support, screen reader, and accessibility settings
   */
  private detectDeviceCapabilities(): void {
    // Check haptic support
    this.hapticsEnabled = this.vibrator.isVibrationsSupported();

    // Check if screen reader is active
    // TODO: Implement robust screen reader detection (e.g., via ARIA live regions)
    this.screenReaderActive = this.checkScreenReaderActive();

    // Get motion preference
    this.motionPreference = shouldReduceMotion();

    // Emit ready event with capabilities
    this.eventBus.emit('interaction:haptic:ready', {
      hapticEnabled: this.hapticsEnabled,
      platformCapabilities: this.getCapabilities(),
    });

    this.eventBus.emit('interaction:a11y:ready', {
      screenReaderEnabled: this.screenReaderActive,
      keyboardNavEnabled: true,
    });
  }

  /**
   * Get list of supported platform capabilities
   * @returns Array of capability strings
   */
  private getCapabilities(): string[] {
    const capabilities: string[] = [];

    if (this.vibrator.isVibrationsSupported()) {
      capabilities.push('haptic:vibration');
    }

    if (this.screenReaderActive) {
      capabilities.push('a11y:screen-reader');
    }

    capabilities.push('a11y:keyboard-nav');

    if (this.motionPreference === false) {
      capabilities.push('motion:full');
    } else if (this.motionPreference === true) {
      capabilities.push('motion:reduced');
    }

    return capabilities;
  }

  /**
   * Check if screen reader is likely active
   * TODO: Implement robust detection via ARIA live regions or browser APIs
   * @returns true if screen reader appears to be active
   */
  private checkScreenReaderActive(): boolean {
    // Placeholder: In a real implementation, we'd use more sophisticated detection
    // such as checking for ARIA live regions, testing keyboard event patterns, etc.
    try {
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        // Simple heuristic: check if there's an aria-live region present
        const ariaLiveElements = document.querySelectorAll('[aria-live]');
        return ariaLiveElements.length > 0;
      }
    } catch {
      // Silently fail if we can't access document
    }
    return false;
  }

  /**
   * Determine which haptic pattern to use based on feedback type and intensity
   * @param feedbackType Type of haptic feedback
   * @param intensity Intensity level (light, medium, strong)
   * @returns Vibration pattern or single duration
   */
  private getHapticPattern(
    feedbackType: HapticFeedbackType,
    intensity: HapticIntensity = 'medium'
  ): VibrationType {
    if (this.motionPreference === true) {
      // User prefers reduced motion: use minimal vibration
      return 10; // Very brief tap
    }

    // Map feedback type to vibration pattern
    switch (feedbackType) {
      case 'tap':
        switch (intensity) {
          case 'light':
            return VIBRATION_PATTERNS.lightTap;
          case 'medium':
            return VIBRATION_PATTERNS.mediumBuzz;
          case 'strong':
            return VIBRATION_PATTERNS.strongShake;
        }
        break;

      case 'success':
        return VIBRATION_PATTERNS.success;

      case 'warning':
        return VIBRATION_PATTERNS.warning;

      case 'error':
        return VIBRATION_PATTERNS.error;

      case 'minimap:expand':
        return intensity === 'light'
          ? VIBRATION_PATTERNS.lightTap
          : VIBRATION_PATTERNS.mediumBuzz;

      case 'minimap:collapse':
        return intensity === 'light'
          ? VIBRATION_PATTERNS.lightTap
          : VIBRATION_PATTERNS.doubleTap;

      case 'mode:switch':
        return VIBRATION_PATTERNS.doubleTap;

      case 'recording:start':
        return VIBRATION_PATTERNS.success;

      case 'recording:stop':
        return VIBRATION_PATTERNS.warning;

      case 'custom':
        // Use light tap as default for custom
        return VIBRATION_PATTERNS.lightTap;
    }

    return VIBRATION_PATTERNS.lightTap;
  }

  /**
   * Trigger haptic feedback for a specific interaction
   * Respects device capabilities and user preferences
   *
   * @param feedbackType Type of haptic feedback
   * @param intensity Intensity level
   * @param customPattern Optional custom vibration pattern
   * @returns true if haptic was triggered, false otherwise
   */
  private triggerHaptic(
    feedbackType: HapticFeedbackType,
    intensity: HapticIntensity = 'medium',
    customPattern?: number[]
  ): boolean {
    // Edge case: haptics disabled or not supported
    if (!this.hapticsEnabled) {
      return false;
    }

    // Edge case: reduced motion preference
    if (this.motionPreference === true) {
      // Still provide minimal feedback
      this.vibrator.vibrate(10);
      return true;
    }

    // Use custom pattern if provided
    if (customPattern) {
      return this.vibrator.pattern(customPattern);
    }

    // Get pattern based on feedback type and intensity
    const pattern = this.getHapticPattern(feedbackType, intensity);

    // Execute vibration
    if (typeof pattern === 'number') {
      return this.vibrator.vibrate(pattern);
    } else {
      return this.vibrator.pattern(pattern);
    }
  }

  /**
   * Update accessibility state for a component and emit event
   * @param component Component identifier
   * @param state New accessibility state
   * @param message Optional message for screen readers
   */
  private updateA11yState(
    component: string,
    state: A11yState,
    message?: string
  ): void {
    const previousState = this.currentA11yState.get(component);

    // Only emit if state changed
    if (previousState !== state) {
      this.currentA11yState.set(component, state);

      this.eventBus.emit('a11y:state:changed', {
        component,
        state,
        message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Trigger feedback for tap interactions
   * Coordinates haptic vibration with accessibility announcements
   *
   * **Interaction Flow:**
   * 1. Haptic feedback triggered (if supported)
   * 2. Accessibility state set to 'active'
   * 3. Interaction event emitted
   * 4. State returns to 'idle'
   *
   * @param targetId Unique identifier for the tapped element
   * @param a11yLabel Accessibility label with ARIA information
   * @param hapticType Type of haptic feedback
   * @param intensity Haptic intensity level
   */
  public triggerTapFeedback(
    targetId: string,
    a11yLabel: AccessibilityLabel,
    hapticType: HapticFeedbackType = 'tap',
    intensity: HapticIntensity = 'light'
  ): void {
    // Trigger haptic feedback
    this.triggerHaptic(hapticType, intensity);

    // Update accessibility state
    this.updateA11yState(targetId, 'active', `${a11yLabel.ariaLabel} activated`);

    // Emit interaction event
    this.eventBus.emit('interaction:triggered', {
      trigger: 'user:tap',
      targetId,
      timestamp: new Date().toISOString(),
    });

    // Reset state after brief delay
    setTimeout(() => {
      this.updateA11yState(targetId, 'idle');
    }, 50);
  }

  /**
   * Trigger feedback for long press interactions
   * Provides stronger haptic feedback than tap for extended presses
   *
   * **Interaction Flow:**
   * 1. Medium/strong haptic feedback triggered
   * 2. Accessibility state set to 'active' with press message
   * 3. Press interaction event emitted
   *
   * @param targetId Unique identifier for the pressed element
   * @param a11yLabel Optional accessibility label
   */
  public triggerPressFeedback(
    targetId: string,
    a11yLabel?: AccessibilityLabel
  ): void {
    // Trigger stronger haptic feedback for press
    this.triggerHaptic('tap', 'strong');

    // Update accessibility state with press indication
    const message = a11yLabel
      ? `${a11yLabel.ariaLabel} pressed`
      : `${targetId} pressed`;
    this.updateA11yState(targetId, 'active', message);

    // Emit interaction event
    this.eventBus.emit('interaction:triggered', {
      trigger: 'user:press',
      targetId,
      timestamp: new Date().toISOString(),
    });

    // Note: Unlike tap, press doesn't reset immediately
    // Reset is called by caller when press ends (e.g., on pointerup)
  }

  /**
   * Reset press state when press ends
   * @param targetId Identifier of the element being depressed
   */
  public endPressFeedback(targetId: string): void {
    this.updateA11yState(targetId, 'idle');
  }

  /**
   * Trigger feedback for keyboard navigation
   * Provides distinctive haptic feedback for keyboard events
   *
   * **Keyboard Event Types:**
   * - Arrow keys: Light tap feedback
   * - Enter/Space: Medium feedback (activation)
   * - Escape: Warning feedback (cancel/close)
   * - Tab: Light tap (navigation)
   *
   * **Accessibility Notes:**
   * - Screen readers announce key presses via ARIA
   * - Haptic provides tactile confirmation
   * - State tracking for keyboard focus state
   *
   * @param key Keyboard key or key combination
   * @param targetId Target element ID for keyboard navigation
   */
  public triggerKeyboardFeedback(key: string, targetId: string): void {
    let hapticType: HapticFeedbackType = 'tap';
    let intensity: HapticIntensity = 'light';

    // Determine haptic feedback based on key
    if (key === 'Enter' || key === ' ') {
      hapticType = 'tap';
      intensity = 'medium';
    } else if (key === 'Escape') {
      hapticType = 'warning';
      intensity = 'medium';
    } else if (
      key === 'ArrowUp' ||
      key === 'ArrowDown' ||
      key === 'ArrowLeft' ||
      key === 'ArrowRight'
    ) {
      hapticType = 'tap';
      intensity = 'light';
    } else if (key === 'Tab') {
      hapticType = 'tap';
      intensity = 'light';
    }

    // Trigger haptic feedback
    this.triggerHaptic(hapticType, intensity);

    // Update accessibility state
    this.updateA11yState(
      targetId,
      'active',
      `Keyboard navigation: ${key} on ${targetId}`
    );

    // Emit keyboard interaction event
    this.eventBus.emit('interaction:triggered', {
      trigger: 'user:keyboard',
      targetId,
      timestamp: new Date().toISOString(),
    });

    // Reset state after brief delay
    setTimeout(() => {
      this.updateA11yState(targetId, 'idle');
    }, 30);
  }

  /**
   * Trigger feedback for overlay show/hide actions
   * Coordinates overlay state with haptic and accessibility feedback
   *
   * **Overlay Coordination:**
   * - Show: Medium feedback + focus trap + screen reader announcement
   * - Hide: Light feedback + focus restore + blur announcement
   * - Update: Brief feedback + state change notification
   *
   * **Accessibility Flow:**
   * 1. Overlay aria-hidden updated
   * 2. Focus management applied (trap/restore)
   * 3. Screen reader announces overlay change
   * 4. Haptic feedback triggered
   * 5. Events emitted for observers
   *
   * TODO: Enhanced focus management with portal detection
   * TODO: Keyboard trap implementation for modal overlays
   * TODO: Focus restoration on overlay close
   *
   * @param overlayId Unique identifier for the overlay
   * @param action Action to perform: show, hide, or update
   * @param a11yMetadata Optional overlay accessibility metadata
   */
  public triggerOverlayFeedback(
    overlayId: string,
    action: 'show' | 'hide' | 'update',
    a11yMetadata?: OverlayA11y
  ): void {
    // Update overlay state tracking
    this.overlayStates.set(overlayId, action === 'show' ? 'show' : 'hide');

    // Determine haptic feedback and state
    let hapticType: HapticFeedbackType = 'tap';
    let a11yState: A11yState = 'idle';
    let message = '';

    switch (action) {
      case 'show':
        hapticType = 'tap';
        a11yState = 'active';
        message = `${a11yMetadata?.label.ariaLabel || overlayId} shown`;
        break;

      case 'hide':
        hapticType = 'tap';
        a11yState = 'idle';
        message = `${a11yMetadata?.label.ariaLabel || overlayId} hidden`;

        // Emit blur event for focus restoration
        this.eventBus.emit('a11y:overlay:blurred', {
          overlayId,
          blurredAt: new Date().toISOString(),
        });
        break;

      case 'update':
        hapticType = 'tap';
        a11yState = 'active';
        message = `${a11yMetadata?.label.ariaLabel || overlayId} updated`;
        break;
    }

    // Trigger haptic feedback
    this.triggerHaptic(hapticType, action === 'show' ? 'medium' : 'light');

    // Update accessibility state
    this.updateA11yState(overlayId, a11yState, message);

    // Emit overlay response event
    this.eventBus.emit('interaction:overlay:respond', {
      overlayId,
      action,
      respondedAt: new Date().toISOString(),
    });

    // Emit focused event for show action
    if (action === 'show') {
      this.eventBus.emit('a11y:overlay:focused', {
        overlayId,
        focusedAt: new Date().toISOString(),
      });

      // TODO: Implement focus trap if metadata specifies trapFocus
      if (a11yMetadata?.focusManagement.trapFocus) {
        this.eventBus.emit('a11y:keyboard:trapped', {
          overlayId,
          trapActivated: new Date().toISOString(),
        });
      }
    }

    // TODO: Implement focus restoration if metadata specifies restoreFocus
    if (action === 'hide' && a11yMetadata?.focusManagement.restoreFocus) {
      // Focus restoration would happen here
    }
  }

  /**
   * Enable or disable haptic feedback globally
   * @param enabled true to enable haptics, false to disable
   */
  public setHapticsEnabled(enabled: boolean): void {
    this.hapticsEnabled = enabled && this.vibrator.isVibrationsSupported();
  }

  /**
   * Check if haptic feedback is currently enabled
   * @returns true if haptics are enabled and supported
   */
  public isHapticsEnabled(): boolean {
    return this.hapticsEnabled;
  }

  /**
   * Get current accessibility state for a component
   * @param component Component identifier
   * @returns Current accessibility state or 'idle' if unknown
   */
  public getA11yState(component: string): A11yState {
    return this.currentA11yState.get(component) ?? 'idle';
  }

  /**
   * Get current overlay state
   * @param overlayId Overlay identifier
   * @returns 'show' if visible, 'hide' if hidden, or undefined if unknown
   */
  public getOverlayState(overlayId: string): 'show' | 'hide' | undefined {
    return this.overlayStates.get(overlayId);
  }

  /**
   * TODO: Motion System Integration
   * Synchronize interaction feedback with CSS animations
   * - Use motion profiles to adjust animation timing
   * - Coordinate haptic duration with animation length
   * - Reduce animation intensity for reduced motion preference
   */
  public getMotionProfile() {
    return {
      shouldReduce: this.motionPreference === true,
      preference: this.motionPreference,
    };
  }

  /**
   * Clean up resources
   * Call this when the manager is no longer needed
   */
  public destroy(): void {
    this.currentA11yState.clear();
    this.overlayStates.clear();
  }
}

/**
 * Hook: useTapFeedback - Handle tap interactions with unified feedback
 *
 * Triggers both haptic and accessibility feedback for tap events.
 * Respects device capabilities and user preferences.
 *
 * **Usage:**
 * ```typescript
 * const tapFeedback = useTapFeedback(targetId, label, 'light');
 *
 * // In event handler:
 * element.addEventListener('pointerdown', tapFeedback);
 * ```
 *
 * **Mobile-First Design:**
 * - Uses pointer events for touch compatibility
 * - Light haptic feedback for quick confirmation
 * - Accessibility state managed automatically
 *
 * **Edge Cases Handled:**
 * - Haptics disabled: Still updates accessibility state
 * - Screen reader active: Verbose announcements
 * - Reduced motion: Minimal haptic feedback
 * - Device capability detection: Graceful degradation
 *
 * @param targetId Unique identifier for tapped element
 * @param a11yLabel Accessibility label for screen readers
 * @param hapticType Type of haptic feedback (default: 'tap')
 * @param manager Optional InteractionFeedbackManager instance
 * @returns Event handler function for tap events
 */
export function useTapFeedback(
  targetId: string,
  a11yLabel: AccessibilityLabel,
  hapticType: HapticFeedbackType = 'tap',
  manager?: InteractionFeedbackManager
): () => void {
  // Lazy initialization of manager if not provided
  if (!manager) {
    const vibrator = HapticVibrator.getInstance();
    const eventBus = new TypedEventBus<AppEvents>();
    manager = new InteractionFeedbackManager(vibrator, eventBus);
  }

  return () => {
    manager!.triggerTapFeedback(targetId, a11yLabel, hapticType, 'light');
  };
}

/**
 * Hook: usePressFeedback - Handle long press interactions
 *
 * Triggers stronger haptic feedback for sustained press interactions.
 * Useful for context menus, actions, and secondary interactions.
 *
 * **Usage:**
 * ```typescript
 * const { onPress, onPressEnd } = usePressFeedback(targetId, label);
 *
 * // In event handlers:
 * element.addEventListener('pointerdown', onPress);
 * element.addEventListener('pointerup', onPressEnd);
 * element.addEventListener('pointercancel', onPressEnd);
 * ```
 *
 * **Accessibility:**
 * - Announces press action with target name
 * - Maintains active state during press
 * - Screen readers notified on press end
 *
 * **Performance:**
 * - Strong haptic feedback only at press start
 * - Minimal overhead during press hold
 * - Efficient state tracking
 *
 * @param targetId Unique identifier for pressed element
 * @param a11yLabel Accessibility label (optional)
 * @param manager Optional InteractionFeedbackManager instance
 * @returns Object with onPress and onPressEnd handlers
 */
export function usePressFeedback(
  targetId: string,
  a11yLabel?: AccessibilityLabel,
  manager?: InteractionFeedbackManager
): { onPress: () => void; onPressEnd: () => void } {
  // Lazy initialization of manager if not provided
  if (!manager) {
    const vibrator = HapticVibrator.getInstance();
    const eventBus = new TypedEventBus<AppEvents>();
    manager = new InteractionFeedbackManager(vibrator, eventBus);
  }

  return {
    onPress: () => {
      manager!.triggerPressFeedback(targetId, a11yLabel);
    },
    onPressEnd: () => {
      manager!.endPressFeedback(targetId);
    },
  };
}

/**
 * Hook: useKeyboardFeedback - Handle keyboard navigation
 *
 * Provides haptic and accessibility feedback for keyboard events.
 * Supports arrow keys, Enter, Escape, Tab, and custom shortcuts.
 *
 * **Usage:**
 * ```typescript
 * const keyboardFeedback = useKeyboardFeedback(targetId);
 *
 * // In event handler:
 * element.addEventListener('keydown', (e) => {
 *   keyboardFeedback(e.key);
 * });
 * ```
 *
 * **Keyboard Support:**
 * - Arrow keys: Light tap (navigation)
 * - Enter/Space: Medium tap (activation)
 * - Escape: Warning feedback (cancel)
 * - Tab: Light tap (focus change)
 * - Custom shortcuts: Customizable via key parameter
 *
 * **Screen Reader Integration:**
 * - Announces keyboard shortcuts
 * - State transitions broadcast
 * - Navigation flow communicated
 *
 * TODO: Navigation Alert Implementation
 * - Haptic patterns for turn-by-turn directions
 * - Screen reader route guidance
 * - GPS-aware navigation alerts
 *
 * @param targetId Target element ID for keyboard navigation
 * @param manager Optional InteractionFeedbackManager instance
 * @returns Handler function accepting key string
 */
export function useKeyboardFeedback(
  targetId: string,
  manager?: InteractionFeedbackManager
): (key: string) => void {
  // Lazy initialization of manager if not provided
  if (!manager) {
    const vibrator = HapticVibrator.getInstance();
    const eventBus = new TypedEventBus<AppEvents>();
    manager = new InteractionFeedbackManager(vibrator, eventBus);
  }

  return (key: string) => {
    manager!.triggerKeyboardFeedback(key, targetId);
  };
}

/**
 * Hook: useOverlayFeedback - Coordinate overlay show/hide with feedback
 *
 * Manages overlay visibility with synchronized haptic and accessibility feedback.
 * Handles focus management, state tracking, and event broadcasting.
 *
 * **Usage:**
 * ```typescript
 * const overlayFeedback = useOverlayFeedback(overlayId, a11yMetadata);
 *
 * // Open overlay:
 * overlayFeedback.show();
 *
 * // Close overlay:
 * overlayFeedback.hide();
 * ```
 *
 * **Focus Management:**
 * - Focus trap for modal overlays (if configured)
 * - Initial focus setting (configurable)
 * - Focus restoration on close
 * - Keyboard navigation within overlay
 *
 * **Accessibility Flow:**
 * 1. Overlay aria-hidden updated
 * 2. Focus management applied
 * 3. Screen reader announcement
 * 4. Haptic feedback triggered
 * 5. Overlay state broadcast
 *
 * **Mobile Considerations:**
 * - Touch-friendly overlay sizing
 * - Haptic feedback for visual feedback
 * - Accessible close mechanisms
 * - Soft keyboard awareness
 *
 * TODO: Safety Warning Integration
 * - SOS overlay with urgent haptic patterns
 * - Emergency contact display
 * - Critical alert state handling
 *
 * @param overlayId Unique identifier for overlay
 * @param a11yMetadata Accessibility metadata with focus management
 * @param manager Optional InteractionFeedbackManager instance
 * @returns Object with show and hide methods
 */
export function useOverlayFeedback(
  overlayId: string,
  a11yMetadata?: OverlayA11y,
  manager?: InteractionFeedbackManager
): { show: () => void; hide: () => void; update: () => void } {
  // Lazy initialization of manager if not provided
  if (!manager) {
    const vibrator = HapticVibrator.getInstance();
    const eventBus = new TypedEventBus<AppEvents>();
    manager = new InteractionFeedbackManager(vibrator, eventBus);
  }

  return {
    show: () => {
      manager!.triggerOverlayFeedback(overlayId, 'show', a11yMetadata);
    },
    hide: () => {
      manager!.triggerOverlayFeedback(overlayId, 'hide', a11yMetadata);
    },
    update: () => {
      manager!.triggerOverlayFeedback(overlayId, 'update', a11yMetadata);
    },
  };
}

export type { HapticFeedbackType, A11yState, InteractionTrigger };
