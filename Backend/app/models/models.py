"""
SIMORGH Platform — Database Models

Core entities for tenant isolation and decision workflow.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum, JSON, Boolean
from sqlalchemy.orm import relationship
import enum

from app.db.database import Base


class Tenant(Base):
    """Tenant represents an organization (e.g., BOLUT customer)."""
    __tablename__ = "tenants"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    users = relationship("User", back_populates="tenant")
    decisions = relationship("Decision", back_populates="tenant")


class User(Base):
    """User belongs to a tenant for authorization boundary."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255))
    role = Column(String(50), default="member")  # member, admin, executive
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="users")
    decisions = relationship("Decision", back_populates="creator")


class DecisionStatus(str, enum.Enum):
    """Workflow states for a Decision."""
    DRAFT = "DRAFT"
    FRAMING = "FRAMING"
    AWAITING_INPUT = "AWAITING_INPUT"
    PLANNING = "PLANNING"
    EVIDENCE = "EVIDENCE"
    ANALYZING = "ANALYZING"
    REVIEWING = "REVIEWING"
    REVISING = "REVISING"
    SYNTHESIZING = "SYNTHESIZING"
    VALIDATING = "VALIDATING"
    COMPLETED = "COMPLETED"
    COMPLETED_WITH_GAPS = "COMPLETED_WITH_GAPS"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class HumanDecisionStatus(str, enum.Enum):
    """Human decision on AI recommendation."""
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    DEFERRED = "DEFERRED"
    REQUESTED_REVISION = "REQUESTED_REVISION"


class Decision(Base):
    """
    Decision is the central artifact of SHORA.
    
    Contains:
    - Question / topic
    - Context
    - Objectives, constraints, criteria
    - Human decision state
    """
    __tablename__ = "decisions"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Core content
    title = Column(String(500), nullable=False)
    question = Column(Text, nullable=False)
    context = Column(Text, nullable=True)
    
    # Structured fields (JSON for flexibility)
    objectives = Column(JSON, nullable=True)  # List of objectives
    constraints = Column(JSON, nullable=True)  # List of constraints
    criteria = Column(JSON, nullable=True)  # Decision criteria
    
    # Workflow state
    status = Column(SQLEnum(DecisionStatus), default=DecisionStatus.DRAFT)
    current_revision_id = Column(Integer, ForeignKey("decision_revisions.id"), nullable=True)
    
    # Human decision
    human_decision_status = Column(SQLEnum(HumanDecisionStatus), nullable=True)
    human_decision_notes = Column(Text, nullable=True)
    human_decided_at = Column(DateTime, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="decisions")
    creator = relationship("User", back_populates="decisions")
    revisions = relationship("DecisionRevision", back_populates="decision", cascade="all, delete-orphan", foreign_keys="DecisionRevision.decision_id")
    runs = relationship("Run", back_populates="decision", cascade="all, delete-orphan", foreign_keys="Run.decision_id")
    events = relationship("WorkflowEvent", back_populates="decision", foreign_keys="WorkflowEvent.decision_id")


class DecisionRevision(Base):
    """
    DecisionRevision captures a versioned snapshot of a Decision.
    
    Each revision contains the full state at a point in time.
    """
    __tablename__ = "decision_revisions"
    
    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False)
    revision_number = Column(Integer, nullable=False)
    
    # Snapshot content
    title = Column(String(500), nullable=False)
    question = Column(Text, nullable=False)
    context = Column(Text, nullable=True)
    objectives = Column(JSON, nullable=True)
    constraints = Column(JSON, nullable=True)
    criteria = Column(JSON, nullable=True)
    
    # Analysis results
    alternatives = Column(JSON, nullable=True)
    evidence_summary = Column(JSON, nullable=True)
    findings = Column(JSON, nullable=True)
    disagreements = Column(JSON, nullable=True)
    recommendation = Column(Text, nullable=True)
    confidence_score = Column(Integer, nullable=True)  # 0-100
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    decision = relationship("Decision", back_populates="revisions")


class RunStatus(str, enum.Enum):
    """Status of a Run execution."""
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class Run(Base):
    """
    Run represents a single execution of the SHORA workflow for a Decision.
    
    A Decision can have multiple Runs (e.g., retry, revision).
    """
    __tablename__ = "runs"
    
    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False)
    run_number = Column(Integer, nullable=False)
    
    # Execution control
    status = Column(SQLEnum(RunStatus), default=RunStatus.PENDING)
    mode = Column(String(50), default="standard")  # brief, standard, deep
    
    # Cost control
    max_tasks = Column(Integer, default=10)
    max_model_calls = Column(Integer, default=20)
    max_tokens = Column(Integer, default=100000)
    estimated_cost = Column(Integer, nullable=True)  # In cents
    
    # Execution tracking
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    decision = relationship("Decision", back_populates="runs")
    tasks = relationship("Task", back_populates="run", cascade="all, delete-orphan")
    events = relationship("WorkflowEvent", back_populates="run")


class TaskStatus(str, enum.Enum):
    """Status of a Task within a Run."""
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"


