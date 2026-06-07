import React from 'react';

export function CameraActive({ facingMode }: { facingMode: string }) {
  return (
    <div className="absolute top-4 right-4 z-10 pointer-events-none">
      <div className="bg-black/50 backdrop-blur-md rounded-full px-3 py-1.5 text-xs text-white/70 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse" />
        {facingMode === 'user' ? 'Frontal' : 'Traseira'}
      </div>
    </div>
  );
}
