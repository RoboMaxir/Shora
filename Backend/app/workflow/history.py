"""
SIMORGH Platform — Workflow History / Audit Trail

Records all important state transitions and workflow events for observability.
"""
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.db.database import Base


class WorkflowEventType(str, enum.Enum):
    """Types of workflow events."""
    
    # Run lifecycle
    RUN_CREATED = "RUN_CREATED"
    RUN_STARTED = "RUN_STARTED"
    RUN_COMPLETED = "RUN_COMPLETED"
    RUN_FAILED = "RUN_FAILED"
    RUN_CANCELLED = "RUN_CANCELLED"
    
    # State transitions
    STATE_TRANSITION = "STATE_TRANSITION"
    
    # Task lifecycle
    TASK_CREATED = "TASK_CREATED"
    TASK_STARTED = "TASK_STARTED"
    TASK_COMPLETED = "TASK_COMPLETED"
    TASK_FAILED = "TASK_FAILED"
    TASK_RETRYING = "TASK_RETRYING"
    TASK_SKIPPED = "TASK_SKIPPED"
    
    # Decision lifecycle
    DECISION_CREATED = "DECISION_CREATED"
    DECISION_UPDATED = "DECISION_UPDATED"
    HUMAN_DECISION_MADE = "HUMAN_DECISION_MADE"
    
    # Cost tracking
    TOKEN_USAGE_RECORDED = "TOKEN_USAGE_RECORDED"
    COST_ESTIMATED = "COST_ESTIMATED"
    
    # Errors
    ERROR_OCCURRED = "ERROR_OCCURRED"
    RECOVERY_ATTEMPTED = "RECOVERY_ATTEMPTED"


class WorkflowEvent(Base):
    """
    WorkflowEvent records every important state transition and workflow action.
    
    This provides:
    - Full audit trail for compliance
    - Debugging capabilities
    - Progress reconstruction
    - Failure analysis
    """
    __tablename__ = "workflow_events"
    
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("runs.id"), nullable=False, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True, index=True)
    
    # Event type
    event_type = Column(SQLEnum(WorkflowEventType), nullable=False)
    
    # State transition info
    previous_state = Column(String(50), nullable=True)
    new_state = Column(String(50), nullable=True)
    
    # Actor (system component or user)
    actor = Column(String(100), nullable=False)  # e.g., "orchestrator", "user:123", "worker"
    
    # Event details
    reason = Column(Text, nullable=True)
    event_metadata = Column(JSON, nullable=True)  # Renamed from 'metadata' to avoid conflict
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    run = relationship("Run", back_populates="events")
    decision = relationship("Decision", back_populates="events")
    task = relationship("Task", back_populates="events")


# ═══ Helper Functions ═══

def record_event(
    db_session,
    run_id: int,
    event_type: WorkflowEventType,
    actor: str,
    decision_id: Optional[int] = None,
    task_id: Optional[int] = None,
    previous_state: Optional[str] = None,
    new_state: Optional[str] = None,
    reason: Optional[str] = None,
    event_metadata: Optional[Dict[str, Any]] = None
) -> WorkflowEvent:
    """
    Record a workflow event to the database.
    
    This is the primary function for recording workflow history.
    """
    event = WorkflowEvent(
        run_id=run_id,
        decision_id=decision_id,
        task_id=task_id,
        event_type=event_type,
        actor=actor,
        previous_state=previous_state,
        new_state=new_state,
        reason=reason,
        event_metadata=event_metadata or {}
    )
    
    db_session.add(event)
    db_session.commit()
    db_session.refresh(event)
    
    return event


def get_run_history(db_session, run_id: int) -> list[WorkflowEvent]:
    """
    Get complete workflow history for a Run.
    
    Returns events ordered by creation time.
    """
    return db_session.query(WorkflowEvent).filter(
        WorkflowEvent.run_id == run_id
    ).order_by(WorkflowEvent.created_at.asc()).all()


def get_task_history(db_session, task_id: int) -> list[WorkflowEvent]:
    """
    Get workflow history for a specific Task.
    """
    return db_session.query(WorkflowEvent).filter(
        WorkflowEvent.task_id == task_id
    ).order_by(WorkflowEvent.created_at.asc()).all()
