# Fleetbase TMS Integration into Steelbunch – APM Implementation Plan
**Memory Strategy:** Dynamic-MD
**Last Modification:** Plan creation by the Setup Agent.
**Project Overview:** Integrate Fleetbase as a full Transportation Management System for Steelbunch sellers via iframe embedding, with SSO authentication (Clerk to Laravel Sanctum bridge), bidirectional tracking data sync, and a new Transportation Management tab replacing the existing Recommendations tab. Uber Freight remains for quotes while Fleetbase provides full TMS execution capabilities. The existing buyer freight tracking experience must remain fully functional.

## Phase 1: Fleetbase Deployment

### Task 1.1 – Analyze Railway Deployment Strategy - Agent_Infrastructure_Config
**Objective:** Determine how to map Fleetbase's 7-service architecture to Railway platform.
**Output:** Documented deployment strategy specifying Railway apps, add-ons, and service mapping.
**Guidance:** Fleetbase has API (FrankenPHP), Console (Nginx/Ember), MySQL, Redis, SocketCluster, Queue Worker, and Scheduler. Research Railway's multi-service capabilities and document the optimal approach.

1. Ad-Hoc Delegation – Railway multi-service deployment research (ref: apm-7-delegate-research.md)
2. Analyze Fleetbase's docker-compose.yml to identify all services, their dependencies, and resource requirements
3. Create service-to-Railway mapping document specifying: Railway apps, Railway add-ons (MySQL/Redis), networking requirements
4. **User Checkpoint:** Present deployment strategy for approval before proceeding with provisioning

### Task 1.2 – Configure Fleetbase Environment Variables - Agent_Infrastructure_Config
**Objective:** Create all required environment variable configurations for Fleetbase services.
**Output:** Complete environment configuration ready for Railway deployment.
**Guidance:** **Depends on: Task 1.1 Output.** Reference Fleetbase's .env.example and docker-compose.yml for required variables.

1. Analyze Fleetbase's `.env.example` and docker-compose.yml for all required environment variables
2. Create environment variable template organized by service (API, Console, SocketCluster, etc.)
3. **User Action:** Provide or generate required secrets (APP_KEY, database credentials, CONSOLE_HOST domain)
4. Configure Railway environment variables for each service group

### Task 1.3 – Provision Railway Infrastructure Services - Agent_Infrastructure_Config
**Objective:** Provision MySQL database and Redis cache on Railway.
**Output:** Running MySQL and Redis instances with connection strings captured.
**Guidance:** **Depends on: Task 1.1 Output.** Use Railway add-ons for managed database services.

1. **User Action:** Provision MySQL 8.0 database via Railway dashboard or CLI (`railway add mysql`)
2. **User Action:** Provision Redis instance via Railway dashboard or CLI (`railway add redis`)
3. Capture and document DATABASE_URL and REDIS_URL connection strings for service configuration

### Task 1.4 – Deploy Fleetbase API Service - Agent_Infrastructure_Deploy
**Objective:** Deploy the main Fleetbase Laravel API with FrankenPHP on Railway.
**Output:** Running API service accessible via Railway-provided URL; URL documented for subsequent tasks.
**Guidance:** **Depends on: Task 1.2 Output by Agent_Infrastructure_Config, Task 1.3 Output by Agent_Infrastructure_Config.** API is the core service that Console and other services depend on. Document the deployed URL as it's required by Tasks 1.5, 1.6, and Phase 2.

1. Create or update `railway.toml` for API service with FrankenPHP build configuration
2. Configure Railway service settings (port 8000, health check endpoint `/api/health`)
3. **User Action:** Trigger deployment via Railway CLI or dashboard
4. **User Action:** Run database migrations via Railway shell (`php artisan migrate`)
5. Verify API is accessible: confirm `/api/health` returns 200 OK, test a basic authenticated endpoint
6. **Document deployed API URL** (e.g., `https://fleetbase-api.up.railway.app`) for use by Console, WebSocket, and SSO configuration

