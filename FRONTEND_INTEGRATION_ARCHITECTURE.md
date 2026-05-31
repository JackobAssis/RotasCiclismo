# 🔗 FRONTEND ↔ BACKEND INTEGRATION ARCHITECTURE

**Connecting the Cycling Routes Runtime to Persistent Backend**

---

## 🎯 PHASE GOAL

Transform isolated frontend runtime into production MVP by:
- ✅ Persisting user data to real backend
- ✅ Maintaining offline-first behavior
- ✅ Preserving cinematic runtime architecture
- ✅ Establishing seamless synchronization
- ✅ Restoring sessions gracefully

**NOT:** Redesigning runtime, breaking motion systems, or tightly coupling layers.

---

## 📐 INTEGRATION ARCHITECTURE

### Current State: Runtime-First Runtime

```
┌─────────────────────────────────────────────┐
│         Frontend (React + Vite)             │
├─────────────────────────────────────────────┤
│                                             │
│  ┌────────────────────────────────────────┐ │
│  │  RUNTIME LAYER (UNTOUCHABLE)          │ │
│  │  ├─ GPS Real-Time (gps.worker.ts)    │ │
│  │  ├─ Motion Processing                │ │
│  │  ├─ Camera Stream                    │ │
│  │  ├─ HUD Widgets                      │ │
│  │  ├─ Map Rendering                    │ │
│  │  ├─ Accessibility Foundations        │ │
│  │  └─ Event Bus (intermodule comms)   │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  ┌────────────────────────────────────────┐ │
│  │  STATE LAYER (Zustand Stores)         │ │
│  │  ├─ ride.store                        │ │
│  │  ├─ gps.store                         │ │
│  │  ├─ camera.store                      │ │
│  │  ├─ runtime.store                     │ │
│  │  └─ minimap.store                     │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  ┌────────────────────────────────────────┐ │
│  │  SYNC QUEUE (Offline-First)           │ │
│  │  ├─ Batches GPS points                │ │
│  │  ├─ Queues snapshots                  │ │
│  │  ├─ Manages ride persistence          │ │
│  │  └─ Handles retries                   │ │
│  └────────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
         ↑
         │  ONLY HERE - No other entry points
         │
    [INTEGRATION LAYER] ← NEW
```

### New Integration Layer (7-Step Implementation)

```
INTEGRATION LAYER (NEW)
├─ Step 1: API Client (Centralized)
│  ├─ Fetch abstraction
│  ├─ Request/response interceptors
│  ├─ Auth token injection
│  ├─ Retry + timeout
│  └─ Offline detection
│
├─ Step 2: Auth Integration
│  ├─ Auth store (Zustand)
│  ├─ Login/signup flows
│  ├─ Session persistence
│  ├─ Token refresh
│  └─ Protected routes
│
├─ Step 3: Sync Queue Integration
│  ├─ Connects existing queue to API
│  ├─ Ride uploads
│  ├─ GPS batch uploads
│  ├─ Snapshot uploads
│  └─ Smart retries
│
├─ Step 4: Ride History UI
│  ├─ History page (queries backend)
│  ├─ Ride details (with route replay)
│  ├─ Metrics display
│  └─ Pagination
│
├─ Step 5: Snapshot Pipeline
│  ├─ Upload integration
│  ├─ Queue management
│  ├─ Progress tracking
│  └─ Thumbnail handling
│
├─ Step 6: Session Restoration
│  ├─ Auth restore
│  ├─ Ride recover
│  ├─ Sync recovery
│  └─ Graceful fallback
│
└─ Step 7: Connectivity Runtime
   ├─ Online/offline detection
   ├─ Sync status UI
   ├─ Upload progress
   └─ Connection quality
```

---

## 🏗️ INTEGRATION DESIGN PRINCIPLES

### 1. Runtime Preservation
- Runtime layer is **completely untouched**
- All GPS, motion, camera, accessibility systems work identically
- Integration layer sits **outside** the runtime
- Runtime continues operating offline

### 2. Zustand as Source of Truth
- Stores remain the single source of truth
- API layer **does not modify** stores directly
- Only through established update mechanisms
- Sync queue manages the coordination

### 3. Offline-First Maintained
- All features work when offline
- Sync queue batches data for later
- Retries happen automatically
- Degraded mode is primary mode

### 4. Layered Integration
```
User Interactions
       ↓
Runtime (GPS, Motion, Accessibility)
       ↓
Zustand Stores (ride, gps, camera, etc.)
       ↓
Sync Queue (local batching)
       ↓
[NEW] API Layer (abstract communication)
       ↓
[NEW] Auth (JWT tokens)
       ↓
Backend APIs (real persistence)
```

