# HONDA LEGACY REPLACEMENT RESOURCE DOC

## Executive summary

- Replace the Excel system with a secure, fast, on-prem web app.
- Deliver 100% feature parity plus new capabilities: on-the-spot booking, cross-location sourcing, anomaly detection, forecasts, and full legacy data transfer.
- Provide a mobile and desktop responsive UI with two role experiences (Sales Worker and Management).
- Rely exclusively on free and open-source components.

## Non-negotiable requirements

- On-prem deployment with LAN or VPN access only; all software must be free and open-source.
- Full Excel parity: model sheets, pivot tables, payment summaries, transit tracking, print/export, and upload.
- Legacy data transfer must accept legacy Excel (including .xlsb), support mapping, validation, reconciliation, and commit; the process must be idempotent and auditable.
- Support on-the-spot booking with deposits, holds, expiry, and conversion to sale.
- Provide cross-location search by distance with geospatial queries and a transfer workflow.
- Include anomaly detection (rules plus ML) and demand forecasts.
- Maintain complete audit trails, RBAC, TLS, observability, and backups.

## Fixed stack (free and optimized)

- OS and hosting: Ubuntu LTS virtual machines (on-prem).
- Reverse proxy and TLS: Nginx.
- Frontend: React + TypeScript (Vite), MUI, React Router, React Query, ECharts, PWA with service worker and IndexedDB.
- Backend: FastAPI (Python 3.11) served via uvicorn or gunicorn.
- Database: PostgreSQL 15+ with PostGIS for geospatial support and pg_trgm for fuzzy search.
- Cache, queue, scheduler: Redis with RQ and RQ-Scheduler.
- AuthN/Z: Keycloak (OIDC) with roles Sales, Management, Admin, and Auditor.
- ML: scikit-learn (IsolationForest) and statsmodels (SARIMAX).
- Observability: Prometheus (metrics), Grafana (dashboards), Loki + Promtail (logs), OpenTelemetry SDK.
- Backups: pgBackRest to NAS.
- CI/CD and packaging: Docker and Docker Compose; GitHub Actions with an on-prem runner.
- Security add-ons: ClamAV for file scanning; Postfix (or existing SMTP) for email.

No alternatives are permitted; the above tools are fixed.

## Architecture overview

- Modular monolith: one API service plus background workers and the web UI behind Nginx.
- PostgreSQL handles transactional data and search; PostGIS powers nearby queries.
- Redis is used for caching, sessions, and queues; RQ executes ingestion, reconciliation, anomaly, and forecast jobs.
- The PWA front-end supports mobile and desktop, including offline drafts with server-validated finalize.
- OpenTelemetry provides traces; Prometheus supplies metrics; Loki captures logs.

Performance optimizations include connection pooling, prepared statements, composite and GIN indexes, PostGIS spatial indexes, Redis caching for hot inventory reads, chunked ingestion with backpressure, and idempotent job design.

## User roles and experiences

- Sales Worker (mobile-first PWA):
    - Global search by model, variant, color, or SKU; QR or VIN scanning via camera.
    - Book on the spot: reserve with optional deposit, hold expiry, conversion to sale, cancel or expire.
    - "Find Nearby" for out-of-stock items; create transfer requests; track inbound transfers.
    - My Tasks list: expiring holds, pending payments, incoming transfers.
    - Offline drafts with sync on reconnect (final reservation always server-validated).
- Management (desktop-first, responsive):
    - Dashboards for stock health (zero, low, overstock), ageing, mix, transit, reconciliation status, anomalies, and forecasts.
    - Admin screens: manage locations, thresholds, deposit and hold policies, alert rules, print templates, data dictionary.
    - Approvals for transfers, adjustments, overrides, and bulk imports.
    - Legacy data transfer: upload Excel, map columns, validate, QA and reconciliation preview, commit, and inspect ingestion history and audit.

## Legacy Data Transfer (first-class)

