"""
Pydantic schemas for workflow events and progress.
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel


class WorkflowEventBase(BaseModel):
    """Base schema for workflow events."""
    event_type: str
    actor: str
    previous_state: Optional[str] = None
    new_state: Optional[str] = None
    reason: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class WorkflowEventResponse(WorkflowEventBase):
    """Response schema for workflow events."""
    id: int
    run_id: int
    decision_id: Optional[int] = None
    task_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class RunProgressResponse(BaseModel):
    """Progress information for a Run."""
    run_id: int
    state: str
    decision_status: str
    total_tasks: int
    completed_tasks: int
    failed_tasks: int
    running_tasks: int
    pending_tasks: int
    progress: int  # Percentage 0-100
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class RunWithHistoryResponse(BaseModel):
    """Run with its workflow history."""
    run_id: int
    decision_id: int
    status: str
    mode: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    progress: RunProgressResponse
    history: List[WorkflowEventResponse] = []
    
    class Config:
        from_attributes = True
