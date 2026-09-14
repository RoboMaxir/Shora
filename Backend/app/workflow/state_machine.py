"""
SIMORGH Platform — Workflow State Machine

Defines valid state transitions for Decision and Run workflows.
All transitions are explicit and validated by the backend.
"""
from enum import Enum
from typing import Set, Dict, Optional
from dataclasses import dataclass


class DecisionStatus(str, Enum):
    """Workflow states for a Decision."""
    DRAFT = "DRAFT"
    FRAMING = "FRAMING"
    AWAITING_INPUT = "AWAITING_INPUT"
    PLANNING = "PLANNING"
    EVIDENCE = "EVIDENCE"
    ANALYZING = "ANALYZING"
    REVIEWING = "REVIEWING"
    REVISING = "REVISING"
    SYNTHESIZING = "SYNTHESIZING"
    VALIDATING = "VALIDATING"
    COMPLETED = "COMPLETED"
    COMPLETED_WITH_GAPS = "COMPLETED_WITH_GAPS"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class RunStatus(str, Enum):
    """Status of a Run execution."""
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class TaskStatus(str, Enum):
    """Status of a Task within a Run."""
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"


@dataclass(frozen=True)
class TransitionRule:
    """Defines a valid state transition with optional conditions."""
    from_state: str
    to_state: str
    description: str = ""


# ═══ Decision State Transitions ═══

DECISION_TRANSITIONS: Set[tuple] = {
    # Initial state
    (None, "DRAFT"),
    
    # Draft → Active workflow
    ("DRAFT", "FRAMING"),
    ("DRAFT", "CANCELLED"),
    
    # Framing
    ("FRAMING", "AWAITING_INPUT"),
    ("FRAMING", "PLANNING"),
    ("FRAMING", "FAILED"),
    
    # Awaiting input
    ("AWAITING_INPUT", "FRAMING"),
    ("AWAITING_INPUT", "PLANNING"),
    ("AWAITING_INPUT", "CANCELLED"),
    
    # Planning
    ("PLANNING", "EVIDENCE"),
    ("PLANNING", "FAILED"),
    
    # Evidence
    ("EVIDENCE", "ANALYZING"),
    ("EVIDENCE", "FAILED"),
    
    # Analyzing
    ("ANALYZING", "REVIEWING"),
    ("ANALYZING", "REVISING"),
    ("ANALYZING", "FAILED"),
    
    # Reviewing
    ("REVIEWING", "ANALYZING"),  # More analysis needed
    ("REVIEWING", "REVISING"),
    ("REVIEWING", "SYNTHESIZING"),
    ("REVIEWING", "FAILED"),
    
    # Revising
    ("REVISING", "ANALYZING"),
    ("REVISING", "REVIEWING"),
    ("REVISING", "FAILED"),
    
    # Synthesizing
    ("SYNTHESIZING", "VALIDATING"),
    ("SYNTHESIZING", "REVISING"),
    ("SYNTHESIZING", "FAILED"),
    
    # Validating
    ("VALIDATING", "COMPLETED"),
    ("VALIDATING", "COMPLETED_WITH_GAPS"),
    ("VALIDATING", "REVISING"),
    ("VALIDATING", "FAILED"),
    
    # Terminal states (no outgoing transitions except documented)
    ("COMPLETED", "CANCELLED"),  # Can be cancelled after completion in rare cases
    ("COMPLETED_WITH_GAPS", "REVISING"),
    ("COMPLETED_WITH_GAPS", "CANCELLED"),
}


# ═══ Run State Transitions ═══

RUN_TRANSITIONS: Set[tuple] = {
    # Initial state
    (None, "PENDING"),
    
    # Pending → Running
    ("PENDING", "RUNNING"),
    ("PENDING", "CANCELLED"),
    
    # Running → Terminal
    ("RUNNING", "COMPLETED"),
    ("RUNNING", "FAILED"),
    ("RUNNING", "CANCELLED"),
    
    # No transitions from terminal states
}