- Accept legacy Excel files (.xls, .xlsx, .xlsb).
- Mapping profiles capture source-to-target mappings per sheet, transforms (trim, date parsing), defaults, and enum rules.
- Dry-run validation checks required fields, types, ranges, duplicates, referential integrity, and business rules.
- QA report highlights errors and warnings with downloadable row-level CSV plus mapping confidence hints.
- Reconciliation preview compares results to pivot totals with variance thresholds (<1% goal); anomalies raised on exceedance.
- Commit is idempotent (file hash plus row digest), chunked, resumable on failure, and fully audited.
- Data layers: raw files -> raw rows -> staging (typed) -> curated (Inventory, StockMovement, Transfers, Payments).
- Governance includes a data dictionary, versioned profiles, lineage tracking, and documented rollbacks.

## Data model (core entities)

- Location: id, code, name, latitude/longitude (PostGIS), region, active flag.
- Product: id, model, variant, color, SKU/codes, attributes.
- Inventory: location_id, product_id, quantity_on_hand, reserved, in_transit, updated_at.
- Customer: id, name, phone/email, optional KYC references.
- Booking: id, customer_id, product_id, location_id, quantity, status (draft/reserved/confirmed/cancelled/expired/converted), hold_expires_at, created_by, timestamps.
- BookingPayment: booking_id, amount, method, transaction reference, received_at.
- Transfer: id, product_id, from_location, to_location, quantity, status (requested/approved/shipped/received), timestamps, documents.
- StockMovement: product_id, location_id, type (receipt/sale/adjust/transfer/reserve/release), quantity, document number, date, references.
- ExternalSnapshot: file metadata, hash, mapping profile/version, QA results, reconciliation, commit status.
- PrintTemplate: name, version, schema, metadata.
- Forecast: product_id, location_id, horizon, forecast value, intervals, metrics, model reference, run_id.
- Anomaly: entity reference, type, severity/score, detected_at, status, context JSON.
- AuditLog: actor, action, entity reference, before/after state, timestamp (append-only).

Indexes include Inventory (location_id, product_id), Product name fields indexed with pg_trgm GIN, Location spatial index, and date indexes on movements and transfers.

## APIs (contract highlights)

- Auth: OIDC with JWT scopes mapped to role checks (Sales, Management, Admin, Auditor).
- Inventory: `GET /api/v1/inventory?filters...`, `GET /api/v1/inventory/{id}`.
- Search:
    - `GET /api/v1/search?query=...` (fuzzy search powered by pg_trgm).
    - `GET /api/v1/search/nearby?productId=...&locationId=...&radiusKm=...&minQty=...` (PostGIS).
- Booking:
    - `POST /api/v1/bookings` (reserve with optional deposit).
    - `PATCH /api/v1/bookings/{id}` (confirm, convert, or cancel).
    - `POST /api/v1/bookings/{id}/payments` (record deposit).
- Transfers:
    - `POST /api/v1/transfers` and `PATCH /api/v1/transfers/{id}` (approve, ship, receive).
- Ingestion:
    - `POST /api/v1/ingest/snapshots` (upload).
    - `POST /api/v1/ingest/preview` (mapping, QA, reconciliation).
    - `POST /api/v1/ingest/commit`.
    - `GET /api/v1/ingest/runs`.
- Analytics:
    - `GET /api/v1/analytics/stock-health`.
    - `GET /api/v1/analytics/anomalies`.
    - `GET /api/v1/analytics/forecast?productId=...&locationId=...`.
    - `GET /api/v1/analytics/reconciliation`.
- Admin: settings, templates, data dictionary, audit log.

Principles: contract-first OpenAPI, pagination everywhere, idempotency keys for booking and transfer operations, consistent error schema, and rate limits on heavy endpoints.

## Anomaly detection and forecasting

- Rule-based anomalies (day one): negative stock, Z-score spikes or drops, stale updates, missing required fields, reconciliation gap above threshold.
- ML anomalies: IsolationForest per product-location on delta values with severity scoring; nightly RQ jobs.
- Forecasts: SARIMAX per product-location with rolling backtests; store MAPE and MAE; compute safety stock and reorder points.
- Triage UI: list anomalies with context and actions; support snooze/resolve; preserve audit log.

## Security and compliance