### Task 1.5 – Deploy Fleetbase Console Service - Agent_Infrastructure_Deploy
**Objective:** Deploy the Fleetbase Ember.js console frontend on Railway.
**Output:** Running console accessible via Railway-provided URL; URL documented for WebSocket CORS and Steelbunch iframe configuration.
**Guidance:** **Depends on: Task 1.4 Output.** Console needs API URL for configuration. Railway can serve static builds via Nixpacks or custom Dockerfile with Nginx.

1. Configure console build environment: set `API_HOST` to deployed API URL from Task 1.4, set `SOCKETCLUSTER_HOST` to planned WebSocket URL
2. Create Railway service for console: configure as static site or use Dockerfile with Nginx for SPA routing (handle client-side routes)
3. **User Action:** Trigger console deployment via Railway
4. Verify console loads, login page renders, and API communication works (check network tab for successful API calls)
5. **Document deployed Console URL** for WebSocket CORS configuration and Steelbunch iframe embedding

### Task 1.6 – Deploy Fleetbase WebSocket Service - Agent_Infrastructure_Deploy
**Objective:** Deploy SocketCluster for real-time WebSocket communication.
**Output:** Running WebSocket service with proper CORS configuration for Console and Steelbunch.
**Guidance:** **Depends on: Task 1.5 Output.** SocketCluster needs Console URL for allowed origins. Steelbunch production URL should be obtained from environment configuration or user.

1. Configure SocketCluster service deployment with port 38000 exposed
2. Set `SOCKETCLUSTER_OPTIONS` allowed origins: include Console URL from Task 1.5, and Steelbunch production URL (obtain from user or use environment variable `STEELBUNCH_URL`)
3. **User Action:** Provide Steelbunch production URL if not already known; trigger SocketCluster deployment via Railway
4. Verify WebSocket connections work from Console (check browser dev tools Network tab for WebSocket upgrade and successful connection)

### Task 1.7 – Deploy Fleetbase Background Workers - Agent_Infrastructure_Deploy
**Objective:** Deploy Laravel queue workers and scheduler for background job processing.
**Output:** Running background processes handling queued jobs and scheduled tasks.
**Guidance:** **Depends on: Task 1.3 Output by Agent_Infrastructure_Config, Task 1.4 Output.** Workers need Redis connection and share API codebase. Railway can run these as separate services from same repo with different start commands.

1. Configure queue worker service: use `php artisan queue:work --sleep=3 --tries=3` command with Redis connection from Task 1.3
2. Configure scheduler service: use cron or `php artisan schedule:work` for continuous scheduling (Railway supports cron jobs)
3. **User Action:** Deploy both background worker services via Railway
4. Verify jobs are processing: check Railway logs for queue worker activity, or dispatch a test job and confirm processing (if Horizon is installed, check Horizon dashboard; otherwise verify via `php artisan queue:monitor` or application logs)

### Task 1.8 – Verify Deployment & End-to-End Testing - Agent_Infrastructure_Deploy
**Objective:** Comprehensive verification that all Fleetbase services are operational.
**Output:** Verified working Fleetbase instance ready for integration.
**Guidance:** **Depends on: Tasks 1.4, 1.5, 1.6, 1.7 Output.** This is the phase completion checkpoint.

1. Verify API health: Access `/api/health` endpoint returns 200 OK
2. Verify Console access: Load console URL, confirm login page renders
3. Verify Database connectivity: Console can display data (create test organization)
4. Verify WebSocket: Real-time updates work in Console (check network tab for socket connection)
5. **User Review Checkpoint:** Confirm Fleetbase is fully operational before proceeding to rebranding

### Task 1.9 – Analyze Fleetbase Console Theming & Steelbunch Branding - Agent_Frontend
**Objective:** Understand Fleetbase Console's theming/customization system and catalog Steelbunch brand assets for rebranding.
**Output:** Documented rebranding plan with specific files to modify, color mappings, logo replacements, and text changes.
**Guidance:** **Depends on: Task 1.8 Output.** Fleetbase Console is an Ember.js application. Steelbunch frontend is a React/Next.js application with Tailwind CSS.

