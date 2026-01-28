# Task 1.2: Configure Fleetbase Environment Variables - Memory Log

**Task Status:** Completed
**Completion Date:** 2026-01-27
**Agent:** Agent_Infrastructure_Config

---

## Key Findings

### 1. Environment Variable Sources Analyzed

| Source | Location | Variables Found |
|--------|----------|-----------------|
| Laravel .env.example | `api/.env.example` | 53 base Laravel variables |
| docker-compose.yml | Root directory | Service-specific overrides |
| Console .env.development | `console/environments/` | 7 frontend variables |
| Console .env.production | `console/environments/` | 8 frontend variables |
| Config files | `api/config/*.php` | 75+ application variables |

### 2. Critical Environment Variables Identified

**Required for All Backend Services:**
- `APP_KEY` - Encryption key (must be generated)
- `DATABASE_URL` - MySQL connection string
- `REDIS_URL` - Redis connection string
- `CACHE_DRIVER` - Set to `redis`
- `QUEUE_CONNECTION` - Set to `redis`

**Required for API Only:**
- `CONSOLE_HOST` - For CORS configuration
- `BROADCAST_DRIVER` - Set to `socketcluster`
- `SESSION_DOMAIN` - Set to `.up.railway.app`

**Required for Console:**
- `API_HOST` - Backend API URL
- `SOCKETCLUSTER_HOST` - WebSocket server URL

**Required for Socket:**
- `SOCKETCLUSTER_OPTIONS` - CORS origins configuration

### 3. Service-to-Variable Mapping

| Service | Database | Redis | Session | WebSocket | Public |
|---------|----------|-------|---------|-----------|--------|
| fleetbase-api | Yes | Yes | Yes | Producer | Optional |
| fleetbase-queue | Yes | Yes | No | No | No |
| fleetbase-scheduler | Yes | Yes | No | No | No |
| fleetbase-console | No | No | No | Consumer | Yes |
| fleetbase-socket | No | No | No | Server | Yes |

### 4. User-Required Actions

1. **APP_KEY Generation:** Must run `php artisan key:generate --show` locally or in container
2. **Post-Deployment URL Updates:** Console URL, API URL, Socket URL need to be collected after initial deployment
3. **SOCKETCLUSTER_OPTIONS:** Must be updated with actual console domain for CORS
4. **MAIL_FROM_ADDRESS:** Should be set to company domain email

### 5. Special Configurations Noted

**Console Configuration Challenge:**
- The Ember.js console reads from `fleetbase.config.json` at runtime
- Need to either:
  - Create custom entrypoint script to generate config from env vars
  - Rebuild console with correct API_HOST embedded
  - Mount config file via Railway volumes

**CORS Configuration:**
- API uses `CONSOLE_HOST` and `FRONTEND_HOSTS` for allowed origins
- Socket uses `SOCKETCLUSTER_OPTIONS` JSON string for origins

**Logging for Railway:**
- Use `LOG_CHANNEL=stderr` for Railway log aggregation
- Avoid file-based logging in containerized environment

---

## Artifact Created

**Location:** `.apm/artifacts/Phase_01/railway_environment_variables.md`

**Contents:**
- Complete environment variable documentation
- Service-specific variable blocks
- Railway reference variable syntax
- User action checklist
- Troubleshooting guide
- CLI configuration commands

---

## Impact on Subsequent Tasks

### Task 1.3 (Provision Railway Infrastructure)
- MySQL and Redis templates must be provisioned first
- Reference variables will be auto-created by Railway

### Task 1.4 (Deploy Fleetbase API)
- API service requires most environment variables
- Must set CONSOLE_HOST after console is deployed

### Task 1.5 (Deploy Fleetbase Console)
- Console needs custom entrypoint or build-time config
- API_HOST must point to deployed API URL

### Task 1.6 (Deploy Fleetbase WebSocket)
- SOCKETCLUSTER_OPTIONS requires console URL
- Origins must be updated post-console-deployment

### Task 1.7 (Deploy Background Workers)
- Queue and Scheduler share similar env vars
- Simpler config than API (no session/CORS needed)

---

## Recommendations

1. **Deployment Order:**
   - Deploy MySQL/Redis first (Phase 1)
   - Deploy Socket next (no dependencies)
   - Deploy API (needs database + redis)
   - Deploy Console last (needs API URL)
   - Update CORS settings after all URLs are known

2. **Environment Variable Management:**
   - Use Railway shared variables for common settings
   - Use reference variables for database/redis connections
   - Keep secrets in Railway (not in code)

3. **Console Deployment Strategy:**
   - Consider building console with environment variable at build time
   - Or create custom docker-entrypoint.sh for runtime config injection

---

## Notes for Manager Agent

- Total of 75+ environment variables identified across all services
- 7 critical user actions required before production deployment
- Console config injection requires additional work (custom entrypoint recommended)
- Post-deployment updates needed for CORS and WebSocket origins
