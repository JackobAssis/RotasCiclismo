/**
 * Mobile Platform Detection System
 *
 * Architecture:
 * - User agent parsing: Detects OS and browser through navigator.userAgent analysis
 * - API detection: Runtime checks for browser APIs (Vibration, Battery, DeviceOrientation, etc.)
 * - Context detection: Distinguishes between native wrapper, PWA, and web browser contexts
 * - Graceful degradation: All checks safely handle undefined APIs and errors
 *
 * Platform-Specific Considerations:
 * - iOS: Limited Vibration API support, requires user gesture; uses Haptic Engine APIs in native contexts
 * - Android: Full Vibration API support with intensity control; extensive sensor availability
 * - Web: Cross-browser compatibility varies; feature detection essential
 * - PWA: Behaves like web but can have enhanced capabilities in standalone mode
 *
 * User Agent Parsing Strategy:
 * - Regex-based detection of OS signatures (iPhone, iPad, Android, Windows, etc.)
 * - Browser detection through user agent strings for Chrome, Safari, Firefox, Edge
 * - Fallback chain ensures graceful handling of unrecognized user agents
 *
 * API Detection Approach:
 * - Synchronous checks for most APIs (safe to call during initialization)
 * - Battery Status API check uses try-catch (deprecated but useful for capability detection)
 * - Permission queries for sensitive APIs use try-catch blocks
 * - All checks return false on error to ensure safe degradation
 *
 * TODO: Device model detection (iPhone 15, Pixel 8, Galaxy S24, etc.)
 * TODO: OS version detection (iOS 17.2, Android 14, etc.)
 * TODO: Battery status monitoring with Battery Status API
 * TODO: Memory constraints detection (available RAM, low-memory detection)
 * TODO: Network type detection (WiFi, cellular, 5G, 4G)
 * TODO: Haptic intensity calibration per device model
 * TODO: Sensor fusion for enhanced motion detection
 * TODO: Performance profiling and throttling detection
 */

/**
 * Supported operating systems
 */
export type OS = 'ios' | 'android' | 'web';

/**
 * Supported browsers
 */
export type Browser =
  | 'chrome'
  | 'firefox'
  | 'safari'
  | 'edge'
  | 'opera'
  | 'samsung'
  | 'unknown';

/**
 * App context types
 */
export type AppContext = 'native' | 'pwa' | 'browser';

/**
 * Device orientation
 */
export type DeviceOrientation = 'portrait' | 'landscape';

/**
 * Device capabilities object
 */
export interface DeviceCapabilities {
  vibration: boolean;
  hapticEngine: boolean;
  batteryAPI: boolean;
  gyroscope: boolean;
  accelerometer: boolean;
  magnetometer: boolean;
  deviceOrientation: boolean;
  deviceMotion: boolean;
  touchEvents: boolean;
  pointerEvents: boolean;
  mediaDevices: boolean;
  geolocation: boolean;
  localStorage: boolean;
}

/**
 * Platform-specific haptic configuration
 */
export interface PlatformHaptics {
  os: OS;
  supportsVibration: boolean;
  supportsHapticEngine: boolean;
  maxVibrationDuration: number;
  defaultIntensity: number;
  isLowPowerMode: boolean;
}

/**
 * Battery status information
 */
export interface BatteryStatus {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
}

/**
 * PlatformDetector - Comprehensive platform and capability detection
 *
 * Singleton pattern ensures consistent detection throughout app lifecycle.
 * All detection methods are synchronous for immediate availability.
 *
 * Usage:
 * ```typescript
 * const detector = PlatformDetector.getInstance();
 * console.log(detector.getOS()); // 'ios' | 'android' | 'web'
 * console.log(detector.getBrowser()); // 'safari' | 'chrome' | ...
 * console.log(detector.hasVibrationAPI()); // true | false
 * console.log(detector.getDeviceCapabilities()); // Full capabilities object
 * ```
 */
export class PlatformDetector {
  private static instance: PlatformDetector | null = null;