- Keycloak SSO with RBAC enforced at API and UI routes.
- TLS everywhere with Nginx termination; database isolated by firewall rules.
- Secrets managed via Docker secrets; database roles with least privilege.
- PII minimization; logs mask sensitive data; export permissions limited.
- Immutable audit logs for bookings, transfers, payments, and settings.
- Virus scan uploads with ClamAV; enforce file type and size whitelist.

## Observability and SRE

- Metrics: request latency and error rate, queue depth, job durations, database health, ingestion QA rates, reconciliation variance.
- Dashboards: Grafana boards with red/amber/green widgets for daily operations.
- Logs: structured JSON sent to Loki with correlation IDs; searchable by entity_id and run_id.
- Alerts: email (on-prem SMTP) for SLO breaches (latency, errors, queue backlog, reconciliation variance).

## DevOps, CI/CD, and environments

- Environments: Dev, Staging, Prod (separate databases and secrets).
- Packaging: Docker images per service; Docker Compose per environment.
- CI/CD: GitHub Actions with self-hosted runner; pipeline sequence build -> tests -> security scan -> image publish -> deploy (with approvals).
- Backups: pgBackRest nightly full plus WAL archiving to NAS; weekly restore drill in Staging; RPO <= 1 hour.
- Runbooks: incident response, backup and restore, scaling, access management.

## Performance and availability targets

- Search, nearby, and booking reserve endpoints: p95 < 2 seconds; cached reads p95 < 500 ms.
- Support 200 concurrent active users on LAN without error spikes.
- Booking integrity: zero double-booking under 50 concurrent reserve attempts on the same product/location (row-level locking plus idempotency).
- Availability >= 99.5% during business hours; document HA roadmap (database replica, multiple app instances).

## Migration and rollout

- Phase 0: Dry runs with representative legacy workbooks; refine mapping profiles and validations.
- Phase 1: Historical backfill in chronological order with checkpoints per sheet; parity reports versus archived pivots.
- Phase 2: Incremental ingestion from drop folder (daily or weekly); alerts on QA or reconciliation anomalies.
- Phase 3: Pilot in 2-3 branches for 2-3 weeks; bug burndown; training; general rollout.

## Roadmap (6-week MVP)

- Week 1: Design system and screen map; define API contract; provision infrastructure (Nginx, Postgres + PostGIS, Redis, Keycloak, Prometheus, Grafana, Loki); draft data dictionary and mapping profiles.
- Week 2: Build Sales UI mock for search, booking, nearby; Management dashboard mock; implement booking and search endpoints; define ingestion spec; set up CI/CD; scaffold anomaly rules.
- Week 3: Wire Sales UI to real APIs; implement My Tasks, offline drafts, transfer lifecycle, reconciliation endpoints; deliver ML anomalies and SARIMAX baseline; finish dashboards.
- Week 4: Implement Admin, approvals, ingestion UI; add print templates and render endpoints; integrate forecasts with reorder points; perform performance tuning; execute backup/restore drill.
- Week 5: Run full parity UAT (pivot variance < 1%, payments and transit match, print outputs approved); conduct concurrency tests; start pilot.
- Week 6: Address fixes, complete security review, deliver training, go live, and provide hypercare.

## Acceptance criteria

- Parity: pivot totals variance < 1%; payment summaries and transit counts match; print templates accepted by stakeholders.
- Booking: reserve, deposit, expire, convert, and cancel flows fully audited; zero double-booking under concurrency tests.
- Cross-location: nearby search, transfer lifecycle, and inventory transitions operate correctly.
- Legacy Data Transfer: latest full workbook ingests with QA error rate under threshold; reconciliation < 1%; idempotent re-ingest produces no changes.
- Operations: monitoring and alerts functioning; backup and restore tested; runbooks published.
- Analytics: anomalies visible within 15 minutes of ingest; forecasts for top SKUs with initial MAPE < 20%.

## Risks and mitigations

- Inconsistent legacy data: address through mapping profiles, validations, reconciliation, and data dictionary ownership with change control.
- On-prem operations overhead: containerize all services; rely on observability stack and runbooks.
- Connectivity gaps on mobile: PWA offline drafts with server-validated finalize; background sync handles retries.
- Analytics adoption: provide transparent backtests, explainable alerts, staged rollout.
- Scope creep (ERP/CRM): enforce MVP boundaries; treat integrations as separate projects.

