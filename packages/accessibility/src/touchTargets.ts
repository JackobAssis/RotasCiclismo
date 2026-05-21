/**
 * @cycling/accessibility/touchTargets - Touch-Safe Interaction Target Guidelines
 *
 * This module provides utilities for ensuring touch target sizes and spacing meet
 * mobile accessibility standards. It implements W3C WCAG 2.1 Level AAA guidelines
 * and mobile platform best practices for touchscreen interactions.
 *
 * Touch Target Standards:
 * =======================
 * - MINIMUM_TOUCH_TARGET_SIZE (44px): W3C WCAG 2.1 Level AAA minimum
 * - RECOMMENDED_TOUCH_TARGET_SIZE (56px): iOS Human Interface Guidelines
 * - MINIMUM_SPACING_BETWEEN_TARGETS (8px): Prevents fat-finger errors
 *
 * Mobile HCI Best Practices:
 * ==========================
 * - Adults have an average fingertip size of 8-10mm (32-40px on 96 DPI)
 * - People with reduced dexterity require larger targets (44px minimum)
 * - Thumb-reachable zones vary by device size and grip orientation
 * - Landscape vs portrait affect reachable interaction areas
 * - One-handed use reduces accessible target zones significantly
 *
 * Platform Guidelines:
 * ====================
 * - iOS HIG: Minimum 44x44 pt (44 logical pixels), recommends 56x56 pt for frequent interactions
 * - Android Material: Minimum 48x48 dp (device-independent pixels)
 * - Web Content: WCAG AAA Level requires 44x44 CSS pixels
 * - Haptic Cycling: Extra padding for feedback zones during intense navigation
 *
 * Architecture Notes:
 * - TouchTargetValidator uses composition for extensibility
 * - Sizing calculations account for CSS transforms and parent containers
 * - Spacing validation checks both direct neighbors and overlapping zones
 * - Helper functions are pure and side-effect free for easy testing
 */

/**
 * W3C WCAG 2.1 Level AAA standard minimum touch target size (in CSS pixels)
 * This size accommodates users with reduced dexterity and limited fine motor control
 *
 * @see https://www.w3.org/WAI/WCAG21/Understanding/target-size-enhanced.html
 */
export const MINIMUM_TOUCH_TARGET_SIZE = 44;

/**
 * iOS Human Interface Guidelines recommended touch target size (in CSS pixels)
 * Apple recommends 56x56pt for frequently accessed controls and primary actions
 *
 * @see https://developer.apple.com/design/human-interface-guidelines/components/controls/buttons
 */
export const RECOMMENDED_TOUCH_TARGET_SIZE = 56;

/**
 * Minimum safe spacing between adjacent touch targets (in CSS pixels)
 * Prevents accidental activation of adjacent controls due to finger width
 *
 * @see https://www.nngroup.com/articles/touch-target-size/
 */
export const MINIMUM_SPACING_BETWEEN_TARGETS = 8;

/**
 * TouchTargetMetrics describes the computed size and position of a touch target
 */
export interface TouchTargetMetrics {
  /** Width of the touch target in pixels */
  width: number;
  /** Height of the touch target in pixels */
  height: number;
  /** Distance from viewport top in pixels */
  top: number;
  /** Distance from viewport left in pixels */
  left: number;
  /** Distance from viewport bottom in pixels */
  bottom: number;
  /** Distance from viewport right in pixels */
  right: number;
  /** Whether target is visible within current viewport */
  isVisible: boolean;
}

/**
 * TouchTargetValidationResult describes validation outcome for a target
 */
export interface TouchTargetValidationResult {
  /** Whether the target meets minimum size requirements */
  isValid: boolean;
  /** Current width of the target */
  currentWidth: number;
  /** Current height of the target */
  currentHeight: number;
  /** Recommended width if below minimum */
  recommendedWidth?: number;
  /** Recommended height if below minimum */
  recommendedHeight?: number;
  /** Reason for validation failure (if any) */
  reason?: string;
}

