"""
SIMORGH Platform — Workflow Module

Provides:
- State machine for workflow transitions
- History/audit trail recording
- Orchestrator for advancing runs
- Task execution framework
"""

from app.workflow.state_machine import (
    DecisionStatus,
    RunStatus,
    TaskStatus,
    WorkflowStateMachine,
    state_machine
)

from app.workflow.history import (
    WorkflowEventType,
    WorkflowEvent,
    record_event,
    get_run_history,
    get_task_history
)

__all__ = [
    "DecisionStatus",
    "RunStatus",
    "TaskStatus",
    "WorkflowStateMachine",
    "state_machine",
    "WorkflowEventType",
    "WorkflowEvent",
    "record_event",
    "get_run_history",
    "get_task_history"
]
