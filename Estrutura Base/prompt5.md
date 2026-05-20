Let's proceed with the GPS buffered emitter and realtime tracking pipeline next.

Goals:

* validate the realtime architecture
* validate event-driven communication
* validate Ride Session integration
* validate low-coupling module interaction

Implement:

* useWatchPosition() hook skeleton
* gps.store.ts skeleton
* buffered RoutePoint emitter
* integration with eventBus
* ride.store integration through typed events

Requirements:

GPS module responsibilities:

* own raw GPS tracking state
* own navigator.geolocation.watchPosition()
* emit RoutePoint updates
* manage GPS status
* manage tracking accuracy
* manage tracking lifecycle

Ride store responsibilities:

* consume RoutePoint events
* append points to active Ride Session
* remain authoritative for session route data

Important:

* gps module MUST NOT write directly into ride store
* communication should happen through typed events only
* use buffered updates to reduce excessive rerenders/events
* optimize for mobile battery usage
* prepare architecture for future workers integration

Implement placeholders for:

* smoothing
* throttling
* accuracy filtering
* battery optimization

Suggested flow:

watchPosition()
→ gps.store updates raw position
→ point buffered
→ eventBus.emit('point:received')
→ ride.store.addPoint()
→ hud reflects state

Also include:

* GPS status enum
* tracking states
* error handling skeleton
* cleanup strategy
* unsubscribe strategy
* comments explaining architectural intent

Do not implement heavy calculations yet.

Focus on:

* scalable realtime architecture
* clean data flow
* event-driven tracking pipeline
* mobile-first performance foundation.




RESPOSTA:



I'm going to add the GPS store and update the ride store to subscribe to typed events, plus update the watch hook to use the GPS store; this will establish the buffered emitter and event-driven pipeline.

Modified 3 files and created useWatchPosition hook+202-4
I'll wire up the GPS buffered emitter and ride-store integration now.

Done — implemented the realtime pipeline foundation:

What I added

gps.store.ts — GPS store skeleton

Owns watch lifecycle, status, buffer, flush logic
startTracking(options), stopTracking(), handlePosition(point), flushBuffer()
Emits typed events via eventBus.emit('point:received', point) when flushing
Includes placeholders/comments for smoothing, throttling, accuracy filtering and battery optimizations
Cleanup and error-handling skeleton included
useWatchPosition.ts — hook skeleton to start/stop GPS tracking from components

Uses gps store API; performs cleanup on unmount
ride.store.ts — updated ride store

No longer emits point:received
Subscribes to eventBus for 'point:received' and 'snapshot:taken' and calls addPoint() / addSnapshot() only when session is active
Keeps rides module authoritative for session route data (no direct writes from gps)
eventBus.ts and eventBus.ts (earlier) — typed event bus singleton used across modules

Architectural intent / guarantees

gps module emits events only; it DOES NOT write into ride store (no direct coupling). Ride store consumes events and remains authoritative for RideSession.
Buffering reduces event frequency; flush interval and batch size configurable in gps.store for mobile/battery tuning.
Event-driven flow:
watchPosition() -> gps.store updates -> buffer -> on flush -> eventBus.emit('point:received') -> ride.store listener calls addPoint() -> HUD reads stores to reflect state.
No circular dependencies: modules interact only via stores and the typed eventBus.
Scalability: workers can be introduced later (analytics, smoothing) by subscribing to events or reading buffered data and posting back via eventBus (e.g., analytics:update or processed point:received).
Naming: events use <domain>:<action> convention (ride:started, point:received, snapshot:taken).
How to try it locally (dev)

Start the workspace (after installing with pnpm):

pnpm installpnpm --filter @cycling/web dev
On a page/component, import and call:

import { useWatchPosition } from '@/hooks/useWatchPosition';useWatchPosition(true, { enableHighAccuracy: false });
The gps store will buffer and emit point:received events; ride.store will append points if a ride is active.
Next suggested steps

Implement rides/services/storage.service.ts (IndexedDB) and persistence queue to batch writes from ride.store.
Add a small debug HUD component that subscribes to gps.store and ride.store to visualize points/events for validation.
Optionally wire a simple test harness that simulates navigator.geolocation updates for automated verification.
Would you like me to:

A) Implement the storage service (IndexedDB) and persistence pipeline next, or
B) Add a debug UI page showing realtime GPS and RideSession data (useful to validate pipelines)?