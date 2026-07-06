# HELIO Infrastructure Documentation

## 1. Architecture Overview

HELIO follows a **containerized modular monolith** architecture, separated into independent runtime processes via Docker containers. Every container uses the same backend Docker image but boots a different process role via `PROCESS_TYPE`.

```
Internet
    │
    ▼ HTTPS (Part B — Nginx + SSL)
    │
    ├──── [helio-frontend :80]
    │         nginx:1.27-alpine
    │         Serves compiled Vite/React SPA
    │         React Router SPA fallback (try_files → index.html)
    │
    └──── [helio-api :5000]
              node:20-alpine | PROCESS_TYPE=api
              Express REST API Gateway
              JWT + Google OAuth Authentication
              Role-Based Authorization
              Rate Limiting | NoSQL Sanitization
              Helmet Security Headers
              Compression
                   │
                   ├── [helio-worker]
                   │       PROCESS_TYPE=worker
                   │       QueueService polling (12 queue types)
                   │       Dose generation, reminders, webhooks,
                   │       adherence, refill, escalation, audit
                   │
                   ├── [helio-scheduler]
                   │       PROCESS_TYPE=scheduler
                   │       Emits scheduling ticks every 30s
                   │       Triggers medication generation + reconciliation
                   │
                   ├── [helio-outbox]
                   │       PROCESS_TYPE=outbox-publisher
                   │       Polls OutboxEvent collection
                   │       Routes domain events to queue consumers
                   │
                   └── [MongoDB Atlas / helio-mongo]
                            Primary data store
                            23 collections
                            Replica set (required for ACID transactions)
                            TTL indexes for automatic retention cleanup

                   └── [helio-redis] (Optional)
                            Session cache
                            Future: pub/sub acceleration
```

---

## 2. Container Inventory

| Container | Image | PROCESS_TYPE | Port | Role |
|---|---|---|---|---|
| `helio-frontend` | `nginx:1.27-alpine` (from `node:20-alpine` build) | N/A | 3000:80 | Serves React SPA |
| `helio-api` | `node:20-alpine` | `api` | 5000:5000 | REST API Gateway |
| `helio-worker` | `node:20-alpine` | `worker` | none | Background job fleet |
| `helio-scheduler` | `node:20-alpine` | `scheduler` | none | Tick dispatcher |
| `helio-outbox` | `node:20-alpine` | `outbox-publisher` | none | Event router |
| `helio-mongo` | `mongo:7.0` | N/A | 27017:27017 | Local dev database |
| `helio-redis` | `redis:7.2-alpine` | N/A | 6379:6379 | Optional cache |

---

## 3. Process Topology

### PROCESS_TYPE Values

| Value | Entry Point | What Starts |
|---|---|---|
| `api` | `server.js` | HTTP server only (no workers/scheduler) |
| `worker` | `worker.js` | QueueService worker fleet only |
| `scheduler` | `worker.js` | Scheduler tick dispatcher only |
| `outbox-publisher` | `worker.js` | OutboxService polling daemon only |
| `all` | `server.js` | Everything — used in local dev |

### Queue Worker Registry (12 Queues)

| Queue Name | Concurrency | Responsibility |
|---|---|---|
| `medication-scheduling` | 2 | Rolling dose instance generation |
| `reminder-orchestration` | 2 | Reminder planning + delivery scan |
| `channel-delivery-whatsapp` | 5 | WhatsApp template message dispatch |
| `channel-delivery-email` | 5 | In-app notification creation |
| `webhook-processing` | 4 | Inbound WhatsApp reply handling |
| `adherence-projection` | 2 | Adherence score calculation + snapshot |
| `refill-projection` | 2 | Supply depletion forecast update |
| `doctor-attention` | 2 | Missed dose escalation evaluation |
| `timeline-projection` | 2 | Health record creation |
| `notification-projection` | 2 | Patient notification creation |
| `audit-processing` | 2 | Audit log persistence |
| `reconciliation` | 1 | Stalled lease recovery + data retention |

---

## 4. Dockerfile Summary

### Frontend Dockerfile (`frontend/Dockerfile`)
```
Stage 1: builder
  Base:    node:20-alpine
  Action:  npm ci && vite build
  Output:  /app/dist

Stage 2: production
  Base:    nginx:1.27-alpine
  Copies:  dist/ from builder
  Config:  SPA routing (try_files → index.html)
  User:    nginx (non-root)
  Port:    80
  Health:  GET /health → 200 OK
```

### Backend Dockerfile (`backend/Dockerfile`)
```
Stage 1: deps
  Base:    node:20-alpine
  Action:  npm ci --omit=dev (production only)
  Output:  /app/node_modules

Stage 2: production
  Base:    node:20-alpine + dumb-init
  Copies:  node_modules from deps, application source
  User:    node (non-root, pre-created in base image)
  Port:    5000
  PID 1:   dumb-init (correct SIGTERM forwarding → graceful shutdown)
  Health:  GET /api/health-check → 200 OK
  Volume:  /app/storage/uploads (mount for upload persistence)
```

---

## 5. Docker Compose Files

### `docker-compose.yml` (Production Simulation)
- Full production topology with all 7 services
- Health checks with dependencies (`depends_on: condition: service_healthy`)
- Named volumes for data persistence
- Single `helio-net` bridge network
- `env_file: ./backend/.env` — secrets injected at runtime, never in image

