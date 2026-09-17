"""
API router for Council Execution.

Endpoints:
- POST   /api/runs/{id}/execute    Start council execution
- GET    /api/runs/{id}/dossier    Get completed run dossier
"""
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.database import get_db
from app.models import models
from app.schemas import schemas
from app.services.council_engine import CouncilEngine


router = APIRouter()


@router.post("/{run_id}/execute")
async def execute_run(
    run_id: int,
    db: Session = Depends(get_db),
):
    """
    Execute a council run from start to finish using CouncilEngine.
    """
    run = db.query(models.Run).filter(models.Run.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    if run.status != models.RunStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Run must be in PENDING state (current: {run.status.value})"
        )
    
    # Use CouncilEngine for execution
    engine = CouncilEngine(db)
    success = await engine.execute_run(run_id)
    
    # Refresh run after execution
    db.refresh(run)
    
    if not success:
        raise HTTPException(status_code=500, detail="Council execution failed")
    
    return {
        "run_id": run.id,
        "status": run.status.value if hasattr(run.status, 'value') else run.status,
        "completed_at": run.completed_at.isoformat() if run.completed_at else None,
        "dossier_available": True,
    }


@router.get("/{run_id}/dossier")
def get_run_dossier(
    run_id: int,
    db: Session = Depends(get_db),
):
    """
    Get the completed run dossier.
    
    The dossier contains:
    - Decision info
    - Run metadata
    - Agent analyses
    - Conflicts detected
    - Synthesis output
    - Evidence summary
    """
    run = db.query(models.Run).filter(models.Run.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    if run.status != models.RunStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail=f"Run must be completed (current: {run.status.value})"
        )
    
    # Return dossier from metadata or reconstruct
    if run.metadata and "dossier" in run.metadata:
        return run.metadata["dossier"]
    
    # Reconstruct if not stored
    decision = run.decision
    conflicts = db.query(models.Conflict).filter(
        models.Conflict.decision_id == decision.id
    ).all()
    
    agent_outputs = {}
    for task in run.tasks:
        if task.task_type.startswith("agent_analysis_") and task.output_data:
            agent_outputs[task.capability] = task.output_data
    
    synthesis_task = next((t for t in run.tasks if t.task_type == "synthesis"), None)
    synthesis = synthesis_task.output_data if synthesis_task else {}
    
    evidence = db.query(models.Evidence).filter(
        models.Evidence.tenant_id == decision.tenant_id
    ).limit(10).all()
    
    dossier = create_dossier(
        db=db,
        decision=decision,
        run=run,
        agent_outputs=agent_outputs,
        synthesis=synthesis,
        conflicts=conflicts,
        evidence=evidence,
    )
    
    return dossier
