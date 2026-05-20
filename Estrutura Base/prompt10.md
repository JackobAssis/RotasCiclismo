Let's proceed with option A first and expand the realtime Debug UI with sync observability.

Goals:

* validate the synchronization architecture visually
* validate queue lifecycle
* validate connectivity handling
* improve offline-first observability
* create a complete development monitoring environment

Expand the Debug page to display:

Sync System:

* online/offline status
* sync service status
* pending tasks count
* processing tasks count
* failed tasks count
* completed tasks count

Realtime Sync Events:

* sync:task:started
* sync:task:finished
* sync:task:failed

Task Details:

* task id
* task type
* retry count
* createdAt
* updatedAt
* current status

Queue Visualization:

* pending queue list
* processing state
* retry placeholders
* future conflict placeholders

Important architectural constraints:

* debug page remains read-only
* no direct mutation of sync state from UI
* reflect stores/services/events only
* keep rerenders optimized
* lightweight visualization only

Also include:

* connectivity change events
* manual sync trigger placeholder
* clear completed tasks placeholder
* comments explaining observability goals

Future-ready considerations:

* worker-based processing
* service worker sync
* upload progress tracking
* cloud reconciliation
* multi-device sync debugging

Do not focus on visual polish yet.

Focus on:

* synchronization visibility
* lifecycle validation
* offline-first debugging quality
* system observability.





RESPOSTA:






I'll add sync query helpers to storage, wire a manual trigger into the sync service, and update the Debug page to show sync stats and task lists.

Modified 2 files and checked patch context+14-0
Compacted conversation

Reviewed Debug.tsx and modified file structure
I'll update the Debug page: add sync event subscriptions, online status and task polling, and UI panels for Sync System and Sync Queue. Applying the patch now.

Updated Debug.tsx and checked 2 files+68-8
Done — I updated Debug UI and added a manual sync trigger.

Changes

Files updated: Debug.tsx — added sync observability (online/offline, task counts), subscribed to sync:task:* events, polled storageService.getAllSyncTasks(), and added a Sync Queue panel.
Files updated: sync.service.ts — listen for sync:manual:trigger events so Debug can request immediate processing.
Next steps

Wire sync:manual:clearCompleted to call storageService.removeSyncTask() (or implement a bulk-clear API).
Optionally I can integrate the sync worker (worker <> sync.service messaging) next — want me to do that?