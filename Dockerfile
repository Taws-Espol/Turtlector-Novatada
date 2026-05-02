# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim-bookworm AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app/backend

# OS libs required by scientific/audio dependencies used by backend
RUN apt-get update && apt-get install -y --no-install-recommends \
    libasound2 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/ /app/backend/
RUN pip install --upgrade pip && pip install .

COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