/**
 * SpacingValidationResult describes validation outcome for target spacing
 */
export interface SpacingValidationResult {
  /** Whether targets meet minimum spacing requirements */
  isValid: boolean;
  /** Actual distance between target centers (in pixels) */
  distanceBetweenCenters: number;
  /** Actual distance between target edges (in pixels) */
  distanceBetweenEdges: number;
  /** Minimum required distance between edges */
  minimumRequiredDistance: number;
  /** Whether targets overlap (distance < 0) */
  isOverlapping: boolean;
}

/**
 * TouchableAreaOptions configure touch-safe wrapper creation
 */
export interface TouchableAreaOptions {
  /** Minimum size to enforce (defaults to MINIMUM_TOUCH_TARGET_SIZE) */
  minSize?: number;
  /** Whether to preserve original element dimensions if already adequate */
  preserveExisting?: boolean;
  /** Additional padding to add around the element (in pixels) */
  padding?: number;
  /** CSS class to apply to the wrapper */
  wrapperClass?: string;
  /** Whether to use flexbox centering for the content */
  centerContent?: boolean;
}

/**
 * TouchTargetValidator validates touch target sizes and spacing against
 * mobile accessibility standards.
 *
 * Responsibilities:
 * - Verify individual targets meet minimum size requirements
 * - Validate spacing between adjacent targets
 * - Recommend corrected sizes for undersized targets
 * - Account for CSS transforms and layout contexts
 *
 * @example
 * ```ts
 * const validator = new TouchTargetValidator();
 *
 * // Validate a single button
 * const result = validator.validate(document.querySelector('button'));
 * if (!result.isValid) {
 *   console.warn(`Button too small: ${result.reason}`);
 *   console.log(`Recommended size: ${result.recommendedWidth}x${result.recommendedHeight}`);
 * }
 *
 * // Validate spacing between two buttons
 * const spacing = validator.validateSpacing(btn1, btn2);
 * if (!spacing.isValid) {
 *   console.warn(`Buttons too close: ${spacing.distanceBetweenEdges}px`);
 * }
 * ```
 */
export class TouchTargetValidator {
  /**
   * Validate that an element meets touch target size requirements
   *
   * Checks if the element's bounding box meets WCAG AAA standards.
   * Returns recommended size if target is too small.
   *
   * @param element - HTMLElement to validate
   * @returns Validation result with current size and recommendations
   *
   * @example
   * ```ts
   * const validator = new TouchTargetValidator();
   * const button = document.querySelector('button');
   * const result = validator.validate(button);
   *
   * if (!result.isValid) {
   *   console.log(`Current: ${result.currentWidth}x${result.currentHeight}`);
   *   console.log(`Recommended: ${result.recommendedWidth}x${result.recommendedHeight}`);
   * }
   * ```
   */
  validate(element: HTMLElement): TouchTargetValidationResult {
    const rect = element.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const isValid =
      width >= MINIMUM_TOUCH_TARGET_SIZE &&
      height >= MINIMUM_TOUCH_TARGET_SIZE;

    const result: TouchTargetValidationResult = {
      isValid,
      currentWidth: width,
      currentHeight: height,
    };

    if (!isValid) {
      result.recommendedWidth = Math.max(
        width,
        MINIMUM_TOUCH_TARGET_SIZE
      );
      result.recommendedHeight = Math.max(
        height,
        MINIMUM_TOUCH_TARGET_SIZE
      );
      result.reason =
        `Target too small: ${Math.round(width)}x${Math.round(height)}px. ` +
        `Minimum is ${MINIMUM_TOUCH_TARGET_SIZE}x${MINIMUM_TOUCH_TARGET_SIZE}px`;
    }

    return result;
  }

