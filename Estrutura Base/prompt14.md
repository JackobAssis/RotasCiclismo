Excellent. The realtime visual foundation is now working.

Before implementing the actual camera runtime, let's create the Runtime Mode System architecture first.

The application will support multiple runtime modes:

* GPS_ONLY
* CAMERA_RECORD
* MAP_FOCUS
* LOW_BATTERY
* FUTURE_AR_MODE

Goals:

* establish runtime rendering orchestration
* control visual composition behavior
* coordinate map/camera/HUD responsibilities
* prepare adaptive mobile rendering strategies

Implement:

Runtime Mode System:

* centralized runtime mode manager
* runtime mode store
* mode transition architecture
* rendering behavior coordination
* performance profile placeholders

Responsibilities per mode:
GPS_ONLY

* fullscreen map
* lightweight HUD
* battery optimized tracking

CAMERA_RECORD

* camera becomes primary layer
* HUD overlays on top
* minimap overlay
* recording indicators

MAP_FOCUS

* large map emphasis
* reduced HUD density
* navigation-oriented layout

LOW_BATTERY

* reduced GPS frequency placeholders
* simplified rendering
* reduced update frequency
* minimized overlays

Important architectural constraints:

* runtime modes remain isolated from business logic
* mode system coordinates rendering only
* avoid coupling runtime mode with Ride lifecycle
* maintain modular UI boundaries
* prepare future adaptive rendering

Also include:

* runtime mode enums/types
* rendering profile definitions
* mode capability flags
* future device capability detection placeholders
* future thermal/battery adaptation placeholders
* comments explaining rendering orchestration intent

Suggested architecture:

RuntimeModeStore
→ controls rendering profiles
→ coordinates HUD composition
→ coordinates map visibility
→ future camera visibility
→ future battery optimizations

Do not implement real camera streaming yet.

Focus on:

* runtime orchestration architecture
* adaptive rendering foundation
* scalable visual mode system
* future mobile performance strategies.




RESPOSTA:



Update Completed
✅ Map.tsx

Finished the conditional render path.
When useShouldShowMap() returns false, the component now shows a runtime-mode placeholder:
Map disabled in {profile.mode} mode
✅ OverlayManager.tsx

Integrated runtime HUD density handling.
OverlayManager now:
reads useShouldShowHud() and useHudDensity()
hides HUD entirely when runtime mode disables it
filters registered widgets for 'full' | 'normal' | 'minimal' density
keeps layer/z-index rendering intact
✅ runtime.store.ts

Fixed import path for runtime type definitions to ../modules/runtime/types.
Validation
Checked Map.tsx, OverlayManager.tsx, and runtime.store.ts
No editor errors found
If you want, I can continue with the next step: adding runtime mode controls to Ride.tsx.

