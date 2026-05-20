Let's implement the storage service and offline persistence pipeline next.

Goals:

* establish true offline-first architecture
* persist Ride Sessions safely
* persist RoutePoints efficiently
* prepare synchronization architecture
* validate long-session stability

Implement:

* IndexedDB storage service
* Ride Session persistence layer
* RoutePoint persistence strategy
* sync queue skeleton
* recovery/session restore skeleton
* batched writes pipeline

Requirements:

Storage responsibilities:

* persist active RideSession
* persist RoutePoints incrementally
* persist snapshots metadata
* maintain sync queue
* support session recovery after reload/crash
* support future backend synchronization

Important architectural constraints:

* storage layer must remain isolated
* ride.store remains authoritative in-memory state
* storage should subscribe/react to events
* avoid direct IndexedDB access from UI
* optimize for large route datasets
* minimize write frequency
* prevent main-thread blocking

Important performance considerations:

* use batched writes
* prepare for large sessions
* avoid saving every single GPS update immediately
* support future worker integration
* maintain mobile battery efficiency

Suggested flow:

point:received
→ ride.store.addPoint()
→ storage queue
→ batch persist to IndexedDB

finishRide()
→ finalize session persistence
→ enqueue future sync task

Also include:

* database versioning strategy
* object store structure
* cleanup strategy
* recovery strategy
* sync status placeholders
* comments explaining offline-first intent

Do not implement backend sync yet.

Focus on:

* robust local persistence
* scalable offline architecture
* efficient mobile storage strategy
* long-session reliability.




RESPOSTA:




I'll update the typed events, emit point-added events from ride.store, and add an IndexedDB-backed storage.service.ts that subscribes to ride events and batches writes.

Modified 3 files and added 1 todo+206-3
Storage service and offline persistence pipeline implemented.

What I added

events.ts: added types ride:point:added and ride:snapshot:added.
ride.store.ts: now emits ride:point:added and ride:snapshot:added when authoritative appends occur.
storage.service.ts: IndexedDB-backed storage service that:
Defines DB schema (sessions, route_points, snapshots, sync_queue) with versioning.
Subscribes to ride:started, ride:point:added, ride:snapshot:added, ride:finished.
Buffers route points in an in-memory queue and flushes batches to IndexedDB (up to 500 per batch).
Emits diagnostic gps:flushed for monitoring.
Provides APIs: init(), getSession(id), getPointsForRide(rideId), clearAll(), manualFlush().
Architectural notes

Storage subscribes to authoritative rides events — gps never writes directly to DB.
Batched writes and requestIdleCallback usage minimize main-thread blocking and battery cost.
DB uses composite key ['rideId','ts'] for route points and index rideId_idx for efficient retrieval.
sync_queue store provisioned for future backend synchronization tasks.
Recovery: sessions and points are persisted incrementally; getSession and getPointsForRide enable restoring RideSession after reload (integration to be added in rides module).
Cleanup: storageService.clearAll() available for tests/dev; production cleanup strategies should be added later.
Next recommended steps

Integrate a restore flow in rides to load active session on app start (use storageService.getSession() and getPointsForRide()).
Implement rides/services/storage.adapter.ts if you want a thin adapter API rather than the service directly used by events.
Add background sync worker that drains sync_queue to backend when online.
Add test harness or simulate long sessions to validate batched writes and memory usage.
Progress update: Implement storage service and offline persistence marked complete in the todo list.

Would you like me to:

A) Implement session restore on app start (rehydrate ride.store from IndexedDB), or
B) Add background sync queue worker scaffold for future uploads?