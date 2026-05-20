import React, { useEffect, useState, useRef } from 'react';
import { useGPSStore } from '../stores/gps.store';
import { useRideStore } from '../stores/ride.store';
import { eventBus } from '../lib/eventBus';
import { storageService } from '../services/storage.service';

type LogEntry = { id: string; at: string; type: string; preview: string };

function fmt(obj: any) {
  try {
    return JSON.stringify(obj, null, 0);
  } catch (e) {
    return String(obj);
  }
}

export default function Debug() {
  const gps = useGPSStore((s) => ({
    last: s.lastPosition,
    status: s.status,
    bufferSize: s.buffer.length
  }));

  const ride = useRideStore((s) => ({ active: s.active, status: s.status }));

  const startTracking = useGPSStore((s) => s.startTracking);
  const stopTracking = useGPSStore((s) => s.stopTracking);

  const startRide = useRideStore((s) => s.startRide);
  const pauseRide = useRideStore((s) => s.pauseRide);
  const resumeRide = useRideStore((s) => s.resumeRide);
  const finishRide = useRideStore((s) => s.finishRide);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const push = (type: string, payload: any) => {
      const entry: LogEntry = {
        id: String(Date.now()) + Math.random().toString(16).slice(2),
        at: new Date().toISOString(),
        type,
        preview: fmt(payload)
      };
      setLogs((s) => [...s.slice(-200), entry]);
    };

    // Subscribe to important events
    const unsubs = [
      eventBus.on('point:received', (p) => push('point:received', { lat: p.latitude, lon: p.longitude, ts: p.timestamp })),
      eventBus.on('snapshot:taken', (s) => push('snapshot:taken', { id: s.id, ts: s.timestamp })),
      eventBus.on('ride:started', (r) => push('ride:started', { id: r.id, mode: r.mode })),
      eventBus.on('ride:paused', (p) => push('ride:paused', p)),
      eventBus.on('ride:resumed', (p) => push('ride:resumed', p)),
      eventBus.on('ride:finished', (f) => push('ride:finished', f)),
      eventBus.on('analytics:update', (a) => push('analytics:update', a)),
      eventBus.on('safety:sos', (s) => push('safety:sos', s)),
      eventBus.on('gps:flushed', (f) => push('gps:flushed', f)),
      eventBus.on('sync:task:started', (t) => push('sync:task:started', t)),
      eventBus.on('sync:task:progress', (t) => push('sync:task:progress', t)),
      eventBus.on('sync:task:finished', (t) => push('sync:task:finished', t)),
      eventBus.on('sync:task:failed', (t) => push('sync:task:failed', t)),
      eventBus.on('sync:worker:status', (s) => push('sync:worker:status', s))
    ];

    return () => unsubs.forEach((u) => u && u());
  }, []);

  useEffect(() => {
    // auto-scroll when new logs arrive
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs.length]);

  // Sync observability
  const [online, setOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [workerStatus, setWorkerStatus] = useState<string>('initializing');
  const [syncTasks, setSyncTasks] = useState<any[]>([]);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    let mounted = true;
    async function refreshTasks() {
      try {
        const all = await storageService.getAllSyncTasks();
        if (mounted) setSyncTasks(all || []);
      } catch (e) {
        // ignore
      }
    }
    refreshTasks();

    const unsubs = [
      eventBus.on('sync:task:started', () => refreshTasks()),
      eventBus.on('sync:task:progress', () => refreshTasks()),
      eventBus.on('sync:task:finished', () => refreshTasks()),
      eventBus.on('sync:task:failed', () => refreshTasks()),
      eventBus.on('sync:worker:status', (status) => setWorkerStatus(status.status))
    ];

    const poll = setInterval(refreshTasks, 5000);

    return () => {
      mounted = false;
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      unsubs.forEach((u) => u && u());
      clearInterval(poll);
    };
  }, []);

  return (
    <div className="p-4 text-sm font-mono text-white bg-gray-900 min-h-screen">
      <h1 className="text-xl mb-4">Realtime Debug — GPS & Ride Pipeline</h1>

      <section className="grid grid-cols-3 gap-4 mb-4">
        <div className="p-3 bg-gray-800 rounded">
          <h2 className="font-semibold mb-2">GPS Status</h2>
          <div>Status: {gps.status}</div>
          <div>Buffer size: {gps.bufferSize}</div>
          <div>Last lat: {gps.last?.latitude ?? '—'}</div>
          <div>Last lon: {gps.last?.longitude ?? '—'}</div>
          <div>Accuracy: {gps.last?.accuracy ?? '—'}</div>
          <div>Altitude: {gps.last?.altitude ?? '—'}</div>
          <div>Speed: {gps.last?.speed ?? '—'}</div>
          <div>Heading: {gps.last?.heading ?? '—'}</div>
          <div>Timestamp: {gps.last?.timestamp ?? '—'}</div>
          <div className="mt-2 flex gap-2">
            <button onClick={() => startTracking({ enableHighAccuracy: false })} className="px-3 py-1 bg-green-600 rounded">Start</button>
            <button onClick={() => stopTracking()} className="px-3 py-1 bg-red-600 rounded">Stop</button>
          </div>
        </div>

        <div className="p-3 bg-gray-800 rounded">
          <h2 className="font-semibold mb-2">Ride Session</h2>
          <div>Session status: {ride.status}</div>
          <div>Mode: {ride.active?.mode ?? '—'}</div>
          <div>StartedAt: {ride.active?.startedAt ?? '—'}</div>
          <div>Duration: {ride.active?.duration ?? '—'}</div>
          <div>Total points: {ride.active?.route?.length ?? 0}</div>
          <div>Snapshots: {ride.active?.snapshots?.length ?? 0}</div>
          <div className="mt-2 flex gap-2">
            <button onClick={() => startRide({ id: String(Date.now()), mode: 'GPS_ONLY' })} className="px-3 py-1 bg-green-600 rounded">Start Ride</button>
            <button onClick={() => pauseRide()} className="px-3 py-1 bg-yellow-600 rounded">Pause</button>
            <button onClick={() => resumeRide()} className="px-3 py-1 bg-blue-600 rounded">Resume</button>
            <button onClick={() => finishRide()} className="px-3 py-1 bg-red-600 rounded">Finish</button>
          </div>
        </div>

        <div className="p-3 bg-gray-800 rounded">
          <h2 className="font-semibold mb-2">Buffer & Flush</h2>
          <div>Current buffer size: {gps.bufferSize}</div>
          <div>Flush interval (ms): {useGPSStore.getState().flushIntervalMs}</div>
          <div>Flush batch size: {useGPSStore.getState().flushBatchSize}</div>
          <div className="mt-2">
            <button onClick={() => useGPSStore.getState().flushBuffer()} className="px-3 py-1 bg-indigo-600 rounded">Manual Flush</button>
          </div>
        </div>
      </section>
      <section className="mb-4">
        <div className="p-3 bg-gray-800 rounded">
          <h3 className="font-semibold mb-2">Sync Queue</h3>
          <div className="h-48 overflow-auto p-2 bg-black bg-opacity-10 rounded">
            {syncTasks.map((t) => (
              <div key={t.id} className="border-b border-gray-700 py-2">
                <div className="text-xs text-gray-400">{t.id} — {t.type} — {t.status}</div>
                <div className="text-xs">Attempts: {t.attempts ?? 0} • createdAt: {t.createdAt} • updatedAt: {t.updatedAt}</div>
                <div className="text-xs">Payload: {fmt(t.payload)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-4 grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-800 rounded">
          <h3 className="font-semibold mb-2">Realtime Events</h3>
          <div ref={logRef} className="h-64 overflow-auto bg-black bg-opacity-20 p-2 rounded">
            {logs.map((l) => (
              <div key={l.id} className="mb-1">
                <div className="text-xs text-gray-400">{l.at} — {l.type}</div>
                <div className="text-xs">{l.preview}</div>
              </div>
            ))}
          </div>
          <div className="mt-2">
            <button onClick={() => setLogs([])} className="px-3 py-1 bg-gray-600 rounded">Clear Log</button>
          </div>
        </div>

        <div className="p-3 bg-gray-800 rounded">
          <h3 className="font-semibold mb-2">Sync System</h3>
          <div>Connectivity: {online ? 'online' : 'offline'}</div>
          <div>Worker status: {workerStatus}</div>
          <div>Sync polling: running</div>
          <div>Pending tasks: {syncTasks.filter((t) => t.status === 'pending').length}</div>
          <div>Processing tasks: {syncTasks.filter((t) => t.status === 'in_progress').length}</div>
          <div>Failed tasks: {syncTasks.filter((t) => t.status === 'failed').length}</div>
          <div>Completed tasks: {syncTasks.filter((t) => t.status === 'completed').length}</div>
          <div className="mt-2 flex gap-2">
            <button onClick={() => eventBus.emit('sync:manual:trigger', {})} className="px-3 py-1 bg-indigo-600 rounded">Trigger Sync</button>
            <button onClick={() => eventBus.emit('sync:manual:clearCompleted', {})} className="px-3 py-1 bg-gray-600 rounded">Clear Completed (placeholder)</button>
          </div>
        </div>
      </section>
    </div>
  );
}
