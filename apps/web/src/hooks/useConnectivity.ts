import { useState, useEffect } from 'react';
import { connectivityService, type ConnectivityStatus, type ConnectivityState } from '../services/connectivity.service';

export function useConnectivity() {
  const [state, setState] = useState<ConnectivityState>(connectivityService.getState());

  useEffect(() => {
    const unsubscribe = connectivityService.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  return {
    status: state.status,
    isOnline: state.isOnline,
    isOffline: state.isOffline,
    isDegraded: state.isDegraded,
    latency: state.latency,
    lastCheckedAt: state.lastCheckedAt,
    forceCheck: () => connectivityService.forceCheck(),
  };
}

export function useOnlineStatus() {
  const status = useConnectivity();
  return status;
}
