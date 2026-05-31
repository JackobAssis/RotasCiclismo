# STEP 1: API LAYER ✅

**Frontend ↔ Backend Integration Phase - Foundation Layer**

---

## 🎯 OBJECTIVE

Build a centralized, type-safe API layer that:
- ✅ Isolates all backend communication
- ✅ Maintains offline-first behavior
- ✅ Handles authentication transparently
- ✅ Implements retry logic
- ✅ Provides error handling
- ✅ Never directly modifies stores
- ✅ Provides full TypeScript type safety

---

## ✨ WHAT WAS CREATED

### Core Files (6 Total)

```
src/
├── api/
│   ├── client.ts               # Central HTTP client
│   ├── endpoints.ts            # Route constants
│   ├── types.ts                # Response types
│   ├── interceptors.ts         # Request/response pipeline
│   └── index.ts                # Export all
│
├── services/
│   ├── api.service.ts          # High-level operations
│   ├── api.init.ts             # Bootstrap
│   └── connectivity.service.ts # Online/offline detection
│
└── utils/
    └── tokenManager.ts         # JWT management
```

### Total Lines of Code: ~1,500

---

## 🏗️ ARCHITECTURE

### Request Pipeline

```
User Action
    ↓
UI Component calls apiService.getRide(id)
    ↓
apiService uses apiClient.get()
    ↓
REQUEST INTERCEPTORS:
├─ Content-Type injection
├─ Auth token injection
└─ Logging
    ↓
FETCH EXECUTION:
├─ Build URL
├─ Add timeout (5s)
├─ Send request
└─ Handle AbortController
    ↓
RESPONSE PROCESSING:
├─ Parse JSON
├─ Response interceptors
└─ Type validation
    ↓
ERROR HANDLING:
├─ Normalize error
├─ Error interceptors
├─ Token refresh (on 401)
├─ Retry logic (exponential backoff)
└─ Network error detection
    ↓
Return Typed Response
    ↓
UI updates (Zustand store)
```

### Component Responsibilities

```
┌─────────────────────────────────────────┐
│ ApiClient (client.ts)                   │
│ ├─ Fetch abstraction                    │
│ ├─ Timeout handling                     │
│ ├─ Retry management                     │
│ ├─ Deduplication of in-flight requests  │
│ ├─ Interceptor pipeline                 │
│ └─ Error normalization                  │
└─────────────────────────────────────────┘
              ↑ ↓
┌─────────────────────────────────────────┐
│ Interceptors (interceptors.ts)          │
│ ├─ Auth injection                       │
│ ├─ Content-Type                         │
│ ├─ Response validation                  │
│ ├─ Token refresh (401)                  │
│ ├─ Rate limit (429)                     │
│ ├─ Logging                              │
│ └─ Error transformation                 │
└─────────────────────────────────────────┘
              ↑ ↓
┌─────────────────────────────────────────┐
│ ApiService (api.service.ts)             │
│ ├─ Auth operations (signup, signin...)  │
│ ├─ User operations (profile, update...) │
│ ├─ Rides operations (CRUD + finish...)  │
│ ├─ RoutePoints (single + bulk upload)   │
│ ├─ Snapshots (metadata + status)        │
│ ├─ Sync tasks (queue + status)          │
│ ├─ Uploads (URL generation + stats)     │
│ └─ Health checks                        │
└─────────────────────────────────────────┘
              ↑ ↓
┌─────────────────────────────────────────┐
│ TokenManager (tokenManager.ts)          │
│ ├─ Token storage (memory + localStorage)│
│ ├─ Token retrieval                      │
│ ├─ Expiration checking                  │
│ ├─ Token decoding                       │
│ ├─ User ID extraction                   │
│ └─ Session persistence                  │
└─────────────────────────────────────────┘
              ↑ ↓
┌─────────────────────────────────────────┐
│ ConnectivityService (connectivity...)   │
│ ├─ Online/offline detection             │
│ ├─ Browser events (online/offline)      │
│ ├─ Health check polling                 │
│ ├─ Latency measurement                  │
│ ├─ Subscriber pattern                   │
│ └─ Connection quality assessment        │
└─────────────────────────────────────────┘
```

