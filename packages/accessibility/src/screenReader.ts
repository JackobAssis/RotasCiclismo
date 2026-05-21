/**
 * @cycling/accessibility/screenReader - Screen Reader Friendly Status Indicators
 *
 * This module provides comprehensive screen reader support for status announcements,
 * ARIA live regions, and accessible status indicators. It enables applications to
 * communicate real-time status changes to assistive technology users in a semantic,
 * non-intrusive manner.
 *
 * ARIA Live Regions:
 * ==================
 * Live regions allow dynamic content changes to be announced to screen reader users
 * without requiring focus changes or page reloads. This module supports three priority
 * levels based on ARIA specification:
 *
 * - polite: Announcements wait for current speech to finish before being announced
 *   Use for: General status updates, confirmations, non-urgent information
 *
 * - assertive: Announcements interrupt current speech immediately
 *   Use for: Important state changes, warnings, time-sensitive information
 *
 * - rude: Immediate announcement, may interrupt current message mid-sentence
 *   Use for: Critical errors, emergency alerts, highest priority messages
 *
 * Announcement Queue:
 * ===================
 * The ScreenReaderIndicator maintains a queue of announcements to prevent:
 * - Duplicate announcements within a debounce window (default 300ms)
 * - Screen reader overload from rapid status changes
 * - Race conditions when multiple status updates occur simultaneously
 *
 * Status Indicators:
 * ==================
 * Specialized announcements for cycling app contexts:
 * - Recording: started, stopped, paused
 * - GPS: acquiring, locked, failed
 * - Mode: GPS_ONLY, GPS_CAMERA
 * - Errors: Alert role for error messages
 * - Success: Confirmation feedback
 *
 * Best Practices for Screen Readers:
 * ===================================
 * 1. Keep announcements concise (aim for < 100 characters)
 * 2. Use role-specific priorities (e.g., "assertive" for GPS lock acquisition)
 * 3. Avoid announcements that change focus (screen readers announce focus changes separately)
 * 4. Group related announcements (e.g., "GPS locked with 8 satellites" as one message)
 * 5. Use present tense for state ("Recording started") rather than future tense
 * 6. Provide context for abbreviations on first use
 * 7. Test with actual screen readers (NVDA, JAWS, VoiceOver) in target use cases
 *
 * TODOs for Future Enhancement:
 * =============================
 * - TODO: Multilingual announcements with locale detection and translation lookups
 * - TODO: Speech rate adjustment for different announcement types (slow for critical, fast for routine)
 * - TODO: Braille output support via BrailleMatrix or similar APIs
 * - TODO: Voice command feedback that acknowledges user voice input and command recognition
 * - TODO: Announcement history with replay capability for users who missed announcements
 * - TODO: Configurable announcement persistence (keep in live region vs clear after timeout)
 * - TODO: Screen reader detection to optimize announcements per reader capabilities
 */

/**
 * Priority levels for screen reader announcements
 * Determines ARIA live region politeness setting and announcement behavior
 */
export type AnnouncementPriority = 'polite' | 'assertive' | 'rude';

/**
 * Status types for cycling application indicators
 */
export enum StatusType {
  RECORDING_STARTED = 'recording_started',
  RECORDING_STOPPED = 'recording_stopped',
  RECORDING_PAUSED = 'recording_paused',
  GPS_ACQUIRING = 'gps_acquiring',
  GPS_LOCKED = 'gps_locked',
  GPS_FAILED = 'gps_failed',
  MODE_GPS_ONLY = 'mode_gps_only',
  MODE_GPS_CAMERA = 'mode_gps_camera',
  ERROR = 'error',
  SUCCESS = 'success',
}

/**
 * Configuration for a live region
 */
interface LiveRegionConfig {
  /** Unique identifier for the live region */
  id: string;
  /** Announcement priority level */
  priority: AnnouncementPriority;
  /** Whether to use role="alert" for critical announcements */
  isAlert: boolean;
  /** Element reference if already created */
  element?: HTMLElement;
}

/**
 * Queued announcement data
 */
interface QueuedAnnouncement {
  /** Message to announce */
  message: string;
  /** Announcement priority */
  priority: AnnouncementPriority;
  /** Timestamp when queued */
  timestamp: number;
  /** Live region ID to send announcement to */
  regionId: string;
}

