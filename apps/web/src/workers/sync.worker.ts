import type { SyncTask, SyncWorkerCommand, SyncWorkerResponse, SyncWorkerStatus } from '../../../../packages/types/src/index';

const WORKER_LOG = '[SyncWorker]';
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '';
let cancelledTaskIds = new Set<number | string>();
let activeStatus: SyncWorkerStatus = 'idle';
let currentAccessToken: string | null = null;
const workerGlobal = self as unknown as { postMessage: (message: any) => void; close: () => void };

function log(msg: string, data?: Record<string, unknown>) {
  console.log(`${WORKER_LOG} ${msg}`, data ?? '');
}

function postWorkerStatus(status: SyncWorkerStatus) {
  activeStatus = status;
  workerGlobal.postMessage({ type: 'status', status });
}

function postWorkerEvent(message: SyncWorkerResponse) {
  workerGlobal.postMessage(message);
}

async function fetchWithRetry<T = any>(
  endpoint: string,
  options: RequestInit,
  maxRetries: number = 2
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30_000);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      if (currentAccessToken) {
        headers['Authorization'] = `Bearer ${currentAccessToken}`;
      }

      const url = `${API_BASE_URL}${endpoint}`;
      log(`fetch:attempt`, { url, method: options.method, attempt: attempt + 1 });

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(
          `HTTP ${response.status}: ${errorBody.message || response.statusText}`
        );
      }

      const data: T = await response.json();
      log(`fetch:success`, { url, status: response.status });
      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      log(`fetch:error`, { attempt: attempt + 1, error: lastError.message });

      if (attempt < maxRetries) {
        const backoffMs = Math.min(5000, 1000 * Math.pow(2, attempt));
        log(`fetch:retry`, { delayMs: backoffMs });
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw lastError || new Error('Unknown error');
}

async function createRideTask(task: SyncTask) {
  const taskId = task.id as number | string;
  postWorkerEvent({ type: 'started', taskId, rideId: task.rideId });
  log('task:create_ride', { rideId: task.rideId });

  try {
    if (!task.payload) throw new Error('Missing payload');

    postWorkerEvent({ type: 'progress', taskId, progress: 20, message: 'Criando pedalada...' });

    const result = await fetchWithRetry('/rides', {
      method: 'POST',
      body: JSON.stringify(task.payload),
    }, 2);

    postWorkerEvent({ type: 'progress', taskId, progress: 100, message: 'Pedalada criada' });
    log('task:create_ride:success', { rideId: task.rideId });
    return result;
  } catch (error) {
    log('task:create_ride:error', { rideId: task.rideId, error: String(error) });
    throw error;
  }
}

async function uploadRoutePointsTask(task: SyncTask) {
  const taskId = task.id as number | string;
  postWorkerEvent({ type: 'started', taskId, rideId: task.rideId });
  log('task:upload_points', { rideId: task.rideId });

  try {
    if (!task.payload || !Array.isArray(task.payload.points)) {
      throw new Error('Invalid payload: missing points array');
    }

    const points = task.payload.points;
    const rideId = task.rideId;

    postWorkerEvent({ type: 'progress', taskId, progress: 20, message: `Enviando ${points.length} pontos...` });
    log('task:upload_points:progress', { rideId, count: points.length });

    const MAX_BATCH = 10000;
    if (points.length > MAX_BATCH) {
      log('task:upload_points:splitting', { total: points.length, max: MAX_BATCH });
      const chunks: any[][] = [];
      for (let i = 0; i < points.length; i += MAX_BATCH) {
        chunks.push(points.slice(i, i + MAX_BATCH));
      }
      for (let i = 0; i < chunks.length; i++) {
        await fetchWithRetry(`/rides/${rideId}/points/bulk`, {
          method: 'POST',
          body: JSON.stringify({ points: chunks[i] }),
        }, 2);
        log('task:upload_points:chunk', { chunk: i + 1, total: chunks.length, count: chunks[i].length });
      }
    } else {
      await fetchWithRetry(`/rides/${rideId}/points/bulk`, {
        method: 'POST',
        body: JSON.stringify({ points }),
      }, 2);
    }

    postWorkerEvent({ type: 'progress', taskId, progress: 90, message: 'Pontos enviados' });
    log('task:upload_points:success', { rideId, count: points.length });
    return { uploaded: points.length };
  } catch (error) {
    log('task:upload_points:error', { rideId: task.rideId, error: String(error) });
    throw error;
  }
}

async function updateRideTask(task: SyncTask) {
  const taskId = task.id as number | string;
  postWorkerEvent({ type: 'started', taskId, rideId: task.rideId });
  log('task:update_ride', { rideId: task.rideId });

  try {
    if (!task.payload) throw new Error('Missing payload');

    postWorkerEvent({ type: 'progress', taskId, progress: 20, message: 'Atualizando pedalada...' });

    const result = await fetchWithRetry(`/rides/${task.rideId}`, {
      method: 'PATCH',
      body: JSON.stringify(task.payload),
    }, 2);

    postWorkerEvent({ type: 'progress', taskId, progress: 100, message: 'Pedalada atualizada' });
    log('task:update_ride:success', { rideId: task.rideId });
    return result;
  } catch (error) {
    log('task:update_ride:error', { rideId: task.rideId, error: String(error) });
    throw error;
  }
}