  /**
   * Validate spacing between two adjacent touch targets
   *
   * Calculates distance between element edges and verifies minimum spacing.
   * Accounts for both center-to-center distance and edge-to-edge distance.
   *
   * @param element1 - First HTMLElement
   * @param element2 - Second HTMLElement
   * @returns Spacing validation result with distances
   *
   * @example
   * ```ts
   * const validator = new TouchTargetValidator();
   * const btn1 = document.querySelector('button:nth-of-type(1)');
   * const btn2 = document.querySelector('button:nth-of-type(2)');
   *
   * const spacing = validator.validateSpacing(btn1, btn2);
   * if (!spacing.isValid) {
   *   console.warn(`Add at least ${spacing.minimumRequiredDistance}px spacing`);
   * }
   * ```
   */
  validateSpacing(
    element1: HTMLElement,
    element2: HTMLElement
  ): SpacingValidationResult {
    const rect1 = element1.getBoundingClientRect();
    const rect2 = element2.getBoundingClientRect();

    const center1 = {
      x: rect1.left + rect1.width / 2,
      y: rect1.top + rect1.height / 2,
    };

    const center2 = {
      x: rect2.left + rect2.width / 2,
      y: rect2.top + rect2.height / 2,
    };

    const distanceBetweenCenters = Math.sqrt(
      Math.pow(center2.x - center1.x, 2) +
        Math.pow(center2.y - center1.y, 2)
    );

    const distanceBetweenEdges = Math.max(
      Math.abs(rect1.right - rect2.left),
      Math.abs(rect2.right - rect1.left),
      Math.abs(rect1.bottom - rect2.top),
      Math.abs(rect2.bottom - rect1.top)
    ) - MINIMUM_SPACING_BETWEEN_TARGETS;

    const isValid = distanceBetweenEdges >= 0 && !this.isOverlapping(rect1, rect2);

    return {
      isValid,
      distanceBetweenCenters,
      distanceBetweenEdges: Math.max(0, distanceBetweenEdges),
      minimumRequiredDistance: MINIMUM_SPACING_BETWEEN_TARGETS,
      isOverlapping: this.isOverlapping(rect1, rect2),
    };
  }

  /**
   * Get recommended size for an undersized touch target
   *
   * Calculates ideal dimensions to meet guidelines while preserving
   * aspect ratio when possible.
   *
   * @param element - HTMLElement to recommend size for
   * @returns Object with recommended width and height, or null if already adequate
   *
   * @example
   * ```ts
   * const validator = new TouchTargetValidator();
   * const icon = document.querySelector('svg');
   * const suggestion = validator.getSuggestedSize(icon);
   *
   * if (suggestion) {
   *   icon.style.width = suggestion.width + 'px';
   *   icon.style.height = suggestion.height + 'px';
   * }
   * ```
   */
  getSuggestedSize(element: HTMLElement): { width: number; height: number } | null {
    const validation = this.validate(element);

    if (validation.isValid) {
      return null;
    }

    const rect = element.getBoundingClientRect();
    const aspectRatio = rect.width / rect.height;

    let suggestedWidth = validation.recommendedWidth || MINIMUM_TOUCH_TARGET_SIZE;
    let suggestedHeight = validation.recommendedHeight || MINIMUM_TOUCH_TARGET_SIZE;

    if (aspectRatio !== 1) {
      if (rect.width < MINIMUM_TOUCH_TARGET_SIZE) {
        suggestedWidth = MINIMUM_TOUCH_TARGET_SIZE;
        suggestedHeight = MINIMUM_TOUCH_TARGET_SIZE / aspectRatio;
      } else if (rect.height < MINIMUM_TOUCH_TARGET_SIZE) {
        suggestedHeight = MINIMUM_TOUCH_TARGET_SIZE;
        suggestedWidth = MINIMUM_TOUCH_TARGET_SIZE * aspectRatio;
      }
    }

    return {
      width: suggestedWidth,
      height: suggestedHeight,
    };
  }