### 5. Graceful Degradation
- Works offline (all features)
- Works online with slow connection
- Works online with fast connection
- Automatically adapts

---

## 🔐 AUTH ARCHITECTURE

### Current State: No Auth
```
Frontend (anonymous)
    ↓ (no auth)
    ↓ (local storage only)
Backend (N/A)
```

### After Integration: Session-Based
```
LOGIN FLOW:
User → SignIn Page → POST /auth/signin → JWT + refresh
     ↓ store in memory + localStorage
     ↓
Authenticated API calls (with Bearer token)
     ↓
GET /user/profile + all data endpoints work

REFRESH FLOW:
Token expires → POST /auth/refresh → new JWT
    ↓ retry failed request
    ↓ continue seamlessly

SESSION RESTORE:
App restart → check localStorage → GET /auth/verify
           ↓ if valid → restore user session
           ↓ if invalid → redirect to login
```

### Storage Strategy
```
Memory (fast access):
├─ accessToken (cleared on logout)
├─ refreshToken (cleared on logout)
└─ user object (cleared on logout)

localStorage (persistent):
├─ refreshToken (for session restore)
├─ user ID (for quick recovery)
└─ theme preferences

sessionStorage (browser session):
├─ temporary auth state
└─ current ride ID
```

---

## 📡 SYNC QUEUE INTEGRATION

### Current State: Local-Only Queuing
```
Frontend Runtime:
├─ Records ride (live GPS, camera, HUD)
├─ Batches GPS points every N points
├─ Takes snapshots as needed
├─ Local storage in ride.store
└─ Waits for online status

Sync Queue:
├─ Stores pending operations
├─ Retries when online (TODO)
└─ Manages offline state
```

### After Integration: Backend Synchronization
```
SYNC FLOW:
1. User records ride (all in memory + local)
2. Ride finishes → sync.service batches data:
   - Ride metadata
   - GPS points (100-1000 per batch)
   - Snapshots (with metadata)
3. When online:
   - POST /sync/tasks with batch
   - Backend stores immediately
   - Task marked PENDING → COMPLETED
4. If offline:
   - Queue stored locally
   - Retry when online
   - Exponential backoff
5. Frontend polls /sync/stats:
   - Pending: 5 tasks
   - Completed: 42 tasks
   - Failed: 0 tasks

OPTIMISTIC UPDATES:
- Frontend assumes upload succeeds
- Stores ride as "synced" locally
- If fails: retries automatically
- Conflict resolution: backend wins
```

### Queue Task Types
```
Type                      | Payload           | Size    | Retry
─────────────────────────────────────────────────────────────────
RIDE_CREATE              | ride metadata     | ~1KB    | yes
RIDE_UPDATE              | updates only      | <1KB    | yes
RIDE_FINISH              | final metrics     | ~1KB    | yes
ROUTE_POINTS_UPLOAD      | GPS batch         | ~50KB   | yes
SNAPSHOT_UPLOAD          | photo metadata    | ~5KB    | yes
VIDEO_UPLOAD             | video info        | ~10KB   | yes (later)
```

---

## 🎬 RIDE HISTORY & DETAILS

### New Pages
```
RIDES HISTORY PAGE:
├─ List all past rides
├─ Filter by date, status, mode
├─ Show thumbnail + metrics
├─ Pagination (20 per page)
├─ Pull-to-refresh
├─ Offline: show cached rides only
└─ Tap → ride details

RIDE DETAILS PAGE:
├─ Full ride metadata
├─ Route map with replay foundation
├─ Metrics (distance, time, speed, elevation, calories)
├─ Snapshots gallery
├─ Share/export options (later)
├─ Sync status indicator
└─ Back to history
```

### Data Flow
```
RideHistory Component:
  ├─ useEffect: load rides
  ├─ GET /rides?page=1&limit=20
  ├─ Store in ride.store
  └─ Render list

RideDetail Component:
  ├─ useEffect: load ride
  ├─ GET /rides/:id/with-route
  ├─ Render metadata
  ├─ Render route on map
  └─ Render snapshots
```

---

## 📸 SNAPSHOT UPLOAD INTEGRATION

### Current State: Camera Captures, No Upload
```
Camera Runtime:
├─ Captures frame when user triggers
├─ Stores in camera.store
├─ Shows in HUD
└─ Saves locally (TODO)
```