1. Analyze Fleetbase Console source code for theming system: look for CSS variables, SCSS themes, Ember engine configuration, brand config files, and logo/icon assets in the console directory
2. Identify all branding touchpoints: logos (navbar, login page, favicon, loading screens), color scheme (primary, secondary, accent), fonts, and application name text references ("Fleetbase")
3. Analyze Steelbunch's existing design system: extract colors, fonts, and logo assets from the Steelbunch codebase (check Tailwind config, global CSS, brand assets directory)
4. Document rebranding plan: specific files to modify, color mappings (Fleetbase color → Steelbunch color), logo files to replace, text strings to change (e.g., "Fleetbase" → "Steelbunch TMS" or user-preferred name)
5. **User Checkpoint:** Present rebranding plan for approval (naming, color choices) before implementation

### Task 1.10 – Rebrand Fleetbase Console to Steelbunch - Agent_Frontend
**Objective:** Apply Steelbunch branding to Fleetbase Console so it visually matches the Steelbunch web application.
**Output:** Rebranded Fleetbase Console deployed with Steelbunch visual identity.
**Guidance:** **Depends on: Task 1.9 Output.** Apply all changes identified in the theming analysis. Console must look like a native part of Steelbunch, not a third-party tool.

1. Replace logos: swap Fleetbase logos with Steelbunch logos across all touchpoints (navbar, login page, favicon, loading/splash screens)
2. Update color scheme: modify CSS variables, SCSS, or theme configuration files to use Steelbunch's color palette
3. Update fonts: match Steelbunch's typography if different from Fleetbase defaults
4. Update text references: replace "Fleetbase" with approved Steelbunch branding text throughout the console UI
5. **User Action:** Deploy updated console to Railway and verify
6. Visual verification: compare rebranded console side-by-side with Steelbunch app to ensure cohesive, consistent appearance

## Phase 2: SSO Authentication Integration

### Task 2.1 – Analyze Authentication Bridge Architecture - Agent_Auth
**Objective:** Design the secure token exchange flow between Clerk (Steelbunch) and Laravel Sanctum (Fleetbase).
**Output:** Architecture document with sections: (1) Token Flow Diagram, (2) Endpoint Specifications, (3) Tenant Mapping Approach, (4) Security Considerations, (5) Error Handling Strategy.
**Guidance:** This is the highest complexity area. Security is critical—design must prevent cross-tenant access and token forgery. Document should be detailed enough for Implementation Agents to execute without ambiguity.

1. Ad-Hoc Delegation – Clerk JWT structure and Laravel Sanctum SSO patterns research (ref: apm-7-delegate-research.md)
2. Analyze Clerk JWT claims structure: identify `sub` (user ID), `org_id` or `organization_id` (company), `email`, and any custom metadata fields
3. Design token exchange flow: Steelbunch obtains Clerk session token → passes to Fleetbase SSO endpoint → Fleetbase validates JWT signature via JWKS → extracts claims → creates/updates user → maps tenant → returns Sanctum token
4. Document architecture with all required sections: include sequence diagram, endpoint URL and request/response format, tenant mapping table schema, security measures (HTTPS, token expiration, JWKS rotation), and error codes

### Task 2.2 – Create Fleetbase SSO Endpoint - Agent_Auth
**Objective:** Create API endpoint in Fleetbase that accepts Clerk JWTs and returns Sanctum sessions.
**Output:** Working `/api/sso/clerk` endpoint in Fleetbase API.
**Guidance:** **Depends on: Task 2.1 Output.** Endpoint must be secure and not leak validation details on failure.

1. Create `SsoController` in Fleetbase API with `clerkLogin` method accepting JWT in Authorization header
2. Add route `POST /api/sso/clerk` in Fleetbase routing configuration
3. Implement token exchange logic: validate JWT signature, extract user claims, create/update Fleetbase user, generate Sanctum token
4. Add endpoint to CORS allowed origins for Steelbunch domain