/**
 * ScreenReaderIndicator manages ARIA live regions and screen reader announcements
 * for status changes and user feedback.
 *
 * @example
 * ```typescript
 * const indicator = new ScreenReaderIndicator();
 *
 * // Create polite live region for status updates
 * indicator.createLiveRegion('status-region', 'polite');
 *
 * // Announce status change
 * indicator.announceStatus(StatusType.GPS_LOCKED, 'GPS signal locked with 8 satellites');
 *
 * // Direct announcement with priority
 * indicator.announce('Route recording started', 'assertive');
 *
 * // Clear queue if needed
 * indicator.clearAnnouncements();
 * ```
 */
export class ScreenReaderIndicator {
  /** Map of live region configurations */
  private liveRegions: Map<string, LiveRegionConfig> = new Map();

  /** Queue of pending announcements */
  private announcementQueue: QueuedAnnouncement[] = [];

  /** Set of recent announcements for deduplication (within debounce window) */
  private recentAnnouncements: Set<string> = new Set();

  /** Debounce duration in milliseconds for duplicate detection */
  private debounceWindow: number = 300;

  /** Timer for processing queued announcements */
  private processingTimer: ReturnType<typeof setTimeout> | null = null;

  /** Default live region ID for general announcements */
  private defaultRegionId: string = 'sr-default-region';

  /**
   * Create a new ScreenReaderIndicator instance.
   * Automatically creates a default polite live region.
   */
  constructor() {
    this.createDefaultLiveRegion();
  }

  /**
   * Create a default polite live region for general announcements.
   * This region is used if no specific region is provided to announce().
   * @internal
   */
  private createDefaultLiveRegion(): void {
    this.createLiveRegion(this.defaultRegionId, 'polite');
  }

  /**
   * Create a new ARIA live region for announcements.
   * If a live region with the same ID exists, it will be reused.
   *
   * @param id - Unique identifier for the live region
   * @param priority - Announcement priority ('polite', 'assertive', or 'rude')
   * @param isAlert - If true, uses role="alert" instead of role="status"
   *
   * @example
   * ```typescript
   * indicator.createLiveRegion('error-region', 'rude', true);
   * indicator.createLiveRegion('update-region', 'polite', false);
   * ```
   */
  public createLiveRegion(
    id: string,
    priority: AnnouncementPriority = 'polite',
    isAlert: boolean = false
  ): HTMLElement {
    // Check if region already exists
    if (this.liveRegions.has(id)) {
      const config = this.liveRegions.get(id)!;
      if (config.element) {
        return config.element;
      }
    }

    // Create the live region element
    const element = document.createElement('div');
    element.id = id;
    element.setAttribute('aria-live', priority);
    element.setAttribute('aria-atomic', 'true');
    element.setAttribute('aria-relevant', 'additions text');

    if (isAlert) {
      element.setAttribute('role', 'alert');
    } else {
      element.setAttribute('role', 'status');
    }

    // Hide from visual layout but keep accessible to screen readers
    element.style.position = 'absolute';
    element.style.left = '-10000px';
    element.style.width = '1px';
    element.style.height = '1px';
    element.style.overflow = 'hidden';

    // Append to body
    document.body.appendChild(element);

    // Store configuration
    const config: LiveRegionConfig = {
      id,
      priority,
      isAlert,
      element,
    };

    this.liveRegions.set(id, config);
    return element;
  }

  /**
   * Announce a message to screen readers using the default live region.
   * Messages are queued to prevent announcement overload.
   * Duplicate announcements within the debounce window are silently dropped.
   *
   * @param message - The message to announce
   * @param priority - Announcement priority level (default: 'polite')
   * @param regionId - Optional specific live region ID (defaults to default region)
   *
   * @example
   * ```typescript
   * indicator.announce('Recording in progress', 'assertive');
   * indicator.announce('Settings saved', 'polite', 'custom-region');
   * ```
   */
  public announce(
    message: string,
    priority: AnnouncementPriority = 'polite',
    regionId: string = this.defaultRegionId
  ): void {
    // Check for duplicate announcements
    const announcementKey = `${message}:${priority}`;
    if (this.recentAnnouncements.has(announcementKey)) {
      return; // Skip duplicate
    }

    // Ensure live region exists, create if needed
    if (!this.liveRegions.has(regionId)) {
      this.createLiveRegion(regionId, priority);
    }

    // Queue the announcement
    this.announcementQueue.push({
      message,
      priority,
      timestamp: Date.now(),
      regionId,
    });

    // Mark as recent for debounce window
    this.recentAnnouncements.add(announcementKey);
    setTimeout(() => {
      this.recentAnnouncements.delete(announcementKey);
    }, this.debounceWindow);

    // Process queue
    this.processQueue();
  }

