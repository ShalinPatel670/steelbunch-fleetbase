# Task 1.1 – Analyze Railway Deployment Strategy

**Status:** Completed
**Agent:** Agent_Infrastructure_Config
**Date Completed:** 2026-01-27

## Key Decisions

1. **Service Mapping:** 8 Fleetbase services → 7 Railway targets
   - MySQL & Redis: Use Railway managed templates (not containers)
   - httpd eliminated: Railway handles SSL termination, routing, load balancing natively

2. **Railway Services from Monorepo:**
   - `fleetbase-api` — Laravel API (FrankenPHP), internal only
   - `fleetbase-queue` — Queue worker, internal only
   - `fleetbase-scheduler` — Cron/scheduler, internal only
   - `fleetbase-console` — Ember.js frontend, **public**
   - `fleetbase-socket` — SocketCluster v17.4.0, **public**

3. **Networking:**
   - Internal services use `*.railway.internal` private networking
   - Console and Socket exposed via `*.up.railway.app` public URLs
   - API can be internal-only if console proxies, or public for direct access

## Important Findings

1. **Private networking unavailable during build** — Migrations must run in startup scripts, not Dockerfile
2. **SocketCluster CORS** — Requires explicit allowed origins configuration
3. **Reference Variables enforce deployment order** — Services referencing MySQL/Redis deploy after those templates

## Cost Estimate

~$97.50/month for 7 services with reasonable resource allocation

## Artifact

Full deployment strategy document: `.apm/artifacts/Phase_01/railway_deployment_strategy.md`

## Next Task

Proceed to Task 1.2: Configure Fleetbase Environment Variables
