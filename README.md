# SIMORGH Platform Backend

FastAPI-based backend for the SIMORGH decision council platform.

## Quick Start

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Set up environment variables

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Start PostgreSQL

Ensure PostgreSQL is running and the database exists:

```bash
createdb simorgh_db
# Or use psql to create the database and user
```

### 4. Run migrations

```bash
cd /workspace/Backend
alembic upgrade head
```

### 5. Start the server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### 6. Interactive API docs

Visit `http://localhost:8000/docs` for Swagger UI interactive documentation.

## Project Structure

```
Backend/
├── app/
│   ├── api/           # FastAPI routers
│   │   ├── decisions.py
│   │   └── runs.py
│   ├── core/          # Configuration and utilities
│   │   └── config.py
│   ├── db/            # Database connection
│   │   └── database.py
│   ├── models/        # SQLAlchemy models
│   │   └── models.py
│   ├── schemas/       # Pydantic schemas
│   │   └── schemas.py
│   └── main.py        # Application entry point
├── migrations/        # Alembic migrations
│   ├── versions/
│   ├── alembic.ini
│   └── env.py
├── requirements.txt
└── .env.example
```

## Core API Endpoints

### Decisions

- `POST /api/decisions` - Create a new decision
- `GET /api/decisions/{id}` - Get decision details
- `PUT /api/decisions/{id}` - Update a decision
- `POST /api/decisions/{id}/run` - Start a new run (workflow execution)
- `POST /api/decisions/{id}/human-decision` - Record human decision

### Runs

- `GET /api/runs/{id}` - Get run details with tasks
- `PUT /api/runs/{id}` - Update run status
- `GET /api/runs/{id}/tasks` - Get all tasks for a run
- `POST /api/runs/{id}/tasks` - Create a new task
- `PUT /api/runs/{id}/tasks/{task_id}` - Update task status

## Data Model

### Core Entities

- **Tenant**: Organization boundary for multi-tenancy
- **User**: User belonging to a tenant
- **Decision**: Central artifact containing business question/context
- **DecisionRevision**: Versioned snapshot of decision state
- **Run**: Single execution of the SHORA workflow
- **Task**: Bounded execution unit within a run
- **TaskAttempt**: Records each LLM call attempt
- **Evidence**: Retrieved information from knowledge sources
- **Source**: External data source configuration
- **Finding**: Analytical finding from capability execution
- **Conflict**: Detected disagreement between analyses
- **AuditEvent**: Security-relevant action log

## Workflow States

### Decision Status

```
DRAFT → FRAMING → AWAITING_INPUT → PLANNING → EVIDENCE → 
ANALYZING → REVIEWING → REVISING → SYNTHESIZING → VALIDATING → COMPLETED
```

Terminal states: `COMPLETED`, `COMPLETED_WITH_GAPS`, `FAILED`, `CANCELLED`

### Human Decision

- `APPROVED` - Human accepts AI recommendation
- `REJECTED` - Human rejects AI recommendation
- `DEFERRED` - Human defers decision
- `REQUESTED_REVISION` - Human requests revision

## Next Steps

After Phase 1 is complete, continue with:

1. **Phase 2**: Implement workflow engine and task scheduler
2. **Phase 3**: Add analytical capabilities
3. **Phase 4**: Implement structured debate/cross-review
4. **Phase 5**: Add KNOWLEDGE interface
5. **Phase 6**: Implement BOLUT adapter

## Development Notes

- All database queries must include tenant_id for isolation
- LLM calls should eventually go through a gateway abstraction
- Cost control limits are enforced at the Run level
- Audit events should be logged for security-relevant actions