class Task(Base):
    """
    Task represents a bounded execution unit within a Run.
    
    Examples:
    - Frame decision
    - Retrieve evidence
    - Financial analysis
    - Operational analysis
    - Cross-review
    - Synthesis
    """
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("runs.id"), nullable=False)
    task_type = Column(String(100), nullable=False)  # e.g., "financial_analysis"
    capability = Column(String(100), nullable=True)  # Capability name
    
    # Execution
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.PENDING)
    input_data = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Tracking
    attempt_count = Column(Integer, default=0)
    max_attempts = Column(Integer, default=3)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Ordering
    order = Column(Integer, nullable=True)
    depends_on = Column(JSON, nullable=True)  # List of task IDs this depends on
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    run = relationship("Run", back_populates="tasks")
    attempts = relationship("TaskAttempt", back_populates="task", cascade="all, delete-orphan")
    events = relationship("WorkflowEvent", back_populates="task")


class TaskAttempt(Base):
    """
    TaskAttempt records each attempt to execute a Task.
    
    Useful for debugging, auditing, and cost tracking.
    """
    __tablename__ = "task_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    attempt_number = Column(Integer, nullable=False)
    
    # LLM call tracking (renamed to avoid SQLAlchemy reserved word)
    llm_model_used = Column(String(100), nullable=True)
    prompt_version = Column(String(50), nullable=True)
    tokens_used = Column(Integer, nullable=True)
    cost_cents = Column(Integer, nullable=True)
    
    # Result
    success = Column(Boolean, default=False)
    output = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    task = relationship("Task", back_populates="attempts")


class Evidence(Base):
    """
    Evidence represents retrieved information from KNOWLEDGE or external sources.
    """
    __tablename__ = "evidence"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    
    # Content
    content = Column(Text, nullable=False)
    source_type = Column(String(50), nullable=True)  # "knowledge", "bolut", "manual"
    source_id = Column(String(255), nullable=True)  # External source identifier
    
    # Metadata (renamed to avoid SQLAlchemy reservation)
    domain = Column(String(100), nullable=True)  # e.g., "inventory", "finance"
    jurisdiction = Column(String(100), nullable=True)
    as_of_date = Column(DateTime, nullable=True)
    extra_metadata = Column(JSON, nullable=True)  # Renamed from 'metadata'
    
    # Provenance
    provider = Column(String(100), nullable=True)  # Which provider retrieved this
    retrieval_query = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant")


class Source(Base):
    """
    Source represents an external data source (e.g., BOLUT ERP, document repository).
    """
    __tablename__ = "sources"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    
    name = Column(String(255), nullable=False)
    source_type = Column(String(50), nullable=False)  # "bolut_erp", "document", "api"
    connection_config = Column(JSON, nullable=True)  # Encrypted connection details
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    last_synced_at = Column(DateTime, nullable=True)
    
    # Relationships
    tenant = relationship("Tenant")


class Finding(Base):
    """
    Finding represents an analytical finding from a capability execution.
    """
    __tablename__ = "findings"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    
    # Content
    finding_type = Column(String(50), nullable=True)  # "fact", "assumption", "calculation"
    content = Column(Text, nullable=False)
    confidence = Column(Integer, nullable=True)  # 0-100
    
    # Traceability
    evidence_ids = Column(JSON, nullable=True)  # References to Evidence
    assumptions = Column(JSON, nullable=True)
    calculations = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    task = relationship("Task")


class Conflict(Base):
    """
    Conflict represents a detected disagreement between analyses.
    """
    __tablename__ = "conflicts"
    
    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False)
    
    # Classification
    conflict_type = Column(String(50), nullable=True)  # "factual", "assumptive", "methodological", "value_based", "scope_based"
    description = Column(Text, nullable=False)
    
    # Parties involved
    party_a_task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    party_b_task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    
    # Resolution
    resolution_status = Column(String(50), default="pending")  # pending, resolved, preserved_dissent
    resolution_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    # Relationships
    decision = relationship("Decision")


class AuditEvent(Base):
    """
    AuditEvent tracks security-relevant actions for compliance.
    """
    __tablename__ = "audit_events"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(Integer, nullable=True)
    
    details = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    tenant = relationship("Tenant")


# ═══ Add WorkflowEvent model at the end ═══

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
    event_type = Column(SQLEnum(
        'RUN_CREATED', 'RUN_STARTED', 'RUN_COMPLETED', 'RUN_FAILED', 'RUN_CANCELLED',
        'STATE_TRANSITION',
        'TASK_CREATED', 'TASK_STARTED', 'TASK_COMPLETED', 'TASK_FAILED', 'TASK_RETRYING', 'TASK_SKIPPED',
        'DECISION_CREATED', 'DECISION_UPDATED', 'HUMAN_DECISION_MADE',
        'TOKEN_USAGE_RECORDED', 'COST_ESTIMATED',
        'ERROR_OCCURRED', 'RECOVERY_ATTEMPTED',
        name='workfloweventtype'
    ), nullable=False)
    
    # State transition info
    previous_state = Column(String(50), nullable=True)
    new_state = Column(String(50), nullable=True)
    
    # Actor (system component or user)
    actor = Column(String(100), nullable=False)  # e.g., "orchestrator", "user:123", "worker"
    
    # Event details
    reason = Column(Text, nullable=True)
    event_data = Column(JSON, nullable=True)  # Renamed from 'metadata' to avoid conflict
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    run = relationship("Run", back_populates="events")
    decision = relationship("Decision", back_populates="events")
    task = relationship("Task", back_populates="events")
