Let's implement the Minimap Overlay System next.

Goals:

* provide spatial awareness during CAMERA_RECORD mode
* validate overlay-based map composition
* prepare navigation-oriented camera experience
* establish lightweight secondary map rendering

Implement:

Minimap Overlay Component:

* floating minimap overlay
* live route polyline
* current position marker
* lightweight rendering mode
* rounded/glassmorphism visual style

Runtime Integration:

* minimap becomes visible when profile.minimap.visible is true
* CAMERA_RECORD mode enables minimap overlay
* runtime modes control minimap visibility declaratively
* minimap remains independent from main map rendering

Important architectural constraints:

* minimap is isolated from primary map instance
* minimap remains read-only
* minimap subscribes through selectors only
* avoid duplicating heavy rendering logic
* prepare future lightweight rendering optimizations

Important performance considerations:

* reduced tile updates
* reduced route sampling
* lightweight marker updates
* future worker-assisted route simplification
* mobile GPU/battery awareness

Visual requirements:

* corner overlay positioning
* adaptive sizing based on runtime profile
* touch-safe margins
* glassmorphism styling
* HUD compatibility
* future navigation overlay compatibility

Also include:

* minimap visibility indicators
* minimap runtime status
* future navigation placeholders
* future turn-by-turn placeholders
* comments explaining overlay map architecture

Suggested runtime flow:

RuntimeModeStore
→ minimap visibility enabled
→ MinimapOverlay renders
→ subscribes to ride selectors
→ renders lightweight route
→ overlays above camera layer
→ HUD overlays remain above minimap

Do not implement navigation logic yet.

Focus on:

* overlay map architecture
* lightweight realtime rendering
* camera/minimap composition
* runtime adaptive UX
* mobile rendering efficiency.



RESPOSTA:


I'll update the todo list to mark camera lifecycle tasks done and add minimap tasks, then add the MinimapOverlay component and integrate it into Ride.tsx.

Updated MinimapOverlay.tsx and Ride.tsx+109-1
Progress update: I updated the todo list and implemented the Minimap Overlay.

What I changed

Updated TODOs to mark camera lifecycle tasks completed and added minimap tasks.
Added components/MinimapOverlay.tsx:
Small, read-only Leaflet MapContainer with reduced interactions.
Lightweight route sampling and polyline rendering.
Current-position CircleMarker.
Glassmorphism styling, rounded corners, shadow.
Adaptive sizing (large/medium/small) based on profile.minimap.scale.
Positioned according to profile.minimap.position.
Minimap status pill ("Minimap • Live").
Integrated MinimapOverlay into pages/Ride.tsx to render when profile.minimap.visible is true (so CAMERA_RECORD will show it).
Notes on constraints and performance

Minimap is isolated from primary map: uses its own MapContainer.
Read-only: all interactive behaviors disabled (dragging, scrollWheelZoom, etc.).
Uses reduced sampling (maxPoints) to keep polyline light.
Designed for easy future optimization (worker-based simplification, tile culling).
Placed between camera and HUD layers (z-index ~150) so HUD overlays stay on top.
Next options

Add a minimap visibility indicator in RuntimeModeControls and the debug panel (todo item 8).
Reduce tile updates further by switching to a static raster or pre-rendered tile source for minimap.
Add a small toggle to temporarily expand minimap on touch.
Which next step should I implement?