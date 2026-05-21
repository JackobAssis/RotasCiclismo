export {
  HapticVibrator,
  vibrator,
  VIBRATION_PATTERNS,
  VIBRATION_TIMING,
  type VibrationType,
  type VibratorState,
} from './vibration';

export {
  createMinimapExpandFeedback,
  createMinimapCollapseFeedback,
  createModeSwitchFeedback,
  createRecordingStartFeedback,
  createRecordingStopFeedback,
  createHapticFeedbackSystem,
  type HapticFeedbackSystem,
} from './feedbackHooks';

export {
  PlatformDetector,
  platformDetector,
  type OS,
  type Browser,
  type AppContext,
  type DeviceOrientation,
  type DeviceCapabilities,
  type PlatformHaptics,
  type BatteryStatus,
} from './platformDetection';
