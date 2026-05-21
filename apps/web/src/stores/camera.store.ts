import create from 'zustand';
import { CameraPermissionState, CameraStatus } from '../modules/camera/types';

type CameraStoreState = {
  permission: CameraPermissionState;
  status: CameraStatus;
  stream: MediaStream | null;
  error: string | null;

  // Actions
  requestPermissionAndStart: () => Promise<boolean>;
  startStream: () => Promise<boolean>;
  stopStream: () => void;
  setPermission: (p: CameraPermissionState) => void;
  setError: (err: string | null) => void;
};

/**
 * Camera runtime store
 * - Owns getUserMedia lifecycle
 * - Exposes stream and permission state
 * - Ensures proper cleanup of tracks
 * - Isolated from ride lifecycle
 */
export const useCameraStore = create<CameraStoreState>((set, get) => ({
  permission: CameraPermissionState.UNKNOWN,
  status: CameraStatus.IDLE,
  stream: null,
  error: null,

  setPermission: (p) => set({ permission: p }),
  setError: (err) => set({ error: err }),

  requestPermissionAndStart: async () => {
    try {
      set({ status: CameraStatus.INITIALIZING, error: null });

      // Prompt for permission and start stream
      const granted = await get().startStream();
      if (granted) {
        set({ permission: CameraPermissionState.GRANTED });
        return true;
      }

      set({ permission: CameraPermissionState.DENIED, status: CameraStatus.STOPPED });
      return false;
    } catch (e: any) {
      set({ error: e?.message ?? String(e), status: CameraStatus.ERROR });
      return false;
    }
  },

  startStream: async () => {
    // If stream already present, keep it
    if (get().stream) {
      set({ status: CameraStatus.STREAMING });
      return true;
    }

    try {
      set({ status: CameraStatus.INITIALIZING, error: null });

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not available');
      }

      // Prefer rear-facing camera on mobile when possible
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: { facingMode: { ideal: 'environment' } }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints as any);

      set({ stream, status: CameraStatus.STREAMING, permission: CameraPermissionState.GRANTED });
      return true;
    } catch (err: any) {
      const message = err?.message ?? String(err);
      console.warn('Camera start failed:', message);
      set({ error: message, status: CameraStatus.ERROR, permission: CameraPermissionState.DENIED });
      return false;
    }
  },

  stopStream: () => {
    const s = get().stream;
    if (s) {
      // Stop all tracks
      s.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch (e) {
          // ignore
        }
      });
    }

    set({ stream: null, status: CameraStatus.STOPPED });
  }
}));

export default useCameraStore;