  // Cached detection results
  private cachedOS: OS | null = null;
  private cachedBrowser: Browser | null = null;
  private cachedAppContext: AppContext | null = null;
  private cachedCapabilities: DeviceCapabilities | null = null;
  private userAgent: string;
  private isSSR: boolean;

  private constructor() {
    // Safely get user agent in both browser and SSR contexts
    this.isSSR = typeof window === 'undefined' || typeof navigator === 'undefined';
    this.userAgent = !this.isSSR ? navigator.userAgent : '';
  }

  /**
   * Get singleton instance of PlatformDetector
   */
  public static getInstance(): PlatformDetector {
    if (!PlatformDetector.instance) {
      PlatformDetector.instance = new PlatformDetector();
    }
    return PlatformDetector.instance;
  }

  // ============ OS Detection ============

  /**
   * Detect operating system from user agent
   *
   * Strategy:
   * 1. Check for iOS indicators (iPhone, iPad, iPod)
   * 2. Check for Android indicators
   * 3. Default to 'web' for all others (desktop, unknown, or browser-based)
   *
   * @returns 'ios' | 'android' | 'web'
   */
  public getOS(): OS {
    if (this.cachedOS) {
      return this.cachedOS;
    }

    if (this.isSSR) {
      this.cachedOS = 'web';
      return 'web';
    }

    const ua = this.userAgent.toLowerCase();

    // iOS detection: iPhone, iPad, iPod
    if (/iphone|ipad|ipod/.test(ua)) {
      this.cachedOS = 'ios';
      return 'ios';
    }

    // Android detection
    if (/android/.test(ua)) {
      this.cachedOS = 'android';
      return 'android';
    }

    this.cachedOS = 'web';
    return 'web';
  }

  /**
   * Check if device is iOS
   */
  public isIOS(): boolean {
    return this.getOS() === 'ios';
  }

  /**
   * Check if device is Android
   */
  public isAndroid(): boolean {
    return this.getOS() === 'android';
  }

  // ============ Browser Detection ============

  /**
   * Detect browser from user agent
   *
   * Strategy:
   * 1. Check for Chromium-based browsers (Chrome, Edge, Opera, Samsung)
   * 2. Check for Firefox
   * 3. Check for Safari (must be after Chrome check due to Chromium/webkit substring)
   * 4. Default to 'unknown'
   *
   * Note: Mobile browsers often report multiple engine strings, so order matters.
   *
   * @returns Browser name or 'unknown'
   */
  public getBrowser(): Browser {
    if (this.cachedBrowser) {
      return this.cachedBrowser;
    }

    if (this.isSSR) {
      this.cachedBrowser = 'unknown';
      return 'unknown';
    }

    const ua = this.userAgent.toLowerCase();

    // Edge (before Chrome check, as it contains "chrome")
    if (/edg/.test(ua)) {
      this.cachedBrowser = 'edge';
      return 'edge';
    }

    // Opera (before Chrome check)
    if (/opr|opera/.test(ua)) {
      this.cachedBrowser = 'opera';
      return 'opera';
    }

    // Samsung Internet
    if (/samsungbrowser/.test(ua)) {
      this.cachedBrowser = 'samsung';
      return 'samsung';
    }

    // Chrome (catches Chromium-based)
    if (/chrome/.test(ua)) {
      this.cachedBrowser = 'chrome';
      return 'chrome';
    }

    // Firefox
    if (/firefox/.test(ua)) {
      this.cachedBrowser = 'firefox';
      return 'firefox';
    }

    // Safari (after Chrome check due to webkit match)
    if (/safari/.test(ua) && !/chrome/.test(ua)) {
      this.cachedBrowser = 'safari';
      return 'safari';
    }

    this.cachedBrowser = 'unknown';
    return 'unknown';
  }

  // ============ App Context Detection ============

