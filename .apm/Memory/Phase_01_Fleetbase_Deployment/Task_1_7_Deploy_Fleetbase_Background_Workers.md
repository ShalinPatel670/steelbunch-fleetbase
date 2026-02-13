---
agent: Agent_Infrastructure_Deploy
task_ref: Task 1.7
status: Completed
ad_hoc_delegation: false
compatibility_issues: false
important_findings: true
---

# Task Log: Task 1.7 - Deploy Fleetbase Background Workers

## Summary
Prepared complete deployment configuration for queue worker and scheduler services using dedicated Dockerfiles (`docker/Dockerfile.queue`, `docker/Dockerfile.scheduler`). Dashboard deployment approach selected (Option B). Both services are internal-only with no public domain.

## Details
- Reviewed main `docker/Dockerfile` — identified multi-stage targets (`events-dev`, `scheduler-dev`) as well as dedicated Dockerfiles
- Discovered `docker/Dockerfile.queue` (self-contained, includes `--sleep=3 --tries=3 --max-time=3600` flags) and `docker/Dockerfile.scheduler` (self-contained, installs go-crond, copies crontab)
- Selected dedicated Dockerfiles over multi-stage targets because:
  - Self-contained: no target selection needed in Railway
  - `Dockerfile.queue` already has desired worker flags baked in
  - Both use `ENTRYPOINT []` (no AWS ssm-parent dependency)
  - Leaner images (queue image doesn't include go-crond)
- Confirmed crontab at `docker/crontab` runs `* * * * * php /fleetbase/api/artisan schedule:run`
- Chose Railway Dashboard deployment (Option B) — cannot use railway.toml because both services share repo root as build context, and Railway only allows one `railway.toml` per root directory
- Both Dockerfiles require `GITHUB_AUTH_KEY` build arg for private composer packages

## Output

### Queue Worker Service (`fleetbase-queue`)

**Railway Dashboard Settings:**
- Source: GitHub Repo (same repo as API)
- Root Directory: `/` (repo root)
- Dockerfile Path: `docker/Dockerfile.queue`
- No start command override needed (baked into Dockerfile)
- No public domain
- Restart Policy: ON_FAILURE

**Build Args:**
- `GITHUB_AUTH_KEY`: Same value as API service
- `ENVIRONMENT`: `production`

**Environment Variables:**
```
APP_NAME=Fleetbase
APP_ENV=production
APP_KEY=${{fleetbase-api.APP_KEY}}
APP_DEBUG=false
DATABASE_URL=${{MySQL.DATABASE_URL}}
DB_CONNECTION=mysql
QUEUE_CONNECTION=redis
CACHE_DRIVER=redis
CACHE_URL=${{Redis.REDIS_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
REDIS_HOST=${{Redis.REDISHOST}}
REDIS_PORT=${{Redis.REDISPORT}}
REDIS_PASSWORD=${{Redis.REDISPASSWORD}}
LOG_CHANNEL=stderr
```

### Scheduler Service (`fleetbase-scheduler`)

**Railway Dashboard Settings:**
- Source: GitHub Repo (same repo as API)
- Root Directory: `/` (repo root)
- Dockerfile Path: `docker/Dockerfile.scheduler`
- No start command override needed (baked into Dockerfile)
- No public domain
- Restart Policy: ON_FAILURE

**Build Args:**
- `GITHUB_AUTH_KEY`: Same value as API service
- `ENVIRONMENT`: `production`

**Environment Variables:** Same as queue worker above.

### Deployment Approach
- **Option B selected**: Railway Dashboard configuration
- **Rationale**: Both services use repo root as build context; railway.toml files cannot be used because Railway only allows one per root directory, and the API already claims the repo root
- No new files created in repo

### Verification Checklist
- [ ] Queue worker logs show "Processing" or worker ready message
- [ ] Scheduler logs show go-crond started and running cron commands every minute
- [ ] No Redis/MySQL connection errors in either service's logs
- [ ] Both services show "Running" status in Railway dashboard

## Issues
None. Configuration is ready for dashboard deployment.

## Important Findings
1. **Dedicated Dockerfiles exist** at `docker/Dockerfile.queue` and `docker/Dockerfile.scheduler` — these are better than using multi-stage targets from the main Dockerfile because they're self-contained and don't require ssm-parent
2. **`GITHUB_AUTH_KEY` build arg required** — both Dockerfiles use this for composer authentication; must match the value used for the API service
3. **Crontab path correction** — the deployment strategy document references `./docker/crontab` in the start command, but inside the container the file is at `./crontab` (WORKDIR `/fleetbase/api`); the dedicated Dockerfile handles this correctly
4. **No railway.toml files possible** for these services since they share the repo root build context with the API service

## Next Steps
- User creates both services via Railway dashboard following the step-by-step guide
- Verify logs for both services after deployment
- Report deployed status back to Manager Agent
