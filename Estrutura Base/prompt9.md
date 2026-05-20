Let's implement the background sync queue worker skeleton next.

Goals:

* complete the offline-first infrastructure foundation
* prepare future backend synchronization
* establish reliable background sync architecture
* support long offline usage sessions

Implement:

* sync queue worker skeleton
* queue processing service
* connectivity detection
* retry strategy placeholders
* sync task lifecycle
* background processing pipeline

Requirements:

Sync responsibilities:

* process queued synchronization tasks
* detect online/offline state
* manage retry attempts
* manage sync status
* prepare future API uploads
* avoid duplicate processing

Important architectural constraints:

* sync system must remain isolated
* storage remains source of persisted truth
* ride.store remains runtime authority
* sync worker should consume sync_queue only
* avoid direct UI dependencies
* prepare worker-friendly architecture

Important performance considerations:

* low battery impact
* background-safe processing
* throttled retries
* batched synchronization
* future Service Worker compatibility

Suggested flow:

Ride finished
→ sync task added to sync_queue
→ sync worker detects connectivity
→ task processing starts
→ upload placeholder executes
→ task status updated

Also include:

* sync status enum
* task lifecycle states
* retry placeholders
* exponential backoff placeholders
* queue cleanup placeholders
* conflict resolution placeholders
* future authentication placeholders
* comments explaining architectural intent

Do not implement real backend uploads yet.

Focus on:

* scalable synchronization architecture
* robust queue processing foundation
* offline-first continuity
* future cloud synchronization readiness.




RESPOSTA:




I'll add SyncTask types, extend storage.service with queue helpers, add a sync worker skeleton, and implement sync.service.ts with connectivity detection and processing loop (placeholders for upload and retry). I'll wire storage to enqueue sync tasks on ride finish.

Modified 4 files and added 1 todo+187-2
Done — background sync queue skeleton implemented and wired into the offline pipeline.

What I added

index.ts: SyncTask and SyncStatus types.
sync.worker.ts: lightweight sync worker skeleton (placeholder for uploads).
sync.service.ts: sync queue processor with:
connectivity detection (navigator.onLine, online event)
polling loop (configurable interval)
per-task lifecycle handling with placeholders for upload, retry/backoff, and events
emits sync:task:started, sync:task:finished, sync:task:failed on eventBus
storage.service.ts: added sync queue helpers:
enqueueSyncTask, getPendingSyncTasks, updateSyncTask, removeSyncTask
storage now enqueues a ride_upload task on ride:finished
Sync flow:
ride:finished -> storage enqueues sync task
sync.service polls the queue when online -> processes tasks -> marks completed/failed -> emits events
Worker can be used later by posting tasks to sync.worker.ts
Design & constraints preserved

Storage remains the source of persisted truth; sync service consumes sync_queue only.
ride.store remains runtime authority; sync uses storage records for uploads.
Sync is isolated: UI does not interact directly with sync internals.
Placeholders included for exponential backoff, retry limits, conflict handling, authentication hooks, and Service Worker integration.
How to test locally

Start a ride, generate points, finish the ride. storageService will enqueue a sync task.
Sync service runs automatically and will simulate task processing (no real upload).
Monitor events via the debug UI (it subscribes to sync:task:* events if you want to add them to the log).
Next suggestions

Add sync:task listeners to the Debug page for visibility.
Replace inline simulated uploads with worker-based processing (new Worker('workers/sync.worker.js')) and message passing.
Add authentication token usage in sync worker for secure uploads.
Implement retry limit and permanent failure handling (notify user).
Shall I:

A) Add sync task events to the Debug page's log for visibility, or
B) Wire the sync worker (create Worker instance) and route tasks to it (still simulated)?