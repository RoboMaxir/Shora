"""
Pydantic schemas for API request/response validation.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# ═══ Tenant Schemas ═══

class TenantBase(BaseModel):
    name: str
    slug: str


class TenantCreate(TenantBase):
    pass


class TenantResponse(TenantBase):
    id: int
    created_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True


# ═══ User Schemas ═══

class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None
    role: str = "member"


class UserCreate(UserBase):
    tenant_id: int


class UserResponse(UserBase):
    id: int
    tenant_id: int
    created_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True


# ═══ Decision Schemas ═══

class DecisionBase(BaseModel):
    title: str = Field(..., max_length=500)
    question: str
    context: Optional[str] = None
    objectives: Optional[Dict[str, Any]] = None
    constraints: Optional[Dict[str, Any]] = None
    criteria: Optional[Dict[str, Any]] = None


class DecisionCreate(DecisionBase):
    tenant_id: int
    creator_id: int


class DecisionUpdate(BaseModel):
    title: Optional[str] = None
    question: Optional[str] = None
    context: Optional[str] = None
    objectives: Optional[Dict[str, Any]] = None
    constraints: Optional[Dict[str, Any]] = None
    criteria: Optional[Dict[str, Any]] = None
    status: Optional[str] = None
    human_decision_status: Optional[str] = None
    human_decision_notes: Optional[str] = None


class DecisionResponse(DecisionBase):
    id: int
    tenant_id: int
    creator_id: int
    status: str
    current_revision_id: Optional[int] = None
    human_decision_status: Optional[str] = None
    human_decision_notes: Optional[str] = None
    human_decided_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ═══ DecisionRevision Schemas ═══

class DecisionRevisionBase(BaseModel):
    title: str
    question: str
    context: Optional[str] = None
    objectives: Optional[Dict[str, Any]] = None
    constraints: Optional[Dict[str, Any]] = None
    criteria: Optional[Dict[str, Any]] = None
    alternatives: Optional[Dict[str, Any]] = None
    evidence_summary: Optional[Dict[str, Any]] = None
    findings: Optional[Dict[str, Any]] = None
    disagreements: Optional[Dict[str, Any]] = None
    recommendation: Optional[str] = None
    confidence_score: Optional[int] = Field(None, ge=0, le=100)


class DecisionRevisionCreate(DecisionRevisionBase):
    decision_id: int
    revision_number: int


class DecisionRevisionResponse(DecisionRevisionBase):
    id: int
    decision_id: int
    revision_number: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ═══ Run Schemas ═══

class RunBase(BaseModel):
    mode: str = "standard"
    max_tasks: int = 10
    max_model_calls: int = 20
    max_tokens: int = 100000


class RunCreate(RunBase):
    decision_id: int
    run_number: int


class RunUpdate(BaseModel):
    status: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    estimated_cost: Optional[int] = None


class RunResponse(RunBase):
    id: int
    decision_id: int
    run_number: int
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    estimated_cost: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# ═══ Task Schemas ═══

class TaskBase(BaseModel):
    task_type: str
    capability: Optional[str] = None
    input_data: Optional[Dict[str, Any]] = None
    order: Optional[int] = None
    depends_on: Optional[List[int]] = None


class TaskCreate(TaskBase):
    run_id: int


class TaskUpdate(BaseModel):
    status: Optional[str] = None
    output_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    attempt_count: Optional[int] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class TaskResponse(TaskBase):
    id: int
    run_id: int
    status: str
    output_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    attempt_count: int
    max_attempts: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# ═══ TaskAttempt Schemas ═══

class TaskAttemptBase(BaseModel):
    attempt_number: int
    llm_model_used: Optional[str] = None  # Renamed to avoid pydantic warning
    prompt_version: Optional[str] = None
    tokens_used: Optional[int] = None
    cost_cents: Optional[int] = None
    success: bool = False
    output: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None


class TaskAttemptCreate(TaskAttemptBase):
    task_id: int


class TaskAttemptResponse(TaskAttemptBase):
    id: int
    task_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ═══ Evidence Schemas ═══

class EvidenceBase(BaseModel):
    content: str
    source_type: Optional[str] = None
    source_id: Optional[str] = None
    domain: Optional[str] = None
    jurisdiction: Optional[str] = None
    as_of_date: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None
    provider: Optional[str] = None
    retrieval_query: Optional[str] = None


class EvidenceCreate(EvidenceBase):
    tenant_id: int


class EvidenceResponse(EvidenceBase):
    id: int
    tenant_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ═══ Composite Response Schemas ═══

class DecisionWithDetailsResponse(DecisionResponse):
    """Decision with related revisions and runs."""
    revisions: List[DecisionRevisionResponse] = []
    runs: List[RunResponse] = []
    creator: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True


class RunWithTasksResponse(RunResponse):
    """Run with related tasks."""
    tasks: List[TaskResponse] = []
    
    class Config:
        from_attributes = True


# ═══ Request/Response for API endpoints ═══

class CreateDecisionRequest(BaseModel):
    """Request to create a new Decision."""
    title: str
    question: str
    context: Optional[str] = None
    objectives: Optional[Dict[str, Any]] = None
    constraints: Optional[Dict[str, Any]] = None
    criteria: Optional[Dict[str, Any]] = None
    tenant_id: int
    user_id: int


class CreateRunRequest(BaseModel):
    """Request to create a new Run for a Decision."""
    mode: str = "standard"
    max_tasks: int = 10
    max_model_calls: int = 20
    max_tokens: int = 100000


class HumanDecisionRequest(BaseModel):
    """Request for human to make a decision on AI recommendation."""
    status: str  # APPROVED, REJECTED, DEFERRED, REQUESTED_REVISION
    notes: Optional[str] = None