  /**
   * Detect application context (native wrapper, PWA, or browser)
   *
   * Strategy:
   * 1. Check for native wrapper indicators (custom user agents, bridge APIs)
   * 2. Check for PWA indicators (display mode, manifest, install prompt)
   * 3. Default to 'browser' for standard web environments
   *
   * @returns 'native' | 'pwa' | 'browser'
   */
  public getAppContext(): AppContext {
    if (this.cachedAppContext) {
      return this.cachedAppContext;
    }

    if (this.isSSR) {
      this.cachedAppContext = 'browser';
      return 'browser';
    }

    try {
      const ua = this.userAgent.toLowerCase();
      const nav = navigator as any;
      const win = window as any;

      // Native wrapper detection
      // Check for common bridge APIs and custom user agents
      if (
        nav.userAgent?.includes('RCApp') || // Rotas Ciclismo custom
        nav.userAgent?.includes('CyclingApp') ||
        win.ReactNativeWebView || // React Native WebView
        win.webkit?.messageHandlers || // iOS native
        win.android?.bridge // Android native
      ) {
        this.cachedAppContext = 'native';
        return 'native';
      }

      // PWA detection
      // Check display mode and manifest
      if (
        win.matchMedia?.('(display-mode: standalone)').matches ||
        win.matchMedia?.('(display-mode: fullscreen)').matches ||
        (nav.standalone === true && this.isIOS()) || // iOS standalone mode
        document.referrer?.includes('android-app://') // Android PWA
      ) {
        this.cachedAppContext = 'pwa';
        return 'pwa';
      }

      this.cachedAppContext = 'browser';
      return 'browser';
    } catch (err) {
      this.cachedAppContext = 'browser';
      return 'browser';
    }
  }

  /**
   * Check if running in native app wrapper
   */
  public isNativeApp(): boolean {
    return this.getAppContext() === 'native';
  }

  /**
   * Check if running as Progressive Web App
   */
  public isPWA(): boolean {
    return this.getAppContext() === 'pwa';
  }

  /**
   * Check if running in regular web browser
   */
  public isBrowser(): boolean {
    return this.getAppContext() === 'browser';
  }

  // ============ Device Type Detection ============

  /**
   * Check if device is mobile or tablet
   *
   * Strategy: Check user agent for mobile/tablet indicators
   * Note: Some tablets may report as desktop; use screen size for additional validation
   *
   * @returns true if mobile or tablet device detected
   */
  public isMobileDevice(): boolean {
    if (this.isSSR) {
      return false;
    }

    const ua = this.userAgent.toLowerCase();

    // Mobile/tablet indicators
    return /mobile|tablet|ipad|android|iphone|ipod|blackberry|windows phone|opera mini|IEMobile/.test(
      ua
    );
  }

  /**
   * Check if device is tablet
   */
  public isTablet(): boolean {
    if (this.isSSR) {
      return false;
    }

    const ua = this.userAgent.toLowerCase();
    return /ipad|android|tablet/.test(ua) && !/mobile/.test(ua);
  }

  /**
   * Check if device is phone
   */
  public isPhone(): boolean {
    if (this.isSSR) {
      return false;
    }

    const ua = this.userAgent.toLowerCase();
    return (
      /mobile|iphone|ipod|blackberry|windows phone|opera mini/.test(ua) ||
      (this.isAndroid() && !/tablet/.test(ua))
    );
  }

  /**
   * Get current device orientation
   *
   * Uses window.orientation (deprecated but widely supported) or
   * window.matchMedia for modern approach
   *
   * @returns 'portrait' | 'landscape'
   */
  public getDeviceOrientation(): DeviceOrientation {
    if (this.isSSR) {
      return 'portrait';
    }

    try {
      // Modern approach using matchMedia
      if (window.matchMedia?.('(orientation: portrait)').matches) {
        return 'portrait';
      }
      if (window.matchMedia?.('(orientation: landscape)').matches) {
        return 'landscape';
      }

      // Fallback to deprecated window.orientation
      const win = window as any;
      if (typeof win.orientation !== 'undefined') {
        const orientation = Math.abs(win.orientation);
        return orientation === 90 ? 'landscape' : 'portrait';
      }

      // Final fallback based on dimensions
      return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    } catch (err) {
      return 'portrait';
    }
  }

  // ============ Capability Detection ============

