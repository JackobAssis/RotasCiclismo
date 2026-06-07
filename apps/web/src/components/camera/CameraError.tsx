import React from 'react';

interface CameraErrorProps {
  error: string | null;
  errorType: string | null;
  onRetry: () => void;
  onDismiss: () => void;
}

const icons: Record<string, string> = {
  PERMISSION_DENIED: '⊘',
  NOT_FOUND: '◎',
  IN_USE: '◌',
  NOT_SUPPORTED: '⚠',
  TIMEOUT: '⏱',
};

export function CameraError({ error, errorType, onRetry, onDismiss }: CameraErrorProps) {
  const icon = icons[errorType ?? ''] ?? '✕';

  return (
    <div className="absolute inset-0 flex items-center justify-center text-white p-4 z-10">
      <div className="bg-red-900/80 backdrop-blur-md rounded-xl px-6 py-5 text-sm flex flex-col gap-4 items-center max-w-xs border border-red-700/50 shadow-2xl">
        <span className="text-4xl">{icon}</span>
        <div className="text-center text-base font-medium leading-relaxed">
          {error ?? 'Erro ao acessar a câmera.'}
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={onRetry}
            className="flex-1 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 rounded-xl text-sm font-bold transition-all min-h-[48px]"
            style={{ touchAction: 'manipulation', userSelect: 'none' }}
          >
            Tentar novamente
          </button>
          <button
            onClick={onDismiss}
            className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 active:bg-gray-900 rounded-xl text-sm font-medium transition-all min-h-[48px] border border-gray-700"
            style={{ touchAction: 'manipulation', userSelect: 'none' }}
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
