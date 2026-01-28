# Fleetbase Railway Environment Variables Configuration

**Document Version:** 1.0
**Created:** 2026-01-27
**Task Reference:** Task 1.2 - Configure Fleetbase Environment Variables
**Agent:** Agent_Infrastructure_Config

---

## Executive Summary

This document provides a comprehensive environment variable configuration for deploying Fleetbase on Railway. Variables are organized by service and categorized by type (shared, reference, service-specific). Each variable is marked with its requirement level and whether user action is needed.

**Total Services:** 5 application services + 2 managed templates
**Total Variables Identified:** 75+ environment variables
**Critical User Actions Required:** 7 items

---

## Table of Contents

1. [Quick Start Checklist](#1-quick-start-checklist)
2. [Railway Project-Level Variables (Shared)](#2-railway-project-level-variables-shared)
3. [Reference Variables (Auto-Injected)](#3-reference-variables-auto-injected)
4. [Service-Specific Variables](#4-service-specific-variables)
   - 4.1 [fleetbase-api](#41-fleetbase-api)
   - 4.2 [fleetbase-queue](#42-fleetbase-queue)
   - 4.3 [fleetbase-scheduler](#43-fleetbase-scheduler)
   - 4.4 [fleetbase-console](#44-fleetbase-console)
   - 4.5 [fleetbase-socket](#45-fleetbase-socket)
5. [User Action Items](#5-user-action-items)
6. [Optional/Future Configuration](#6-optionalfuture-configuration)
7. [Railway CLI Configuration Commands](#7-railway-cli-configuration-commands)

---

## 1. Quick Start Checklist

Before deployment, ensure you have:

- [ ] Generated APP_KEY using `php artisan key:generate --show`
- [ ] Obtained your Railway Console public URL (after first deploy)
- [ ] Obtained your Railway API public URL (after first deploy)
- [ ] Obtained your Railway Socket public URL (after first deploy)
- [ ] Configured SMTP/mail credentials (optional, can use log driver initially)
- [ ] Set up AWS credentials (optional, for S3 file storage)
- [ ] Documented the CONSOLE_HOST domain for CORS configuration

---

## 2. Railway Project-Level Variables (Shared)

These variables should be set at the **Railway Project level** and will be available to all services.

### 2.1 Core Application Settings

| Variable | Value | Type | Notes |
|----------|-------|------|-------|
| `APP_NAME` | `Fleetbase` | Default | Application display name |
| `APP_ENV` | `production` | Default | Environment mode |
| `APP_DEBUG` | `false` | Default | Must be false in production |
| `APP_KEY` | `base64:...` | **USER ACTION** | Generate with `php artisan key:generate --show` |
| `APP_URL` | `${{fleetbase-api.RAILWAY_PUBLIC_DOMAIN}}` | Reference | Auto-populated after API deployment |

### 2.2 External Services

| Variable | Value | Type | Notes |
|----------|-------|------|-------|
| `REGISTRY_HOST` | `https://registry.fleetbase.io` | Default | Fleetbase extension registry |
| `REGISTRY_PREINSTALLED_EXTENSIONS` | `true` | Default | Enable pre-installed extensions |
| `OSRM_HOST` | `https://router.project-osrm.org` | Default | Open Source Routing Machine |

### 2.3 Mail Configuration (Default - Log Driver)

| Variable | Value | Type | Notes |
|----------|-------|------|-------|
| `MAIL_MAILER` | `log` | Default | Set to `smtp` for real email |
| `MAIL_FROM_NAME` | `Fleetbase` | Default | Sender display name |
| `MAIL_FROM_ADDRESS` | `noreply@yourdomain.com` | **USER ACTION** | Set your domain email |

### 2.4 Mail Configuration (Production - SMTP)

Set these when ready for production email:

| Variable | Value | Type | Notes |
|----------|-------|------|-------|
| `MAIL_MAILER` | `smtp` | User Config | Change from log to smtp |
| `MAIL_HOST` | `smtp.mailgun.org` | **USER ACTION** | Your SMTP host |
| `MAIL_PORT` | `587` | Default | Standard TLS port |
| `MAIL_USERNAME` | _(your username)_ | **USER ACTION** | SMTP username |
| `MAIL_PASSWORD` | _(your password)_ | **USER ACTION** | SMTP password |
| `MAIL_ENCRYPTION` | `tls` | Default | TLS encryption |

---

## 3. Reference Variables (Auto-Injected)

Railway automatically provides these from managed templates. Use Railway's reference syntax.

### 3.1 MySQL Template Variables

When you add the MySQL template, Railway creates these variables. Reference them in your services:

| Railway Reference | Resolves To | Usage |
|-------------------|-------------|-------|
| `${{MySQL.DATABASE_URL}}` | `mysql://user:pass@host:3306/db` | Full connection URL |
| `${{MySQL.MYSQL_URL}}` | Same as DATABASE_URL | Alternative reference |
| `${{MySQL.MYSQLHOST}}` | `mysql.railway.internal` | Internal hostname |
| `${{MySQL.MYSQLPORT}}` | `3306` | Port number |
| `${{MySQL.MYSQLDATABASE}}` | `railway` | Database name |
| `${{MySQL.MYSQLUSER}}` | `root` | Database username |
| `${{MySQL.MYSQLPASSWORD}}` | _(auto-generated)_ | Database password |

### 3.2 Redis Template Variables

When you add the Redis template, Railway creates these variables:

| Railway Reference | Resolves To | Usage |
|-------------------|-------------|-------|
| `${{Redis.REDIS_URL}}` | `redis://default:pass@host:6379` | Full connection URL |
| `${{Redis.REDISHOST}}` | `redis.railway.internal` | Internal hostname |
| `${{Redis.REDISPORT}}` | `6379` | Port number |
| `${{Redis.REDISPASSWORD}}` | _(auto-generated)_ | Redis password |

---

## 4. Service-Specific Variables

### 4.1 fleetbase-api

**Purpose:** Main API server running Laravel Octane with FrankenPHP
**Dockerfile:** `docker/Dockerfile` (target: app-release)
**Port:** 8000

#### Database Configuration

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | `${{MySQL.DATABASE_URL}}` | Yes |
| `DB_CONNECTION` | `mysql` | Yes |

#### Cache & Queue Configuration

| Variable | Value | Required |
|----------|-------|----------|
| `CACHE_DRIVER` | `redis` | Yes |
| `CACHE_URL` | `${{Redis.REDIS_URL}}` | Yes |
| `QUEUE_CONNECTION` | `redis` | Yes |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` | Yes |
| `REDIS_HOST` | `${{Redis.REDISHOST}}` | Yes |
| `REDIS_PORT` | `${{Redis.REDISPORT}}` | Yes |
| `REDIS_PASSWORD` | `${{Redis.REDISPASSWORD}}` | Yes |

#### Session Configuration

| Variable | Value | Required |
|----------|-------|----------|
| `SESSION_DRIVER` | `redis` | Recommended |
| `SESSION_DOMAIN` | `.up.railway.app` | Yes |
| `SESSION_SECURE_COOKIE` | `true` | Yes |
| `SESSION_LIFETIME` | `120` | Default |

#### Broadcasting (SocketCluster)

| Variable | Value | Required |
|----------|-------|----------|
| `BROADCAST_DRIVER` | `socketcluster` | Yes |
| `SOCKETCLUSTER_HOST` | `fleetbase-socket.railway.internal` | Yes |
| `SOCKETCLUSTER_PORT` | `8000` | Yes |

#### Logging

| Variable | Value | Required |
|----------|-------|----------|
| `LOG_CHANNEL` | `stderr` | Recommended |
| `LOG_LEVEL` | `info` | Default |
| `LOG_DEPRECATIONS_CHANNEL` | `null` | Default |

#### CORS Configuration

| Variable | Value | Required |
|----------|-------|----------|
| `CONSOLE_HOST` | `https://your-console.up.railway.app` | **USER ACTION** |
| `FRONTEND_HOSTS` | _(comma-separated list)_ | Optional |

#### Application URLs

| Variable | Value | Required |
|----------|-------|----------|
| `APP_URL` | `https://your-api.up.railway.app` | **USER ACTION** |

#### Complete fleetbase-api Environment Block

```bash
# Core (Reference Project-Level)
APP_NAME=${{shared.APP_NAME}}
APP_ENV=${{shared.APP_ENV}}
APP_KEY=${{shared.APP_KEY}}
APP_DEBUG=${{shared.APP_DEBUG}}
APP_URL=https://fleetbase-api-production.up.railway.app

# Database
DATABASE_URL=${{MySQL.DATABASE_URL}}
DB_CONNECTION=mysql

# Redis/Cache/Queue
CACHE_DRIVER=redis
CACHE_URL=${{Redis.REDIS_URL}}
QUEUE_CONNECTION=redis
REDIS_URL=${{Redis.REDIS_URL}}
REDIS_HOST=${{Redis.REDISHOST}}
REDIS_PORT=${{Redis.REDISPORT}}
REDIS_PASSWORD=${{Redis.REDISPASSWORD}}

# Session
SESSION_DRIVER=redis
SESSION_DOMAIN=.up.railway.app
SESSION_SECURE_COOKIE=true
SESSION_LIFETIME=120

# Broadcasting
BROADCAST_DRIVER=socketcluster
SOCKETCLUSTER_HOST=fleetbase-socket.railway.internal
SOCKETCLUSTER_PORT=8000

# Logging
LOG_CHANNEL=stderr
LOG_LEVEL=info

# CORS
CONSOLE_HOST=https://fleetbase-console-production.up.railway.app

# External Services
REGISTRY_HOST=https://registry.fleetbase.io
REGISTRY_PREINSTALLED_EXTENSIONS=true
OSRM_HOST=https://router.project-osrm.org

# Mail (adjust for production)
MAIL_MAILER=log
MAIL_FROM_NAME=Fleetbase
MAIL_FROM_ADDRESS=noreply@steelbunch.com

# Filesystem
FILESYSTEM_DRIVER=public
```

---

### 4.2 fleetbase-queue

**Purpose:** Background job processor using Laravel Queue
**Dockerfile:** `docker/Dockerfile` (target: events-dev or events)
**Start Command:** `php artisan queue:work --sleep=3 --tries=3 --max-time=3600`
**Port:** None (internal worker)

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | `${{MySQL.DATABASE_URL}}` | Yes |
| `DB_CONNECTION` | `mysql` | Yes |
| `QUEUE_CONNECTION` | `redis` | Yes |
| `CACHE_DRIVER` | `redis` | Yes |
| `CACHE_URL` | `${{Redis.REDIS_URL}}` | Yes |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` | Yes |
| `REDIS_HOST` | `${{Redis.REDISHOST}}` | Yes |
| `REDIS_PORT` | `${{Redis.REDISPORT}}` | Yes |
| `REDIS_PASSWORD` | `${{Redis.REDISPASSWORD}}` | Yes |
| `APP_KEY` | `${{shared.APP_KEY}}` | Yes |
| `APP_ENV` | `production` | Yes |
| `LOG_CHANNEL` | `stderr` | Recommended |

#### Complete fleetbase-queue Environment Block

```bash
# Core
APP_NAME=Fleetbase
APP_ENV=production
APP_KEY=${{shared.APP_KEY}}
APP_DEBUG=false

# Database
DATABASE_URL=${{MySQL.DATABASE_URL}}
DB_CONNECTION=mysql

# Redis/Cache/Queue
QUEUE_CONNECTION=redis
CACHE_DRIVER=redis
CACHE_URL=${{Redis.REDIS_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
REDIS_HOST=${{Redis.REDISHOST}}
REDIS_PORT=${{Redis.REDISPORT}}
REDIS_PASSWORD=${{Redis.REDISPASSWORD}}

# Logging
LOG_CHANNEL=stderr
LOG_LEVEL=info

# Queue Failed Jobs
QUEUE_FAILED_DRIVER=database-uuids
```

---

### 4.3 fleetbase-scheduler

**Purpose:** Cron-based task scheduler using go-crond
**Dockerfile:** `docker/Dockerfile` (target: scheduler-dev or scheduler)
**Start Command:** `go-crond --verbose root:./crontab`
**Port:** None (internal worker)

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | `${{MySQL.DATABASE_URL}}` | Yes |
| `DB_CONNECTION` | `mysql` | Yes |
| `QUEUE_CONNECTION` | `redis` | Yes |
| `CACHE_DRIVER` | `redis` | Yes |
| `CACHE_URL` | `${{Redis.REDIS_URL}}` | Yes |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` | Yes |
| `REDIS_HOST` | `${{Redis.REDISHOST}}` | Yes |
| `REDIS_PORT` | `${{Redis.REDISPORT}}` | Yes |
| `REDIS_PASSWORD` | `${{Redis.REDISPASSWORD}}` | Yes |
| `APP_KEY` | `${{shared.APP_KEY}}` | Yes |
| `APP_ENV` | `production` | Yes |
| `LOG_CHANNEL` | `stderr` | Recommended |

#### Complete fleetbase-scheduler Environment Block

```bash
# Core
APP_NAME=Fleetbase
APP_ENV=production
APP_KEY=${{shared.APP_KEY}}
APP_DEBUG=false

# Database
DATABASE_URL=${{MySQL.DATABASE_URL}}
DB_CONNECTION=mysql

# Redis/Cache/Queue
QUEUE_CONNECTION=redis
CACHE_DRIVER=redis
CACHE_URL=${{Redis.REDIS_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
REDIS_HOST=${{Redis.REDISHOST}}
REDIS_PORT=${{Redis.REDISPORT}}
REDIS_PASSWORD=${{Redis.REDISPASSWORD}}

# Logging
LOG_CHANNEL=stderr
LOG_LEVEL=info
```

---

### 4.4 fleetbase-console

**Purpose:** Ember.js frontend application served via Nginx
**Dockerfile:** `console/Dockerfile`
**Port:** 4200
**Public:** Yes

The console uses a runtime configuration file (`fleetbase.config.json`) that must be mounted or injected at runtime.

#### Build-Time Variables (ENVIRONMENT arg)

| Variable | Value | Notes |
|----------|-------|-------|
| `ENVIRONMENT` | `production` | Build arg for ember build |

#### Runtime Configuration (fleetbase.config.json)

The console reads configuration from `/usr/share/nginx/html/fleetbase.config.json`. This file should contain:

```json
{
  "API_HOST": "https://fleetbase-api-production.up.railway.app"
}
```

#### Alternative: Environment Variables for Console

If the console supports environment variable injection at runtime, set:

| Variable | Value | Required |
|----------|-------|----------|
| `API_HOST` | `https://your-api.up.railway.app` | **USER ACTION** |
| `API_NAMESPACE` | `int/v1` | Default |
| `API_SECURE` | `true` | Default |
| `SOCKETCLUSTER_HOST` | `your-socket.up.railway.app` | **USER ACTION** |
| `SOCKETCLUSTER_PATH` | `/socketcluster/` | Default |
| `SOCKETCLUSTER_SECURE` | `true` | Default |
| `SOCKETCLUSTER_PORT` | `443` | Default (HTTPS) |
| `OSRM_HOST` | `https://router.project-osrm.org` | Default |

#### Console Configuration Strategy for Railway

**Option A: Build-time injection**
Set environment variables before building. The Ember app will embed these during `pnpm build`.

**Option B: Runtime config file**
Mount or generate `fleetbase.config.json` at container startup. This requires a custom entrypoint script.

**Recommended Approach:**
Create a Railway startup script that generates `fleetbase.config.json` from environment variables:

```bash
#!/bin/sh
# docker-entrypoint.sh for console
cat > /usr/share/nginx/html/fleetbase.config.json << EOF
{
  "API_HOST": "${API_HOST:-http://localhost:8000}"
}
EOF
exec nginx -g 'daemon off;'
```

---

### 4.5 fleetbase-socket

**Purpose:** SocketCluster WebSocket server for real-time communication
**Image:** `socketcluster/socketcluster:v17.4.0` (Docker Hub)
**Port:** 8000
**Public:** Yes (for browser WebSocket connections)

| Variable | Value | Required |
|----------|-------|----------|
| `SOCKETCLUSTER_WORKERS` | `10` | Default |
| `SOCKETCLUSTER_BROKERS` | `10` | Default |
| `SOCKETCLUSTER_OPTIONS` | _(JSON string)_ | **USER ACTION** |

#### CORS Configuration for SocketCluster

The `SOCKETCLUSTER_OPTIONS` variable must contain a JSON object with allowed origins:

```bash
SOCKETCLUSTER_OPTIONS={"origins":"https://fleetbase-console-production.up.railway.app:*,https://fleetbase-api-production.up.railway.app:*"}
```

**Important:** Update the origins to match your actual Railway public URLs after initial deployment.

#### Complete fleetbase-socket Environment Block

```bash
SOCKETCLUSTER_WORKERS=10
SOCKETCLUSTER_BROKERS=10
SOCKETCLUSTER_OPTIONS={"origins":"https://fleetbase-console-production.up.railway.app:*"}
```

---

## 5. User Action Items

### 5.1 Critical - Must Complete Before Deployment

| # | Action | Variable(s) | How to Obtain |
|---|--------|-------------|---------------|
| 1 | Generate APP_KEY | `APP_KEY` | Run `php artisan key:generate --show` locally |
| 2 | Set Console URL | `CONSOLE_HOST` | Deploy console first, copy Railway URL |
| 3 | Set API URL | `APP_URL` | Deploy API first, copy Railway URL |
| 4 | Set Socket Origins | `SOCKETCLUSTER_OPTIONS` | Update with console/API URLs |
| 5 | Configure Console API_HOST | `API_HOST` (console) | Use API's Railway URL |
| 6 | Configure Console Socket Host | `SOCKETCLUSTER_HOST` (console) | Use Socket's Railway URL |
| 7 | Set Mail From Address | `MAIL_FROM_ADDRESS` | Your domain email |

### 5.2 Post-Deployment Updates

After initial deployment, you must:

1. **Get Railway URLs:** Each service gets a `*.up.railway.app` URL
2. **Update CONSOLE_HOST:** Set in fleetbase-api with console URL
3. **Update SOCKETCLUSTER_OPTIONS:** Set origins with console URL
4. **Update Console config:** Set API_HOST with API URL

### 5.3 Optional - Production Readiness

| Action | Variables | Notes |
|--------|-----------|-------|
| Configure SMTP | `MAIL_MAILER`, `MAIL_HOST`, etc. | For email notifications |
| Configure AWS S3 | `AWS_*` variables | For file storage |
| Configure Stripe | `STRIPE_*` variables | For payments (if needed) |
| Set Custom Domain | Railway domain settings | For branded URLs |

---

## 6. Optional/Future Configuration

### 6.1 AWS S3 (File Storage)

| Variable | Value | Notes |
|----------|-------|-------|
| `FILESYSTEM_DRIVER` | `s3` | Change from public |
| `AWS_ACCESS_KEY_ID` | _(your key)_ | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | _(your secret)_ | AWS credentials |
| `AWS_DEFAULT_REGION` | `us-east-1` | Your region |
| `AWS_BUCKET` | _(your bucket)_ | S3 bucket name |
| `AWS_URL` | _(optional)_ | Custom S3 URL |

### 6.2 Google Cloud Storage (Alternative)

| Variable | Value | Notes |
|----------|-------|-------|
| `FILESYSTEM_DRIVER` | `gcs` | Use GCS |
| `GOOGLE_CLOUD_PROJECT_ID` | _(project id)_ | GCP project |
| `GOOGLE_CLOUD_KEY_FILE` | _(path or JSON)_ | Service account |
| `GOOGLE_CLOUD_STORAGE_BUCKET` | _(bucket name)_ | GCS bucket |

### 6.3 Stripe (Payments)

| Variable | Value | Notes |
|----------|-------|-------|
| `STRIPE_KEY` | _(publishable key)_ | Stripe public key |
| `STRIPE_SECRET` | _(secret key)_ | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | _(webhook secret)_ | For webhook verification |

### 6.4 SSO/OAuth (Phase 2 - TBD)

Reserved for Phase 2 SSO integration:

| Variable | Notes |
|----------|-------|
| `MICROSOFT_GRAPH_CLIENT_ID` | Azure AD integration |
| `MICROSOFT_GRAPH_CLIENT_SECRET` | Azure AD integration |
| `MICROSOFT_GRAPH_TENANT_ID` | Azure AD integration |

### 6.5 Alternative Mail Providers

**SendGrid:**
| Variable | Value |
|----------|-------|
| `MAIL_MAILER` | `sendgrid` |
| `SENDGRID_API_KEY` | _(your api key)_ |

**Mailgun:**
| Variable | Value |
|----------|-------|
| `MAIL_MAILER` | `mailgun` |
| `MAILGUN_DOMAIN` | _(your domain)_ |
| `MAILGUN_SECRET` | _(your api key)_ |

**AWS SES:**
| Variable | Value |
|----------|-------|
| `MAIL_MAILER` | `ses` |
| `AWS_ACCESS_KEY_ID` | _(required)_ |
| `AWS_SECRET_ACCESS_KEY` | _(required)_ |
| `AWS_DEFAULT_REGION` | _(required)_ |

---

## 7. Railway CLI Configuration Commands

### 7.1 Setting Shared Variables

```bash
# Set shared variables at project level
railway variables set APP_NAME=Fleetbase
railway variables set APP_ENV=production
railway variables set APP_DEBUG=false
railway variables set APP_KEY="base64:YOUR_GENERATED_KEY_HERE"
railway variables set REGISTRY_HOST=https://registry.fleetbase.io
railway variables set REGISTRY_PREINSTALLED_EXTENSIONS=true
railway variables set OSRM_HOST=https://router.project-osrm.org
```

### 7.2 Setting Service Variables

```bash
# Link to specific service first
railway link --service fleetbase-api

# Set API service variables
railway variables set DATABASE_URL='${{MySQL.DATABASE_URL}}'
railway variables set REDIS_URL='${{Redis.REDIS_URL}}'
railway variables set CACHE_DRIVER=redis
railway variables set QUEUE_CONNECTION=redis
railway variables set BROADCAST_DRIVER=socketcluster
railway variables set LOG_CHANNEL=stderr
railway variables set SESSION_DRIVER=redis
railway variables set SESSION_DOMAIN=.up.railway.app

# Repeat for other services...
```

### 7.3 Bulk Import from File

Create a `.env.railway` file and import:

```bash
railway variables import < .env.railway
```

---

## Appendix A: Variable Reference Quick Sheet

### Essential Variables (All Backend Services)

```bash
APP_NAME=Fleetbase
APP_ENV=production
APP_KEY=base64:...
APP_DEBUG=false
DATABASE_URL=${{MySQL.DATABASE_URL}}
DB_CONNECTION=mysql
CACHE_DRIVER=redis
CACHE_URL=${{Redis.REDIS_URL}}
QUEUE_CONNECTION=redis
REDIS_URL=${{Redis.REDIS_URL}}
LOG_CHANNEL=stderr
```

### Console-Specific Variables

```bash
API_HOST=https://your-api.up.railway.app
API_NAMESPACE=int/v1
SOCKETCLUSTER_HOST=your-socket.up.railway.app
SOCKETCLUSTER_SECURE=true
SOCKETCLUSTER_PORT=443
```

### Socket-Specific Variables

```bash
SOCKETCLUSTER_WORKERS=10
SOCKETCLUSTER_BROKERS=10
SOCKETCLUSTER_OPTIONS={"origins":"https://your-console.up.railway.app:*"}
```

---

## Appendix B: Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Database connection failed | Wrong DATABASE_URL | Verify MySQL template is deployed, check reference syntax |
| Redis connection failed | Redis not ready | Ensure Redis template is deployed first |
| CORS errors | CONSOLE_HOST not set | Add console URL to CONSOLE_HOST |
| WebSocket 403 | Wrong SOCKETCLUSTER_OPTIONS | Update origins with correct console URL |
| Sessions not persisting | SESSION_DOMAIN mismatch | Ensure domain matches Railway suffix |
| Migrations fail | Database not accessible | Check private networking is enabled |

### Verification Commands

```bash
# Check service health
railway logs --service fleetbase-api

# Check environment variables
railway variables --service fleetbase-api

# Test database connection
railway run --service fleetbase-api -- php artisan migrate:status

# Test Redis connection
railway run --service fleetbase-api -- php artisan tinker --execute="Redis::ping()"
```

---

**End of Document**