---

## 📝 KEY FILES

### 1. **ApiClient** (`client.ts`)

Central HTTP client with:
- Fetch abstraction
- Request/response interceptors
- Retry logic (exponential backoff)
- Timeout handling (5s default)
- In-flight request deduplication
- Error normalization

**Key Methods:**
```typescript
request<T>(method, path, config?) // Core method
get<T>(path, config?)
post<T>(path, body, config?)
put<T>(path, body, config?)
patch<T>(path, body, config?)
delete<T>(path, config?)

addRequestInterceptor(interceptor)
addResponseInterceptor(interceptor)
addErrorInterceptor(interceptor)
```

**Design:**
- No store mutations
- Fully typed
- Extensible pipeline
- Testable interceptors

---

### 2. **Endpoints** (`endpoints.ts`)

Centralized route definitions for:
- Auth (signup, signin, refresh)
- Users (profile, stats)
- Rides (CRUD, finish, with-route)
- RoutePoints (single, bulk, list)
- Snapshots (CRUD, status)
- Sync tasks (create, list, status, stats)
- Uploads (URL, stats)
- Health (health, ready, alive)

**Benefits:**
- Type-safe endpoint access
- Easy refactoring
- Single source of truth
- IDE autocomplete

---

### 3. **Types** (`types.ts`)

~400 lines of TypeScript interfaces for:
- Auth (signup/signin requests & responses)
- User (profile, updates, stats)
- Rides (create, update, finish, details)
- RoutePoints (single, bulk, paginated)
- Snapshots (create, update status)
- SyncTasks (create, status, stats)
- Uploads (URL request/response)
- Pagination (generic paginated response)
- Health checks

**Guarantees:**
- Compile-time type safety
- IDE autocomplete
- API contract validation
- No "any" types

---

### 4. **Interceptors** (`interceptors.ts`)

Request/response processing pipeline:

**Request Interceptors:**
- Auth token injection
- Content-Type setting
- Logging (dev only)

**Response Interceptors:**
- Response logging (dev only)
- Response validation
- Error detection

**Error Interceptors:**
- Token refresh (401)
- Rate limit handling (429)
- Error logging (dev only)
- Network error user-friendly messages

**Pattern:**
```typescript
// Create interceptor
const authInterceptor = createAuthInterceptor(getToken);

// Register with client
apiClient.addRequestInterceptor(authInterceptor);

// Automatically applied to all requests
```

---

### 5. **TokenManager** (`tokenManager.ts`)

JWT lifecycle management:

```typescript
// Store tokens (memory + localStorage)
tokenManager.setTokens({ accessToken, refreshToken });

// Get tokens for API calls
tokenManager.getAccessToken();
tokenManager.getRefreshToken();

// Check authentication
tokenManager.isAuthenticated();
tokenManager.isAccessTokenExpired();
tokenManager.getExpiresIn(); // seconds

// Decode token (for info extraction)
const user = tokenManager.getUser();
const userId = tokenManager.getUserId();
const email = tokenManager.getEmail();

// Refresh token
const newTokens = await tokenManager.refresh(apiBaseUrl);

// Cleanup
tokenManager.clear();
```

**Storage Strategy:**
- Access token: Memory only (cleared on logout)
- Refresh token: Memory + localStorage (for session restore)
- User ID: localStorage (for quick recovery)

---

### 6. **ConnectivityService** (`connectivity.service.ts`)

Online/offline monitoring:

```typescript
// Get current state
const state = connectivityService.getState();
// {
//   status: 'online' | 'offline' | 'degraded',
//   isOnline: boolean,
//   isOffline: boolean,
//   isDegraded: boolean,
//   lastCheckedAt: number,
//   latency?: number
// }

// Check status
connectivityService.isOnline();
connectivityService.isOffline();
connectivityService.isDegraded();
connectivityService.getLatency();

// Subscribe to changes
const unsubscribe = connectivityService.subscribe((state) => {
  console.log('Connectivity changed:', state);
});

// Force health check
await connectivityService.forceCheck();

// Cleanup
connectivityService.destroy();
```