### Task 2.3 – Implement Clerk Token Validation in Fleetbase - Agent_Auth
**Objective:** Implement secure JWT validation for Clerk tokens within Fleetbase.
**Output:** JWT validation service that verifies Clerk token signatures and claims.
**Guidance:** **Depends on: Task 2.1 Output.** Use JWKS-based validation for key rotation support. Recommended PHP JWT libraries: `firebase/php-jwt` or `lcobucci/jwt` — both support JWKS validation.

1. **User Action:** Provide Clerk JWKS URL (typically `https://<clerk-domain>/.well-known/jwks.json`) from Clerk dashboard
2. Install JWT validation library (e.g., `composer require firebase/php-jwt`) and create `ClerkTokenValidator` service class
3. Implement JWKS-based validation: fetch and cache JWKS keys, validate JWT signature, verify claims (`iss` matches Clerk domain, `exp` not expired, `aud` if configured)
4. Extract user claims: `sub` (user ID), `org_id` or custom claim for company, `email`, and return structured claims object
5. Implement secure error handling: return generic 401 for all validation failures, log detailed errors server-side only

### Task 2.4 – Implement Multi-Tenant Company Mapping - Agent_Auth
**Objective:** Create tenant isolation mechanism mapping Clerk organizations to Fleetbase companies.
**Output:** Company mapping service ensuring users only access their own tenant data.
**Guidance:** **Depends on: Task 2.2 Output, Task 2.3 Output.** Critical for security—must prevent cross-tenant data access. Fleetbase already has multi-tenant Company model — leverage existing structure where possible.

1. Analyze existing Fleetbase multi-tenancy: review `Company` model and existing tenant scoping to understand current implementation
2. Create migration for `clerk_company_mappings` table linking Clerk `org_id` (string) to Fleetbase `company_id` (UUID), with unique constraint on `clerk_org_id`
3. Create `TenantMapper` service: on SSO, lookup mapping by Clerk org_id → if exists, return Fleetbase company; if not, create new Fleetbase Company and mapping record
4. Integrate with SSO flow: after user authentication, set authenticated user's company context using Fleetbase's existing session/auth mechanisms
5. Verify tenant isolation: confirm Fleetbase's existing query scopes apply to SSO-authenticated users (if not, add middleware to enforce company scoping)

### Task 2.5 – Create Steelbunch SSO Trigger Service - Agent_Auth
**Objective:** Create Steelbunch-side service that initiates SSO when loading Fleetbase iframe.
**Output:** TypeScript service and React hook for SSO authentication.
**Guidance:** **Depends on: Task 2.2 Output.** Service calls Fleetbase SSO endpoint with Clerk JWT. Use postMessage for token passing (not URL parameters) to avoid token exposure in browser history/logs.

1. Create `fleetbaseSsoService.ts` in Steelbunch frontend (`src/services/` or `src/lib/`) with SSO initiation logic
2. Implement `getFleetbaseToken()` method: obtain current Clerk session token using `useAuth()` hook's `getToken()` method
3. Call Fleetbase `/api/sso/clerk` endpoint with Clerk JWT in Authorization header, receive Sanctum token in response
4. Create `useFleetbaseAuth` hook that: (a) manages SSO state (loading, authenticated, error), (b) caches Sanctum token, (c) provides `sendAuthToIframe()` method using postMessage API
5. Implement token refresh logic: detect Sanctum token expiration and re-authenticate via Clerk token

### Task 2.6 – Verify SSO Security & Tenant Isolation - Agent_Auth
**Objective:** Comprehensive security testing of SSO implementation.
**Output:** Verified secure SSO flow with documented tenant isolation confirmation.
**Guidance:** **Depends on: Tasks 2.2, 2.3, 2.4, 2.5 Output.** Phase completion checkpoint. Document all test results.

1. Test valid SSO flow: Steelbunch seller logs in → loads iframe → automatically authenticated in Fleetbase → can access Fleetbase console features
2. Test invalid token rejection: Modify JWT payload or signature → call SSO endpoint → verify 401 response with no session created
3. Test tenant isolation methodology: (a) Authenticate as User from Company A, capture Sanctum token; (b) Attempt to access Company B resources using Company A's token (e.g., `GET /api/v1/companies/{company_b_id}`); (c) Verify 403 Forbidden or empty results
4. Test token expiration: Use expired Clerk token → verify SSO fails with appropriate error → verify re-authentication flow works
5. **User Review Checkpoint:** Present test results summary, confirm SSO is secure and tenant-isolated before proceeding to Phase 3

