# Fleetbase Railway Deployment Strategy

**Document Version:** 1.0
**Created:** 2026-01-27
**Task Reference:** Task 1.1 - Analyze Railway Deployment Strategy
**Agent:** Agent_Infrastructure_Config

---

## Executive Summary

This document defines the deployment strategy for mapping Fleetbase's 8-service Docker Compose architecture to Railway's platform. The strategy leverages Railway's managed database templates, private networking, shared variables, and custom start commands to create a production-ready deployment.

**Key Decisions:**
- Replace MySQL/Redis containers with Railway managed templates
- Eliminate httpd reverse proxy (Railway handles routing natively)
- Deploy 5 Railway services from single monorepo with custom start commands
- Use private networking for all internal service communication
- Expose only Console and SocketCluster publicly

---

## 1. Service-to-Railway Mapping

### 1.1 Infrastructure Services (Railway Templates)

| Fleetbase Service | Railway Target | Rationale |
|-------------------|----------------|-----------|
| `database` (mysql:8.0-oracle) | **Railway MySQL Template** | Managed backups, scaling, connection pooling |
| `cache` (redis:4-alpine) | **Railway Redis Template** | Managed persistence, no container management |

### 1.2 Application Services (Railway Services)

| Fleetbase Service | Railway Service Name | Dockerfile | Start Command | Public? |
|-------------------|---------------------|------------|---------------|---------|
| `application` | `fleetbase-api` | `Dockerfile.api` | Default (`/start.sh`) | No |
| `queue` | `fleetbase-queue` | `Dockerfile.api` | `php artisan queue:work` | No |
| `scheduler` | `fleetbase-scheduler` | `Dockerfile.api` | `go-crond --verbose root:./docker/crontab` | No |
| `console` | `fleetbase-console` | `Dockerfile.console` | Default (`/docker-entrypoint.sh`) | **Yes** |
| `socket` | `fleetbase-socket` | N/A (Docker Hub) | Default | **Yes** |

### 1.3 Eliminated Services

| Fleetbase Service | Reason for Elimination |
|-------------------|----------------------|
| `httpd` | Railway provides native SSL termination, routing, and load balancing. Direct traffic to `fleetbase-api` via Railway's public URL or internal networking. |

---

## 2. Railway Project Structure

```
Railway Project: steelbunch-fleetbase
├── Templates (Managed Add-ons)
│   ├── MySQL (database)
│   └── Redis (cache)
│
├── Services (from GitHub: steelbunch/steelex-fleetbase)
│   ├── fleetbase-api        [Internal]
│   ├── fleetbase-queue      [Internal]
│   ├── fleetbase-scheduler  [Internal]
│   ├── fleetbase-console    [Public]
│   └── fleetbase-socket     [Public]
│
└── Networking
    ├── Private: *.railway.internal
    └── Public: *.up.railway.app
```

---

## 3. Networking Configuration

### 3.1 Internal Service Communication

All internal services communicate via Railway's private networking using `<service-name>.railway.internal`:

| From Service | To Service | Internal URL |
|--------------|------------|--------------|
| fleetbase-api | MySQL | `mysql.railway.internal:3306` |
| fleetbase-api | Redis | `redis.railway.internal:6379` |
| fleetbase-api | fleetbase-socket | `fleetbase-socket.railway.internal:8000` |
| fleetbase-queue | MySQL | `mysql.railway.internal:3306` |
| fleetbase-queue | Redis | `redis.railway.internal:6379` |
| fleetbase-scheduler | MySQL | `mysql.railway.internal:3306` |
| fleetbase-scheduler | Redis | `redis.railway.internal:6379` |

### 3.2 Public Endpoints

| Service | Public URL Pattern | Purpose |
|---------|-------------------|---------|
| fleetbase-console | `https://fleetbase-console-production.up.railway.app` | Admin UI |
| fleetbase-socket | `https://fleetbase-socket-production.up.railway.app` | WebSocket (browser connections) |
| fleetbase-api | `https://fleetbase-api-production.up.railway.app` | API (optional - can be internal only if console proxies) |

### 3.3 CORS Configuration

SocketCluster requires explicit CORS origins. Configure `SOCKETCLUSTER_OPTIONS`:

```json
{
  "origins": "https://fleetbase-console-production.up.railway.app:*,https://fleetbase-socket-production.up.railway.app:*"
}
```

**Note:** Update origins when deploying to different environments (staging, production).

### 3.4 Networking Constraints