### After Integration: Async Upload Pipeline
```
SNAPSHOT UPLOAD FLOW:
1. User captures snapshot:
   - Frame captured (base64 or blob)
   - Stored in camera.store
   - Added to ride (local metadata)

2. Queue for upload:
   - Create sync task: SNAPSHOT_UPLOAD
   - Store metadata: {imageData, location, timestamp}
   - Mark upload status: PENDING

3. When online:
   - POST /uploads/url (get upload endpoint)
   - POST snapshot metadata (with imageUrl)
   - Update upload status: UPLOADING
   - Handle retry if fails

4. After complete:
   - Update upload status: COMPLETED
   - Update snapshot record
   - Show in ride details

PROGRESS:
├─ PENDING: not yet uploaded
├─ UPLOADING: in progress (show spinner)
├─ COMPLETED: ready for viewing
└─ FAILED: show retry button
```

---

## 🔄 SESSION RESTORATION

### App Startup Flow
```
COLD START (first time):
1. App loads
2. Check localStorage for refreshToken
3. If not found:
   → Redirect to login
   → User must signin
4. If found:
   → POST /auth/verify with refreshToken
   → If valid → restore session
   → If invalid → redirect to login
   → Load user profile
   → Load recent rides (from cache or API)
   → Restore unfinished ride (if exists)

WARM START (return user):
1. App loads
2. Check memory for tokens
3. If in memory:
   → Already authenticated
   → Load dashboard
4. If not in memory:
   → Check localStorage
   → Verify with backend
   → Restore session
   → Load dashboard

UNFINISHED RIDE:
1. On app start, check if ride.store has active ride
2. If ACTIVE status:
   → Ask user: "Resume ride?"
   → If yes: continue recording
   → If no: finish/discard ride
3. If PAUSED:
   → Resume/stop buttons available
4. If offline:
   → Show last known state
   → Continue collecting GPS
   → Sync when online
```

---

## 🌐 CONNECTIVITY RUNTIME

### Online/Offline Detection
```
CURRENT STATE:
- No connectivity detection
- Assumes always online

AFTER INTEGRATION:
- Continuous connectivity monitoring
- navigator.onLine as baseline
- PING /health as verification
- Periodic checks (every 30s)

STATES:
┌─────────────────────────┐
│ ONLINE (verified)       │ → All APIs work
├─────────────────────────┤
│ ONLINE (unverified)     │ → Cache results
├─────────────────────────┤
│ OFFLINE                 │ → Use cache only
├─────────────────────────┤
│ DEGRADED (slow)         │ → Retry with backoff
└─────────────────────────┘

UI INDICATORS:
├─ Connection badge (top right)
├─ Sync status (pending/completed/failed)
├─ Upload progress (for snapshots)
└─ Last sync timestamp
```

### Sync Status UI
```
SYNC INDICATOR:
┌──────────────────────┐
│ Sync: 5 pending ⏳   │  while uploading
│ Sync: Complete ✅    │  when done
│ Sync: 2 failed ⚠️    │  when errors
│ Offline 🔴           │  no connection
└──────────────────────┘

POLLING:
GET /sync/stats every 5 seconds
├─ pending
├─ completed
├─ failed
└─ total
```

---

## 📁 FILE STRUCTURE

### New Files to Create
```
src/
├─ api/
│  ├─ client.ts              # Centralized API client
│  ├─ endpoints.ts           # API route constants
│  ├─ interceptors.ts        # Request/response interceptors
│  └─ types.ts               # API response types
│
├─ stores/
│  ├─ auth.store.ts          # NEW: Auth state (Zustand)
│  └─ [existing stores]      # ride, gps, camera, minimap, runtime
│
├─ services/
│  ├─ auth.service.ts        # NEW: Auth operations
│  ├─ api.service.ts         # NEW: Backend communication
│  ├─ sync.service.ts        # EXTEND: real sync integration
│  └─ connectivity.service.ts # NEW: online/offline detection
│
├─ hooks/
│  ├─ useAuth.ts             # NEW: Auth hook
│  ├─ useConnectivity.ts     # NEW: Connectivity hook
│  ├─ useSyncStatus.ts       # NEW: Sync status hook
│  └─ [existing hooks]
│
├─ pages/
│  ├─ Login.tsx              # NEW: Login page
│  ├─ Signup.tsx             # NEW: Signup page
│  ├─ RideHistory.tsx        # NEW: History page
│  ├─ RideDetail.tsx         # NEW: Detail page
│  └─ [existing pages]
│
├─ middleware/
│  ├─ auth.middleware.ts     # NEW: Protected routes
│  └─ offline.middleware.ts  # NEW: Offline handling
│
├─ utils/
│  ├─ tokenManager.ts        # NEW: JWT token management
│  ├─ retry.ts               # NEW: Retry logic
│  └─ [existing utils]
│
└─ App.tsx                   # MODIFY: Add auth routes
```