  /**
   * Announce a status change with context-specific messaging.
   * Uses predefined messages for common cycling app status types.
   *
   * @param status - The status type to announce
   * @param details - Optional additional details to append to the message
   *
   * @example
   * ```typescript
   * indicator.announceStatus(StatusType.GPS_LOCKED, '8 satellites, accuracy: 5m');
   * indicator.announceStatus(StatusType.RECORDING_STARTED);
   * indicator.announceStatus(StatusType.ERROR, 'GPS signal lost');
   * ```
   */
  public announceStatus(status: StatusType, details?: string): void {
    const statusMessages: Record<StatusType, { message: string; priority: AnnouncementPriority; isAlert: boolean }> = {
      [StatusType.RECORDING_STARTED]: {
        message: 'Recording started',
        priority: 'assertive',
        isAlert: false,
      },
      [StatusType.RECORDING_STOPPED]: {
        message: 'Recording stopped',
        priority: 'polite',
        isAlert: false,
      },
      [StatusType.RECORDING_PAUSED]: {
        message: 'Recording paused',
        priority: 'polite',
        isAlert: false,
      },
      [StatusType.GPS_ACQUIRING]: {
        message: 'Acquiring GPS signal',
        priority: 'polite',
        isAlert: false,
      },
      [StatusType.GPS_LOCKED]: {
        message: 'GPS signal locked',
        priority: 'assertive',
        isAlert: false,
      },
      [StatusType.GPS_FAILED]: {
        message: 'GPS signal failed',
        priority: 'rude',
        isAlert: true,
      },
      [StatusType.MODE_GPS_ONLY]: {
        message: 'Mode: GPS only',
        priority: 'polite',
        isAlert: false,
      },
      [StatusType.MODE_GPS_CAMERA]: {
        message: 'Mode: GPS and camera',
        priority: 'polite',
        isAlert: false,
      },
      [StatusType.ERROR]: {
        message: 'Error occurred',
        priority: 'rude',
        isAlert: true,
      },
      [StatusType.SUCCESS]: {
        message: 'Operation successful',
        priority: 'polite',
        isAlert: false,
      },
    };

    const config = statusMessages[status];
    if (!config) {
      console.warn(`Unknown status type: ${status}`);
      return;
    }

    // Ensure live region exists with appropriate alert setting
    const regionId = config.isAlert ? 'sr-alert-region' : this.defaultRegionId;
    if (!this.liveRegions.has(regionId)) {
      this.createLiveRegion(regionId, config.priority, config.isAlert);
    }

    // Build final message with optional details
    let finalMessage = config.message;
    if (details) {
      finalMessage = `${config.message}: ${details}`;
    }

    // Announce with appropriate priority
    this.announce(finalMessage, config.priority, regionId);
  }

  /**
   * Process the announcement queue, sending announcements to their live regions.
   * Uses a minimal delay to allow batching of rapid announcements.
   * @internal
   */
  private processQueue(): void {
    // Clear any existing timer
    if (this.processingTimer) {
      clearTimeout(this.processingTimer);
    }

    // Process queue after minimal delay to allow batching
    this.processingTimer = setTimeout(() => {
      while (this.announcementQueue.length > 0) {
        const announcement = this.announcementQueue.shift();
        if (!announcement) {
          break;
        }

        const region = this.liveRegions.get(announcement.regionId);
        if (region && region.element) {
          // Clear previous content and set new message
          region.element.textContent = '';
          region.element.textContent = announcement.message;
        }
      }

      this.processingTimer = null;
    }, 10);
  }

  /**
   * Clear all queued announcements without sending them.
   * Also clears the duplicate announcement tracker.
   *
   * @example
   * ```typescript
   * indicator.clearAnnouncements();
   * ```
   */
  public clearAnnouncements(): void {
    this.announcementQueue = [];
    this.recentAnnouncements.clear();

    if (this.processingTimer) {
      clearTimeout(this.processingTimer);
      this.processingTimer = null;
    }
  }