**Status Determination:**
1. Browser `navigator.onLine` event (baseline)
2. Health check to `/health` (verification)
3. Latency assessment (quality)

---

### 7. **ApiService** (`api.service.ts`)

High-level typed operations (~300 lines):

```typescript
// Auth
apiService.signup(dto)
apiService.signin(dto)
apiService.refreshToken(token)

// Users
apiService.getProfile()
apiService.getUser(id)
apiService.updateProfile(id, dto)

// Rides
apiService.createRide(dto)
apiService.listRides(page, limit, options)
apiService.getRide(id)
apiService.getRideWithRoute(id)
apiService.updateRide(id, dto)
apiService.finishRide(id, dto)
apiService.deleteRide(id)

// RoutePoints
apiService.createRoutePoint(rideId, dto)
apiService.createBulkRoutePoints(rideId, dto) // Preferred
apiService.listRoutePoints(rideId, skip, take)
apiService.deleteRoutePoints(rideId)

// Snapshots
apiService.createSnapshot(rideId, dto)
apiService.listSnapshots(rideId, skip, take)
apiService.updateSnapshotStatus(id, dto)
apiService.deleteSnapshot(id)

// Sync
apiService.createSyncTask(dto)
apiService.getSyncTask(id)
apiService.getPendingSyncTasks(limit)
apiService.getSyncTaskStatus(id)
apiService.markSyncTaskCompleted(id)
apiService.markSyncTaskFailed(id, error)
apiService.retrySyncTask(id)
apiService.getSyncStats()

// Uploads
apiService.getUploadUrl(dto)
apiService.getStorageStats()

// Health
apiService.checkHealth()
apiService.checkReady()
apiService.checkAlive()
```

**Design:**
- No mutations (only returns data)
- Error handling built-in
- Retry logic transparent
- Fully typed responses

---

### 8. **Initialization** (`api.init.ts`)

Bootstrap file:

```typescript
// In main.tsx
import { initializeApiLayer } from '@/services/api.init';

initializeApiLayer({
  redirectToLogin: () => navigate('/login'),
  enableLogging: import.meta.env.DEV,
});

// On app shutdown
import { cleanupApiLayer } from '@/services/api.init';
cleanupApiLayer();
```

---

## 🔄 RETRY STRATEGY

### Exponential Backoff

```
Attempt 1: fails immediately
Attempt 2: wait 1s, retry
Attempt 3: wait 2s, retry
Attempt 4: wait 4s, retry
Attempt 5: wait 8s, retry (max 30s total wait)

Conditions for retry:
- Network errors (any error type)
- Timeouts (>5s wait)
- 5xx server errors
- 429 rate limit
- 408 request timeout
```

### Non-Retryable Errors
- 400 Bad Request (invalid input)
- 401 Unauthorized (except token refresh)
- 403 Forbidden (no permission)
- 404 Not Found (wrong endpoint)

---

## 🛡️ OFFLINE BEHAVIOR

### While Offline

```
API calls return error:
{
  message: "You are offline. Changes will sync when online.",
  statusCode: 0,
  isOffline: true,
  retryable: true
}

App behavior:
├─ Uses cached data if available
├─ Queues changes locally (via sync queue)
├─ Shows offline indicator (UI)
├─ Continues collecting GPS/motion data (runtime)
└─ Retry when online
```

### When Coming Online

```
1. Browser triggers 'online' event
2. ConnectivityService detects change
3. Health check triggered
4. Queued requests retry automatically
5. UI updates (sync status)
```

---

## 📊 ERROR HANDLING

### Error Types