## Phase 3: Frontend Integration & UI

### Task 3.1 – Analyze Freight.tsx Current Structure - Agent_Frontend
**Objective:** Understand current Freight page structure and Recommendations component for replacement planning.
**Output:** Documented understanding of current structure and modification plan.
**Guidance:** Focus on tab system, conditional rendering patterns, and component hierarchy.

- Analyze `Freight.tsx` page structure: identify tab system, current tabs, and how Recommendations tab is rendered
- Document component hierarchy: FreightMap, FreightRecommendations, RecommendationCard relationships
- Identify seller vs buyer conditional rendering patterns already in use for consistent implementation

### Task 3.2 – Create Transportation Management Tab Component - Agent_Frontend
**Objective:** Create React component that will house the Fleetbase iframe.
**Output:** `TransportationManagement.tsx` component in freight components directory.
**Guidance:** **Depends on: Task 3.1 Output.** Match existing design patterns and Tailwind styling.

- Create `TransportationManagement.tsx` component in `src/components/freight/` directory
- Implement component structure with loading state, error handling, and iframe container
- Add props interface for Fleetbase URL and authentication token from SSO service
- Style component to match existing Freight page design patterns (Tailwind CSS)

### Task 3.3 – Implement Fleetbase iframe Embedding - Agent_Frontend
**Objective:** Implement secure iframe that loads Fleetbase console with authentication.
**Output:** Working iframe with proper security attributes and responsive sizing.
**Guidance:** **Depends on: Task 3.2 Output, Phase 2 SSO Output by Agent_Auth.** Use postMessage for authentication (aligned with Task 2.5), not URL parameters. Security attributes require careful configuration.

1. Implement iframe element with Fleetbase Console URL; use `useFleetbaseAuth` hook from Task 2.5 to obtain authentication state
2. After iframe loads, send Sanctum token via postMessage API (not URL parameter) with strict target origin
3. Configure iframe security attributes: `sandbox="allow-scripts allow-same-origin allow-forms allow-popups"` — note: `allow-same-origin` with `allow-scripts` requires trusting iframe content; ensure Fleetbase console is from trusted source
4. Implement responsive sizing: use CSS `width: 100%; height: calc(100vh - header-height)` or ResizeObserver for dynamic adjustment
5. Add loading spinner during SSO authentication and iframe load; show user-friendly error state if Fleetbase is unreachable or SSO fails

### Task 3.4 – Implement Secure Cross-Origin Communication - Agent_Frontend
**Objective:** Implement postMessage API for secure communication between Steelbunch and Fleetbase iframe.
**Output:** Bidirectional messaging system with origin validation on both sides.
**Guidance:** **Depends on: Task 3.3 Output.** Strict origin validation is required for security. Aligns with postMessage approach established in Tasks 2.5 and 3.3.

1. In Steelbunch: Enhance `useFleetbaseAuth` hook with `sendMessage(type, payload)` method using `iframe.contentWindow.postMessage()` with explicit target origin (Fleetbase Console URL)
2. In Fleetbase Console: Create `SteelbunchMessageHandler` service with `window.addEventListener('message', handler)` to receive messages from parent
3. Implement strict origin validation: Steelbunch checks `event.origin === FLEETBASE_CONSOLE_URL`; Fleetbase checks `event.origin === STEELBUNCH_URL`; reject all messages from unexpected origins
4. Define message protocol with TypeScript interfaces:
   - `{ type: 'AUTH', token: string }` — Sanctum token for authentication
   - `{ type: 'NAVIGATION', path: string }` — Navigate iframe to specific route
   - `{ type: 'READY' }` — Fleetbase signals ready to receive messages
   - `{ type: 'TRACKING_UPDATE', data: TrackingPayload }` — Future: tracking data sync via UI