### Modified Files
```
src/
├─ App.tsx                   # Add login/auth routes
├─ main.tsx                  # Initialize auth restore
├─ stores/
│  ├─ ride.store.ts          # Add sync integration
│  └─ runtime.store.ts       # Add connectivity state
├─ pages/
│  ├─ Home.tsx               # Protected route
│  ├─ Ride.tsx               # Protected route
│  └─ Debug.tsx              # Protected route
└─ services/
   └─ sync.service.ts        # Real backend integration
```

---

## 🔄 DATA FLOW DIAGRAM

### Ride Recording & Sync
```
┌─────────────────────────────────────────────────────────┐
│ USER STARTS RIDE                                        │
└─────────────────────────────────────────────────────────┘
                        ↓
        ┌───────────────────────────────────┐
        │ Runtime: GPS + Motion + Camera    │
        │ ├─ GPS Worker (10Hz)             │
        │ ├─ Camera Stream                  │
        │ ├─ HUD Widgets                    │
        │ └─ Accessibility                  │
        └───────────────────────────────────┘
                        ↓
        ┌───────────────────────────────────┐
        │ Zustand Stores (State)            │
        │ ├─ ride.store (metrics)           │
        │ ├─ gps.store (live points)        │
        │ ├─ camera.store (snapshots)       │
        │ └─ runtime.store (UI)             │
        └───────────────────────────────────┘
                        ↓
        ┌───────────────────────────────────┐
        │ Sync Queue (Local Batching)       │
        │ ├─ Batch GPS points (100/batch)   │
        │ ├─ Queue snapshots                │
        │ └─ Mark ready to sync             │
        └───────────────────────────────────┘
                        ↓
              [ONLINE CHECK]
                   ↓    ↓
                YES   NO
                ↓      └→ [CACHE LOCALLY]
        ┌───────────────────────────────────┐
        │ API Layer                         │
        │ ├─ Auth token injection           │
        │ ├─ Request interceptors           │
        │ ├─ Response handling              │
        │ └─ Retry logic                    │
        └───────────────────────────────────┘
                        ↓
        ┌───────────────────────────────────┐
        │ Backend APIs                      │
        │ ├─ POST /sync/tasks              │
        │ ├─ POST /rides/:id/points/bulk   │
        │ ├─ POST /rides/:id/snapshots     │
        │ └─ PATCH /rides/:id              │
        └───────────────────────────────────┘
                        ↓
        ┌───────────────────────────────────┐
        │ Database                          │
        │ ├─ User (authenticated)           │
        │ ├─ Ride (persisted)               │
        │ ├─ RoutePoints (GPS synced)       │
        │ └─ Snapshots (uploaded)           │
        └───────────────────────────────────┘
```

---

## 🛡️ ERROR HANDLING STRATEGY

### Network Errors
```
REQUEST FAILS:
1. Check error type:
   ├─ Network error (no connection)
   │  └─ Queue for retry
   ├─ Timeout (took >5s)
   │  └─ Retry with backoff
   ├─ 4xx error (bad request)
   │  └─ Show user error, don't retry
   └─ 5xx error (server error)
      └─ Retry with backoff

RETRY STRATEGY:
- Exponential backoff: 1s, 2s, 4s, 8s, 16s
- Max retries: 10
- Max wait: 5 minutes
- Queue persists offline
- Auto-retry when online
```

### Auth Errors
```
TOKEN EXPIRED:
1. Detect 401 response
2. Attempt token refresh:
   ├─ POST /auth/refresh
   ├─ If success → retry original request
   ├─ If fail → redirect to login
   └─ Clear tokens

INVALID TOKEN:
1. Detect 403 response
2. Clear auth state
3. Redirect to login

SESSION EXPIRED:
1. Detect from backend
2. Clear tokens
3. Show "session expired" message
4. Redirect to login
```

### Sync Errors
```
SYNC TASK FAILS:
1. Mark task as FAILED
2. Log error details
3. Show in UI: "Upload failed - will retry"
4. Retry when conditions improve:
   ├─ Connection restored
   ├─ Manual user retry
   └─ Automatic retry (exponential backoff)

CONFLICT HANDLING:
1. Backend has newer version
   ├─ Show user: "Updated since you edited"
   ├─ Accept backend version (wins)
   └─ Store local version as draft (for later)
```

