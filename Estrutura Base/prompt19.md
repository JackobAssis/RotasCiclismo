Let's continue evolving the Minimap Overlay System before moving into cinematic motion polish.

Next goals:

* improve minimap interaction UX
* validate overlay interaction behavior
* prepare future navigation-focused experiences
* improve runtime observability

Implement:

Minimap Interaction System:

* tap-to-expand minimap behavior
* temporary expanded overlay mode
* smooth expand/collapse transitions
* lightweight interaction handling
* auto-collapse placeholder support

Minimap Indicators:

* minimap visibility indicator
* minimap runtime status
* active minimap scale indicator
* runtime debug visibility integration

Expanded Minimap Behavior:

* enlarged overlay rendering
* preserve read-only interaction model
* maintain lightweight rendering strategy
* adaptive positioning/sizing
* future navigation placeholder area

Important architectural constraints:

* minimap remains isolated from primary map
* minimap remains rendering-focused only
* avoid coupling with navigation logic
* maintain declarative rendering
* preserve mobile-first ergonomics

Important performance considerations:

* avoid unnecessary tile reloads during expansion
* preserve lightweight polyline sampling
* minimize rerenders during transitions
* prepare future worker-assisted minimap rendering

Visual requirements:

* glassmorphism expanded state
* smooth scale transitions
* touch-safe expansion targets
* adaptive z-index layering
* HUD compatibility during expansion

Also include:

* future turn-by-turn placeholders
* future waypoint placeholders
* future navigation overlays
* comments explaining overlay interaction architecture

Suggested runtime flow:

MinimapOverlay
→ user tap
→ expanded state enabled
→ adaptive overlay rendering
→ HUD adjusts layering
→ minimap expands smoothly
→ future navigation overlays can appear

Do not implement navigation logic yet.

Focus on:

* overlay interaction architecture
* adaptive minimap UX
* runtime overlay ergonomics
* mobile realtime interaction quality.



RESPOSTA:


I'll: 1) add a small minimap.store.ts to track expanded state and provide toggle/auto-collapse; 2) update MinimapOverlay.tsx to use the store, add tap-to-expand/collapse with smooth transitions and map invalidate; 3) update Ride.tsx debug and controls to display minimap state. I'll apply those edits now.

Updated MinimapOverlay.tsx and Ride.tsx, checked 3 files+103-13
Progress update: I added a small minimap store, implemented tap-to-expand/collapse with smooth transitions, and exposed minimap visibility/expanded state in the debug panels.

What I changed

Added minimap.store.ts to track minimap expanded state.
Updated components/MinimapOverlay.tsx:
Tap-to-expand/collapse with useMinimapStore.
Smooth transition via Tailwind transition-all duration-300.
Auto-collapse placeholder after 8s.
MapInner helper invalidates map size when expanded to avoid tile issues.
Expanded state shows larger circle marker and a close button.
Updated pages/Ride.tsx:
Imported useMinimapStore.
Show Minimap Visible and Minimap Expanded in the RuntimeModeControls debug panel.
Show Minimap status (Visible/Expanded/Hidden) in the debug bar.
Notes and tradeoffs

Expansion animates container size; the map is invalidated shortly after expansion to reduce tile glitches.
Tile requests will still occur when the map view/zoom changes; further optimizations (static raster tiles or pre-rendered snapshot) can reduce network usage if needed.
Auto-collapse is a placeholder; you can adjust or remove the timeout in MinimapOverlay as desired.
Minimap state is now globally observable via useMinimapStore, making it easy to integrate other UI (controls, analytics).
Next suggestions (pick one)

Add a small toggle in RuntimeModeControls to open/close the minimap without tapping the overlay.
Add haptic feedback / vibration placeholder for mobile on expand/collapse.
Add an accessibility label and keyboard handler for the minimap control.
Optimize tile usage by switching to a static, low-detail tile server for minimap.
Which would you like next?

