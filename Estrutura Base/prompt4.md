Let's proceed with implementing the typed event bus and the Ride Session store skeleton first.

Requirements:

Create:

* a lightweight typed event bus
* ride.store.ts skeleton
* core Ride Session state structure
* ride session lifecycle actions
* typed domain events
* basic module communication foundation

Focus on architecture and scalability first.

Do NOT implement full GPS logic yet.

The goal is to establish:

* realtime communication patterns
* state ownership
* Ride Session lifecycle control
* event-driven architecture
* low-coupling module interaction

Ride store responsibilities:

* startRide()
* pauseRide()
* resumeRide()
* finishRide()
* session status
* active mode
* timestamps
* session metadata
* metrics placeholders
* route points placeholders

Event bus requirements:

* strongly typed events
* lightweight implementation
* subscribe/unsubscribe
* emit/listen pattern
* suitable for realtime updates
* suitable for HUD transient events

Important architectural constraints:

* rides module owns Ride Session lifecycle
* gps module only emits tracking updates
* hud module only reflects state
* camera module remains isolated from GPS
* avoid circular dependencies
* optimize for mobile realtime performance

Also include:

* suggested event naming conventions
* store ownership conventions
* recommendations for future workers integration
* comments explaining architectural intent

Do not implement business-heavy logic yet.

Focus on clean scalable foundations.




RESPOSTA:



I'll add typed event definitions, a generic event-bus in utils, instantiate a typed bus in the web app, and replace the ride store with a lifecycle skeleton.

Modified 4 files and prepared design docs+189-10
Done — I added a typed event bus and a Ride Session store skeleton.

What I implemented

events.ts — typed AppEvents map (ride events, point, snapshot, analytics, safety).
index.ts — re-exported events.
eventBus.ts — generic TypedEventBus<E> with on, off, once, emit, clear.
index.ts — exports TypedEventBus.
eventBus.ts — app-scoped eventBus singleton typed with AppEvents.
ride.store.ts — RideSession lifecycle skeleton (startRide, pauseRide, resumeRide, finishRide, addPoint, addSnapshot), emits/consumes typed events from eventBus.
Notes on architecture & usage

rides module is authoritative for RideSession lifecycle; its store is the only writer for the RideSession entity.
gps should publish raw RoutePoint updates (via eventBus.emit('point:received', point) or by updating gps.store — rides listens and calls addPoint).
camera emits snapshot events; does not read or write ride route directly.
hud subscribes to stores (ride.store, gps.store, analytics.store) and listens to eventBus for transient events — it must never mutate domain stores.
Event naming convention: <domain>:<action> (e.g., ride:started, point:received, snapshot:taken) — consistent, scalable and easy to filter.
Store conventions: module-local zustand stores; other modules call services or publish events to request actions on authoritative stores (no direct cross-store writes).
Workers: heavy processing (analytics, smoothing) should read buffered points from rides/gps or be fed via eventBus and post results back via analytics:update events.
Next steps (options)

Implement gps buffered emitter that uses the bus to publish point:received (no GPS logic yet), or
Implement rides persistence skeleton (IndexedDB storage service and sync queue), or
Add a small example subscriber (HUD debug) to show events flowing.
Which should I implement next?