---

## 📊 METRICS & MONITORING

### What to Track
```
Auth:
- Login success rate
- Token refresh frequency
- Session restore success

Sync:
- Queue size (pending)
- Success rate
- Average retry count
- Time to sync (P50, P95)

API:
- Response time by endpoint
- Error rate
- 5xx vs 4xx distribution

Connectivity:
- Online/offline transitions
- Connection quality
- Restore time

User:
- Session duration
- Active rides
- Snapshot uploads
```

---

## 🚀 ROLLOUT STRATEGY

### Phase 1: Foundation (Ready Now)
- ✅ API client layer
- ✅ Auth store + login
- ✅ Existing runtime works offline

### Phase 2: Integration (This Phase)
- ✅ Sync queue → backend
- ✅ Ride persistence
- ✅ Session restoration

### Phase 3: UI/UX (After Phase 2)
- ✅ Ride history
- ✅ Snapshot uploads
- ✅ Connectivity indicators

### Phase 4: Polish (Future)
- Video recording
- GPX export
- Analytics
- Social features

---

## ⚠️ ARCHITECTURAL CONSTRAINTS

### DO ✅
- Preserve runtime systems (GPS, motion, camera, accessibility)
- Use Zustand stores as source of truth
- Batch API calls for efficiency
- Implement graceful offline fallback
- Maintain frontend-first UX
- Type-safe API layer
- Modular service design

### DON'T ❌
- Don't redesign runtime
- Don't tightly couple API/UI
- Don't bypass Zustand stores
- Don't break offline functionality
- Don't add blocking waits for API calls
- Don't mix concerns (API, UI, runtime)
- Don't create temporal coupling

---

## 📝 INTEGRATION CHECKLIST

- [ ] Step 1: API Layer
  - [ ] Centralized API client created
  - [ ] Fetch abstraction working
  - [ ] Interceptors configured
  - [ ] Retry logic implemented
  - [ ] Offline detection working
  - [ ] Types defined

- [ ] Step 2: Auth Integration
  - [ ] Auth store created
  - [ ] Login page working
  - [ ] Signup page working
  - [ ] Token persistence working
  - [ ] Session restore working
  - [ ] Protected routes working

- [ ] Step 3: Sync Queue Integration
  - [ ] Queue connected to API
  - [ ] Ride uploads working
  - [ ] GPS batch uploads working
  - [ ] Snapshot uploads working
  - [ ] Retry logic working
  - [ ] Optimistic updates working

- [ ] Step 4: Ride History
  - [ ] History page working
  - [ ] Details page working
  - [ ] Pagination working
  - [ ] Metrics display working
  - [ ] Route replay foundation ready

- [ ] Step 5: Snapshot Integration
  - [ ] Upload pipeline ready
  - [ ] Queue integration working
  - [ ] Progress tracking working
  - [ ] Thumbnail handling working

- [ ] Step 6: Session Restoration
  - [ ] Auth restore working
  - [ ] Ride restore working
  - [ ] Sync recovery working
  - [ ] Graceful fallback working

- [ ] Step 7: Connectivity Runtime
  - [ ] Online/offline detection working
  - [ ] Sync status UI working
  - [ ] Upload progress UI working
  - [ ] Connection quality indicators ready

---

## 🎓 KEY INSIGHTS

1. **Runtime is Sacred** - The GPS, motion, camera, and accessibility systems are production-grade. We wrap them, not replace them.

2. **Offline-First is Non-Negotiable** - All features work without a server. The backend is eventual consistency, not real-time dependency.

3. **Zustand is the Hub** - All state flows through stores. API layer doesn't directly update stores; it uses established patterns.

4. **Batching is Optimization** - GPS points are uploaded 100-1000 at a time, not individually. This is efficiency, not buffering.

5. **Graceful Degradation** - The app works at 10 Mbps, 1 Mbps, offline. Each level degrades gracefully.

6. **User Experience First** - Integration must be invisible to the user. They shouldn't see loading spinners on every interaction.

7. **Type Safety Throughout** - Full TypeScript from API layer to UI ensures catch errors at compile time, not runtime.

---

**Phase Status:** Ready to Begin  
**Architecture:** Layered Integration (Runtime-First)  
**Approach:** 7-Step Systematic Implementation  
**Timeline:** Weeks 2-4  
**Success Criteria:** MVP fully operational with real persistence
