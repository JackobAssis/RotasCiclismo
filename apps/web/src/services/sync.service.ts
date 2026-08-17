import { storageService } from './storage.service';
import { eventBus } from '../lib/eventBus';
import { useAuthStore } from '../stores/auth.store';
import type {
  SyncTask,
  SyncWorkerCommand,
  SyncWorkerResponse,
  SyncWorkerStatus,
} from '../../../../packages/types/src/index';

const POLL_INTERVAL = 10_000; // 10s
const WORKER_RESPONSE_TIMEOUT = 25_000; // 25s per task
const MAX_TASK_BATCH = 5;

let polling = false;
let worker: Worker | null = null;
let workerStatus: SyncWorkerStatus = 'initializing';
const pendingTaskResolvers = new Map<
  number | string,
  {
    resolve: () => void;
    reject: (reason?: unknown) => void;
    timeoutId: number;
    rideId?: string;
  }
>();

function isOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

function setWorkerStatus(status: SyncWorkerStatus) {
  workerStatus = status;
  eventBus.emit('sync:worker:status', { status });
}

function sendTokenToWorker() {
  if (!worker) return;
  const token = useAuthStore.getState().accessToken;
  if (token) {
    worker.postMessage({
      type: 'setAccessToken',
      token,
    });
  }
}

function createWorker(): Worker | null {
  if (worker) return worker;
  if (typeof Worker === 'undefined') {
    setWorkerStatus('error');
    return null;
  }

  const instance = new Worker(new URL('../workers/sync.worker.ts', import.meta.url), {
    type: 'module',
  });

  instance.onmessage = handleWorkerMessage;
  instance.onerror = handleWorkerError;
  setWorkerStatus('initializing');
  worker = instance;

  // Send access token ao worker após criação
  setTimeout(() => sendTokenToWorker(), 100);

  return worker;
}

function terminateWorker() {
  if (!worker) return;
  worker.terminate();
  worker = null;
  setWorkerStatus('terminated');
  pendingTaskResolvers.forEach(({ reject, timeoutId }) => {
    clearTimeout(timeoutId);
    reject(new Error('worker_terminated'));
  });
  pendingTaskResolvers.clear();
}

function handleWorkerError(event: ErrorEvent) {
  setWorkerStatus('error');
  console.warn('Sync worker error', event.message);
}

function handleWorkerMessage(event: MessageEvent<SyncWorkerResponse>) {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  switch (data.type) {
    case 'status':
      setWorkerStatus(data.status);
      return;
    case 'started':
      eventBus.emit('sync:task:started', { taskId: data.taskId, rideId: data.rideId });
      return;
    case 'progress':
      eventBus.emit('sync:task:progress', {
        taskId: data.taskId,
        progress: data.progress,
        message: data.message,
      });
      return;
    case 'success':
      processWorkerSuccess(data.taskId, data.rideId);
      return;
    case 'failure':
      processWorkerFailure(data.taskId, data.rideId, data.error, data.recoverable);
      return;
    default:
      return;
  }
}

async function processWorkerSuccess(taskId: number | string, rideId: string) {
  pendingTaskResolvers.get(taskId)?.resolve();
  clearTaskTimeout(taskId);

  await storageService.updateSyncTask(taskId, { status: 'completed' });
  await storageService.removeSyncTask(taskId);
  eventBus.emit('sync:task:finished', { taskId, rideId, ok: true });
}

async function processWorkerFailure(
  taskId: number | string,
  rideId: string,
  error?: string,
  recoverable = true,
) {
  pendingTaskResolvers.get(taskId)?.reject(new Error(error ?? 'sync_failure'));
  clearTaskTimeout(taskId);

  const attempts = (await getTaskAttempts(taskId)) + 1;
  await storageService.updateSyncTask(taskId, { status: 'failed', attempts });
  eventBus.emit('sync:task:failed', { taskId, rideId, attempts, error });

  if (recoverable) {
    const backoffMs = Math.min(60_000, 1000 * Math.pow(2, attempts));
    setTimeout(() => {
      processQueueOnce().catch(() => {});
    }, backoffMs);
  }
}

