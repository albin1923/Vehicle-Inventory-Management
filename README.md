# Vehicle Inventory Management

FastAPI backend and React (Vite) frontend that replicate Honda's internal inventory tracking workflow with richer analytics and UI polish.

## Local development

1. Copy `.env.example` to `.env` inside `backend/` and fill in required secrets.
2. Bring up dependencies and the API:
   ```powershell
   cd backend
   poetry install
   poetry run uvicorn app.main:app --reload
   ```
   Or use Docker for Postgres/Redis with `docker-compose up -d` from the repo root.
3. Start the Vite dev server:
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```
   The UI is available at `http://localhost:5173` and proxies API requests to `http://localhost:8000`.

## Continuous integration

GitHub Actions workflows live under `.github/workflows/`:

- `backend-ci.yml` installs the FastAPI project with Poetry and runs `pytest` on pushes and pull requests that touch the backend.
- `frontend-deploy.yml` builds the Vite site and publishes the static bundle to GitHub Pages.

## Production deployment (free tiers)

### Frontend → GitHub Pages

1. In the GitHub repository settings, open **Pages** and ensure "GitHub Actions" is selected as the source.
2. Under **Settings → Secrets and variables → Actions**, add a repository variable named `VITE_API_BASE_URL` pointing at your live backend, for example `https://vehicle-inventory-backend.onrender.com/api/v1`.
3. Push to `main` (or trigger the workflow manually). The `frontend-deploy` workflow will build the site and publish it to the `github-pages` environment. The published URL appears in the workflow run output.

The workflow automatically sets the Vite base path to `/<repository-name>/`, so no manual changes are required after renaming the repository.

### Backend → Render free web service

1. Create a Render account (free tier) and click **New + → Blueprint**.
2. Point Render at this repository. It will detect the `render.yaml` blueprint and propose a service named `vehicle-inventory-backend` rooted at `backend/`.
3. During setup, provide the required environment variables:
   - `DATABASE_URL` – Render Postgres connection string (add a free Postgres instance in the same blueprint, or supply your own).
   - `REDIS_URL` – Optional if you provision a Redis instance; otherwise set to an empty string to disable.
   - `JWT_SECRET_KEY` – Generate a strong random value (e.g., `openssl rand -hex 32`).
   - Leave `ENVIRONMENT=production` as provided.
4. Render runs `pip install poetry && poetry install --no-root` and starts the API with `poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000`.
5. Enable automatic deploys from `main` so every push redeploys the API.

Render will use the built-in `/health` endpoint for readiness checks. The resulting URL can be plugged back into the `VITE_API_BASE_URL` repository variable so GitHub Pages hits the hosted API.

## Useful commands

- `npm run build` – create a production build of the frontend (also used by CI).
- `poetry run pytest` – execute backend tests locally.
- `docker-compose up -d` – start supporting Postgres and Redis services for local development.
