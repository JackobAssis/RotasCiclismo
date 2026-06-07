import React from 'react';

export function CameraIdle() {
  return (
    <div className="absolute inset-0 flex items-center justify-center text-white p-4 z-10">
      <div className="flex flex-col items-center gap-3">
        <div className="text-3xl text-gray-600">◎</div>
        <div className="bg-gray-900/80 rounded-xl px-5 py-3 text-sm font-medium backdrop-blur-sm">
          Câmera pronta
        </div>
      </div>
    </div>
  );
}