## Team roles (8 people)

- FE1: UI/UX lead (design system, components, PWA UX).
- FE2: Sales Worker flows (search, booking, nearby, tasks, offline).
- FE3: Management flows (dashboards, admin, ingestion, approvals, print).
- BE1: API/domain lead (auth, inventory, booking locks, transfers).
- BE2: Data, ingestion, and reports (mapping, QA, reconciliation, print/export APIs).
- MLE: anomalies and forecasting (rules, IsolationForest, SARIMAX, dashboards).
- DEVOPS: infrastructure, CI/CD, TLS, Keycloak, monitoring, backups.
- QA/PM: parity checklist, test plans, UAT/pilot coordination, acceptance gates.

## What "optimized" means here

- Keep moving parts to a minimum (modular monolith) to speed delivery and reduce operations overhead.
- Leverage Postgres for search and geospatial to avoid an additional search cluster.
- Use Redis for caching and background jobs to avoid a separate broker.
- Deliver a PWA to avoid mobile app stores and maintain a single codebase.
- Perform batch ingestion with idempotency and backpressure to protect the database.
- Rely on widely used, free, open-source choices for all components.

# Front end / Back end / Beta testers / DevOps

## Front-end / UIUX

Objectives

- Deliver a responsive, installable PWA for phones and desktops with Sales Worker and Management role experiences.
- Preserve all Excel functionality (stock views, pivot insights, payments, transit, print/export, upload) while improving workflows and supporting on-the-spot booking.

Stack and standards

- Tech: React + TypeScript (Vite), MUI design system, React Router, React Query, ECharts for charts.
- PWA: service worker, app manifest, offline caching, IndexedDB (localForage) for drafts.
- Accessibility: WCAG 2.1 AA, keyboard navigation, high contrast, RTL-ready if required.

Key screens and flows

- Sales Worker (mobile-first):
    - Home: search by model, variant, color, SKU; QR or VIN camera scan; quick filters.
    - Product detail: stock at current location, "Find Nearby" (PostGIS distance sort), booking call-to-action.
    - Booking flow: capture customer info, quantity, deposit, hold expiry, confirmation receipt; manage holds (extend or cancel).
    - Transfers: create request when out of stock, track inbound, mark received.
    - My tasks: expiring holds, incoming transfers, pending payments.
    - Offline: create booking or transfer drafts; auto-sync on reconnect with server-side validation before final reserve.
- Management (desktop-first):
    - Dashboards: stock health (zero, low, overstock), transit, mix by color or variant, reconciliation versus pivot, anomalies, forecasts.
    - Admin controls: locations, thresholds, deposit and hold policies, alert rules, print templates, data dictionary.
    - Approvals: transfers, adjustments, overrides, bulk imports.
    - Ingestion: upload Excel, map columns, review QA report, commit.
    - Reports and printouts: booking receipt, transfer note, stock list, reconciliation report.

Design system and patterns

- MUI theme aligned to brand colors and typography with UI tokens and spacing scale.
- Core components: SearchBar, ScannerButton, InventoryTable (virtualized), KPI cards, map/distance list, BookingWizard, TransferWizard, AuditTimeline, chart widgets.
- Provide error, empty, and loading states for critical views; use optimistic UI only for drafts (never for stock reserve).

Validation and acceptance

- Performance: Lighthouse PWA score >= 85 for mobile and desktop; core flows p95 < 2 seconds on LAN.
- Usability: gather feedback from 10-15 user sessions; achieve task success >= 90% for booking and nearby search.
- Accessibility: automated checks (axe) pass; perform manual screen reader spot checks.

## Backend

Objectives

- Supply secure, low-latency APIs with strong data integrity for reservations, transfers, ingestion, analytics, and printing.
- Run ML workloads (anomaly detection and forecasting) as scheduled on-prem batch jobs.

Stack and components

- FastAPI (Python 3.11) behind Nginx with uvicorn or gunicorn workers.
- PostgreSQL 15+ (PostGIS, pg_trgm), Redis for cache and RQ broker, RQ plus RQ-Scheduler for background jobs.
- Keycloak (OIDC) for SSO and RBAC (Sales, Management, Admin, Auditor).
- Observability via Prometheus client and OpenTelemetry traces.

