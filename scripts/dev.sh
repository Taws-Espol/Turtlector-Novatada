#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cleanup() {
  kill 0
}
trap cleanup EXIT INT TERM

(
  cd "$ROOT_DIR/backend"
  if command -v uv >/dev/null 2>&1; then
    uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
  else
    python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
  fi
) &

(
  cd "$ROOT_DIR/frontend"
  npm run dev -- --host --port 5173
) &

wait
