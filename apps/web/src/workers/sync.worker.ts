import type { SyncTask, SyncWorkerCommand, SyncWorkerResponse, SyncWorkerStatus } from '../../../../packages/types/src/index';

const WORKER_PROGRESS_TICKS = [15, 40, 70, 90, 100];
let cancelledTaskIds = new Set<number | string>();
let activeStatus: SyncWorkerStatus = 'idle';
const workerGlobal = self as unknown as { postMessage: (message: any) => void; close: () => void };

function postWorkerStatus(status: SyncWorkerStatus) {
  activeStatus = status;
  workerGlobal.postMessage({ type: 'status', status });
}

function postWorkerEvent(message: SyncWorkerResponse) {
  workerGlobal.postMessage(message);
}

async function simulateTaskUpload(task: SyncTask) {
  const taskId = task.id as number | string;
  postWorkerEvent({ type: 'started', taskId, rideId: task.rideId });

  for (const progress of WORKER_PROGRESS_TICKS) {
    if (cancelledTaskIds.has(taskId)) {
      throw new Error('cancelled');
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
    postWorkerEvent({
      type: 'progress',
      taskId,
      progress,
      message: progress < 100 ? 'processing' : 'finalizing'
    });
  }

  // Placeholder: real upload logic would go here, e.g. fetch or background sync.
  await new Promise((resolve) => setTimeout(resolve, 200));
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
          await simulateTaskUpload(task);
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
