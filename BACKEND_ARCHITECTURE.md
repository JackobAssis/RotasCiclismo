# Backend Architecture Documentation

**Cycling Routes — MVP Backend Foundation**

Date: May 24, 2026  
Version: 1.0.0  
Status: Production-Ready Scaffold

---

## Executive Summary

The backend is designed as a **persistence layer** for the **frontend runtime system**. It does NOT dictate the frontend architecture. Instead, it:

- Provides reliable data persistence
- Supports offline-first sync operations
- Handles authentication and authorization
- Prepares infrastructure for future features (video, analytics, social)
- Maintains scalability and type safety

---

## Core Design Principles

### 1. **Frontend-Centric Architecture**

The frontend (Zustand stores, event bus, runtime) is the source of truth during recording.
The backend is a **storage backend**, not a business logic engine.

**Pattern:**
```
Frontend: create local ride → record GPS points → take snapshots
                ↓
          batch data into sync tasks
                ↓
Backend: receives, validates, persists
                ↓
Frontend: polls sync status or receives webhook
                ↓
          Frontend updates local state
```

### 2. **Offline-First by Design**

Users record rides completely offline.
Backend is eventually consistent via sync queue.

**Not:** Real-time streaming of GPS to backend  
**Yes:** Local batching, then sync when online

### 3. **Module-Per-Domain Pattern**

Each domain (Auth, Users, Rides, etc.) is a separate module.
Modules are **loosely coupled**, **highly cohesive**.

**Communication:**
- Via service exports (direct calls)
- Via event bus (future)
- Via webhooks (future)

### 4. **Type Safety First**

All DTOs are validated with class-validator.
All responses are strongly typed.
Database schema is source of truth (Prisma).

### 5. **Scalability Prepared**

Database schema prepared for:
- Geographic queries (PostGIS ready)
- Analytics (separate analytics table)
- Video streaming (video_recordings table)
- Social features (follows, comments)
- Safety systems (safety_events table)

---

## Module Design

### Auth Module

**Responsibility:** Authentication only (signup, signin, token refresh)

