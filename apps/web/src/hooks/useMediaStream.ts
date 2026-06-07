import { useEffect, useRef } from 'react';

export function useMediaStream(videoRef: React.RefObject<HTMLVideoElement | null>, stream: MediaStream | null) {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    cleanupRef.current?.();
    const el = videoRef.current;
    if (!el) return;

    if (stream) {
      const attachId = setTimeout(() => {
        try {
          (el as any).srcObject = stream;
          setTimeout(() => {
            el.play().catch(() => {});
          }, 50);
        } catch (e) {
          console.warn('Failed to attach stream to video element', e);
        }
      }, 100);

      cleanupRef.current = () => clearTimeout(attachId);
    } else {
      try {
        (el as any).srcObject = null;
      } catch (e) {}
    }
  }, [stream, videoRef]);

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      const el = videoRef.current;
      if (el) {
        try { (el as any).srcObject = null; } catch (e) {}
      }
    };
  }, [videoRef]);
}
