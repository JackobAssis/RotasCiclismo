import React, { useRef, useCallback } from 'react';
import useCameraStore from '../stores/camera.store';
import { useMediaStream } from '../hooks/useMediaStream';
import { CameraLoading, CameraIdle, CameraError, CameraActive } from './camera';

interface CameraSurfaceProps {
  className?: string;
}

const CameraSurface: React.FC<CameraSurfaceProps> = ({ className = '' }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stream = useCameraStore((s) => s.stream);
  const status = useCameraStore((s) => s.status);
  const error = useCameraStore((s) => s.error);
  const errorType = useCameraStore((s) => s.errorType);
  const facingMode = useCameraStore((s) => s.facingMode);
  const requestPermissionAndStart = useCameraStore((s) => s.requestPermissionAndStart);
  const stopStream = useCameraStore((s) => s.stopStream);

  useMediaStream(videoRef, stream);

  const handleRetry = useCallback(() => {
    requestPermissionAndStart();
  }, [requestPermissionAndStart]);

  const handleDismiss = useCallback(() => {
    stopStream();
  }, [stopStream]);

  return (
    <div className={`absolute inset-0 ${className} bg-black`}
         data-component="camera-surface">
      {status === 'INITIALIZING' && <CameraLoading />}
      {status === 'IDLE' && <CameraIdle />}
      {status === 'ERROR' && (
        <CameraError
          error={error}
          errorType={errorType}
          onRetry={handleRetry}
          onDismiss={handleDismiss}
        />
      )}
      {status === 'STREAMING' && <CameraActive facingMode={facingMode} />}

      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        autoPlay={false}
        data-testid="camera-video"
      />
    </div>
  );
};

export default CameraSurface;
