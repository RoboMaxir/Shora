"""
SIMORGH Platform — Workflow Orchestrator

The orchestrator is responsible for advancing a Run through its workflow.
It creates tasks, executes them (or delegates to workers), and transitions state.

This is the core application logic layer - NOT in API routes.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.models import models
from app.workflow.state_machine import state_machine, DecisionStatus, RunStatus, TaskStatus
from app.workflow.history import record_event, WorkflowEventType


class WorkflowOrchestrator:
    """
    Orchestrates the SHORA workflow for a Run.
    
    Responsibilities:
    - Validate and execute state transitions
    - Create tasks based on workflow phase
    - Track progress
    - Handle failures and retries
    - Record history events
    
    The orchestrator is deterministic and inspectable.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def start_run(self, run_id: int) -> models.Run:
        """
        Start a Run by transitioning from PENDING → RUNNING.
        
        Creates initial tasks for the PLANNING phase.
        """
        run = self.db.query(models.Run).filter(models.Run.id == run_id).first()
        if not run:
            raise ValueError(f"Run {run_id} not found")
        
        if run.status != RunStatus.PENDING:
            raise ValueError(f"Run is not in PENDING state (current: {run.status})")
        
        # Validate transition
        is_valid, error = state_machine.validate_run_transition(
            run.status.value, 
            RunStatus.RUNNING.value
        )
        if not is_valid:
            raise ValueError(f"Invalid transition: {error}")
        
        # Execute transition
        previous_state = run.status.value
        run.status = RunStatus.RUNNING
        run.started_at = datetime.utcnow()
        
        # Record event
        record_event(
            db_session=self.db,
            run_id=run.id,
            event_type=WorkflowEventType.RUN_STARTED,
            actor="orchestrator",
            decision_id=run.decision_id,
            previous_state=previous_state,
            new_state=RunStatus.RUNNING.value,
            reason="Starting workflow execution"
        )
        
        # Update decision status
        decision = run.decision
        if decision.status == DecisionStatus.DRAFT:
            decision.status = DecisionStatus.PLANNING
        
        # Create initial planning task
        self._create_planning_task(run)
        
        self.db.commit()
        self.db.refresh(run)
        
        return run
    
    def _create_planning_task(self, run: models.Run) -> models.Task:
        """Create the initial planning/decision framing task."""
        task = models.Task(
            run_id=run.id,
            task_type="decision_framing",
            capability="planning",
            input_data={
                "decision_id": run.decision_id,
                "question": run.decision.question,
                "context": run.decision.context,
            },
            order=0,
            status=TaskStatus.PENDING,
        )
        
        self.db.add(task)
        self.db.flush()  # Get task ID
        
        # Record event
        record_event(
            db_session=self.db,
            run_id=run.id,
            event_type=WorkflowEventType.TASK_CREATED,
            actor="orchestrator",
            decision_id=run.decision_id,
            task_id=task.id,
            new_state=TaskStatus.PENDING.value,
            reason="Created initial planning task",
            metadata={"task_type": "decision_framing"}
        )
        
        return task
    
    def complete_task(
        self,
        task_id: int,
        output_data: Optional[Dict[str, Any]] = None,
        success: bool = True
    ) -> models.Task:
        """
        Mark a task as completed or failed.
        
        This triggers the next step in the workflow.
        """
        task = self.db.query(models.Task).filter(models.Task.id == task_id).first()
        if not task:
            raise ValueError(f"Task {task_id} not found")
        
        if task.status != TaskStatus.RUNNING:
            raise ValueError(f"Task is not in RUNNING state (current: {task.status})")
        
        run = task.run
        
        if success:
            # Mark as completed
            task.status = TaskStatus.COMPLETED
            task.output_data = output_data or {}
            task.completed_at = datetime.utcnow()
            
            # Record event
            record_event(
                db_session=self.db,
                run_id=run.id,
                event_type=WorkflowEventType.TASK_COMPLETED,
                actor="orchestrator",
                decision_id=run.decision_id,
                task_id=task.id,
                previous_state=TaskStatus.RUNNING.value,
                new_state=TaskStatus.COMPLETED.value,
                reason="Task completed successfully"
            )
            
            # Advance workflow
            self._advance_workflow(run)
        else:
            # Handle failure
            self._handle_task_failure(task, output_data)
        
        self.db.commit()
        self.db.refresh(task)
        
        return task
    
    def _handle_task_failure(self, task: models.Task, error_info: Optional[Dict] = None):
        """Handle task failure with retry logic."""
        run = task.run
        
        if task.attempt_count < task.max_attempts:
            # Retry
            task.attempt_count += 1
            task.status = TaskStatus.PENDING
            task.error_message = str(error_info) if error_info else None
            
            record_event(
                db_session=self.db,
                run_id=run.id,
                event_type=WorkflowEventType.TASK_RETRYING,
                actor="orchestrator",
                decision_id=run.decision_id,
                task_id=task.id,
                previous_state=TaskStatus.RUNNING.value,
                new_state=TaskStatus.PENDING.value,
                reason=f"Retrying task (attempt {task.attempt_count}/{task.max_attempts})",
                metadata={"attempt": task.attempt_count}
            )
        else:
            # Max attempts reached - fail the task
            task.status = TaskStatus.FAILED
            task.error_message = str(error_info) if error_info else "Max attempts reached"
            task.completed_at = datetime.utcnow()
            
            record_event(
                db_session=self.db,
                run_id=run.id,
                event_type=WorkflowEventType.TASK_FAILED,
                actor="orchestrator",
                decision_id=run.decision_id,
                task_id=task.id,
                previous_state=TaskStatus.RUNNING.value,
                new_state=TaskStatus.FAILED.value,
                reason="Task failed after max attempts",
                metadata={"error": str(error_info)}
            )
            
            # Fail the run
            self._fail_run(run, f"Task {task.id} failed: {task.error_message}")
    
    def _advance_workflow(self, run: models.Run):
        """
        Advance the workflow based on completed tasks.
        
        This is a simplified implementation - in production this would
        have more sophisticated logic based on task types and dependencies.
        """
        # Get all tasks for this run
        tasks = run.tasks
        
        if not tasks:
            return
        
        # Count completed tasks
        completed = [t for t in tasks if t.status == TaskStatus.COMPLETED]
        failed = [t for t in tasks if t.status == TaskStatus.FAILED]
        pending = [t for t in tasks if t.status in [TaskStatus.PENDING, TaskStatus.RUNNING]]
        
        # Simple workflow progression
        if failed:
            # If any task failed, fail the run
            self._fail_run(run, f"One or more tasks failed")
            return
        
        if not pending:
            # All tasks completed - complete the run
            self._complete_run(run)
            return
        
        # More tasks to execute - start the next pending task
        next_task = sorted(
            [t for t in pending],
            key=lambda t: (t.order or 0, t.created_at)
        )[0]
        
        self._start_task(next_task)
    
    def _start_task(self, task: models.Task):
        """Start executing a task."""
        task.status = TaskStatus.RUNNING
        task.started_at = datetime.utcnow()
        
        record_event(
            db_session=self.db,
            run_id=task.run_id,
            event_type=WorkflowEventType.TASK_STARTED,
            actor="orchestrator",
            decision_id=task.run.decision_id,
            task_id=task.id,
            previous_state=TaskStatus.PENDING.value,
            new_state=TaskStatus.RUNNING.value,
            reason="Starting task execution"
        )
    
    def _complete_run(self, run: models.Run):
        """Mark a Run as completed."""
        previous_state = run.status.value
        
        run.status = RunStatus.COMPLETED
        run.completed_at = datetime.utcnow()
        
        record_event(
            db_session=self.db,
            run_id=run.id,
            event_type=WorkflowEventType.RUN_COMPLETED,
            actor="orchestrator",
            decision_id=run.decision_id,
            previous_state=previous_state,
            new_state=RunStatus.COMPLETED.value,
            reason="All tasks completed successfully"
        )
        
        # Update decision status
        run.decision.status = DecisionStatus.COMPLETED
        run.decision.completed_at = datetime.utcnow()
    
    def _fail_run(self, run: models.Run, error_message: str):
        """Mark a Run as failed."""
        previous_state = run.status.value
        
        run.status = RunStatus.FAILED
        run.error_message = error_message
        run.completed_at = datetime.utcnow()
        
        record_event(
            db_session=self.db,
            run_id=run.id,
            event_type=WorkflowEventType.RUN_FAILED,
            actor="orchestrator",
            decision_id=run.decision_id,
            previous_state=previous_state,
            new_state=RunStatus.FAILED.value,
            reason=error_message
        )
        
        # Update decision status
        run.decision.status = DecisionStatus.FAILED
    
    def get_run_progress(self, run_id: int) -> Dict[str, Any]:
        """
        Get current progress of a Run.
        
        Returns structured progress information for the UI.
        """
        run = self.db.query(models.Run).filter(models.Run.id == run_id).first()
        if not run:
            raise ValueError(f"Run {run_id} not found")
        
        tasks = run.tasks
        total = len(tasks)
        completed = len([t for t in tasks if t.status == TaskStatus.COMPLETED])
        failed = len([t for t in tasks if t.status == TaskStatus.FAILED])
        running = len([t for t in tasks if t.status == TaskStatus.RUNNING])
        pending = len([t for t in tasks if t.status == TaskStatus.PENDING])
        
        progress_percentage = int((completed / total * 100)) if total > 0 else 0
        
        return {
            "run_id": run.id,
            "state": run.status.value,
            "decision_status": run.decision.status.value,
            "total_tasks": total,
            "completed_tasks": completed,
            "failed_tasks": failed,
            "running_tasks": running,
            "pending_tasks": pending,
            "progress": progress_percentage,
            "started_at": run.started_at.isoformat() if run.started_at else None,
            "completed_at": run.completed_at.isoformat() if run.completed_at else None,
        }