| Constraint | Impact | Mitigation |
|------------|--------|------------|
| Private networking unavailable during build | Cannot run migrations in Dockerfile | Use startup script for migrations |
| Per-environment networking only | Staging cannot call production internal services | Use public URLs for cross-env |
| TCP Proxy egress billing | External DB/Redis access incurs costs | Use internal networking exclusively |

---

## 4. Environment Variable Strategy

### 4.1 Shared Variables (Project-Level)

Define these once at project level, reference across all services:

```bash
# Application Identity
APP_NAME=Fleetbase
APP_ENV=production
APP_KEY=base64:...  # Generate with: php artisan key:generate --show

# External Services
REGISTRY_HOST=https://registry.fleetbase.io
OSRM_HOST=https://router.project-osrm.org

# Mail Configuration
MAIL_MAILER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_FROM_NAME=Fleetbase
MAIL_FROM_ADDRESS=noreply@steelbunch.com

# Feature Flags
REGISTRY_PREINSTALLED_EXTENSIONS=true
```

### 4.2 Reference Variables (Auto-Injected)

Railway auto-injects these from MySQL/Redis templates:

```bash
# From MySQL Template
MYSQL_URL        # Full connection string
MYSQL_HOST       # Hostname
MYSQL_PORT       # Port (3306)
MYSQL_DATABASE   # Database name
MYSQL_USER       # Username
MYSQL_PASSWORD   # Password

# From Redis Template
REDIS_URL        # Full connection string
REDIS_HOST       # Hostname
REDIS_PORT       # Port (6379)
```

### 4.3 Service-Specific Variables

#### fleetbase-api
```bash
# Database (Reference from MySQL)
DATABASE_URL=${MYSQL_URL}

# Cache/Queue (Reference from Redis)
QUEUE_CONNECTION=redis
CACHE_DRIVER=redis
REDIS_URL=${REDIS_URL}
CACHE_URL=${REDIS_URL}

# Session
SESSION_DOMAIN=.up.railway.app
SESSION_DRIVER=redis

# Broadcasting
BROADCAST_DRIVER=socketcluster
SOCKETCLUSTER_HOST=fleetbase-socket.railway.internal
SOCKETCLUSTER_PORT=8000

# Logging
LOG_CHANNEL=stderr
```

#### fleetbase-queue
```bash
DATABASE_URL=${MYSQL_URL}
QUEUE_CONNECTION=redis
CACHE_DRIVER=redis
REDIS_URL=${REDIS_URL}
CACHE_URL=${REDIS_URL}
```

#### fleetbase-scheduler
```bash
DATABASE_URL=${MYSQL_URL}
QUEUE_CONNECTION=redis
CACHE_DRIVER=redis
REDIS_URL=${REDIS_URL}
CACHE_URL=${REDIS_URL}
```

#### fleetbase-socket
```bash
SOCKETCLUSTER_WORKERS=10
SOCKETCLUSTER_BROKERS=10
SOCKETCLUSTER_OPTIONS={"origins":"https://fleetbase-console-production.up.railway.app:*"}
```

#### fleetbase-console
```bash
# Runtime config injected via fleetbase.config.json or environment
API_HOST=https://fleetbase-api-production.up.railway.app
API_NAMESPACE=int/v1
SOCKETCLUSTER_HOST=fleetbase-socket-production.up.railway.app
SOCKETCLUSTER_SECURE=true
SOCKETCLUSTER_PORT=443
```

---

## 5. Deployment Order

Railway enforces deployment order via Reference Variables. Services referencing other services' variables deploy after their dependencies.

### 5.1 Dependency Chain

```
Phase 1 (No Dependencies):
├── MySQL Template
├── Redis Template
└── fleetbase-socket

Phase 2 (Depends on MySQL + Redis):
├── fleetbase-scheduler  [refs: MYSQL_URL, REDIS_URL]
└── fleetbase-queue      [refs: MYSQL_URL, REDIS_URL]

Phase 3 (Depends on Phase 2):
└── fleetbase-api        [refs: MYSQL_URL, REDIS_URL]
    └── Runs migrations on startup

Phase 4 (Depends on API being ready):
└── fleetbase-console    [refs: API_HOST]
```

### 5.2 Railway Configuration for Ordering

Ensure these Reference Variables are set to enforce ordering:

| Service | Must Reference | Effect |
|---------|----------------|--------|
| fleetbase-api | `${{MySQL.MYSQL_URL}}` | Deploys after MySQL |
| fleetbase-api | `${{Redis.REDIS_URL}}` | Deploys after Redis |
| fleetbase-queue | `${{MySQL.MYSQL_URL}}` | Deploys after MySQL |
| fleetbase-scheduler | `${{MySQL.MYSQL_URL}}` | Deploys after MySQL |

