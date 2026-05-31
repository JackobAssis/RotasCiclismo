# Cycling Routes Backend API

**MVP Backend Foundation** - Production-ready NestJS + PostgreSQL + Prisma

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- pnpm or npm

### Setup

```bash
# Install dependencies
cd apps/api
pnpm install

# Copy environment
cp .env.example .env

# Start database
docker-compose up -d

# Generate Prisma client
pnpm run prisma:generate

# Run migrations
pnpm run prisma:migrate

# Start dev server
pnpm run dev
```

The API will be available at `http://localhost:3000`

### Database Management

```bash
# View database GUI
open http://localhost:5050

# Studio (Prisma GUI)
pnpm run prisma:studio

# Create migration
pnpm run prisma:migrate

# Reset database (dev only)
npx prisma migrate reset
```

---

## 📚 API Endpoints

### Authentication

```
POST   /auth/signup           - Register new user
POST   /auth/signin           - Login user
POST   /auth/refresh          - Refresh access token
```

### Users

```
GET    /users/:id             - Get user profile
GET    /users/me/profile      - Get current user
PATCH  /users/:id             - Update profile
```

### Rides

```
POST   /rides                 - Create ride
GET    /rides                 - List user rides
GET    /rides/:id             - Get ride details
PATCH  /rides/:id             - Update ride
POST   /rides/:id/finish      - Finish ride
DELETE /rides/:id             - Delete ride
GET    /rides/:id/with-route  - Get ride with full route
```

### Route Points (GPS)

```
POST   /rides/:id/points          - Create point
POST   /rides/:id/points/bulk     - Bulk create points (PREFERRED)
GET    /rides/:id/points          - Get all points
DELETE /rides/:id/points          - Delete all points
```

### Snapshots (Photos)

```
POST   /rides/:id/snapshots       - Create snapshot
GET    /rides/:id/snapshots       - Get ride snapshots
PATCH  /snapshots/:id/status      - Update upload status
DELETE /snapshots/:id             - Delete snapshot
```

### Sync Queue

```
POST   /sync/tasks            - Create sync task
GET    /sync/tasks            - Get pending tasks
GET    /sync/tasks/:id        - Get task details
GET    /sync/tasks/:id/status - Get task status
POST   /sync/tasks/:id/complete - Mark completed
GET    /sync/stats            - Get sync statistics
```

### Uploads

```
POST   /uploads/url           - Get upload URL
POST   /uploads/stats         - Get storage usage
```

### Health

```
GET    /health                - Health check
GET    /ready                 - Readiness probe
GET    /alive                 - Liveness probe
```

---

## 🏗️ Architecture

### Module Structure

```
src/
├── config/                    # Configuration management
│   └── config.ts
├── common/                    # Shared utilities
│   ├── dtos.ts               # Data transfer objects
│   ├── exceptions.ts         # Custom exceptions
│   ├── jwt.types.ts          # JWT interfaces
│   ├── jwt.strategy.ts       # Passport JWT strategy
│   └── auth.guard.ts         # Auth guards
├── modules/
│   ├── auth/                 # Authentication (signup, signin)
│   ├── users/                # User profiles
│   ├── rides/                # Ride management
│   ├── route-points/         # GPS point storage
│   ├── snapshots/            # Photo/snapshot management
│   ├── sync/                 # Offline-first sync queue
│   ├── uploads/              # File upload preparation
│   └── health/               # Health checks
└── main.ts                   # Application bootstrap
```

### Database Schema

**Core Tables:**

- `users` - User accounts and profiles
- `rides` - Ride sessions
- `route_points` - GPS coordinates (1000s per ride)
- `snapshots` - Photos taken during rides

**Infrastructure:**

- `sync_tasks` - Offline-first sync queue
- `video_recordings` - Video metadata (future)
- `follows` - Social relationships (future)
- `achievements` - Gamification (future)
- `comments` - Social engagement (future)
- `safety_events` - Safety tracking (future)
- `ride_analytics` - Performance metrics (future)

### Authentication Flow

1. **Signup**: `POST /auth/signup` → Creates user, returns JWT + refresh token
2. **Signin**: `POST /auth/signin` → Validates credentials, returns JWT + refresh token
3. **Protected**: All endpoints except `/auth/*` require Bearer token
4. **Refresh**: `POST /auth/refresh` → Gets new access token using refresh token

### Offline-First Sync Architecture

```
Frontend (Zustand + Storage)
         ↓
    Creates local ride with ID
         ↓
    Batches GPS points + photos
         ↓
    When online: POST /sync/tasks
         ↓
Backend (Prisma + PostgreSQL)
         ↓
    Stores in database
         ↓
    Returns task status
         ↓
Frontend polls /sync/stats or receives webhook
         ↓
    Updates local ride status
```

---

## 🔐 Security

### Implemented

- ✅ Password hashing (bcrypt)
- ✅ JWT authentication
- ✅ CORS validation
- ✅ Input validation (class-validator)
- ✅ User ownership checks
- ✅ Rate limiting placeholders

### TODO (Future)

- [ ] Rate limiting (express-rate-limit)
- [ ] Request signing
- [ ] API key management
- [ ] 2FA
- [ ] Audit logging
- [ ] Secrets rotation

---

## 📊 Development

### Logging

Environment variable: `LOG_LEVEL` (debug, log, warn, error)

```bash
LOG_LEVEL=debug pnpm run dev
```

### Type Checking

```bash
pnpm run typecheck
```

### Linting

```bash
pnpm run lint
```

---

## 🚢 Deployment

### Docker Build

```bash
docker build -f Dockerfile.api -t cycling-api:latest .
```

### Production Checklist

- [ ] Set strong `JWT_SECRET` in environment
- [ ] Enable database backups
- [ ] Configure monitoring/logging
- [ ] Setup CI/CD pipeline
- [ ] Test database connections
- [ ] Configure file storage (S3/Azure)
- [ ] Enable HTTPS
- [ ] Setup rate limiting
- [ ] Configure CDN for uploads

---

## 🛣️ Roadmap

### Phase 1 MVP (Current)

- ✅ Authentication & users
- ✅ Ride CRUD
- ✅ GPS point persistence
- ✅ Photo/snapshot management
- ✅ Offline-first sync queue
- 🟡 File upload preparation

### Phase 2 (Next Sprint)

- [ ] Implement full file uploads (S3/local)
- [ ] Add video recording support
- [ ] Implement ride replay/export (GPX)
- [ ] Analytics dashboard
- [ ] Notification system

### Phase 3 (Future)

- [ ] Social features (followers, likes)
- [ ] Gamification (badges, leaderboard)
- [ ] AI safety analysis
- [ ] Route recommendations
- [ ] Community features

---

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check if Postgres is running
docker ps | grep cycling_db

# Restart containers
docker-compose restart postgres
```

### Prisma Issues

```bash
# Regenerate client
pnpm run prisma:generate

# Reset schema (dev only)
npx prisma migrate reset
```

### Port Already in Use

Change PORT in .env or kill process:

```bash
lsof -ti:3000 | xargs kill -9
```

---

## 📖 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)

---

**Created:** May 24, 2026  
**Stack:** NestJS + TypeScript + PostgreSQL + Prisma  
**Status:** MVP Foundation Complete
