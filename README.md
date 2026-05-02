# Turtlector

Single-service deployment with **FastAPI + React (Vite build)**.

## Architecture
- Backend: FastAPI (`backend/`)
- Frontend: React + Vite (`frontend/`)
- Production runtime: one Python process (`uvicorn`) that serves:
  - API under `/api/*`
  - Frontend static bundle from `frontend/dist`

## Local Development

### Prerequisites
- Python 3.11
- Node 20+
- npm
- `uv` (optional, recommended)

### Install
```bash
cd frontend && npm ci
cd ../backend
uv sync --no-dev
```

If you do not use `uv`:
```bash
cd backend
python -m pip install --upgrade pip
python -m pip install .
```

### Run frontend + backend (with Vite proxy)
```bash
./scripts/dev.sh
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/api`
- API docs: `http://localhost:8000/docs`

`frontend/vite.config.ts` proxies `/api` to `http://localhost:8000` during development.

## Production Build and Run (No Docker)

### Build
```bash
./scripts/coolify_build.sh
```

### Start
```bash
./scripts/coolify_start.sh
```

This serves the built frontend and API from one FastAPI process.

## Coolify (Nixpacks) Setup

Use a normal application (non-Docker) pointing to this repository.

- Build Command: `./scripts/coolify_build.sh`
- Start Command: `./scripts/coolify_start.sh`
- Port: `PORT` environment variable (defaults to `8000` if unset)

A `nixpacks.toml` is included with these commands.

### Required Environment Variables
Configure these in Coolify (example):

```env
GEMINI_API_KEY=...
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
OPENAI_API_KEY=...
```

## API Path Notes
- Chat endpoint: `POST /api/chat/send`
- Health: `GET /health`

## Why `/api` + Vite Proxy
- Development: Vite runs on `5173`, backend on `8000`; proxy forwards `/api` correctly.
- Production: frontend is served by FastAPI on the same origin; `/api` stays correct without extra frontend env config.