**NOT:** User profiles, settings, preferences (that's Users module)

**Key Decisions:**

- JWT with refresh token pattern
- Password hashing with bcrypt (10 rounds)
- No session storage (stateless)
- Refresh tokens live 30 days, access tokens 7 days

**Scope:**
```
POST /auth/signup
POST /auth/signin  
POST /auth/refresh
```

### Users Module

**Responsibility:** User profiles, preferences, settings

**Key Decisions:**

- Separate from Auth (clean separation)
- Profile queries include ride statistics
- User can only modify own profile
- Exports UserService for use by other modules

### Rides Module

**Responsibility:** Ride lifecycle management

**Key Decisions:**

- Ride status: ACTIVE → FINISHED → SYNCED
- Frontend generates ride ID (for offline consistency)
- Backend accepts frontend ID and associates with user
- Full ride lifecycle: create → update during recording → finish
- Cascade delete: deleting ride also deletes route points, snapshots

**Workflow:**

```
1. Frontend starts recording
   → POST /rides { id, mode, startedAt }
   → Backend stores with localOnly=true

2. Frontend records GPS points
   → POST /rides/{id}/points/bulk { points }
   → Backend appends to route_points

3. Frontend takes snapshots
   → POST /rides/{id}/snapshots { imageUrl, timestamp, location }
   → Backend stores metadata (not file)

4. Frontend finishes recording
   → POST /rides/{id}/finish { duration, distance, metrics }
   → Backend marks status=FINISHED

5. Frontend syncs to cloud (future)
   → Sync task marks status=SYNCED
```

### Route Points Module

**Responsibility:** GPS point persistence

**Key Decisions:**

- Bulk upload is preferred (via `/points/bulk`)
- Single point endpoint exists but rarely used
- Pagination support (500 points default)
- Future: PostGIS spatial indexing for queries

**Why Separate Module:**

- Scalability: route points are high-volume writes
- Future: Route points might have separate scaling tier
- Testability: Can test GPS logic independently

### Snapshots Module

**Responsibility:** Photo metadata and upload status tracking

**Key Decisions:**

- Stores metadata only (imageUrl, timestamp, location)
- Does NOT store file (uploads module handles that)
- Tracks upload status (PENDING → UPLOADING → COMPLETED → FAILED)
- Can retry failed uploads

### Sync Module

**Responsibility:** Offline-first sync queue management

**Key Decisions:**

- Frontend creates sync tasks via `POST /sync/tasks`
- Backend stores task with status=PENDING
- Retry logic: max 5 attempts, exponential backoff (future)
- Task types: ride_create, route_points_upload, snapshot_upload, etc.
- Frontend polls `/sync/stats` to see progress

**Sync Task Lifecycle:**

```
Frontend creates task
     ↓
POST /sync/tasks { type: 'ride_create', payload: {...} }
     ↓
Backend stores task (status: PENDING)
     ↓
Frontend polls /sync/stats
     ↓
Backend processor (async job, future) marks as COMPLETED
     ↓
Frontend queries sync status and updates UI
```

### Uploads Module

**Responsibility:** File upload infrastructure and preparation

**Key Decisions:**

- Currently supports local storage only
- Architecture prepared for S3, Azure Blob
- Pre-signed URL pattern (ready for S3)
- File validation (size, type)
- Storage quota tracking (future)

**Scope:**

```
POST /uploads/url          # Get upload endpoint
POST /uploads/stats        # Get storage usage
```

**Future Upgrade:**

```javascript
// Currently returns local endpoint
GET /uploads/url → { uploadUrl: '/uploads/local/uuid' }

// Future S3
GET /uploads/url → { uploadUrl: 's3://bucket/...' }
```

### Health Module

**Responsibility:** Liveness and readiness probes

**Endpoints:**

```
GET /health     # Detailed health (includes DB)
GET /ready      # Readiness for load balancer
GET /alive      # Liveness (always true)
```

---

## Data Flow Architecture

### Recording a Ride (Offline First)

```
┌──────────────────────────────────────┐
│  Frontend (React + Zustand)          │
│  - ride.store: RideSession (local)   │
│  - gps.worker: GPS polling           │
│  - camera.store: Photo tracking      │
└──────────────────────────────────────┘
           ↓ (when online)
┌──────────────────────────────────────┐
│  sync.service.ts (Web Worker)        │
│  - Batches GPS points                │
│  - Queues snapshots                  │
│  - Creates SyncTasks                 │
└──────────────────────────────────────┘
           ↓ (HTTP)
┌──────────────────────────────────────┐
│  Backend API                         │
│  - POST /sync/tasks                  │
│  - POST /rides/{id}/points/bulk      │
│  - POST /rides/{id}/snapshots        │
└──────────────────────────────────────┘
           ↓ (Prisma)
┌──────────────────────────────────────┐
│  PostgreSQL Database                 │
│  - rides table                       │
│  - route_points table                │
│  - snapshots table                   │
│  - sync_tasks table                  │
└──────────────────────────────────────┘
```

---

## Authentication & Authorization

### JWT Flow

```
1. User signs up
   → POST /auth/signup { email, username, password }
   → Backend: hash password, create user
   → Returns: { accessToken, refreshToken, user }

2. User makes request
   → GET /rides
   → Header: Authorization: Bearer {accessToken}
   → Backend: JwtStrategy validates token
   → Returns: user's rides

3. Access token expires (7 days)
   → POST /auth/refresh { refreshToken }
   → Backend: validates refresh token
   → Returns: { accessToken }

4. Refresh token expires (30 days)
   → User must signin again
```

### Authorization Checks

Every endpoint that accesses user data checks ownership:

```typescript
// Example: Get ride
const ride = await ridesService.getRide(rideId, req.user.userId);

// Inside service:
if (ride.userId !== userId) {
  throw new UnauthorizedException();
}
```

---

## Database Schema Evolution

### Current (MVP)

- Users
- Rides
- RoutePoints
- Snapshots
- SyncTasks

### Phase 2

- VideoRecordings
- RideAnalytics

### Phase 3

- Follows (social)
- Achievements (gamification)
- Comments (engagement)
- SafetyEvents (security)

**Note:** Schema is prepared but not implemented. Can add without breaking existing APIs.

---

## Error Handling

### Custom Exceptions

```typescript
throw new UserAlreadyExistsException(email);
throw new InvalidCredentialsException();
throw new RideNotFoundException(rideId);
throw new UnauthorizedRideAccessException(rideId);
```

### Global Validation

- ValidationPipe on all DTOs
- Automatic input sanitization
- Type coercion
- Detailed error messages

---

## Performance Considerations

### Database Indexing

```prisma
// User lookups
User: @index([email])
User: @index([username])

// Ride queries
Ride: @index([userId])
Ride: @index([status])
Ride: @index([createdAt])

// Sync operations
SyncTask: @index([userId])
SyncTask: @index([status])

// Route point optimization
RoutePoint: @index([rideId])
RoutePoint: @index([timestamp])
// Future: PostGIS spatial index
```

### Pagination Defaults

- Rides: 20 per page
- Route Points: 500 per page
- Snapshots: 100 per page

### Batch Operations

- Route points support bulk insert (up to 10,000 per request)
- Designed for 1000+ points per ride

---

## Scalability Roadmap

### Currently

- Single backend instance
- Single PostgreSQL instance
- Local file storage

### Phase 2 (Horizontal Scaling)

- Multiple backend instances behind load balancer
- Database read replicas
- S3 for file storage
- Redis for caching (optional)

### Phase 3 (Global Scale)

- Database sharding by region
- Edge functions for uploads
- CDN for snapshots
- Message queue for async tasks

---

## Testing Strategy

### TODO

- [ ] Unit tests for services
- [ ] Integration tests for API endpoints
- [ ] Database tests (with migrations)
- [ ] Auth flow tests
- [ ] Offline sync tests

---

## Deployment Checklist

### Environment Variables

```
NODE_ENV=production
PORT=3000
JWT_SECRET=<change-me>
JWT_REFRESH_SECRET=<change-me>
DATABASE_URL=postgresql://...
CORS_ORIGIN=https://cycling.app
STORAGE_TYPE=s3 (or local)
```

### Pre-Deployment

- [ ] Database backups configured
- [ ] Monitoring/logging setup
- [ ] Rate limiting enabled
- [ ] HTTPS certificates valid
- [ ] Database migrations tested
- [ ] File upload paths configured
- [ ] Secrets not in code
- [ ] Error logging enabled

---

## Future Enhancements

### Real-Time Features (WebSocket)

- Live ride broadcasting (for social)
- Notifications
- Live position streaming (future mode)

### Analytics

- GPS heatmaps (popular routes)
- Performance trends
- Safety analytics

### AI/ML

- Route recommendations
- Safety hazard detection
- Weather impact analysis

### Social

- Follow users
- Share rides publicly
- Comments and reactions
- Leaderboards

### Media

- Video recording support
- Streaming transcoding
- CDN distribution

---

## Architecture Decisions (ADR)

### ADR-001: Frontend-Centric, Backend-Persistent

**Decision:** Backend does not own business logic. Frontend runtime owns ride recording.

**Rationale:** Allows robust offline operation, simpler sync, better UX.

**Alternative Rejected:** Backend-centric (requires real-time connection).

### ADR-002: JWT without Sessions

**Decision:** Stateless authentication via JWT.

**Rationale:** Scalable, no session storage needed, supports distributed systems.

**Alternative Rejected:** Session-based (requires sticky sessions or shared store).

### ADR-003: Module-Per-Domain

**Decision:** Each domain (Auth, Rides, Snapshots, etc.) is a separate NestJS module.

**Rationale:** Loose coupling, independent scaling, clear boundaries.

**Alternative Rejected:** Monolithic structure (harder to maintain).

### ADR-004: Prisma as ORM

**Decision:** Use Prisma for type-safe database access.

**Rationale:** Strong typing, migrations, prepared for PostGIS, excellent DX.

**Alternative Rejected:** Raw SQL (not type-safe), TypeORM (heavier).

---

## Summary

This backend is designed to be:

1. **Reliable** - Persists user data safely with proper backups
2. **Scalable** - Architecture prepared for 1000s of concurrent users
3. **Type-Safe** - All data validated and strongly typed
4. **Frontend-Compatible** - Designed around existing runtime architecture
5. **Future-Proof** - Schema ready for video, analytics, social features
6. **Production-Ready** - Proper error handling, health checks, logging

The backend is **NOT**:
- A realtime system (batched sync)
- A business logic engine (frontend owns UX logic)
- A monolith (modular by design)
- Tightly coupled to frontend (clean separation)

---

**Last Updated:** May 24, 2026  
**Next Review:** After Phase 1 MVP completion  
**Maintainer:** Engineering Team
