import React from 'react';

export function CameraLoading() {
  return (
    <div className="absolute inset-0 flex items-center justify-center text-white p-4 z-10">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <div className="bg-gray-900/80 rounded-xl px-5 py-3 text-sm font-medium backdrop-blur-sm">
          Ativando câmera…
        </div>
      </div>
    </div>
  );
}