```
NetworkError:
- Fetch failed (CORS, DNS, etc.)
- No internet connection
- Retryable: YES

Timeout:
- Request took >5s
- Retryable: YES

401 Unauthorized:
- Token expired
- Action: Refresh token, retry
- Retryable: YES (after refresh)

403 Forbidden:
- No permission for resource
- Retryable: NO

404 Not Found:
- Wrong endpoint
- Retryable: NO

429 Rate Limited:
- Too many requests
- Retryable: YES (wait and retry)

5xx Server Error:
- Backend error
- Retryable: YES (with backoff)
```

---

## 🧪 USAGE EXAMPLES

### In Components

```typescript
// Import
import { apiService, tokenManager, connectivityService } from '@/api';

// Simple operation
async function loadRide(rideId: string) {
  try {
    const ride = await apiService.getRide(rideId);
    return ride;
  } catch (error) {
    console.error('Failed to load ride:', error.message);
    // Show error to user, use cached data if available
  }
}

// With connectivity check
function useRideList() {
  const [rides, setRides] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const connectivity = connectivityService.getState();

  useEffect(() => {
    if (connectivity.isOnline) {
      loadRides();
    }
  }, [connectivity.status]);

  async function loadRides() {
    setIsLoading(true);
    try {
      const result = await apiService.listRides(1, 20);
      setRides(result.data);
    } catch (error) {
      // Use cached rides or show error
    } finally {
      setIsLoading(false);
    }
  }

  return { rides, isLoading, connectivity };
}

// Subscribe to connectivity
useEffect(() => {
  const unsubscribe = connectivityService.subscribe((state) => {
    console.log('Connection status:', state.status);
    if (state.isOnline) {
      // Resume sync tasks
    }
  });

  return () => unsubscribe();
}, []);
```

---

## 🎓 DESIGN PRINCIPLES

### ✅ DO

- Use `apiService` methods only (no direct apiClient calls)
- Handle errors in components
- Store responses in Zustand stores
- Check connectivity before important operations
- Use TypeScript for full type safety
- Implement retry logic in sync queue

### ❌ DON'T

- Don't call `apiClient` directly from components
- Don't bypass interceptors
- Don't store sensitive data outside of tokenManager
- Don't directly modify stores from API layer
- Don't make blocking API calls on page load
- Don't ignore offline mode

---

## 📈 NEXT STEPS

After API layer is complete:

✅ **Step 1: API Layer** (COMPLETE)
- [x] Centralized client
- [x] Interceptors
- [x] Type safety
- [x] Error handling
- [x] Offline detection

→ **Step 2: Auth Integration**
- [ ] Auth store (Zustand)
- [ ] Login/signup pages
- [ ] Session restore
- [ ] Protected routes

→ **Step 3: Sync Queue Integration**
- [ ] Connect frontend queue to APIs
- [ ] Ride persistence
- [ ] GPS uploads

→ **Step 4+: UI Features**
- [ ] Ride history
- [ ] Snapshots
- [ ] Session recovery
- [ ] Connectivity UI

---

## ✅ VALIDATION CHECKLIST

- [x] API client created and exported
- [x] All endpoints defined (40+)
- [x] All response types defined
- [x] Interceptors working (auth, content-type, logging)
- [x] Retry logic implemented (exponential backoff)
- [x] Timeout handling (5s default)
- [x] Offline detection working
- [x] Token manager integrated
- [x] Connectivity service running
- [x] ApiService with all operations
- [x] Full TypeScript type safety
- [x] No "any" types used
- [x] Error handling comprehensive
- [x] Initialization file created
- [x] Index exports all utilities

---

## 📦 DEPENDENCIES

All files created use only standard web APIs:
- `fetch` (native)
- `localStorage` (native)
- `AbortController` (native)
- No external HTTP libraries required

---

## 🎉 STEP 1 COMPLETE!

The API layer is now:
- ✅ Robust and type-safe
- ✅ Offline-first ready
- ✅ Error resilient
- ✅ Fully documented
- ✅ Ready for Step 2 integration

**Time to move to Step 2: Auth Integration** 🚀
