import { useEffect, useState } from 'react';
import { connectivityService, type ConnectivityStatus } from '../services/connectivity.service';

const statusConfig: Record<ConnectivityStatus, { label: string; dot: string; message: string }> = {
  online: { label: 'Conectado', dot: 'bg-neon-400', message: 'Sincronizando em tempo real' },
  degraded: { label: 'Conexão instável', dot: 'bg-yellow-400', message: 'Algumas funções podem estar limitadas' },
  offline: { label: 'Offline', dot: 'bg-red-400', message: 'Dados salvos localmente, sincronização automática quando reconectar' },
};

export function OfflineIndicator() {
  const [status, setStatus] = useState<ConnectivityStatus>(connectivityService.getState().status);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const unsubscribe = connectivityService.subscribe((state) => {
      setStatus(state.status);
    });
    return unsubscribe;
  }, []);

  if (status === 'online') return null;

  const config = statusConfig[status];

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium backdrop-blur-md transition-all duration-300"
        style={{
          backgroundColor: status === 'offline' ? 'rgba(220, 38, 38, 0.15)' : 'rgba(234, 179, 8, 0.12)',
          color: status === 'offline' ? '#fca5a5' : '#fde047',
        }}
      >
        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${config.dot}`} />
        <span>{config.label}</span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {expanded && (
        <div
          className="px-4 py-2 text-xs backdrop-blur-md border-b"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            borderColor: status === 'offline' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(234, 179, 8, 0.2)',
            color: '#a3a3a3',
          }}
        >
          <div className="flex items-start gap-2 max-w-md mx-auto">
            <span className="shrink-0 mt-0.5">
              {status === 'offline' ? '📡' : '⚠️'}
            </span>
            <p>{config.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
