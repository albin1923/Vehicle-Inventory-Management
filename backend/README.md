# Honda Internal System Backend

FastAPI-based backend for the Honda internal system modernization project. Provides inventory, sales, payments, transfer management, anomaly detection, and reporting APIs.

## Prerequisites

- Python 3.11+
- Poetry
- Docker (for local Postgres/Redis via docker-compose)

## Setup

1. **Install dependencies:**

```bash
poetry install
```

2. **Configure environment:**

For local development (running backend directly on Windows/macOS/Linux), create a `.env.local` file to override Docker hostnames:

```bash
# backend/.env.local
POSTGRES_SERVER=127.0.0.1
POSTGRES_PORT=5432
POSTGRES_USER=honda
POSTGRES_PASSWORD=honda
POSTGRES_DB=honda_internal
REDIS_URL=redis://127.0.0.1:6379/0
```

> **Note:** `.env.local` takes precedence over `.env`. If running the backend inside Docker, omit `.env.local` or set hostnames to `db` and `redis`.

3. **Start supporting services:**

```bash
docker compose up -d db redis
```

4. **Run database migrations:**

```bash
poetry run alembic upgrade head
```

5. **Seed reference data (optional, idempotent):**

```bash
poetry run python scripts/seed_branches.py
poetry run python scripts/seed_demo_data.py
```

6. **Start the backend:**

```bash
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

## Development Notes

- **Migrations:** When adding/modifying models, create a new migration with `poetry run alembic revision -m "description"` and apply with `upgrade head`.
- **Imports:** CSV/Excel imports validate coordinates (-90..90 lat, -180..180 long) and create/update branches dynamically.
- **Indexes:** Performance indexes added for `branches.code`, `vehicle_models.external_code` in migration `ecaf6f96600f`.
