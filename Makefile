.PHONY: install backend-install frontend-install dev-backend dev-frontend \
       migrate migration test lint format typecheck clean

# ─── Install ─────────────────────────────────────────────────────────
install: backend-install frontend-install

backend-install:
	pip install -e backend[dev]

frontend-install:
	cd frontend && npm install

# ─── Development Servers ─────────────────────────────────────────────
dev-backend:
	uvicorn backend.app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

# ─── Database ────────────────────────────────────────────────────────
migrate:
	alembic upgrade head

migration:
	alembic revision --autogenerate -m "$(msg)"

# ─── Quality ─────────────────────────────────────────────────────────
test:
	pytest backend/tests

lint:
	ruff check backend && cd frontend && npm run lint

format:
	ruff format backend && cd frontend && npm run format

typecheck:
	mypy backend/app && cd frontend && npx tsc --noEmit

# ─── Cleanup ─────────────────────────────────────────────────────────
clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .mypy_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .ruff_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	rm -rf build/ dist/ htmlcov/ .coverage
	cd frontend && rm -rf node_modules/.vite dist