# ═══ Task State Transitions ═══

TASK_TRANSITIONS: Set[tuple] = {
    # Initial state
    (None, "PENDING"),
    
    # Pending → Running
    ("PENDING", "RUNNING"),
    ("PENDING", "SKIPPED"),
    
    # Running → Terminal
    ("RUNNING", "COMPLETED"),
    ("RUNNING", "FAILED"),
    
    # Retry logic: Failed → Pending (with attempt_count increment)
    ("FAILED", "PENDING"),
}


class WorkflowStateMachine:
    """
    Validates and executes state transitions for Decision, Run, and Task.
    
    All transitions are explicit and validated against predefined rules.
    Invalid transitions are rejected.
    """
    
    def __init__(self):
        self.decision_transitions = DECISION_TRANSITIONS
        self.run_transitions = RUN_TRANSITIONS
        self.task_transitions = TASK_TRANSITIONS
    
    def validate_decision_transition(
        self, 
        from_state: Optional[str], 
        to_state: str
    ) -> tuple[bool, str]:
        """
        Validate a Decision state transition.
        
        Returns:
            (is_valid, error_message)
        """
        if to_state not in [s.value for s in DecisionStatus]:
            return False, f"Invalid target state: {to_state}"
        
        from_key = from_state if from_state else None
        
        if (from_key, to_state) in self.decision_transitions:
            return True, ""
        
        return False, f"Transition from {from_state} to {to_state} is not allowed"
    
    def validate_run_transition(
        self, 
        from_state: Optional[str], 
        to_state: str
    ) -> tuple[bool, str]:
        """
        Validate a Run state transition.
        
        Returns:
            (is_valid, error_message)
        """
        if to_state not in [s.value for s in RunStatus]:
            return False, f"Invalid target state: {to_state}"
        
        from_key = from_state if from_state else None
        
        if (from_key, to_state) in self.run_transitions:
            return True, ""
        
        return False, f"Transition from {from_state} to {to_state} is not allowed"
    
    def validate_task_transition(
        self, 
        from_state: Optional[str], 
        to_state: str,
        is_retry: bool = False
    ) -> tuple[bool, str]:
        """
        Validate a Task state transition.
        
        Special handling for retry: FAILED → PENDING is only allowed
        when is_retry=True (indicating attempt_count will be incremented).
        
        Returns:
            (is_valid, error_message)
        """
        if to_state not in [s.value for s in TaskStatus]:
            return False, f"Invalid target state: {to_state}"
        
        # Special case: retry from FAILED
        if from_state == "FAILED" and to_state == "PENDING":
            if is_retry:
                return True, ""
            else:
                return False, "Retry transition requires is_retry flag"
        
        from_key = from_state if from_state else None
        
        if (from_key, to_state) in self.task_transitions:
            return True, ""
        
        return False, f"Transition from {from_state} to {to_state} is not allowed"
    
    def get_allowed_decision_transitions(self, current_state: Optional[str]) -> list[str]:
        """Get list of allowed next states for a Decision."""
        from_key = current_state if current_state else None
        allowed = []
        
        for (from_s, to_s) in self.decision_transitions:
            if from_s == from_key:
                allowed.append(to_s)
        
        return allowed
    
    def get_allowed_run_transitions(self, current_state: Optional[str]) -> list[str]:
        """Get list of allowed next states for a Run."""
        from_key = current_state if current_state else None
        allowed = []
        
        for (from_s, to_s) in self.run_transitions:
            if from_s == from_key:
                allowed.append(to_s)
        
        return allowed
    
    def get_allowed_task_transitions(self, current_state: Optional[str]) -> list[str]:
        """Get list of allowed next states for a Task."""
        from_key = current_state if current_state else None
        allowed = []
        
        for (from_s, to_s) in self.task_transitions:
            if from_s == from_key:
                allowed.append(to_s)
        
        return allowed


# Singleton instance
state_machine = WorkflowStateMachine()
