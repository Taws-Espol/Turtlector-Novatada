# Turtlector

Single-service app with FastAPI + React.

## Runtime model
- React is built to static files with Vite.
- FastAPI serves API routes under `/api/*`.
- FastAPI also serves the frontend static build (`frontend/dist`).
- Production runs as one container and one process (`uvicorn`).

## Local development

### Prerequisites
- Python 3.11
- Node 20+
- npm

### Run backend + frontend dev servers
```bash
./scripts/dev.sh
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/api`
- Docs: `http://localhost:8000/docs`

Vite proxies `/api` to `http://localhost:8000` in development.

## Docker (single file, no compose)

### Build image
```bash
docker build -t turtlector:latest .
```

### Run container
```bash
docker run --rm -p 8000:8000 \
  -e GEMINI_API_KEY=... \
  -e OPENAI_API_KEY=... \
  -e GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/google.json \
  -v /absolute/path/google.json:/app/credentials/google.json:ro \
  turtlector:latest
```

Then open:
- App: `http://localhost:8000/`
- Health: `http://localhost:8000/health`
- Docs: `http://localhost:8000/docs`

## Coolify deployment (Dockerfile)

In Coolify:
1. Create an `Application` from this repo.
2. Choose build type `Dockerfile` (not Nixpacks).
3. Dockerfile path: `./Dockerfile`.
4. Exposed/internal port: `8000`.
5. Set environment variables:
   - `GEMINI_API_KEY`
   - `OPENAI_API_KEY` (if used)
   - `GOOGLE_APPLICATION_CREDENTIALS` (path inside container)
6. Mount Google credentials JSON as a read-only file matching that path.
7. Deploy.

## API paths
- Chat: `POST /api/chat/send`
- Health: `GET /health`