  /**
   * Check if two rectangles overlap
   * @internal
   */
  private isOverlapping(rect1: DOMRect, rect2: DOMRect): boolean {
    return !(
      rect1.right < rect2.left ||
      rect2.right < rect1.left ||
      rect1.bottom < rect2.top ||
      rect2.bottom < rect1.top
    );
  }

  /**
   * Get computed metrics for a touch target
   *
   * @param element - HTMLElement to measure
   * @returns TouchTargetMetrics with detailed position and visibility information
   *
   * @internal
   */
  getMetrics(element: HTMLElement): TouchTargetMetrics {
    const rect = element.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0 &&
      getComputedStyle(element).visibility !== 'hidden' &&
      getComputedStyle(element).display !== 'none';

    return {
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      bottom: rect.bottom,
      right: rect.right,
      isVisible,
    };
  }
}

/**
 * Quick validation: Check if dimensions meet minimum touch target size
 *
 * Pure function for simple size validation without DOM access.
 * Useful for pre-calculation and unit testing.
 *
 * @param width - Target width in pixels
 * @param height - Target height in pixels
 * @returns Whether dimensions meet minimum size requirement
 *
 * @example
 * ```ts
 * if (!isTouchSafe(32, 32)) {
 *   console.warn('Target too small for touch interactions');
 * }
 *
 * const desiredSize = isTouchSafe(56, 56) ? 56 : 44;
 * ```
 */
export function isTouchSafe(width: number, height: number): boolean {
  return width >= MINIMUM_TOUCH_TARGET_SIZE && height >= MINIMUM_TOUCH_TARGET_SIZE;
}

/**
 * Add padding to an element to meet minimum touch target size
 *
 * Increases the hit area by adding padding without changing layout
 * of the element's content. Particularly useful for icons and small buttons.
 *
 * @param element - HTMLElement to add padding to
 * @param minSize - Minimum size to achieve (defaults to MINIMUM_TOUCH_TARGET_SIZE)
 * @returns The modified element (for chaining)
 *
 * @example
 * ```ts
 * const iconButton = document.querySelector('.icon-button');
 * addTouchPadding(iconButton, RECOMMENDED_TOUCH_TARGET_SIZE);
 * // Now the button has a 56x56px touch target
 *
 * // For multiple elements
 * document.querySelectorAll('.icon-button').forEach(btn => {
 *   addTouchPadding(btn);
 * });
 * ```
 */
export function addTouchPadding(
  element: HTMLElement,
  minSize: number = MINIMUM_TOUCH_TARGET_SIZE
): HTMLElement {
  const rect = element.getBoundingClientRect();
  const currentSize = Math.max(rect.width, rect.height);

  if (currentSize < minSize) {
    const padding = (minSize - currentSize) / 2;
    const currentPadding = getComputedStyle(element).padding;

    element.style.padding = `${padding}px`;
  }

  return element;
}

/**
 * Create a touch-safe wrapper around an element
 *
 * Wraps the provided element in a container with guaranteed minimum size.
 * Useful for making small icons or visual elements touch-safe without
 * modifying their direct styling.
 *
 * @param baseElement - Element to wrap
 * @param options - Configuration options for the wrapper
 * @returns The wrapper container (contains baseElement as child)
 *
 * @example
 * ```ts
 * const icon = document.querySelector('svg');
 * const touchSafeIcon = createTouchableArea(icon, {
 *   minSize: RECOMMENDED_TOUCH_TARGET_SIZE,
 *   centerContent: true,
 *   wrapperClass: 'touch-safe-icon'
 * });
 *
 * // Replace icon with wrapper in the DOM
 * icon.parentNode.replaceChild(touchSafeIcon, icon);
 *
 * // Or manually position the wrapper
 * document.body.appendChild(touchSafeIcon);
 * ```
 */