function clearTaskTimeout(taskId: number | string) {
  const resolver = pendingTaskResolvers.get(taskId);
  if (!resolver) return;
  clearTimeout(resolver.timeoutId);
  pendingTaskResolvers.delete(taskId);
}

async function getTaskAttempts(taskId: number | string): Promise<number> {
  const tasks = await storageService.getAllSyncTasks();
  const task = tasks.find((t) => t.id === taskId);
  return task?.attempts ?? 0;
}

function createWorkerTimeout(taskId: number | string, rideId?: string) {
  return window.setTimeout(async () => {
    if (!pendingTaskResolvers.has(taskId)) return;
    pendingTaskResolvers.get(taskId)?.reject(new Error('worker_timeout'));
    clearTaskTimeout(taskId);
    await storageService.updateSyncTask(taskId, { status: 'failed' });
    eventBus.emit('sync:task:failed', {
      taskId,
      rideId: rideId ?? String(taskId),
      attempts: await getTaskAttempts(taskId),
      error: 'worker_timeout',
    });
  }, WORKER_RESPONSE_TIMEOUT);
}

function dispatchTaskBatch(tasks: SyncTask[]) {
  const activeWorker = createWorker();
  if (!activeWorker) return Promise.reject(new Error('worker_unavailable'));

  setWorkerStatus('busy');

  const payload: SyncWorkerCommand = {
    type: 'processTasks',
    tasks: tasks.map((task) => ({ ...task })),
  };

  const taskPromises: Promise<void>[] = [];
  for (const task of tasks) {
    const taskId = task.id as number | string;
    if (taskId == null) continue;

    const taskPromise = new Promise<void>((resolve, reject) => {
      const timeoutId = createWorkerTimeout(taskId, task.rideId);
      pendingTaskResolvers.set(taskId, { resolve, reject, timeoutId, rideId: task.rideId });
    });

    taskPromises.push(taskPromise);
  }

  activeWorker.postMessage(payload);
  return Promise.allSettled(taskPromises);
}

async function processQueueOnce() {
  if (!isOnline()) return;
  if (workerStatus === 'busy') return;

  const tasks = await storageService.getPendingSyncTasks(MAX_TASK_BATCH);
  if (!tasks.length) return;

  const batch = tasks.slice(0, Math.min(tasks.length, MAX_TASK_BATCH));

  for (const task of batch) {
    await storageService.updateSyncTask(task.id as number | string, {
      status: 'in_progress',
      attempts: (task.attempts || 0) + 1,
    });
  }

  await dispatchTaskBatch(batch);
}

export const syncService = {
  start() {
    if (polling) return;
    polling = true;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        processQueueOnce().catch(() => {});
      });
      window.addEventListener('offline', () => {
        setWorkerStatus('idle');
      });
    }

    createWorker();

    (async function loop() {
      while (polling) {
        try {
          await processQueueOnce();
        } catch (e) {
          // keep going even when the worker or queue fails
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL));
      }
    })();

    eventBus.on('sync:manual:trigger', () => {
      processQueueOnce().catch(() => {});
    });
    eventBus.on('sync:manual:cancel', ({ taskId }: { taskId: number | string }) => {
      if (!worker) return;
      worker.postMessage({ type: 'cancelTasks', taskIds: [taskId] });
    });
    eventBus.on('sync:manual:clearCompleted', async () => {
      const tasks = await storageService.getAllSyncTasks();
      const completed = tasks.filter((task) => task.status === 'completed');
      await Promise.all(
        completed.map((task) => storageService.removeSyncTask(task.id as number | string)),
      );
    });
  },

  stop() {
    polling = false;
    terminateWorker();
  },
};

syncService.start();
