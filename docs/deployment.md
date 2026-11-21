# Production Deployment Guide

## Prerequisites
- Linux or Windows Server with Python 3.11+
- PostgreSQL 15+ with `pgvector` extension
- Redis 7+
- Optional: NVIDIA GPU with CUDA 12.x for accelerated neural inference

## Database Setup
```bash
# Connect to PostgreSQL and enable pgvector
CREATE DATABASE codexa;
\c codexa;
CREATE EXTENSION IF NOT EXISTS vector;
```

## Backend Configuration
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start production server with Uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Frontend Configuration
```bash
cd frontend
npm install
npm run build

# Serve dist with Nginx, Caddy, or static host
```
