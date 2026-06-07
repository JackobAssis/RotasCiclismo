import create from 'zustand';
import { CameraPermissionState, CameraStatus } from '../modules/camera/types';

type CameraStoreState = {
  permission: CameraPermissionState;
  status: CameraStatus;
  stream: MediaStream | null;
  error: string | null;
  facingMode: string;
  deviceLabel: string;
  errorType: 'PERMISSION_DENIED' | 'NOT_FOUND' | 'IN_USE' | 'NOT_SUPPORTED' | 'TIMEOUT' | 'UNKNOWN' | null;

  // Actions
  requestPermissionAndStart: (options?: { fps?: number; resolution?: '720p' | '1080p' }) => Promise<boolean>;
  startStream: (options?: { fps?: number; resolution?: '720p' | '1080p' }) => Promise<boolean>;
  stopStream: () => void;
};

const GET_USERMEDIA_TIMEOUT = 15000; // 15s max for camera initialization

function getUserMediaWithTimeout(constraints: MediaStreamConstraints, timeoutMs: number): Promise<MediaStream> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new DOMException('Camera initialization timed out', 'TimeoutError'));
    }, timeoutMs);

    navigator.mediaDevices.getUserMedia(constraints as any)
      .then((stream) => {
        clearTimeout(timer);
        resolve(stream);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function classifyCameraError(err: any): CameraStoreState['errorType'] {
  if (!err) return 'UNKNOWN';
  const name = err.name ?? err.constructor?.name ?? '';
  if (name === 'NotAllowedError') return 'PERMISSION_DENIED';
  if (name === 'NotFoundError') return 'NOT_FOUND';
  if (name === 'NotReadableError') return 'IN_USE';
  if (name === 'NotSupportedError') return 'NOT_SUPPORTED';
  if (name === 'TimeoutError') return 'TIMEOUT';
  return 'UNKNOWN';
}

function getUserMediaErrorMessage(errorType: CameraStoreState['errorType']): string {
  switch (errorType) {
    case 'PERMISSION_DENIED': return 'Permissão de câmera negada. Permita o acesso nas configurações do dispositivo.';
    case 'NOT_FOUND': return 'Nenhuma câmera encontrada neste dispositivo.';
    case 'IN_USE': return 'Câmera está sendo usada por outro aplicativo. Feche-o e tente novamente.';
    case 'NOT_SUPPORTED': return 'Câmera não suportada neste dispositivo.';
    case 'TIMEOUT': return 'A câmera não respondeu. Verifique se está disponível.';
    default: return 'Erro ao acessar a câmera. Tente novamente.';
  }
}

export const useCameraStore = create<CameraStoreState>((set, get) => ({
  permission: CameraPermissionState.UNKNOWN,
  status: CameraStatus.IDLE,
  stream: null,
  error: null,
  facingMode: 'environment',
  deviceLabel: '',
  errorType: null,

  requestPermissionAndStart: async (options) => {
    const state = get();

    // Prevent concurrent starts
    if (state.status === CameraStatus.INITIALIZING) return false;

    // Kill any existing stream before requesting a new one
    if (state.stream) {
      state.stream.getTracks().forEach((t) => {
        try { t.stop(); } catch (e) { /* ignore */ }
      });
    }
    set({ stream: null, status: CameraStatus.INITIALIZING, error: null, errorType: null });

    try {
      const granted = await get().startStream(options);
      if (granted) {
        set({ permission: CameraPermissionState.GRANTED });
        return true;
      }
      set({ permission: CameraPermissionState.DENIED, status: CameraStatus.STOPPED });
      return false;
    } catch (e: any) {
      const errorType = classifyCameraError(e);
      const message = getUserMediaErrorMessage(errorType);
      set({ error: message, errorType, status: CameraStatus.ERROR });
      return false;
    }
  },

  startStream: async (options) => {
    const state = get();
    if (state.stream) {
      set({ status: CameraStatus.STREAMING });
      return true;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new DOMException('Camera API not available', 'NotSupportedError');
    }

    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      throw new DOMException('Camera requires HTTPS connection', 'NotSupportedError');
    }

    const fps = options?.fps ?? 30;
    const resolution = options?.resolution ?? '720p';
    const width = resolution === '1080p' ? 1920 : 1280;
    const height = resolution === '1080p' ? 1080 : 720;

    // Try cameras in order: environment → any → user
    const facingModes: Array<'environment' | 'user' | undefined> = ['environment', undefined, 'user'];
    let lastError: Error | null = null;

    for (const facingMode of facingModes) {
      try {
        const videoConstraints: MediaTrackConstraints = {
          width: { ideal: width },
          height: { ideal: height },
          frameRate: { ideal: fps },
        };
        if (facingMode) {
          videoConstraints.facingMode = { ideal: facingMode };
        }

        const constraints: MediaStreamConstraints = { audio: false, video: videoConstraints };

        const stream = await getUserMediaWithTimeout(constraints, GET_USERMEDIA_TIMEOUT);

        const track = stream.getVideoTracks()[0];
        const settings = track.getSettings();

        set({
          stream,
          status: CameraStatus.STREAMING,
          permission: CameraPermissionState.GRANTED,
          facingMode: (settings as any).facingMode ?? facingMode ?? 'environment',
          deviceLabel: track.label || 'Camera',
          error: null,
          errorType: null,
        });
        return true;
      } catch (err: any) {
        lastError = err;
        // Only retry on NotFoundError or NotReadableError (camera in use)
        if (err.name !== 'NotFoundError' && err.name !== 'NotReadableError') {
          break;
        }
      }
    }

    throw lastError ?? new DOMException('No camera available', 'NotFoundError');
  },

  stopStream: () => {
    const s = get().stream;
    if (s) {
      s.getTracks().forEach((t) => {
        try { t.stop(); } catch (e) { /* ignore */ }
      });
    }
    set({ stream: null, status: CameraStatus.STOPPED, errorType: null });
  },
}));

export default useCameraStore;