Core domain and integrity

- Entities: Location, Product, Inventory, Booking, BookingPayment, Transfer, StockMovement, ExternalSnapshot, PrintTemplate, Forecast, Anomaly, AuditLog.
- Transactions and locking:
    - Row-level locks on (location_id, product_id) during booking reserve and conversion.
    - Idempotency keys on booking and transfer endpoints.
    - Background sweepers to release expired holds; retries and dead-letter queues for jobs.

APIs (high-level, fixed)

- Inventory and search:
    - `GET /api/v1/inventory?filters...`
    - `GET /api/v1/search?query=...`
    - `GET /api/v1/search/nearby?productId=...&locationId=...&radiusKm=...&minQty=...`
- Booking:
    - `POST /api/v1/bookings` (reserve with optional deposit)
    - `PATCH /api/v1/bookings/{id}` (confirm, cancel, convert)
    - `POST /api/v1/bookings/{id}/payments` (record deposit); auto-expiry job releases reservations
- Transfers:
    - `POST /api/v1/transfers`
    - `PATCH /api/v1/transfers/{id}` (approve, ship, receive)
- Ingestion:
    - `POST /api/v1/ingest/snapshots` -> preview mapping -> `POST /api/v1/ingest/commit`
    - `GET /api/v1/ingest/runs` (QA results, variances, errors)
- Analytics:
    - `GET /api/v1/analytics/stock-health`
    - `GET /api/v1/analytics/anomalies`
    - `GET /api/v1/analytics/forecasts`
    - `GET /api/v1/analytics/reconciliation`
- Admin:
    - Settings, templates, data dictionary, audit logs

Search and geospatial

- Use PostGIS functions (ST_DWithin, ST_Distance) for nearby queries with spatial indexes.
- Use pg_trgm with GIN indexes for fuzzy search on model, variant, and color; support VIN/engine prefix matches.

Ingestion and reconciliation

- Support column mapping profiles with validations for duplicates, nulls, and ranges.
- Generate reconciliation reports versus pivot totals; raise anomaly if variance > 1%.
- Capture row-level errors and provide partial commit strategy with clear counts.

ML pipelines

- Anomaly jobs (nightly): rules first, then IsolationForest; produce severity scores and triageable alerts.
- Forecast jobs (nightly): SARIMAX per product-location; track MAPE; recommend safety stock and reorder points.
- Store model registry and metrics in the database; expose dashboards for model health.

Performance targets

- p95 < 2 seconds for search and nearby endpoints; < 2 seconds for reserve booking with locking.
- API error rate < 1%; job success rate > 99%; size the database connection pool appropriately.

## Beta testing

Strategy

- Combine black-box and white-box testing; perform parity UAT against Excel outputs.
- Use test data packs from real snapshots (with PII anonymized if needed).

Test suites

- Functional: booking (reserve, deposit, expire, convert, cancel), transfers (request to receive), ingestion (mapping and commit), search/nearby, dashboards, print/export.
- Concurrency: simultaneous bookings on the same product/location to ensure no double-booking.
- Parity/UAT:
    - Recreate pivot totals with variance < 1%.
    - Match payment summaries and transit counts to legacy results.
    - Validate print outputs (booking, transfer, stock list) against Excel expectations.
- Performance:
    - Load test with 200 concurrent users ensuring SLAs.
    - Analyze long-running queries and tune indexes.
- Security:
    - Verify role isolation (Sales vs Management vs Admin), protect against token tampering, enforce endpoint rate limits, validate inputs.
- Offline:
    - Confirm PWA drafts resync idempotently; provide conflict resolution messaging.
- Recovery:
    - Run backup/restore drill; simulate app or DB restart; ensure job replay is idempotent.

Acceptance and exit

- All parity checks signed off; SLAs met; no critical Sev1 or Sev2 defects open.
- Runbooks and training delivered; monitoring and alerts stay green for 1-2 weeks in pilot.

Pilot plan

- Deploy to 2-3 branches for 2-3 weeks; collect feedback; burn down defects to zero; then scale out.