### Task 3.5 – Add Seller-Only Tab Visibility Logic - Agent_Frontend
**Objective:** Implement conditional rendering so Transportation Management tab replaces Recommendations tab for sellers only.
**Output:** Role-based tab visibility in Freight.tsx with Recommendations replaced (not just hidden) for sellers.
**Guidance:** **Depends on: Task 3.2 Output.** Use existing context patterns for role checking. Per user requirements, Transportation Management REPLACES Recommendations for sellers.

- Use existing `CompanyContext` or session context to check if current user's company type is 'seller'
- In Freight.tsx tab navigation: for sellers, render Transportation Management tab in place of Recommendations tab (same tab position); for buyers, render Recommendations tab as before
- Verify tab switching works correctly: sellers see Transportation Management content, buyers see Recommendations content; no remnants of the other tab visible to each user type

### Task 3.6 – Verify UI Integration & Buyer Experience Preservation - Agent_Frontend
**Objective:** Comprehensive testing that UI integration works and buyer experience is unchanged.
**Output:** Verified working integration with documented buyer experience confirmation.
**Guidance:** **Depends on: Tasks 3.2, 3.3, 3.4, 3.5 Output.** Phase completion checkpoint.

1. Test seller view: Login as seller → navigate to Freight → see Transportation Management tab → Fleetbase loads in iframe
2. Test buyer view: Login as buyer → navigate to Freight → see original tabs (no Transportation Management) → tracking map works
3. Test SSO flow: Seller sees Fleetbase authenticated (not login page) when iframe loads
4. Test responsive behavior: Resize browser, verify iframe adjusts appropriately
5. **User Review Checkpoint:** Confirm UI integration works for sellers and buyer experience is preserved before proceeding to Phase 4

## Phase 4: Tracking Data Sync

### Task 4.1 – Analyze Tracking Data Models in Both Systems - Agent_Backend
**Objective:** Understand tracking data structures in Fleetbase and Steelbunch for sync design.
**Output:** Documented data model comparison and field mapping.
**Guidance:** Focus on Order/Shipment/TrackingLog in Fleetbase and Shipment model in Steelbunch.

- Analyze Fleetbase tracking models: Order, Shipment, TrackingLog, Waypoint entities and their fields
- Analyze Steelbunch tracking models: Shipment model, tracking fields, location data structure
- Document field mapping between systems: Fleetbase status → Steelbunch status, location format conversion
- Identify gaps: fields in one system not present in other, required transformations

### Task 4.2 – Design Tracking Sync Architecture - Agent_Backend
**Objective:** Design overall sync mechanism including data flow and error handling.
**Output:** Architecture document specifying webhook-based sync approach.
**Guidance:** **Depends on: Task 4.1 Output.** Webhooks recommended for real-time updates.

1. Evaluate sync mechanisms: webhooks (Fleetbase pushes to Steelbunch) vs polling (Steelbunch pulls from Fleetbase) — recommend webhooks for real-time updates
2. Design data flow: Fleetbase tracking event → webhook to Steelbunch → transform data → update Shipment model → notify connected clients
3. Design error handling: retry logic for failed webhook deliveries, idempotency keys to prevent duplicate updates
4. Document architecture including: endpoint URLs, authentication (shared secret or API key), payload format, retry policy

### Task 4.3 – Create Fleetbase Webhook for Tracking Updates - Agent_Backend
**Objective:** Implement webhook emission in Fleetbase when tracking data changes.
**Output:** Webhook dispatcher that sends updates to Steelbunch with defined payload structure.
**Guidance:** **Depends on: Task 4.2 Output.** Use Laravel event listeners for tracking events. Identify actual Fleetbase event classes in `packages/fleetops/` for order and tracking events.