  /**
   * Get all live region elements managed by this indicator.
   * Useful for testing or integration with other accessibility tools.
   *
   * @returns Map of region IDs to their configurations
   */
  public getLiveRegions(): Map<string, LiveRegionConfig> {
    return new Map(this.liveRegions);
  }

  /**
   * Remove a live region from the DOM and from management.
   *
   * @param id - The ID of the live region to remove
   *
   * @example
   * ```typescript
   * indicator.removeLiveRegion('custom-region');
   * ```
   */
  public removeLiveRegion(id: string): void {
    const config = this.liveRegions.get(id);
    if (config && config.element) {
      config.element.remove();
    }
    this.liveRegions.delete(id);
  }

  /**
   * Destroy the screen reader indicator, removing all live regions and clearing queues.
   * Should be called during cleanup or before unmounting the component.
   *
   * @example
   * ```typescript
   * indicator.destroy();
   * ```
   */
  public destroy(): void {
    this.clearAnnouncements();

    // Remove all live regions from DOM
    for (const [, config] of this.liveRegions) {
      if (config.element) {
        config.element.remove();
      }
    }

    this.liveRegions.clear();
  }
}

/**
 * Create an ARIA label for an element.
 * Useful for elements that need accessible naming but shouldn't display text visually.
 *
 * @param text - The label text
 * @param role - Optional ARIA role for the label element
 * @returns The created label element
 *
 * @example
 * ```typescript
 * const label = createAriaLabel('Start recording', 'presentation');
 * button.appendChild(label);
 * ```
 */
export function createAriaLabel(text: string, role?: string): HTMLElement {
  const label = document.createElement('span');
  label.className = 'sr-only';
  label.textContent = text;

  if (role) {
    label.setAttribute('role', role);
  }

  // Apply screen reader only styling
  label.style.position = 'absolute';
  label.style.left = '-10000px';
  label.style.width = '1px';
  label.style.height = '1px';
  label.style.overflow = 'hidden';

  return label;
}

/**
 * Link an element to an external aria-labelledby reference.
 * The element will be labeled by the referenced element's text content.
 *
 * @param element - The element to add aria-labelledby to
 * @param labelId - The ID of the element containing the label text
 *
 * @example
 * ```typescript
 * const heading = document.getElementById('dialog-title');
 * const dialog = document.getElementById('my-dialog');
 * createAriaLabelledby(dialog, heading.id);
 * ```
 */
export function createAriaLabelledby(element: HTMLElement, labelId: string): void {
  const existing = element.getAttribute('aria-labelledby');
  if (existing && !existing.includes(labelId)) {
    element.setAttribute('aria-labelledby', `${existing} ${labelId}`);
  } else if (!existing) {
    element.setAttribute('aria-labelledby', labelId);
  }
}

/**
 * Set the aria-pressed state on a toggle button element.
 * Used for buttons that toggle between pressed and not pressed states.
 *
 * @param element - The button element to update
 * @param pressed - Whether the button is pressed
 *
 * @example
 * ```typescript
 * const recordButton = document.getElementById('record-btn');
 * setAriaPressed(recordButton, true); // Button is now "pressed"
 * ```
 */
export function setAriaPressed(element: HTMLElement, pressed: boolean): void {
  element.setAttribute('aria-pressed', pressed ? 'true' : 'false');
}

/**
 * Set the aria-expanded state on a disclosure element.
 * Used for elements that expand/collapse additional content (accordions, dropdowns, etc).
 *
 * @param element - The disclosure element to update
 * @param expanded - Whether the disclosed content is expanded
 *
 * @example
 * ```typescript
 * const menuButton = document.getElementById('menu-btn');
 * setAriaExpanded(menuButton, true); // Menu is now expanded
 * ```
 */
export function setAriaExpanded(element: HTMLElement, expanded: boolean): void {
  element.setAttribute('aria-expanded', expanded ? 'true' : 'false');
}

/**
 * Get the singleton ScreenReaderIndicator instance for application-wide use.
 * Creates one if it doesn't exist.
 *
 * @returns The global ScreenReaderIndicator instance
 *
 * @example
 * ```typescript
 * const indicator = getScreenReaderIndicator();
 * indicator.announce('Status updated', 'polite');
 * ```
 */
let singletonInstance: ScreenReaderIndicator | null = null;

export function getScreenReaderIndicator(): ScreenReaderIndicator {
  if (!singletonInstance) {
    singletonInstance = new ScreenReaderIndicator();
  }
  return singletonInstance;
}
