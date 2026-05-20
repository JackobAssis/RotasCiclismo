Let's proceed with option B first and create a realtime debug validation page.

Goals:

* validate the realtime architecture visually
* validate event-driven communication
* validate Ride Session integration
* validate GPS buffering and event flow
* validate store reactivity
* create a safe debugging environment before persistence

Create:

* a dedicated debug page
* lightweight debug HUD
* realtime event stream viewer
* GPS status visualization
* Ride Session visualization
* buffer visualization

The debug page should display:

GPS:

* tracking status
* latitude
* longitude
* accuracy
* altitude
* speed
* heading
* last update timestamp

Ride Session:

* session status
* mode
* duration
* total route points
* snapshots count

Buffer State:

* current buffer size
* flush count
* last flush timestamp

Realtime Events:

* scrolling event log
* timestamped events
* event type
* payload preview

Important architectural constraints:

* debug UI must remain read-only
* HUD/debug components should only reflect stores/events
* no direct mutation from UI
* keep rerenders optimized
* use lightweight components

Also include:

* simple start/stop tracking controls
* start/pause/resume/finish ride controls
* clear event log action
* comments explaining the validation purpose

Future-ready considerations:

* workers integration
* analytics visualization
* route replay debugging
* performance monitoring hooks

Do not focus on visual polish yet.

Focus on:

* architecture validation
* realtime visibility
* debugging clarity
* event flow observability
* development tooling quality.




RESPOSTA:





I'll update the event types to include a gps flush event, emit that from the GPS store, and add a Debug page that subscribes to stores and eventBus to visualize realtime state.

Modified 4 files and added 1 todo+158-6
I've added a realtime debug page and completed the GPS → eventBus → rides pipeline wiring for validation.

Changes made

Added 'gps:flushed' event to events.ts.
GPS store (gps.store.ts):
Buffers points, emits point:received on flush and now emits gps:flushed diagnostic events.
Implements startTracking, stopTracking, handlePosition, flushBuffer.
Includes placeholders for smoothing, throttling, accuracy filtering, battery optimization, and cleanup.
Ride store (ride.store.ts):
Subscribes to eventBus for point:received and snapshot:taken.
Appends points only when session active — rides remains authoritative.
Event bus (existing): typed bus used for all inter-module events.
Debug page (Debug.tsx):
Displays GPS status and last position fields.
Shows Ride Session status, mode, total points and snapshots.
Visualizes buffer size and exposes manual flush.
Realtime event log subscribing to point:received, gps:flushed, ride events, snapshots, analytics and safety events.
Controls: start/stop tracking; start/pause/resume/finish ride; clear event log.
Read-only for domain state (calls only store APIs / services).
How it validates architecture

Confirms event-driven flow: GPS emits events, ride store consumes them (no direct writes).
Buffering reduces emission frequency; debug UI shows buffer size and flush events.
Ride store ownership is enforced by only allowing ride.store to mutate RideSession.
HUD/debug components are read-only; event log demonstrates typed event propagation.
Prepares for workers by emitting both per-point and batch/diagnostic events (gps:flushed) to hook workers or analytics later.
How to run the debug page

Install deps:

pnpm install
Start the web app:

pnpm --filter @cycling/web dev
Open the app in the browser. The debug page is the app entry for now.
Next suggested steps

Implement rides/services/storage.service.ts (IndexedDB) to persist session and queued sync.
Add a lightweight HUD debug overlay that reads ride.store and gps.store selectors with minimal re-renders.
Hook a Web Worker (analytics) to point:received or gps:flushed for offline processing and metrics.
Would you like me to implement the storage service next or add the HUD debug overlay?