  /**
   * Check if Vibration API is supported
   * W3C Vibration API: https://w3c.github.io/vibration/
   *
   * Supported on:
   * - Android: Full support
   * - iOS: Limited (requires user gesture, no longer supported in modern iOS)
   * - Modern browsers: Widespread support with permission checks
   *
   * @returns true if navigator.vibrate is available
   */
  public hasVibrationAPI(): boolean {
    if (this.isSSR) {
      return false;
    }

    try {
      const nav = navigator as any;
      return !!(
        nav.vibrate ||
        nav.webkitVibrate ||
        nav.mozVibrate ||
        nav.msVibrate
      );
    } catch (err) {
      return false;
    }
  }

  /**
   * Check if iOS Haptic Engine is available
   *
   * iOS Haptic Engine provides more sophisticated haptic feedback than
   * the generic Vibration API. Available in native contexts and some PWAs.
   *
   * Indicators checked:
   * - Running on iOS
   * - In native app context or PWA
   * - iOS version supports Haptic Engine (iOS 10+)
   *
   * TODO: Detect iOS version to confirm Haptic Engine support
   *
   * @returns true if Haptic Engine likely available
   */
  public hasHapticEngine(): boolean {
    if (this.isSSR) {
      return false;
    }

    try {
      const isIOS = this.isIOS();
      const isNativeOrPWA =
        this.isNativeApp() || this.isPWA();

      // Haptic Engine available on iOS 10+ in native/PWA contexts
      if (isIOS && isNativeOrPWA) {
        return true;
      }

      // Check for haptic feedback in browser (experimental APIs)
      const nav = navigator as any;
      return !!(
        nav.hapticFeedback || // Custom bridge
        typeof (window as any).webkit?.haptic === 'object' // WebKit bridge
      );
    } catch (err) {
      return false;
    }
  }

