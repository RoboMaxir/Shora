"""
API router for Runs.

Endpoints:
- GET    /api/runs/            List all runs
- GET    /api/runs/{id}        Get a run by ID
- POST   /api/runs/{id}/execute Execute a council run
- GET    /api/runs/{id}/dossier Get the decision dossier
- GET    /api/runs/{id}/tasks  Get tasks for a run
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.database import get_db
from app.models import models
from app.schemas import schemas


router = APIRouter()


@router.get("/", response_model=List[schemas.RunResponse])
def list_runs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    List all Runs.
    """
    runs = db.query(models.Run).offset(skip).limit(limit).all()
    return runs


@router.get("/{run_id}", response_model=schemas.RunWithTasksResponse)
def get_run(run_id: int, db: Session = Depends(get_db)):
    """
    Get a Run by ID with its tasks.
    """
    run = db.query(models.Run).filter(models.Run.id == run_id).first()
    
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    return run


@router.post("/{run_id}/execute", response_model=schemas.RunResponse)
async def execute_run(run_id: int, db: Session = Depends(get_db)):
    """
    Execute a Council Run.
    
    This triggers the full council workflow: Strategy → Finance → Market → Cross Review → Synthesis → Dossier
    """
    run = db.query(models.Run).filter(models.Run.id == run_id).first()
    
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    # Check if already running or completed
    if run.status in [models.RunStatus.RUNNING, models.RunStatus.COMPLETED]:
        raise HTTPException(status_code=400, detail="Run is already executing or completed")
    
    # Update status to RUNNING
    run.status = models.RunStatus.RUNNING
    run.started_at = datetime.utcnow()
    db.commit()
    
    # Import and execute council engine
    try:
        from app.services.council_engine import CouncilEngine
        engine = CouncilEngine(db)
        await engine.execute_run(run_id)
        
        # Refresh after execution
        db.refresh(run)
        return run
        
    except Exception as e:
        run.status = models.RunStatus.FAILED
        run.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Council execution failed: {str(e)}")


@router.get("/{run_id}/dossier", response_model=Dict[str, Any])
def get_run_dossier(run_id: int, db: Session = Depends(get_db)):
    """
    Get the Decision Dossier for a completed run.
    """
    run = db.query(models.Run).filter(models.Run.id == run_id).first()
    
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    # Build dossier from run data
    decision = run.decision
    tasks = run.tasks
    
    # Extract agent outputs
    agent_outputs = {}
    conflicts = []
    synthesis = {}
    
    for task in tasks:
        if task.task_type and task.task_type.startswith('agent_analysis_'):
            agent_name = task.task_type.replace('agent_analysis_', '')
            if task.output_data:
                agent_outputs[agent_name] = task.output_data
        elif task.task_type == 'cross_review':
            if task.output_data:
                conflicts = task.output_data.get('conflicts', [])
        elif task.task_type == 'synthesis':
            if task.output_data:
                synthesis = task.output_data
    
    dossier = {
        "decision": {
            "id": decision.id,
            "title": decision.title,
            "question": decision.question,
            "objectives": decision.objectives,
            "constraints": decision.constraints,
            "context": decision.context
        } if decision else {},
        "run": {
            "id": run.id,
            "run_number": run.run_number,
            "status": run.status.value if hasattr(run.status, 'value') else run.status,
            "started_at": run.started_at.isoformat() if run.started_at else None,
            "completed_at": run.completed_at.isoformat() if run.completed_at else None
        },
        "agent_outputs": agent_outputs,
        "conflicts": conflicts,
        "synthesis": synthesis,
        "human_decision": {
            "status": decision.human_decision_status.value if decision and decision.human_decision_status else None,
            "notes": decision.human_decision_notes if decision else None,
            "decided_at": decision.human_decided_at.isoformat() if decision and decision.human_decided_at else None
        } if decision else {}
    }
    
    return dossier


@router.get("/{run_id}/tasks", response_model=List[schemas.TaskResponse])
def get_run_tasks(run_id: int, db: Session = Depends(get_db)):
    """
    Get all Tasks for a Run.
    """
    run = db.query(models.Run).filter(models.Run.id == run_id).first()
    
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    return run.tasks
