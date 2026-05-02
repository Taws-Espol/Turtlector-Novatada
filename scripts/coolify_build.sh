#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[build] frontend dependencies"
cd "$ROOT_DIR/frontend"
npm ci

echo "[build] frontend static bundle"
npm run build

echo "[build] backend dependencies"
cd "$ROOT_DIR/backend"
if command -v uv >/dev/null 2>&1; then
  uv sync --frozen --no-dev
else
  python3 -m pip install --upgrade pip
  python3 -m pip install .
fi
