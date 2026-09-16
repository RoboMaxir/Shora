"""
API router for workflow operations.

Endpoints:
- POST   /api/runs/{id}/start         Start a run (PENDING → RUNNING)
- GET    /api/runs/{id}/progress      Get run progress
- GET    /api/runs/{id}/history       Get workflow history
- POST   /api/tasks/{id}/complete     Complete a task
- POST   /api/tasks/{id}/fail         Fail a task
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import models
from app.schemas import workflow_schemas
from app.services import WorkflowOrchestrator
from app.workflow.history import get_run_history, WorkflowEventType


router = APIRouter()


@router.post("/{run_id}/start", response_model=workflow_schemas.RunProgressResponse)
def start_run(run_id: int, db: Session = Depends(get_db)):
    """
    Start a Run by transitioning from PENDING → RUNNING.
    
    This creates the initial planning task and begins workflow execution.
    """
    orchestrator = WorkflowOrchestrator(db)
    
    try:
        run = orchestrator.start_run(run_id)
        progress = orchestrator.get_run_progress(run_id)
        return progress
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{run_id}/progress", response_model=workflow_schemas.RunProgressResponse)
def get_run_progress(run_id: int, db: Session = Depends(get_db)):
    """
    Get current progress of a Run.
    
    Returns structured progress information including:
    - Current state
    - Task counts (completed, failed, running, pending)
    - Progress percentage
    - Timestamps
    """
    orchestrator = WorkflowOrchestrator(db)
    
    try:
        progress = orchestrator.get_run_progress(run_id)
        return progress
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{run_id}/history", response_model=List[workflow_schemas.WorkflowEventResponse])
def get_workflow_history(run_id: int, db: Session = Depends(get_db)):
    """
    Get complete workflow history for a Run.
    
    Returns all events ordered by creation time.
    """
    run = db.query(models.Run).filter(models.Run.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    events = get_run_history(db, run_id)
    return events


@router.get("/{run_id}/full", response_model=workflow_schemas.RunWithHistoryResponse)
def get_run_with_history(run_id: int, db: Session = Depends(get_db)):
    """
    Get Run with full progress and history.
    
    This is the primary endpoint for the UI to display run status.
    """
    run = db.query(models.Run).filter(models.Run.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    orchestrator = WorkflowOrchestrator(db)
    progress = orchestrator.get_run_progress(run_id)
    events = get_run_history(db, run_id)
    
    return workflow_schemas.RunWithHistoryResponse(
        run_id=run.id,
        decision_id=run.decision_id,
        status=run.status.value,
        mode=run.mode,
        started_at=run.started_at,
        completed_at=run.completed_at,
        error_message=run.error_message,
        progress=progress,
        history=[workflow_schemas.WorkflowEventResponse.model_validate(e) for e in events]
    )


@router.post("/tasks/{task_id}/complete", response_model=workflow_schemas.RunProgressResponse)
def complete_task(
    task_id: int,
    output_data: dict = None,
    db: Session = Depends(get_db)
):
    """
    Mark a task as completed.
    
    This triggers the next step in the workflow.
    """
    orchestrator = WorkflowOrchestrator(db)
    
    try:
        task = orchestrator.complete_task(task_id, output_data, success=True)
        progress = orchestrator.get_run_progress(task.run_id)
        return progress
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/tasks/{task_id}/fail", response_model=workflow_schemas.RunProgressResponse)
def fail_task(
    task_id: int,
    error_info: dict = None,
    db: Session = Depends(get_db)
):
    """
    Mark a task as failed.
    
    This may trigger retry logic or fail the entire run.
    """
    orchestrator = WorkflowOrchestrator(db)
    
    try:
        task = orchestrator.complete_task(task_id, error_info, success=False)
        progress = orchestrator.get_run_progress(task.run_id)
        return progress
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