  /**
   * Check if Battery Status API is supported
   * W3C Battery Status API: https://w3c.github.io/battery/
   *
   * Note: This API is deprecated but still useful for capability detection
   * and battery awareness in web apps
   *
   * @returns true if getBattery() or battery event listeners available
   */
  public hasBatteryAPI(): boolean {
    if (this.isSSR) {
      return false;
    }

    try {
      const nav = navigator as any;
      // Check for deprecated getBattery() API
      if (typeof nav.getBattery === 'function') {
        return true;
      }
      // Check for battery manager (modern implementation)
      if (typeof nav.getBattery === 'function') {
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }

  /**
   * Check if Gyroscope (rotational motion) sensors are available
   * Part of DeviceOrientation Event API and Generic Sensor API
   *
   * Supported on:
   * - Modern Android devices
   * - Modern iOS devices (iPhone 4+, iPad 2+)
   * - Limited support on desktop browsers
   *
   * @returns true if DeviceOrientationEvent can be accessed
   */
  public hasGyroscope(): boolean {
    if (this.isSSR) {
      return false;
    }

    try {
      // Check for DeviceOrientation API (requires user permission on iOS 13+)
      if (typeof window !== 'undefined' && typeof window.DeviceOrientationEvent !== 'undefined') {
        return true;
      }

      // Check for Sensor API (modern approach)
      const nav = navigator as any;
      return (
        typeof nav.permissions?.query === 'function' ||
        typeof (window as any).Sensor === 'function'
      );
    } catch (err) {
      return false;
    }
  }

  /**
   * Check if Accelerometer sensors are available
   * Part of DeviceMotion Event API and Generic Sensor API
   *
   * Supported on:
   * - Android: Full support
   * - iOS: Full support (requires permission on iOS 13+)
   * - Some desktop accelerometers (rare)
   *
   * @returns true if DeviceMotionEvent can be accessed
   */
  public hasAccelerometer(): boolean {
    if (this.isSSR) {
      return false;
    }

    try {
      // Check for DeviceMotion API (standard)
      if (typeof window !== 'undefined' && typeof window.DeviceMotionEvent !== 'undefined') {
        return true;
      }

      // Check for Sensor API (modern approach)
      const nav = navigator as any;
      return (
        typeof nav.permissions?.query === 'function' ||
        typeof (window as any).Sensor === 'function'
      );
    } catch (err) {
      return false;
    }
  }

  /**
   * Check if Magnetometer sensors are available
   * Part of DeviceOrientation Absolute Event API and Generic Sensor API
   *
   * Less common than gyroscope/accelerometer, but useful for compass
   * and orientation calibration
   *
   * @returns true if magnetometer likely available
   */
  public hasMagnetometer(): boolean {
    if (this.isSSR) {
      return false;
    }

    try {
      const nav = navigator as any;
      // Generic Sensor API check
      if (typeof (window as any).Sensor === 'function') {
        return true;
      }
      // Check for magnetometer-related permissions
      if (typeof nav.permissions?.query === 'function') {
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }

  /**
   * Check if Device Orientation Event API is supported
   */
  public hasDeviceOrientation(): boolean {
    if (this.isSSR) {
      return false;
    }

    try {
      return (
        typeof window !== 'undefined' &&
        typeof window.DeviceOrientationEvent !== 'undefined'
      );
    } catch (err) {
      return false;
    }
  }

  /**
   * Check if Device Motion Event API is supported
   */
  public hasDeviceMotion(): boolean {
    if (this.isSSR) {
      return false;
    }

    try {
      return (
        typeof window !== 'undefined' &&
        typeof window.DeviceMotionEvent !== 'undefined'
      );
    } catch (err) {
      return false;
    }
  }

  /**
   * Check if Touch Events API is supported
   */
  public hasTouchEvents(): boolean {
    if (this.isSSR) {
      return false;
    }

    try {
      return (
        typeof window !== 'undefined' &&
        'ontouchstart' in window &&
        typeof window.TouchEvent !== 'undefined'
      );
    } catch (err) {
      return false;
    }
  }

  /**
   * Check if Pointer Events API is supported
   */
  public hasPointerEvents(): boolean {
    if (this.isSSR) {
      return false;
    }

    try {
      return (
        typeof window !== 'undefined' &&
        'onpointerdown' in window &&
        typeof window.PointerEvent !== 'undefined'
      );
    } catch (err) {
      return false;
    }
  }

  /**
   * Check if Media Devices API is available (camera, microphone)
   */
  public hasMediaDevices(): boolean {
    if (this.isSSR) {
      return false;
    }

    try {
      const nav = navigator as any;
      return (
        typeof nav.mediaDevices?.enumerateDevices === 'function' ||
        typeof nav.mediaDevices?.getUserMedia === 'function'
      );
    } catch (err) {
      return false;
    }
  }

  /**
   * Check if Geolocation API is available
   */
  public hasGeolocation(): boolean {
    if (this.isSSR) {
      return false;
    }

    try {
      const nav = navigator as any;
      return typeof nav.geolocation?.getCurrentPosition === 'function';
    } catch (err) {
      return false;
    }
  }

  /**
   * Check if localStorage is available
   */
  public hasLocalStorage(): boolean {
    if (this.isSSR) {
      return false;
    }

    try {
      const storage = window.localStorage;
      const test = '__storage_test__';
      storage.setItem(test, test);
      storage.removeItem(test);
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Get comprehensive device capabilities object
   *
   * Returns an object containing all capability detection results
   * for easy checking of supported features
   *
   * @returns DeviceCapabilities object
   */
  public getDeviceCapabilities(): DeviceCapabilities {
    if (this.cachedCapabilities) {
      return this.cachedCapabilities;
    }

    this.cachedCapabilities = {
      vibration: this.hasVibrationAPI(),
      hapticEngine: this.hasHapticEngine(),
      batteryAPI: this.hasBatteryAPI(),
      gyroscope: this.hasGyroscope(),
      accelerometer: this.hasAccelerometer(),
      magnetometer: this.hasMagnetometer(),
      deviceOrientation: this.hasDeviceOrientation(),
      deviceMotion: this.hasDeviceMotion(),
      touchEvents: this.hasTouchEvents(),
      pointerEvents: this.hasPointerEvents(),
      mediaDevices: this.hasMediaDevices(),
      geolocation: this.hasGeolocation(),
      localStorage: this.hasLocalStorage(),
    };

    return this.cachedCapabilities;
  }

  // ============ Configuration Helpers ============

  /**
   * Get platform-specific haptic configuration
   *
   * Returns a configuration object with OS-specific haptic settings
   * and capability information, useful for initializing haptic systems
   *
   * @returns PlatformHaptics configuration object
   */
  public getPlatformHaptics(): PlatformHaptics {
    const os = this.getOS();
    const supportsVibration = this.hasVibrationAPI();
    const supportsHapticEngine = this.hasHapticEngine();
    const isLowPower = this.getLowPowerModeStatus();

    // Platform-specific defaults
    let maxVibrationDuration = 5000; // Default 5 seconds
    let defaultIntensity = 0.5; // Default 50% intensity

    if (os === 'ios') {
      // iOS haptics are more subtle, shorter bursts recommended
      maxVibrationDuration = 1000;
      defaultIntensity = supportsHapticEngine ? 0.7 : 0.4;
    } else if (os === 'android') {
      // Android supports longer vibrations
      maxVibrationDuration = 5000;
      defaultIntensity = 0.6;
    }

    return {
      os,
      supportsVibration,
      supportsHapticEngine,
      maxVibrationDuration,
      defaultIntensity,
      isLowPowerMode: isLowPower,
    };
  }

  /**
   * Get low-power mode / battery saver status
   *
   * Attempts to detect if device is in low-power mode / battery saver.
   * This is useful for reducing haptic feedback intensity when battery is critical.
   *
   * TODO: Implement full Battery Status API integration
   * TODO: Add periodic battery monitoring
   *
   * @returns true if low-power mode detected or likely
   */
  public getLowPowerModeStatus(): boolean {
    if (this.isSSR) {
      return false;
    }

    try {
      // Check for media query support (some browsers expose this)
      if (window.matchMedia?.('(prefers-reduced-motion)').matches) {
        // While not exactly battery saver, indicates user preference for reduced motion
        // which correlates with low-power scenarios
        return true;
      }

      // iOS low-power mode detection via Battery Status API (deprecated)
      const nav = navigator as any;
      if (this.isIOS() && nav.getBattery && typeof nav.getBattery === 'function') {
        // This would require async call, so we just return false for now
        // TODO: Implement async battery status check
        return false;
      }

      // Android battery saver detection (future implementation)
      if (this.isAndroid()) {
        // TODO: Check for battery percentage thresholds
        return false;
      }

      return false;
    } catch (err) {
      return false;
    }
  }

  /**
   * Get system battery status (if available)
   *
   * Note: Battery Status API is deprecated, but still works on some platforms.
   * This is a best-effort implementation for legacy compatibility.
   *
   * TODO: Implement async battery monitoring with Battery Status API
   *
   * @returns BatteryStatus object or null if unavailable
   */
  public async getBatteryStatus(): Promise<BatteryStatus | null> {
    if (this.isSSR) {
      return null;
    }

    try {
      const nav = navigator as any;

      // Try Battery Status API (deprecated)
      if (typeof nav.getBattery === 'function') {
        const battery = await nav.getBattery();
        return {
          level: battery.level || 0,
          charging: battery.charging || false,
          chargingTime: battery.chargingTime || 0,
          dischargingTime: battery.dischargingTime || 0,
        };
      }

      return null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Get a human-readable platform summary
   *
   * Useful for logging, debugging, and user-facing information
   *
   * @returns String describing the platform
   */
  public getPlatformSummary(): string {
    const os = this.getOS();
    const browser = this.getBrowser();
    const context = this.getAppContext();
    const isMobile = this.isMobileDevice();
    const caps = this.getDeviceCapabilities();

    const capsSummary = [
      caps.vibration && 'vibration',
      caps.hapticEngine && 'hapticEngine',
      caps.accelerometer && 'accelerometer',
      caps.gyroscope && 'gyroscope',
    ]
      .filter(Boolean)
      .join(', ');

    return `${os}/${browser} (${context}, ${isMobile ? 'mobile' : 'desktop'}) [${capsSummary}]`;
  }
}

/**
 * Convenience export - singleton instance
 * Can be imported as: import { platformDetector } from '@cycling/haptics'
 */
export const platformDetector = PlatformDetector.getInstance();