export function createTouchableArea(
  baseElement: HTMLElement,
  options: TouchableAreaOptions = {}
): HTMLElement {
  const {
    minSize = MINIMUM_TOUCH_TARGET_SIZE,
    preserveExisting = false,
    padding = 0,
    wrapperClass = 'touch-safe-wrapper',
    centerContent = false,
  } = options;

  const wrapper = document.createElement('div');
  wrapper.className = wrapperClass;

  const rect = baseElement.getBoundingClientRect();
  const needsResize =
    !preserveExisting ||
    (rect.width < minSize || rect.height < minSize);

  if (needsResize) {
    wrapper.style.width = `${minSize + padding * 2}px`;
    wrapper.style.height = `${minSize + padding * 2}px`;
  } else {
    wrapper.style.width = `${rect.width + padding * 2}px`;
    wrapper.style.height = `${rect.height + padding * 2}px`;
  }

  wrapper.style.position = 'relative';
  wrapper.style.display = 'inline-flex';

  if (centerContent) {
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
  }

  if (padding > 0) {
    wrapper.style.padding = `${padding}px`;
  }

  baseElement.parentNode?.insertBefore(wrapper, baseElement);
  wrapper.appendChild(baseElement);

  return wrapper;
}

/**
 * TODO: Dynamic Device Detection
 * Adapt touch target sizes based on device capabilities and user context:
 * - detectDeviceSize(): Identify phone, tablet, or desktop form factor
 * - getRecommendedSize(deviceType): Get size for device category
 * - detectTouchCapability(): Check if device supports touch events
 * - getThumbReachableArea(orientation): Calculate reachable zones for one-handed use
 * - detectUserAgility(testInteraction): Profile user's dexterity for sizing
 */

/**
 * TODO: Haptic Feedback Zones
 * Define zones with specific vibration patterns for different target types:
 * - createHapticZone(element, pattern): Mark element for haptic feedback
 * - applyHapticFeedback(zone, intensity): Trigger vibration pattern
 * - defineVibrationPatterns(): Configure patterns (light, medium, heavy, double-tap)
 * - syncHapticWithAnimation(element, keyframes): Link haptics to CSS animations
 * - detectHapticSupport(): Check if device supports Vibration API
 */

/**
 * TODO: Gesture Recognition Zones
 * Define zones for specific multi-touch and gesture interactions:
 * - createGestureZone(element, gestures): Define recognized gestures
 * - validateGestureSpace(element): Ensure zone has space for gesture detection
 * - getGesturePattern(type): Get pattern for pinch, rotate, swipe, etc.
 * - trackMultiTouchDistance(): Monitor distance between touch points
 * - conflictDetection(): Warn when gesture zones overlap inappropriately
 */

/**
 * TODO: One-Handed Mode Support
 * Adapt UI for single-handed phone interaction:
 * - detectOneHandedMode(): Check if user prefers one-handed layout
 * - getOneHandedZones(handedness): Calculate reachable areas for left/right hand
 * - reorderTargets(hand): Rearrange interactive elements for accessibility
 * - updateLayout(mode): Shift UI elements to preferred side of screen
 * - showReachabilityHeatmap(): Visualize tap-friendly zones for device
 */

/**
 * TODO: Landscape vs Portrait Adaptation
 * Adjust target sizing and spacing for device orientation:
 * - detectOrientation(): Get current device orientation (portrait/landscape)
 * - getOrientationSpecificSize(orientation): Return size for orientation
 * - optimizeLayoutForOrientation(): Rearrange targets by orientation
 * - handleOrientationChange(): React to device rotation events
 * - precomputeOrientationMetrics(): Cache calculations for both orientations
 */

/**
 * TODO: Fat-Finger Correction
 * Dynamically expand touch zones when user interactions are inaccurate:
 * - trackMissedTaps(): Monitor when users tap adjacent targets by mistake
 * - expandHitArea(element, factor): Grow interactive zone without visual change
 * - createDeadzones(): Define areas that trigger specific targets
 * - learnUserPattern(): Adapt zones based on user's individual tap accuracy
 * - resetAdaptiveZones(): Clear learned patterns for privacy
 */