async function finishRideTask(task: SyncTask) {
  const taskId = task.id as number | string;
  postWorkerEvent({ type: 'started', taskId, rideId: task.rideId });
  log('task:finish_ride', { rideId: task.rideId });

  try {
    if (!task.payload) throw new Error('Missing payload');

    postWorkerEvent({ type: 'progress', taskId, progress: 20, message: 'Finalizando pedalada...' });

    const result = await fetchWithRetry(`/rides/${task.rideId}/finish`, {
      method: 'POST',
      body: JSON.stringify(task.payload),
    }, 2);

    postWorkerEvent({ type: 'progress', taskId, progress: 100, message: 'Pedalada finalizada' });
    log('task:finish_ride:success', { rideId: task.rideId });
    return result;
  } catch (error) {
    log('task:finish_ride:error', { rideId: task.rideId, error: String(error) });
    throw error;
  }
}

async function uploadSnapshotTask(task: SyncTask) {
  const taskId = task.id as number | string;
  postWorkerEvent({ type: 'started', taskId, rideId: task.rideId });
  log('task:upload_snapshot', { rideId: task.rideId, snapshotId: task.payload?.id });

  try {
    if (!task.payload) throw new Error('Missing payload');

    const { id, ...snapshotData } = task.payload;

    postWorkerEvent({ type: 'progress', taskId, progress: 20, message: 'Enviando snapshot...' });

    const result = await fetchWithRetry(`/rides/${task.rideId}/snapshots`, {
      method: 'POST',
      body: JSON.stringify(snapshotData),
    }, 2);

    postWorkerEvent({ type: 'progress', taskId, progress: 100, message: 'Snapshot enviado' });
    log('task:upload_snapshot:success', { rideId: task.rideId, snapshotId: id });
    return result;
  } catch (error) {
    log('task:upload_snapshot:error', { rideId: task.rideId, error: String(error) });
    throw error;
  }
}

const TASK_DISPATCHER: Record<string, (task: SyncTask) => Promise<any>> = {
  RIDE_CREATE: createRideTask,
  RIDE_UPDATE: updateRideTask,
  ROUTE_POINTS_UPLOAD: uploadRoutePointsTask,
  RIDE_FINISH: finishRideTask,
  SNAPSHOT_UPLOAD: uploadSnapshotTask,
};

async function executeRealTaskUpload(task: SyncTask): Promise<any> {
  const handler = TASK_DISPATCHER[task.type];
  if (!handler) {
    throw new Error(`Unknown task type: ${task.type}`);
  }
  return handler(task);
}

self.addEventListener('message', async (ev: MessageEvent<SyncWorkerCommand>) => {
  const message = ev.data;
  if (!message || typeof message !== 'object') return;

  switch (message.type) {
    case 'processTasks': {
      if (!Array.isArray(message.tasks) || message.tasks.length === 0) {
        postWorkerStatus('idle');
        return;
      }

      log('processTasks:start', { count: message.tasks.length });
      postWorkerStatus('busy');

      for (const task of message.tasks) {
        const taskId = task.id as number | string;
        if (taskId == null) {
          log('processTasks:skip', { reason: 'missing_id', rideId: task.rideId });
          postWorkerEvent({
            type: 'failure',
            taskId: 'unknown',
            rideId: task.rideId,
            error: 'missing_task_id',
            recoverable: false,
          });
          continue;
        }

        if (cancelledTaskIds.has(taskId)) {
          log('processTasks:cancelled', { taskId, rideId: task.rideId });
          postWorkerEvent({
            type: 'failure',
            taskId,
            rideId: task.rideId,
            error: 'cancelled',
            recoverable: true,
          });
          cancelledTaskIds.delete(taskId);
          continue;
        }

        try {
          log('processTasks:executing', { taskId, type: task.type, rideId: task.rideId });
          await executeRealTaskUpload(task);
          postWorkerEvent({ type: 'success', taskId, rideId: task.rideId });
          log('processTasks:success', { taskId, type: task.type, rideId: task.rideId });
        } catch (error) {
          const isCancelled = cancelledTaskIds.has(taskId);
          cancelledTaskIds.delete(taskId);
          const errMsg = isCancelled
            ? 'cancelled'
            : error instanceof Error
              ? error.message
              : String(error);
          log('processTasks:failure', { taskId, type: task.type, rideId: task.rideId, error: errMsg });
          postWorkerEvent({
            type: 'failure',
            taskId,
            rideId: task.rideId,
            error: errMsg,
            recoverable: !isCancelled,
          });
        }
      }

      postWorkerStatus('idle');
      log('processTasks:done', {});
      return;
    }

    case 'cancelTasks': {
      for (const taskId of message.taskIds) {
        cancelledTaskIds.add(taskId);
      }
      return;
    }

    case 'setAccessToken': {
      currentAccessToken = message.token;
      log('auth:token_updated', { tokenSet: !!message.token });
      return;
    }

    case 'ping': {
      postWorkerStatus(activeStatus);
      return;
    }

    case 'terminate': {
      postWorkerStatus('terminated');
      workerGlobal.close();
      return;
    }

    default:
      return;
  }
});