1. Identify Fleetbase tracking events: search for event classes in `packages/fleetops-api/src/Events/` (e.g., `OrderStatusChanged`, `DriverLocationUpdated`, or similar)
2. Create `SteelbunchWebhookDispatcher` service in Fleetbase (`app/Services/` or within fleetops package) that sends HTTP POST to Steelbunch
3. Define webhook payload structure: `{ "event_type": "order.status_changed"|"tracking.location_updated", "order_id": string, "status": string, "location": { "lat": number, "lon": number }, "eta": ISO8601|null, "carrier": string|null, "tracking_number": string|null, "timestamp": ISO8601 }`
4. Register event listeners to trigger webhook dispatch on relevant events; configure endpoint URL via `STEELBUNCH_WEBHOOK_URL` environment variable
5. Implement webhook authentication: include `X-Webhook-Secret` header; implement retry logic (3 attempts with exponential backoff) for failed deliveries

### Task 4.4 – Create Steelbunch Tracking Sync Receiver - Agent_Backend
**Objective:** Implement webhook receiver endpoint in Steelbunch for tracking updates.
**Output:** FastAPI endpoint that processes incoming tracking webhooks with idempotency handling.
**Guidance:** **Depends on: Task 4.2 Output.** Validate webhook signature, process asynchronously. Payload structure must align with Task 4.3 specification.

1. Create `POST /api/webhooks/fleetbase/tracking` endpoint in Steelbunch FastAPI backend (`backend/routers/webhooks.py` or new file)
2. Implement webhook signature validation: verify `X-Webhook-Secret` header matches `FLEETBASE_WEBHOOK_SECRET` environment variable; return 401 if invalid
3. Parse webhook payload per Task 4.3 structure: extract `event_type`, `order_id`, `status`, `location`, `eta`, `carrier`, `tracking_number`, `timestamp`
4. Implement idempotency: use combination of `order_id` + `timestamp` as idempotency key; skip processing if already processed (store processed keys in Redis with TTL or database table)
5. Queue tracking update for async processing (return 200 immediately): use FastAPI BackgroundTasks or existing queue system to process update via Task 4.5 transformer

### Task 4.5 – Implement Data Transformation Layer - Agent_Backend
**Objective:** Create data transformation logic converting Fleetbase tracking data to Steelbunch format.
**Output:** Transformation service with field mapping and status conversion.
**Guidance:** **Depends on: Task 4.1 Output.** Handle optional fields gracefully. Input format follows webhook payload structure defined in Task 4.3.

- Create `FleetbaseTrackingTransformer` service class in Steelbunch backend (`backend/services/fleetbase_tracking_transformer.py`)
- Implement status mapping: map Fleetbase `event_type` and `status` to Steelbunch Shipment status enum (e.g., `order.status_changed` + `in_transit` → Shipment.status = 'in_transit')
- Implement location transformation: convert webhook `location: { lat, lon }` to Steelbunch Shipment location fields (latitude, longitude, last_location_update timestamp)
- Handle optional fields with defaults: `eta` → Shipment.estimated_delivery (null if missing), `carrier` → Shipment.carrier_name (preserve existing if missing), `tracking_number` → Shipment.tracking_number
- Return transformed Shipment update dict ready for database update

### Task 4.6 – Integrate with Existing Steelbunch Tracking Display - Agent_Backend
**Objective:** Connect synced tracking data to existing Freight.tsx map and tracking UI.
**Output:** Updated tracking display showing Fleetbase-sourced shipment data.
**Guidance:** **Depends on: Task 4.4 Output, Task 4.5 Output.** Ensure seamless display alongside existing tracking.

1. Ensure Steelbunch Shipment model includes `source` field to distinguish Fleetbase vs Uber Freight shipments
2. Update tracking API endpoints to return Fleetbase-sourced shipments alongside existing shipments
3. Verify FreightMap component displays Fleetbase shipments correctly (same marker/tracking behavior)
4. Consider WebSocket integration for real-time updates if Steelbunch has existing socket infrastructure

### Task 4.7 – Verify End-to-End Tracking Sync - Agent_Backend
**Objective:** Comprehensive testing of tracking sync from Fleetbase to Steelbunch display.
**Output:** Verified working sync with documented test results.
**Guidance:** **Depends on: Tasks 4.3, 4.4, 4.5, 4.6 Output.** Phase completion checkpoint.

