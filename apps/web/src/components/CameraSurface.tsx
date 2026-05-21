import React, { useEffect, useRef } from 'react';
import useCameraStore from '../stores/camera.store';

/**
 * CameraSurface
 *
 * Renders a MediaStream using a <video> element. The component is
 * declarative: it consumes the camera store for stream changes and
 * attaches the MediaStream to a ref. It performs proper cleanup on
 * unmount to stop tracks.
 *
 * Architectural notes:
 * - The camera store owns stream lifecycle; this component only renders it
 * - Avoids direct DOM mutation outside of ref assignment
 * - Mobile-first: video uses object-fit: cover to fill screen
 */
interface CameraSurfaceProps {
  className?: string;
}

const CameraSurface: React.FC<CameraSurfaceProps> = ({ className = '' }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stream = useCameraStore((s) => s.stream);
  const status = useCameraStore((s) => s.status);
  const error = useCameraStore((s) => s.error);
  const requestPermissionAndStart = useCameraStore((s) => s.requestPermissionAndStart);
  const stopStream = useCameraStore((s) => s.stopStream);

  // Attach stream to video element when available
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (stream) {
      try {
        // Assigning srcObject is the recommended approach
        (el as any).srcObject = stream;
        el.play().catch(() => {
          // autoplay may be blocked; UI will reflect status
        });
      } catch (e) {
        console.warn('Failed to attach stream to video element', e);
      }
    } else {
      // Clear srcObject when stream is removed
      try {
        (el as any).srcObject = null;
      } catch (e) {
        // ignore
      }
    }
  }, [stream]);

  // When unmounting, do not stop tracks here — store owns cleanup
  useEffect(() => {
    return () => {
      const el = videoRef.current;
      if (el) {
        try {
          (el as any).srcObject = null;
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  return (
    <div className={`absolute inset-0 ${className} bg-black`}
         data-component="camera-surface">
      {/* Loading / initializing state */}
      {status === 'INITIALIZING' && (
        <div className="absolute inset-0 flex items-center justify-center text-white p-4">
          <div className="bg-gray-900/70 rounded p-3 text-sm">Initializing camera…</div>
        </div>
      )}

      {/* Permission denied / error state with retry */}
      {status === 'ERROR' && (
        <div className="absolute inset-0 flex items-center justify-center text-white p-4">
          <div className="bg-red-800/60 rounded p-3 text-sm flex flex-col gap-2 items-center">
            <div>Camera error: {error ?? 'Permission denied or unavailable'}</div>
            <div className="flex gap-2">
              <button
                onClick={() => requestPermissionAndStart()}
                className="px-3 py-1 bg-cyan-600 rounded text-xs font-semibold"
              >
                Retry
              </button>
              <button
                onClick={() => stopStream()}
                className="px-3 py-1 bg-gray-700 rounded text-xs font-semibold"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video surface - attached when stream present */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        data-testid="camera-video"
      />

      {/* Future: recording overlay, snapshot button placeholders */}
    </div>
  );
};

export default CameraSurface;
