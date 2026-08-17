import React, { useEffect, useState, useRef } from 'react';
import { useGPSStore } from '../stores/gps.store';
import { useRideStore } from '../stores/ride.store';
import { eventBus } from '../lib/eventBus';
import { storageService } from '../services/storage.service';
import type { SyncTask } from '../../../../packages/types/src/index';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Section } from '../components/ui/Section';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

type LogEntry = { id: string; at: string; type: string; preview: string };

function fmt(obj: unknown) {
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
    bufferSize: s.buffer.length,
  }));

  const ride = useRideStore((s) => ({ active: s.active, status: s.status }));

  const startTracking = useGPSStore((s) => s.startTracking);
  const stopTracking = useGPSStore((s) => s.stopTracking);

  const startRide = useRideStore((s) => s.startRide);
  const pauseRide = useRideStore((s) => s.pauseRide);
  const resumeRide = useRideStore((s) => s.resumeRide);
  const finishRide = useRideStore((s) => s.finishRide);
  const flushBuffer = useGPSStore((s) => s.flushBuffer);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const push = (type: string, payload: unknown) => {
      const entry: LogEntry = {
        id: String(Date.now()) + Math.random().toString(16).slice(2),
        at: new Date().toISOString(),
        type,
        preview: fmt(payload),
      };
      setLogs((s) => [...s.slice(-200), entry]);
    };

    const unsubs = [
      eventBus.on('point:received', (p) =>
        push('point:received', {
          lat: p.latitude,
          lon: p.longitude,
          ts: p.timestamp,
        }),
      ),
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
      eventBus.on('sync:worker:status', (s) => push('sync:worker:status', s)),
    ];

    return () => unsubs.forEach((u) => u && u());
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs.length]);

  const [online, setOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [workerStatus, setWorkerStatus] = useState<string>('initializing');
  const [syncTasks, setSyncTasks] = useState<SyncTask[]>([]);

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
      eventBus.on('sync:worker:status', (status) => setWorkerStatus(status.status)),
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
    <div className="space-y-6">
      <PageHeader title="Debug" subtitle="Painel de monitoramento em tempo real" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="md">
          <Section title="GPS Status">
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <Badge
                  variant={
                    gps.status === 'watching'
                      ? 'success'
                      : gps.status === 'error'
                        ? 'danger'
                        : 'default'
                  }
                >
                  {gps.status}
                </Badge>
              </div>
              <DebugRow label="Buffer" value={String(gps.bufferSize)} />
              <DebugRow label="Latitude" value={gps.last?.latitude?.toFixed(6) ?? '--'} />
              <DebugRow label="Longitude" value={gps.last?.longitude?.toFixed(6) ?? '--'} />
              <DebugRow
                label="Precisão"
                value={gps.last?.accuracy ? `${gps.last.accuracy}m` : '--'}
              />
              <DebugRow
                label="Velocidade"
                value={gps.last?.speed ? `${gps.last.speed.toFixed(1)} km/h` : '--'}
              />
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => startTracking({ enableHighAccuracy: false })}
                >
                  Iniciar
                </Button>
                <Button size="sm" variant="danger" onClick={() => stopTracking()}>
                  Parar
                </Button>
              </div>
            </div>
          </Section>
        </Card>

        <Card padding="md">
          <Section title="Sessão">
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <Badge
                  variant={
                    ride.status === 'active'
                      ? 'success'
                      : ride.status === 'paused'
                        ? 'warning'
                        : ride.status === 'finished'
                          ? 'info'
                          : 'default'
                  }
                >
                  {ride.status}
                </Badge>
              </div>
              <DebugRow label="Modo" value={ride.active?.mode ?? '--'} />
              <DebugRow
                label="Duração"
                value={ride.active?.duration ? `${ride.active.duration}s` : '--'}
              />
              <DebugRow label="Pontos" value={String(ride.active?.route?.length ?? 0)} />
              <DebugRow label="Snapshots" value={String(ride.active?.snapshots?.length ?? 0)} />
              <div className="flex gap-2 pt-2 flex-wrap">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() =>
                    startRide({
                      id: String(Date.now()),
                      mode: 'GPS_ONLY',
                    })
                  }
                >
                  Iniciar
                </Button>
                <Button size="sm" variant="secondary" onClick={() => pauseRide()}>
                  Pausar
                </Button>
                <Button size="sm" variant="secondary" onClick={() => resumeRide()}>
                  Retomar
                </Button>
                <Button size="sm" variant="danger" onClick={() => finishRide()}>
                  Finalizar
                </Button>
              </div>
            </div>
          </Section>
        </Card>

        <Card padding="md">
          <Section title="Buffer">
            <div className="space-y-1.5 text-xs font-mono">
              <DebugRow label="Tamanho" value={String(gps.bufferSize)} />
              <DebugRow label="Flush (ms)" value={String(useGPSStore.getState().flushIntervalMs)} />
              <DebugRow label="Batch" value={String(useGPSStore.getState().flushBatchSize)} />
              <div className="pt-2">
                <Button size="sm" variant="secondary" onClick={() => flushBuffer()}>
                  Flush manual
                </Button>
              </div>
            </div>
          </Section>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card padding="md">
          <Section title="Sync Queue">
            <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-xs">
              {syncTasks.length === 0 ? (
                <p className="text-gray-600 py-4 text-center">Nenhuma tarefa de sync</p>
              ) : (
                syncTasks.map((t) => (
                  <div key={t.id} className="p-2 rounded-lg bg-dark-850 border border-dark-700">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={
                          t.status === 'completed'
                            ? 'success'
                            : t.status === 'failed'
                              ? 'danger'
                              : t.status === 'in_progress'
                                ? 'warning'
                                : 'default'
                        }
                      >
                        {t.status}
                      </Badge>
                      <span className="text-gray-400">{t.type}</span>
                    </div>
                    <div className="text-gray-600">Tentativas: {t.attempts ?? 0}</div>
                  </div>
                ))
              )}
            </div>
          </Section>
        </Card>

        <Card padding="md">
          <Section title="Sistema de Sync">
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-gray-600">Conectividade</span>
                <Badge variant={online ? 'success' : 'danger'}>
                  {online ? 'online' : 'offline'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Worker</span>
                <Badge
                  variant={
                    workerStatus === 'idle'
                      ? 'default'
                      : workerStatus === 'busy'
                        ? 'warning'
                        : 'info'
                  }
                >
                  {workerStatus}
                </Badge>
              </div>
              <DebugRow
                label="Pendentes"
                value={String(syncTasks.filter((t) => t.status === 'pending').length)}
              />
              <DebugRow
                label="Processando"
                value={String(syncTasks.filter((t) => t.status === 'in_progress').length)}
              />
              <DebugRow
                label="Falhas"
                value={String(syncTasks.filter((t) => t.status === 'failed').length)}
              />
              <DebugRow
                label="Completos"
                value={String(syncTasks.filter((t) => t.status === 'completed').length)}
              />
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => eventBus.emit('sync:manual:trigger', {})}
                >
                  Forçar Sync
                </Button>
              </div>
            </div>
          </Section>
        </Card>
      </div>

      <Card padding="md">
        <Section title="Eventos em Tempo Real">
          <div
            ref={logRef}
            className="max-h-64 overflow-y-auto space-y-1 font-mono text-xs bg-dark-950 rounded-lg p-3 border border-dark-700"
          >
            {logs.length === 0 ? (
              <p className="text-gray-600 text-center py-4">Aguardando eventos...</p>
            ) : (
              logs.map((l) => (
                <div key={l.id} className="pb-1.5 border-b border-dark-800 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 shrink-0">{l.at.slice(11, 23)}</span>
                    <Badge variant="default">{l.type}</Badge>
                  </div>
                  <div className="text-gray-500 truncate mt-0.5">{l.preview}</div>
                </div>
              ))
            )}
          </div>
          <div className="mt-2">
            <Button size="sm" variant="ghost" onClick={() => setLogs([])}>
              Limpar log
            </Button>
          </div>
        </Section>
      </Card>
    </div>
  );
}

function DebugRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="text-gray-300">{value}</span>
    </div>
  );
}
