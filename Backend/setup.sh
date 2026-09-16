#!/bin/bash
# SIMORGH Platform - Phase 1 Setup Script
# This script sets up the backend foundation

set -e

echo "════════════════════════════════════════════════════════"
echo "  SIMORGH Platform — Phase 1 Setup"
echo "════════════════════════════════════════════════════════"
echo ""

cd /workspace/Backend

# Step 1: Check Python version
echo "✓ Checking Python version..."
python --version

# Step 2: Install dependencies
echo ""
echo "✓ Installing dependencies..."
pip install -q -r requirements.txt

# Step 3: Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "✓ Creating .env file from template..."
    cp .env.example .env
    echo "  ⚠️  Please edit .env with your database credentials"
else
    echo ""
    echo "✓ .env file already exists"
fi

# Step 4: Verify imports
echo ""
echo "✓ Verifying application imports..."
python -c "from app.main import app; print('  FastAPI app: OK')"
python -c "from app.models import models; print('  Models: OK')"
python -c "from app.schemas import schemas; print('  Schemas: OK')"
python -c "from app.api import decisions, runs; print('  API routers: OK')"

# Step 5: Show summary
echo ""
echo "════════════════════════════════════════════════════════"
echo "  Phase 1 Setup Complete!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Start PostgreSQL and create database 'simorgh_db'"
echo "  2. Edit Backend/.env with your database credentials"
echo "  3. Run migrations: alembic upgrade head"
echo "  4. Start server: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo "  5. Open http://localhost:8000/docs for API documentation"
echo ""
echo "Created components:"
echo "  ✓ FastAPI application"
echo "  ✓ SQLAlchemy models (12 entities)"
echo "  ✓ Pydantic schemas"
echo "  ✓ Decision API (6 endpoints)"
echo "  ✓ Run API (5 endpoints)"
echo "  ✓ Alembic migrations"
echo "  ✓ Tenant isolation boundary"
echo ""