### `docker-compose.dev.yml` (Developer Overlay)
- Extends `docker-compose.yml` with:
  - Vite dev server (hot module replacement) instead of nginx
  - Nodemon live-reload for backend
  - Source volume mounts (no rebuilds on code change)
  - `PROCESS_TYPE=all` (unified monolith for dev simplicity)
  - Separate worker/scheduler/outbox disabled (not needed in `all` mode)

---

## 6. Environment Variable Reference

### Required (All Environments)
| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `GEMINI_API_KEY` | Google Gemini API key |
| `JWT_SECRET` | HS256 JWT signing secret (min 32 chars) |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `CLIENT_URL` | Frontend origin (used for CORS) |
| `BACKEND_URL` | Backend public URL (used for OAuth callback) |

### Optional
| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | `development / production / test` |
| `PORT` | `5000` | HTTP server port |
| `PROCESS_TYPE` | `all` | Process role per container |
| `REDIS_URL` | _(empty)_ | Redis connection (skipped if not set) |
| `STORAGE_PROVIDER` | `local` | `local / s3 / cloudinary` |
| `LOG_LEVEL` | `info` | `debug / info / warn / error` |

### Feature Flags
| Variable | Default | Behaviour |
|---|---|---|
| `ENABLE_WHATSAPP` | `false` | When true, requires WhatsApp credentials |
| `ENABLE_OCR` | `true` | OCR prescription parsing |
| `ENABLE_VOICE` | `true` | Voice command recognition |
| `ENABLE_GEMINI` | `true` | Gemini AI chat / OCR |
| `ENABLE_EMAIL` | `false` | Email delivery channel |
| `ENABLE_ANALYTICS` | `true` | Adherence analytics |

### WhatsApp (Required only when `ENABLE_WHATSAPP=true`)
| Variable | Description |
|---|---|
| `WHATSAPP_ACCESS_TOKEN` | Meta Graph API Bearer token |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta Phone Number ID |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Meta Business Account ID |
| `WHATSAPP_APP_SECRET` | HMAC-SHA256 webhook validation secret |
| `WHATSAPP_VERIFY_TOKEN` | Webhook challenge token |

---

## 7. Startup Sequence

```
1. validateEnv()
   └── Check required vars, JWT strength, feature flags, WhatsApp credentials

2. connectDB()
   └── 3-attempt retry with 2s backoff
   └── IPv4-forced, 10s connection timeout
   └── Fallback to local MongoDB if primary fails

3. verifyStartupHealth()
   ├── MongoDB readyState === 1 (connected)
   ├── Redis ping (if REDIS_URL configured)
   └── Gemini API test generate (fallback to mock on failure)

4. app.listen(PORT)
   └── Server accepts requests

5. worker.bootstrap()
   ├── QueueService.start()       (if worker or all)
   ├── OutboxService.start()      (if outbox-publisher or all)
   └── startSchedulerTicks()      (if scheduler or all)
```

---

## 8. Graceful Shutdown Sequence

```
SIGTERM or SIGINT received
    │
    ├── HTTP server.close()        Stop accepting new connections
    │
    ├── QueueService.stop(5000ms)  Drain active jobs (5s timeout)
    │
    ├── OutboxService.stop()       Stop outbox polling daemon
    │
    ├── ReconciliationService.stop() Stop reconciliation intervals
    │
    └── mongoose.connection.close()  Close database connections
```

---

## 9. Volume Strategy

| Volume | Purpose | Production Recommendation |
|---|---|---|
| `mongo-data` | Local MongoDB data | Replace with MongoDB Atlas |
| `redis-data` | Redis persistence | Redis Cloud / Upstash / ElastiCache |
| `uploads-data` | File upload storage | S3 / Cloudinary (set `STORAGE_PROVIDER`) |

---

## 10. Security Baseline

| Control | Implementation |
|---|---|
| Non-root containers | `USER nginx` (frontend), `USER node` (backend) |
| Minimal images | `nginx:1.27-alpine` + `node:20-alpine` |
| No secrets in images | All secrets via `env_file` at runtime |
| Correct PID 1 | `dumb-init` for signal forwarding |
| CORS scoped | `CLIENT_URL` environment variable |
| Trust proxy | `app.set('trust proxy', 1)` for Nginx |
| Compression | Gzip via `compression` middleware |
| Helmet headers | HSTS, XSS protection, frame options |
| Rate limiting | 200 req/15min API, 30 req/15min auth |
| NoSQL injection | `express-mongo-sanitize` on all requests |
| Webhook validation | HMAC-SHA256 from Meta |
| JWT strength enforced | envValidator blocks weak secrets in production |

---

## 11. Commands Reference

### Build and Start (Production Simulation)
```bash
# Build all images
docker compose build

# Start all services (foreground)
docker compose up

# Start all services (detached)
docker compose up -d

# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f helio-api
docker compose logs -f helio-worker
```

### Development Mode
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Individual Container Management
```bash
# Restart a specific service
docker compose restart helio-worker

# Scale workers (multiple instances)
docker compose up -d --scale helio-worker=3

# Open a shell in a container
docker compose exec helio-api sh

# Run tests inside container
docker compose exec helio-api node tests/orchestration.test.js
```

### Teardown
```bash
# Stop all containers (keep volumes)
docker compose down

# Stop and remove all volumes (full reset)
docker compose down -v

# Remove all built images
docker compose down --rmi all
```
