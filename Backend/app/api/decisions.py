"""
API router for Decisions.

Endpoints:
- GET    /api/decisions/       List all decisions
- POST   /api/decisions/       Create a new decision
- GET    /api/decisions/{id}   Get a decision by ID
- PUT    /api/decisions/{id}   Update a decision
- POST   /api/decisions/{id}/run Create a new run for a decision
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.database import get_db
from app.models import models
from app.schemas import schemas


router = APIRouter()


@router.get("/", response_model=List[schemas.DecisionResponse])
def list_decisions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    List all Decisions.
    """
    decisions = db.query(models.Decision).offset(skip).limit(limit).all()
    return decisions


@router.post("/", response_model=schemas.DecisionResponse, status_code=status.HTTP_201_CREATED)
def create_decision(decision_data: schemas.CreateDecisionRequest, db: Session = Depends(get_db)):
    """
    Create a new Decision.
    
    This is the entry point for starting a SHORA council session.
    """
    # Verify tenant exists
    tenant = db.query(models.Tenant).filter(models.Tenant.id == decision_data.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Verify user exists
    user = db.query(models.User).filter(models.User.id == decision_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create decision
    db_decision = models.Decision(
        tenant_id=decision_data.tenant_id,
        creator_id=decision_data.user_id,
        title=decision_data.title,
        question=decision_data.question,
        context=decision_data.context,
        objectives=decision_data.objectives,
        constraints=decision_data.constraints,
        criteria=decision_data.criteria,
        status=models.DecisionStatus.DRAFT,
    )
    
    db.add(db_decision)
    db.commit()
    db.refresh(db_decision)
    
    # Create initial revision
    initial_revision = models.DecisionRevision(
        decision_id=db_decision.id,
        revision_number=1,
        title=db_decision.title,
        question=db_decision.question,
        context=db_decision.context,
        objectives=db_decision.objectives,
        constraints=db_decision.constraints,
        criteria=db_decision.criteria,
    )
    
    db.add(initial_revision)
    db_decision.current_revision_id = initial_revision.id
    db.commit()
    db.refresh(db_decision)
    
    return db_decision


@router.get("/{decision_id}", response_model=schemas.DecisionWithDetailsResponse)
def get_decision(decision_id: int, db: Session = Depends(get_db)):
    """
    Get a Decision by ID with its revisions and runs.
    """
    decision = db.query(models.Decision).filter(models.Decision.id == decision_id).first()
    
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    
    return decision


@router.put("/{decision_id}", response_model=schemas.DecisionResponse)
def update_decision(
    decision_id: int,
    decision_update: schemas.DecisionUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a Decision.
    """
    decision = db.query(models.Decision).filter(models.Decision.id == decision_id).first()
    
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    
    # Update fields
    update_data = decision_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(decision, field, value)
    
    # Update timestamp
    decision.updated_at = datetime.utcnow()
    
    # If status is completed, set completed_at
    if decision_update.status == "COMPLETED":
        decision.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(decision)
    
    return decision


@router.post("/{decision_id}/run", response_model=schemas.RunResponse, status_code=status.HTTP_201_CREATED)
def create_run_for_decision(
    decision_id: int,
    run_data: schemas.CreateRunRequest,
    db: Session = Depends(get_db)
):
    """
    Create a new Run for a Decision.
    
    This starts the SHORA workflow execution for the decision.
    """
    decision = db.query(models.Decision).filter(models.Decision.id == decision_id).first()
    
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    
    # Determine run number
    last_run = db.query(models.Run).filter(
        models.Run.decision_id == decision_id
    ).order_by(models.Run.run_number.desc()).first()
    
    run_number = (last_run.run_number + 1) if last_run else 1
    
    # Create run
    db_run = models.Run(
        decision_id=decision_id,
        run_number=run_number,
        mode=run_data.mode,
        max_tasks=run_data.max_tasks,
        max_model_calls=run_data.max_model_calls,
        max_tokens=run_data.max_tokens,
        status=models.RunStatus.PENDING,
    )
    
    db.add(db_run)
    db.commit()
    db.refresh(db_run)
    
    # Update decision status to PLANNING
    decision.status = models.DecisionStatus.PLANNING
    db.commit()
    
    return db_run


@router.get("/{decision_id}/runs", response_model=List[schemas.RunResponse])
def get_runs_for_decision(decision_id: int, db: Session = Depends(get_db)):
    """
    Get all Runs for a Decision.
    """
    decision = db.query(models.Decision).filter(models.Decision.id == decision_id).first()
    
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    
    return decision.runs


@router.post("/{decision_id}/human-decision", response_model=schemas.DecisionResponse)
def record_human_decision(
    decision_id: int,
    human_decision: schemas.HumanDecisionRequest,
    db: Session = Depends(get_db)
):
    """
    Record a human decision on the AI recommendation.
    
    This is the final step where a human approves, rejects, defers, or requests revision.
    """
    decision = db.query(models.Decision).filter(models.Decision.id == decision_id).first()
    
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    
    # Validate status
    valid_statuses = ["APPROVED", "REJECTED", "DEFERRED", "REQUESTED_REVISION"]
    if human_decision.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    decision.human_decision_status = getattr(models.HumanDecisionStatus, human_decision.status)
    decision.human_decision_notes = human_decision.notes
    decision.human_decided_at = datetime.utcnow()
    
    db.commit()
    db.refresh(decision)
    
    return decision
