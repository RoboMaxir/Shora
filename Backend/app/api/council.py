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
from app.workflow.orchestrator import WorkflowOrchestrator
from app.services.council_engine import (
    gather_context,
    execute_agent,
    AGENT_REGISTRY,
    detect_conflicts,
    synthesize_analysis,
    create_dossier,
)


router = APIRouter()


@router.post("/{run_id}/execute")
async def execute_run(
    run_id: int,
    db: Session = Depends(get_db),
):
    """
    Execute a council run from start to finish.
    
    This is the main entry point for running the full council workflow:
    1. Context/Evidence gathering
    2. Strategy Agent analysis
    3. Finance Agent analysis
    4. Market Agent analysis
    5. Cross-review (conflict detection)
    6. Synthesis
    7. Dossier creation
    
    Returns progress information.
    """
    run = db.query(models.Run).filter(models.Run.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    if run.status != models.RunStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Run must be in PENDING state (current: {run.status.value})"
        )
    
    decision = run.decision
    tenant_id = decision.tenant_id
    
    orchestrator = WorkflowOrchestrator(db)
    
    # Start the run (creates tasks)
    await orchestrator.start_run(run_id)
    
    # Refresh to get created tasks
    db.refresh(run)
    
    # Execute tasks sequentially (simplified - no async task queue)
    agent_outputs: Dict[str, Dict[str, Any]] = {}
    evidence: list[models.Evidence] = []
    
    for task in sorted(run.tasks, key=lambda t: t.order or 0):
        try:
            # Start task
            task.status = models.TaskStatus.RUNNING
            task.started_at = datetime.utcnow()
            db.commit()
            
            if task.task_type == "context_gathering":
                # Gather context/evidence
                evidence = await gather_context(db, decision, tenant_id)
                task.output_data = {"evidence_count": len(evidence)}
                task.status = models.TaskStatus.COMPLETED
                
            elif task.task_type.startswith("agent_analysis_"):
                # Execute agent analysis
                agent_name = task.capability
                agent = AGENT_REGISTRY.get(agent_name)
                
                if not agent:
                    task.status = models.TaskStatus.SKIPPED
                    task.error_message = f"Unknown agent: {agent_name}"
                    db.commit()
                    continue
                
                success, output, tokens_used = await execute_agent(
                    db=db,
                    task=task,
                    agent=agent,
                    decision=decision,
                    evidence=evidence,
                )
                
                if success:
                    task.output_data = output
                    task.status = models.TaskStatus.COMPLETED
                    agent_outputs[agent_name] = output
                else:
                    task.status = models.TaskStatus.FAILED
                    task.error_message = output.get("error", "Unknown error")
                    
            elif task.task_type == "cross_review":
                # Detect conflicts between agent outputs
                conflicts = detect_conflicts(db, decision, agent_outputs)
                task.output_data = {
                    "conflicts_detected": len(conflicts),
                    "conflict_ids": [c.id for c in conflicts],
                }
                task.status = models.TaskStatus.COMPLETED
                
            elif task.task_type == "synthesis":
                # Get conflicts for synthesis
                conflicts = db.query(models.Conflict).filter(
                    models.Conflict.decision_id == decision.id
                ).all()
                
                # Synthesize analysis
                synthesis = await synthesize_analysis(
                    db=db,
                    decision=decision,
                    agent_outputs=agent_outputs,
                    conflicts=conflicts,
                    evidence=evidence,
                )
                
                task.output_data = synthesis
                task.status = models.TaskStatus.COMPLETED
            
            task.completed_at = datetime.utcnow()
            db.commit()
            
        except Exception as e:
            task.status = models.TaskStatus.FAILED
            task.error_message = str(e)
            task.completed_at = datetime.utcnow()
            db.commit()
    
    # Complete the run
    all_completed = all(t.status == models.TaskStatus.COMPLETED for t in run.tasks)
    any_failed = any(t.status == models.TaskStatus.FAILED for t in run.tasks)
    
    if any_failed:
        run.status = models.RunStatus.FAILED
        run.error_message = "One or more tasks failed"
    else:
        run.status = models.RunStatus.COMPLETED
    
    run.completed_at = datetime.utcnow()
    decision.status = models.DecisionStatus.COMPLETED
    decision.completed_at = datetime.utcnow()
    
    db.commit()
    
    # Create dossier
    conflicts = db.query(models.Conflict).filter(
        models.Conflict.decision_id == decision.id
    ).all()
    
    synthesis_task = next((t for t in run.tasks if t.task_type == "synthesis"), None)
    synthesis = synthesis_task.output_data if synthesis_task else {}
    
    dossier = create_dossier(
        db=db,
        decision=decision,
        run=run,
        agent_outputs=agent_outputs,
        synthesis=synthesis,
        conflicts=conflicts,
        evidence=evidence,
    )
    
    # Store dossier reference in run metadata
    run.metadata = {"dossier": dossier}
    db.commit()
    
    return {
        "run_id": run.id,
        "status": run.status.value,
        "completed_at": run.completed_at.isoformat() if run.completed_at else None,
        "tasks_completed": len([t for t in run.tasks if t.status == models.TaskStatus.COMPLETED]),
        "agents_executed": list(agent_outputs.keys()),
        "conflicts_detected": len(conflicts),
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
