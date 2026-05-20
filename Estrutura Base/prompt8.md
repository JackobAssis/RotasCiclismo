Let's implement the session restore / rehydration flow next.

Goals:

* complete the offline-first foundation
* restore active Ride Sessions after reload/crash
* validate long-session resilience
* support app continuity on mobile devices

Implement:

* Ride Session rehydration flow
* restore active session on app startup
* restore RoutePoints from IndexedDB
* restore ride metadata/state
* rehydrate ride.store safely
* recovery service skeleton

Requirements:

Recovery responsibilities:

* detect unfinished active sessions
* restore RideSession metadata
* restore RoutePoints incrementally
* restore active mode
* restore timestamps
* restore snapshots metadata
* prepare GPS tracking resumption

Important architectural constraints:

* rehydration should NOT replay old events
* recovery should hydrate stores directly
* avoid triggering duplicate persistence events
* maintain rides module ownership
* avoid circular dependencies
* optimize memory usage during restore

Important performance considerations:

* support large route datasets
* restore points progressively if necessary
* avoid blocking initial render
* prepare future worker-assisted restore
* maintain mobile responsiveness

Suggested flow:

App startup
→ storageService.init()
→ detect active RideSession
→ load session metadata
→ load RoutePoints
→ hydrate ride.store
→ restore UI state
→ optionally resume GPS tracking

Also include:

* session recovery status
* corrupted session handling placeholders
* stale session detection placeholders
* recovery strategy comments
* future sync reconciliation placeholders

Do not implement backend reconciliation yet.

Focus on:

* robust recovery architecture
* safe store hydration
* scalable restore pipeline
* offline-first continuity.








RESPOSTA:





Short patch batch: I'll update ride.store.ts, extend storage.service.ts with query/stream methods, add recovery.service.ts, and call recovery init from main.tsx.

Modified 4 files and added 1 todo+141-1
Done — session restore and rehydration flow implemented.

What I changed

ride.store.ts

Added silent hydration APIs: hydrateSession(session), appendPointsSilent(points), appendSnapshotsSilent(snapshots).
These methods update ride.store directly without emitting persistence or lifecycle events.
storage.service.ts

Added getSnapshotsForRide(rideId), getUnfinishedSessions(), and streamPointsForRide(rideId, onChunk, chunkSize) to support incremental restoration and large sessions.
streamPointsForRide uses an IDB cursor and invokes onChunk for each chunk.
recovery.service.ts

New recovery service that:
Initializes storage
Detects unfinished sessions, picks the most recent
Hydrates ride.store with metadata (via hydrateSession)
Streams route points in chunks and appends them silently via appendPointsSilent
Restores snapshot metadata via appendSnapshotsSilent
Avoids replaying events or triggering persistence during restore.
main.tsx

Calls recoveryService.init() non-blocking on startup to rehydrate state.
Design notes / guarantees

Rides module remains authoritative; recovery uses silent APIs to avoid circular writes.
Restoration is incremental (IDB cursor + chunking) to support very large route datasets without blocking UI or exhausting memory.
Storage layer remains isolated: UI never touches IndexedDB directly.
Duplicate persistence avoided: hydration does not emit ride:point:added or ride:started, so storage won't re-write already persisted data.
Recovery leaves the decision to resume GPS tracking to the UI (user may choose to resume).
How to validate

Start the app, create/start a ride, generate points (use debug page), stop app or refresh, then reload — the debug UI should show restored session data (route points count increases as chunks are streamed).
You can use storageService.manualFlush() (exposed) to force a write and validate persistence.
Next recommended steps

Add a lightweight UI confirmation to prompt "Resume previous session?" after recovery, or auto-resume based on user setting.
Add worker-assisted restore (move streamPointsForRide processing into a worker for heavy sessions).
Implement sync_queue processing for backend synchronization when online.
Want me to add an optional auto-resume prompt/UI or implement the background sync queue worker skeleton next?