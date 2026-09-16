"""
API router for Runs.

Endpoints:
- GET    /api/runs/{id}           Get a run by ID
- PUT    /api/runs/{id}           Update a run
- GET    /api/runs/{id}/tasks     Get tasks for a run
- POST   /api/runs/{id}/tasks     Create a task for a run
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.database import get_db
from app.models import models
from app.schemas import schemas


router = APIRouter()


@router.get("/{run_id}", response_model=schemas.RunWithTasksResponse)
def get_run(run_id: int, db: Session = Depends(get_db)):
    """
    Get a Run by ID with its tasks.
    """
    run = db.query(models.Run).filter(models.Run.id == run_id).first()
    
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    return run


@router.put("/{run_id}", response_model=schemas.RunResponse)
def update_run(
    run_id: int,
    run_update: schemas.RunUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a Run status and metadata.
    """
    run = db.query(models.Run).filter(models.Run.id == run_id).first()
    
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    # Update fields
    update_data = run_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(run, field, value)
    
    db.commit()
    db.refresh(run)
    
    return run


@router.get("/{run_id}/tasks", response_model=List[schemas.TaskResponse])
def get_tasks_for_run(run_id: int, db: Session = Depends(get_db)):
    """
    Get all Tasks for a Run.
    """
    run = db.query(models.Run).filter(models.Run.id == run_id).first()
    
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    return run.tasks


@router.post("/{run_id}/tasks", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task_for_run(
    run_id: int,
    task_data: schemas.TaskCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new Task for a Run.
    
    Tasks represent bounded execution units like:
    - decision_framing
    - evidence_retrieval
    - financial_analysis
    - operational_analysis
    - cross_review
    - synthesis
    """
    run = db.query(models.Run).filter(models.Run.id == run_id).first()
    
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    # Check max tasks limit
    current_task_count = db.query(models.Task).filter(models.Task.run_id == run_id).count()
    if current_task_count >= run.max_tasks:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum task limit ({run.max_tasks}) reached for this run"
        )
    
    # Determine task order
    last_task = db.query(models.Task).filter(
        models.Task.run_id == run_id
    ).order_by(models.Task.order.desc()).first()
    
    order = (last_task.order + 1) if last_task else 0
    
    # Create task
    db_task = models.Task(
        run_id=run_id,
        task_type=task_data.task_type,
        capability=task_data.capability,
        input_data=task_data.input_data,
        order=order,
        depends_on=task_data.depends_on,
        status=models.TaskStatus.PENDING,
    )
    
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    return db_task


@router.put("/{run_id}/tasks/{task_id}", response_model=schemas.TaskResponse)
def update_task(
    run_id: int,
    task_id: int,
    task_update: schemas.TaskUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a Task's status and output.
    """
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.run_id == run_id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update fields
    update_data = task_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
    
    db.commit()
    db.refresh(task)
    
    return task
