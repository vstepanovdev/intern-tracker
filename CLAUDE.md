# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

**Backend (FastAPI + SQLite):**
```bash
# From repo root:
pip3 install -r backend/requirements.txt
python3 -m uvicorn backend.main:app --reload          # http://localhost:8000
```

**Frontend (React + Vite):**
```bash
cd frontend
npm install
npm run dev       # http://localhost:5173 (proxies /api to backend)
npm run build     # Production build to frontend/dist/
npx tsc -b        # Type-check without emitting
```

Both servers must run simultaneously. The Vite dev server proxies `/api/*` requests to `http://localhost:8000`.

## Architecture

Two-tier app: React SPA frontend talks to a FastAPI backend via REST. No auth layer.

### Backend (`backend/`)
- **Entry:** `main.py` — FastAPI app with CORS (allow all origins), lifespan creates DB tables on startup.
- **Database:** `database.py` — SQLAlchemy with SQLite (`backend/internships.db`), session via `get_db()` dependency.
- **Models:** `models.py` — `Company` (1) ↔ (many) `Application`, cascade delete. Application status is a string validated against `VALID_STATUSES` in `schemas.py`.
- **Routers:** Domain-split under `routers/` — `applications.py`, `companies.py`, `dashboard.py`. All mounted at `/api/<domain>`.
- **Schemas:** `schemas.py` — Pydantic v2 models with `model_config = {"from_attributes": True}`. Separate Create/Update/Out schemas per entity.

Key endpoint: `POST /api/applications/quick-apply` accepts a list of `ApplicationCreate` for batch creation (skips duplicates by company+position).

Company suggestions (`GET /api/companies/suggestions`) are hardcoded in `companies.py`, not in the database.

### Frontend (`frontend/src/`)
- **Routing:** React Router in `App.tsx` — sidebar layout wrapping 6 routes.
- **API layer:** `api.ts` — single Axios instance (`baseURL: "/api"`), one exported function per endpoint.
- **Types:** `types.ts` — TypeScript interfaces mirroring backend Pydantic `*Out` schemas. `DashboardStats.recent_applications` (not `recent`) matches the backend field name.
- **State:** Plain `useState`/`useEffect` hooks, no state management library.
- **Styling:** Tailwind CSS via `@tailwindcss/vite` plugin (imported in `index.css` as `@import "tailwindcss"`). No custom CSS files.

### Application Status Flow
Valid statuses: `wishlist` → `applied` → `phone_screen` → `interview` → `offer` | `rejected` | `withdrawn`

Status colors are defined in `StatusBadge.tsx` (frontend) and used consistently across pages.
