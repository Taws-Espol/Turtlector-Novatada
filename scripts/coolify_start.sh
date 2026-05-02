#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR/backend"

if command -v uv >/dev/null 2>&1; then
  exec uv run uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
else
  exec python3 -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
fi
