import type { SyncTask, SyncWorkerCommand, SyncWorkerResponse, SyncWorkerStatus } from '../../../../packages/types/src/index';

const API_BASE_URL = self.location.origin;
let cancelledTaskIds = new Set<number | string>();
let activeStatus: SyncWorkerStatus = 'idle';
let currentAccessToken: string | null = null;
const workerGlobal = self as unknown as { postMessage: (message: any) => void; close: () => void };

function postWorkerStatus(status: SyncWorkerStatus) {
  activeStatus = status;
  workerGlobal.postMessage({ type: 'status', status });
}

function postWorkerEvent(message: SyncWorkerResponse) {
  workerGlobal.postMessage(message);
}

/**
 * Faz uma requisição HTTP com retry automático
 */
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

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const backoffMs = Math.min(5000, 1000 * Math.pow(2, attempt));
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw lastError || new Error('Unknown error');
}

/**
 * Executa upload real de rota points para o backend
 */
async function uploadRoutePointsTask(task: SyncTask) {
  const taskId = task.id as number | string;
  postWorkerEvent({ type: 'started', taskId, rideId: task.rideId });

  try {
    if (!task.payload || !Array.isArray(task.payload.points)) {
      throw new Error('Invalid payload: missing points array');
    }

    const points = task.payload.points;
    const rideId = task.rideId;

    postWorkerEvent({
      type: 'progress',
      taskId,
      progress: 20,
      message: `Enviando ${points.length} pontos de rota...`,
    });

    const result = await fetchWithRetry(
      `/route-points/bulk`,
      {
        method: 'POST',
        body: JSON.stringify({
          rideId,
          points,
        }),
      },
      2
    );

    postWorkerEvent({
      type: 'progress',
      taskId,
      progress: 90,
      message: 'Finalizando...',
    });

    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Executa finalização de ride no backend
 */
async function finishRideTask(task: SyncTask) {
  const taskId = task.id as number | string;
  postWorkerEvent({ type: 'started', taskId, rideId: task.rideId });

  try {
    if (!task.payload) {
      throw new Error('Invalid payload: missing ride data');
    }

    const rideId = task.rideId;
    const rideData = task.payload;

    postWorkerEvent({
      type: 'progress',
      taskId,
      progress: 20,
      message: 'Finalizando ride...',
    });

    const result = await fetchWithRetry(
      `/rides/${rideId}/finish`,
      {
        method: 'POST',
        body: JSON.stringify(rideData),
      },
      2
    );

    postWorkerEvent({
      type: 'progress',
      taskId,
      progress: 90,
      message: 'Ride finalizado',
    });

    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Executa upload de snapshot para o backend
 */
async function uploadSnapshotTask(task: SyncTask) {
  const taskId = task.id as number | string;
  postWorkerEvent({ type: 'started', taskId, rideId: task.rideId });

  try {
    if (!task.payload) {
      throw new Error('Invalid payload: missing snapshot data');
    }

    const rideId = task.rideId;
    const snapshotData = task.payload;

    postWorkerEvent({
      type: 'progress',
      taskId,
      progress: 20,
      message: 'Enviando foto...',
    });

    const result = await fetchWithRetry(
      `/snapshots`,
      {
        method: 'POST',
        body: JSON.stringify({
          rideId,
          ...snapshotData,
        }),
      },
      2
    );

    postWorkerEvent({
      type: 'progress',
      taskId,
      progress: 90,
      message: 'Foto enviada',
    });

    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Dispatcher para diferentes tipos de tasks
 */
async function executeRealTaskUpload(task: SyncTask): Promise<any> {
  switch (task.type) {
    case 'route_points_upload':
      return uploadRoutePointsTask(task);

    case 'ride_upload':
      return finishRideTask(task);

    case 'snapshot_upload':
      return uploadSnapshotTask(task);

    default:
      throw new Error(`Unknown task type: ${task.type}`);
  }
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

      postWorkerStatus('busy');
      for (const task of message.tasks) {
        const taskId = task.id as number | string;
        if (taskId == null) {
          postWorkerEvent({ type: 'failure', taskId: 'unknown', rideId: task.rideId, error: 'missing_task_id', recoverable: false });
          continue;
        }

        if (cancelledTaskIds.has(taskId)) {
          postWorkerEvent({ type: 'failure', taskId, rideId: task.rideId, error: 'cancelled', recoverable: true });
          cancelledTaskIds.delete(taskId);
          continue;
        }

        try {
          await executeRealTaskUpload(task);
          postWorkerEvent({ type: 'success', taskId, rideId: task.rideId });
        } catch (error) {
          const isCancelled = cancelledTaskIds.has(taskId);
          cancelledTaskIds.delete(taskId);
          postWorkerEvent({
            type: 'failure',
            taskId,
            rideId: task.rideId,
            error: isCancelled ? 'cancelled' : (error instanceof Error ? error.message : String(error)),
            recoverable: !isCancelled
          });
        }
      }
      postWorkerStatus('idle');
      return;
    }

    case 'cancelTasks': {
      for (const taskId of message.taskIds) {
        cancelledTaskIds.add(taskId);
      }
      return;
    }

    case 'setAccessToken': {
      currentAccessToken = (message as any).token;
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
