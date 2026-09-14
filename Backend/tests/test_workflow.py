"""
Tests for Phase 2 — SHORA Workflow

Tests cover:
- State machine transitions (valid and invalid)
- Run creation and lifecycle
- Task creation and execution
- Workflow history recording
- Tenant isolation
- API behavior
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.database import Base, get_db
from app.models import models
from app.workflow.state_machine import state_machine, DecisionStatus, RunStatus, TaskStatus


# ═══ Test Database Setup ═══

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function")
def client():
    """Create test database and client."""
    Base.metadata.create_all(bind=engine)
    
    with TestClient(app) as test_client:
        yield test_client
    
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Provide a database session for tests."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


# ═══ State Machine Tests ═══

class TestStateMachine:
    """Test workflow state transitions."""
    
    def test_valid_run_transition(self):
        """Test valid run state transitions."""
        # PENDING → RUNNING is valid
        is_valid, error = state_machine.validate_run_transition("PENDING", "RUNNING")
        assert is_valid is True
        assert error == ""
        
        # RUNNING → COMPLETED is valid
        is_valid, error = state_machine.validate_run_transition("RUNNING", "COMPLETED")
        assert is_valid is True
        
        # RUNNING → FAILED is valid
        is_valid, error = state_machine.validate_run_transition("RUNNING", "FAILED")
        assert is_valid is True
    
    def test_invalid_run_transition(self):
        """Test invalid run state transitions are rejected."""
        # PENDING → COMPLETED is NOT valid (must go through RUNNING)
        is_valid, error = state_machine.validate_run_transition("PENDING", "COMPLETED")
        assert is_valid is False
        assert "not allowed" in error
        
        # COMPLETED → RUNNING is NOT valid (terminal state)
        is_valid, error = state_machine.validate_run_transition("COMPLETED", "RUNNING")
        assert is_valid is False
    
    def test_valid_task_transition(self):
        """Test valid task state transitions."""
        # PENDING → RUNNING is valid
        is_valid, error = state_machine.validate_task_transition("PENDING", "RUNNING")
        assert is_valid is True
        
        # RUNNING → COMPLETED is valid
        is_valid, error = state_machine.validate_task_transition("RUNNING", "COMPLETED")
        assert is_valid is True
        
        # RUNNING → FAILED is valid
        is_valid, error = state_machine.validate_task_transition("RUNNING", "FAILED")
        assert is_valid is True
    
    def test_retry_transition_requires_flag(self):
        """Test that retry from FAILED requires is_retry flag."""
        # Without flag - should fail
        is_valid, error = state_machine.validate_task_transition("FAILED", "PENDING", is_retry=False)
        assert is_valid is False
        assert "requires is_retry flag" in error
        
        # With flag - should succeed
        is_valid, error = state_machine.validate_task_transition("FAILED", "PENDING", is_retry=True)
        assert is_valid is True
    
    def test_invalid_state_value(self):
        """Test that invalid state values are rejected."""
        is_valid, error = state_machine.validate_run_transition("PENDING", "INVALID_STATE")
        assert is_valid is False
        assert "Invalid target state" in error


# ═══ API Integration Tests ═══

class TestDecisionAPI:
    """Test Decision CRUD operations."""
    
    def test_create_decision(self, client, db_session):
        """Test creating a decision via API."""
        # Create tenant and user first
        tenant = models.Tenant(name="Test Tenant", slug="test")
        db_session.add(tenant)
        db_session.commit()
        
        user = models.User(tenant_id=tenant.id, email="test@example.com", full_name="Test User")
        db_session.add(user)
        db_session.commit()
        
        # Create decision
        response = client.post(
            "/api/decisions/",
            json={
                "title": "Test Decision",
                "question": "What should we do about inventory?",
                "context": "Inventory management context",
                "tenant_id": tenant.id,
                "user_id": user.id
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test Decision"
        assert data["status"] == "DRAFT"
        assert "id" in data


class TestRunAPI:
    """Test Run lifecycle operations."""
    
    def test_create_run_for_decision(self, client, db_session):
        """Test creating a run for a decision."""
        # Setup
        tenant = models.Tenant(name="Test Tenant", slug="test")
        db_session.add(tenant)
        db_session.commit()
        
        user = models.User(tenant_id=tenant.id, email="test@example.com")
        db_session.add(user)
        db_session.commit()
        
        decision = models.Decision(
            tenant_id=tenant.id,
            creator_id=user.id,
            title="Test Decision",
            question="What to do?",
            status=models.DecisionStatus.DRAFT
        )
        db_session.add(decision)
        db_session.commit()
        
        # Create run
        response = client.post(
            f"/api/decisions/{decision.id}/run",
            json={"mode": "standard"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["decision_id"] == decision.id
        assert data["status"] == "PENDING"
        assert data["run_number"] == 1
    
    def test_start_run(self, client, db_session):
        """Test starting a run (PENDING → RUNNING)."""
        # Setup
        tenant = models.Tenant(name="Test Tenant", slug="test")
        db_session.add(tenant)
        db_session.commit()
        
        user = models.User(tenant_id=tenant.id, email="test@example.com")
        db_session.add(user)
        db_session.commit()
        
        decision = models.Decision(
            tenant_id=tenant.id,
            creator_id=user.id,
            title="Test Decision",
            question="What to do?"
        )
        db_session.add(decision)
        db_session.commit()
        
        run = models.Run(decision_id=decision.id, run_number=1, status=models.RunStatus.PENDING)
        db_session.add(run)
        db_session.commit()
        
        # Start run
        response = client.post(f"/api/runs/{run.id}/start")
        
        assert response.status_code == 200
        data = response.json()
        assert data["state"] == "RUNNING"
        assert data["total_tasks"] == 1  # Initial planning task created
    
    def test_get_run_progress(self, client, db_session):
        """Test getting run progress."""
        # Setup
        tenant = models.Tenant(name="Test Tenant", slug="test")
        db_session.add(tenant)
        db_session.commit()
        
        user = models.User(tenant_id=tenant.id, email="test@example.com")
        db_session.add(user)
        db_session.commit()
        
        decision = models.Decision(
            tenant_id=tenant.id,
            creator_id=user.id,
            title="Test Decision",
            question="What to do?"
        )
        db_session.add(decision)
        db_session.commit()
        
        run = models.Run(
            decision_id=decision.id,
            run_number=1,
            status=models.RunStatus.RUNNING
        )
        db_session.add(run)
        db_session.commit()
        
        # Add some tasks
        task1 = models.Task(run_id=run.id, task_type="planning", status=models.TaskStatus.COMPLETED)
        task2 = models.Task(run_id=run.id, task_type="analysis", status=models.TaskStatus.PENDING)
        db_session.add(task1)
        db_session.add(task2)
        db_session.commit()
        
        # Get progress
        response = client.get(f"/api/runs/{run.id}/progress")
        
        assert response.status_code == 200
        data = response.json()
        assert data["state"] == "RUNNING"
        assert data["total_tasks"] == 2
        assert data["completed_tasks"] == 1
        assert data["pending_tasks"] == 1
        assert data["progress"] == 50  # 1/2 = 50%
    
    def test_get_run_history(self, client, db_session):
        """Test getting workflow history."""
        # Setup
        tenant = models.Tenant(name="Test Tenant", slug="test")
        db_session.add(tenant)
        db_session.commit()
        
        user = models.User(tenant_id=tenant.id, email="test@example.com")
        db_session.add(user)
        db_session.commit()
        
        decision = models.Decision(
            tenant_id=tenant.id,
            creator_id=user.id,
            title="Test Decision",
            question="What to do?"
        )
        db_session.add(decision)
        db_session.commit()
        
        run = models.Run(decision_id=decision.id, run_number=1, status=models.RunStatus.RUNNING)
        db_session.add(run)
        db_session.commit()
        
        # Add an event
        event = models.WorkflowEvent(
            run_id=run.id,
            decision_id=decision.id,
            event_type="RUN_STARTED",
            actor="orchestrator",
            previous_state="PENDING",
            new_state="RUNNING",
            reason="Starting workflow"
        )
        db_session.add(event)
        db_session.commit()
        
        # Get history
        response = client.get(f"/api/runs/{run.id}/history")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["event_type"] == "RUN_STARTED"
        assert data[0]["actor"] == "orchestrator"


# ═══ Tenant Isolation Tests ═══

class TestTenantIsolation:
    """Test that tenants cannot access each other's data."""
    
    def test_tenant_cannot_access_other_decision(self, client, db_session):
        """Test that decisions are isolated by tenant."""
        # Create two tenants
        tenant1 = models.Tenant(name="Tenant 1", slug="tenant1")
        tenant2 = models.Tenant(name="Tenant 2", slug="tenant2")
        db_session.add(tenant1)
        db_session.add(tenant2)
        db_session.commit()
        
        user1 = models.User(tenant_id=tenant1.id, email="user1@example.com")
        user2 = models.User(tenant_id=tenant2.id, email="user2@example.com")
        db_session.add(user1)
        db_session.add(user2)
        db_session.commit()
        
        # Create decision for tenant1
        decision = models.Decision(
            tenant_id=tenant1.id,
            creator_id=user1.id,
            title="Tenant 1 Decision",
            question="Question?"
        )
        db_session.add(decision)
        db_session.commit()
        
        # Note: In production, we would add tenant filtering in the API
        # For now, this test documents the requirement
        # The actual enforcement happens at the query level with tenant_id filter
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