---

## 6. Build Configuration

### 6.1 Monorepo Service Configuration

Each service needs Railway configuration specifying build context:

#### fleetbase-api (railway.json)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.api"
  },
  "deploy": {
    "healthcheckPath": "/api/v1/health",
    "healthcheckTimeout": 60,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

#### fleetbase-queue (railway.json)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.api"
  },
  "deploy": {
    "startCommand": "php artisan queue:work --sleep=3 --tries=3 --max-time=3600",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

#### fleetbase-scheduler (railway.json)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.api"
  },
  "deploy": {
    "startCommand": "go-crond --verbose root:./docker/crontab",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

#### fleetbase-console (railway.json)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.console"
  },
  "deploy": {
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30
  }
}
```

#### fleetbase-socket
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERIMAGE",
    "dockerImage": "socketcluster/socketcluster:v17.4.0"
  }
}
```

---

## 7. Cost Estimation

### 7.1 Per-Service Resource Allocation (Estimated)

| Service | RAM | vCPU | Monthly Cost (Est.) |
|---------|-----|------|---------------------|
| MySQL | 1 GB | 0.5 | $15 |
| Redis | 512 MB | 0.25 | $7.50 |
| fleetbase-api | 1 GB | 1 | $30 |
| fleetbase-queue | 512 MB | 0.5 | $15 |
| fleetbase-scheduler | 256 MB | 0.25 | $7.50 |
| fleetbase-console | 256 MB | 0.25 | $7.50 |
| fleetbase-socket | 512 MB | 0.5 | $15 |
| **Total** | ~4 GB | ~3.25 | **~$97.50/month** |

**Note:** Actual costs depend on usage. Railway bills per-second based on actual resource consumption.

### 7.2 Additional Costs

- **Network Egress:** $0.05/GB (external traffic)
- **Volume Storage:** $0.15/GB/month (if needed for persistent uploads)

---

## 8. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Private networking not available during build | High | Migration failures | Run migrations in startup script, not Dockerfile |
| SocketCluster CORS misconfiguration | Medium | Real-time features broken | Document exact origin patterns, test thoroughly |
| MySQL connection limits | Medium | API failures under load | Use connection pooling, monitor connections |
| Console config not updated for environment | Medium | Console cannot reach API | Automate config injection via environment variables |
| Cold start latency | Low | Slow first requests | Keep minimum instances or use health checks |

---

## 9. Alternative Approaches Considered

### 9.1 Keep httpd Reverse Proxy
**Rejected:** Railway provides equivalent functionality (SSL, routing, gzip) natively. Adding httpd increases complexity and cost without benefit.

### 9.2 Single Combined Service
**Rejected:** Running API, queue, and scheduler in one container prevents independent scaling and complicates deployments.

### 9.3 External MySQL/Redis (e.g., PlanetScale, Upstash)
**Deferred:** Railway templates are simpler for initial deployment. Can migrate to external providers later if needed for geo-distribution or specific features.

---

## 10. Next Steps

1. **Create Railway Project** with MySQL and Redis templates
2. **Configure Services** with environment variables and Reference Variables
3. **Deploy Infrastructure** (MySQL, Redis, Socket) first
4. **Deploy Application Services** (API, Queue, Scheduler)
5. **Deploy Console** with correct API_HOST configuration
6. **Verify Connectivity** between all services
7. **Test End-to-End** (console -> API -> database, real-time via socket)

---

## Appendix A: Quick Reference Commands

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to project
railway link

# Deploy specific service
railway up --service fleetbase-api

# View logs
railway logs --service fleetbase-api

# Open shell in service
railway shell --service fleetbase-api
```

---

## Appendix B: Environment Variable Template

Complete `.env` template for local development mirroring Railway:

```bash
# App
APP_NAME=Fleetbase
APP_ENV=local
APP_KEY=base64:your-key-here
APP_DEBUG=true

# Database (mirrors Railway MySQL)
DATABASE_URL=mysql://root:password@localhost:3306/fleetbase
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=fleetbase
DB_USERNAME=root
DB_PASSWORD=password

# Redis (mirrors Railway Redis)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Queue/Cache
QUEUE_CONNECTION=redis
CACHE_DRIVER=redis

# SocketCluster
BROADCAST_DRIVER=socketcluster
SOCKETCLUSTER_HOST=localhost
SOCKETCLUSTER_PORT=38000

# External
REGISTRY_HOST=https://registry.fleetbase.io
OSRM_HOST=https://router.project-osrm.org
```

---

**End of Document**