1. Test webhook delivery: Create/update shipment in Fleetbase → verify webhook reaches Steelbunch endpoint
2. Test data transformation: Verify Fleetbase tracking data correctly transforms to Steelbunch format
3. Test buyer visibility: Login as buyer → view order → see Fleetbase-sourced shipment tracking on map
4. Test real-time updates: Update location in Fleetbase → verify update appears in Steelbunch within reasonable time
5. **User Review Checkpoint:** Confirm tracking sync works end-to-end before proceeding to Phase 5

## Phase 5: Production Hardening & Testing

### Task 5.1 – Security Audit & Hardening - Agent_Auth
**Objective:** Review all security-sensitive components and apply hardening measures.
**Output:** Security audit checklist with all items addressed.
**Guidance:** Focus on SSO, webhooks, iframe security, and secret management.

1. Audit SSO implementation: Verify JWT validation is secure, tokens cannot be forged, tenant isolation is enforced
2. Audit webhook security: Verify shared secrets are strong, signature validation is correct, no injection vulnerabilities
3. Audit iframe security: Verify CSP headers are set, sandbox attributes are appropriate, no clickjacking vulnerabilities
4. Review environment variables: Ensure no secrets in code, all sensitive values use environment variables
5. **User Action:** Rotate any development secrets before production deployment

### Task 5.2 – Environment Configuration Review - Agent_Infrastructure_Deploy
**Objective:** Review all environment configurations for production readiness.
**Output:** Verified production environment configurations.
**Guidance:** **Depends on: Task 5.1 Output by Agent_Auth.** Ensure all security findings are addressed in config.

1. Review Fleetbase production environment: APP_DEBUG=false, proper database credentials, CORS origins restricted
2. Review Steelbunch production environment: Clerk production keys, Fleetbase URLs pointing to production
3. Verify Railway environment variables are set for all services with production values
4. Confirm HTTPS is enforced on all endpoints (API, Console, webhooks)

### Task 5.3 – Error Handling & Logging Verification - Agent_Backend
**Objective:** Verify error handling is graceful and logging is appropriate for production.
**Output:** Verified error handling and logging configuration.
**Guidance:** Ensure no sensitive data leaks in error messages.

- Verify SSO failures show user-friendly errors (not stack traces) in production mode
- Verify webhook failures are logged with sufficient detail for debugging but don't expose secrets
- Verify iframe loading failures show helpful error states to users
- Confirm logging levels are appropriate: errors logged, debug logs disabled in production

### Task 5.4 – Full Integration Testing - Agent_Frontend
**Objective:** End-to-end testing of the complete integrated system.
**Output:** Documented test results for all major user flows.
**Guidance:** **Depends on: Task 5.1 Output by Agent_Auth, Task 5.2 Output by Agent_Infrastructure_Deploy, Task 5.3 Output by Agent_Backend.** Comprehensive manual testing required.

1. Test complete seller flow: Login → Freight page → Transportation Management tab → Create shipment in Fleetbase
2. Test complete buyer flow: Login → Orders → View shipment tracking → See Fleetbase-sourced tracking on map
3. Test SSO edge cases: Session expiration, re-authentication, multiple browser tabs
4. Test tracking sync: Create shipment → Update status in Fleetbase → Verify buyer sees update
5. Test error scenarios: Fleetbase unavailable, invalid tokens, webhook failures
6. Document any issues found and verify all are resolved

### Task 5.5 – Production Deployment Verification - Agent_Infrastructure_Deploy
**Objective:** Final verification that production deployment is complete and operational.
**Output:** Verified production system with sign-off.
**Guidance:** **Depends on: Task 5.4 Output by Agent_Frontend.** Final phase completion checkpoint.

1. Verify all Railway services are running in production: API, Console, MySQL, Redis, SocketCluster, workers
2. Verify Steelbunch production can reach Fleetbase production endpoints
3. Verify SSO works with production Clerk configuration
4. Verify tracking webhooks are being received and processed in production
5. **Final User Sign-off:** Confirm production integration is complete and operational

