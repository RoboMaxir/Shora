"""
Council Agent Execution Engine

This module implements the core council execution logic:
- Agent definitions (Strategy, Finance, Market)
- Structured agent output schemas
- Agent execution with LLM integration
- Evidence/context handling
- Cross-review mechanism
- Synthesis

The execution engine works with the existing Task/TaskAttempt system.
"""
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
import json
import logging

from app.models import models
from app.platform import platform
from app.workflow.history import record_event, WorkflowEventType

logger = logging.getLogger(__name__)


# ═══ Agent Definition ═══

class AgentDefinition:
    """
    Defines a council agent's characteristics and behavior.
    
    Each agent has:
    - name: Unique identifier
    - role: Human-readable role name
    - system_instructions: Prompt template for the agent
    - required_inputs: What context/data the agent needs
    - output_schema: Expected structured output format
    """
    
    def __init__(
        self,
        name: str,
        role: str,
        system_instructions: str,
        required_inputs: List[str],
        output_schema: Dict[str, Any],
    ):
        self.name = name
        self.role = role
        self.system_instructions = system_instructions
        self.required_inputs = required_inputs
        self.output_schema = output_schema


# ═══ Agent Definitions for Council ═══

STRATEGY_AGENT = AgentDefinition(
    name="strategy",
    role="Strategic Analysis",
    system_instructions="""You are a strategic advisor analyzing a business decision.

Your role is to evaluate the decision from a strategic perspective:
- Market positioning and competitive dynamics
- Long-term strategic fit
- Growth opportunities and risks
- Alternative scenarios and paths

Provide structured analysis with clear claims, assumptions, and recommendations.""",
    required_inputs=["decision_question", "decision_context", "objectives"],
    output_schema={
        "summary": "string - Executive summary of strategic analysis",
        "claims": "list[string] - Key strategic claims",
        "assumptions": "list[string] - Critical assumptions made",
        "risks": "list[string] - Strategic risks identified",
        "opportunities": "list[string] - Strategic opportunities",
        "recommendations": "list[string] - Strategic recommendations",
        "confidence": "float 0-1 - Confidence level in analysis",
    }
)

FINANCE_AGENT = AgentDefinition(
    name="finance",
    role="Financial Analysis",
    system_instructions="""You are a financial advisor analyzing a business decision.

Your role is to evaluate the decision from a financial perspective:
- Financial viability and ROI
- Cost implications and budget impact
- Cash flow considerations
- Valuation and pricing (if applicable)
- Financial risks and sensitivities

Provide structured analysis with quantitative reasoning where possible.""",
    required_inputs=["decision_question", "decision_context", "constraints"],
    output_schema={
        "summary": "string - Executive summary of financial analysis",
        "claims": "list[string] - Key financial claims",
        "assumptions": "list[string] - Financial assumptions made",
        "risks": "list[string] - Financial risks identified",
        "opportunities": "list[string] - Financial opportunities",
        "recommendations": "list[string] - Financial recommendations",
        "confidence": "float 0-1 - Confidence level in analysis",
    }
)

MARKET_AGENT = AgentDefinition(
    name="market",
    role="Market Analysis",
    system_instructions="""You are a market analyst evaluating a business decision.

Your role is to assess the decision from a market perspective:
- Market size and dynamics
- Customer needs and behavior
- Competitive landscape
- Market timing and trends
- Go-to-market considerations

Provide structured analysis grounded in market realities.""",
    required_inputs=["decision_question", "decision_context", "criteria"],
    output_schema={
        "summary": "string - Executive summary of market analysis",
        "claims": "list[string] - Key market claims",
        "assumptions": "list[string] - Market assumptions made",
        "risks": "list[string] - Market risks identified",
        "opportunities": "list[string] - Market opportunities",
        "recommendations": "list[string] - Market recommendations",
        "confidence": "float 0-1 - Confidence level in analysis",
    }
)

# Registry of available agents
AGENT_REGISTRY = {
    "strategy": STRATEGY_AGENT,
    "finance": FINANCE_AGENT,
    "market": MARKET_AGENT,
}


# ═══ Agent Execution ═══

async def execute_agent(
    db: Session,
    task: models.Task,
    agent: AgentDefinition,
    decision: models.Decision,
    evidence: List[models.Evidence],
    model: str = "gpt-4o-mini",
) -> Tuple[bool, Dict[str, Any], int]:
    """
    Execute an agent analysis task.
    
    Args:
        db: Database session
        task: The Task being executed
        agent: Agent definition
        decision: The Decision being analyzed
        evidence: Retrieved evidence/context
        model: LLM model to use
    
    Returns:
        (success, output_dict, tokens_used)
    """
    # Build input context
    context_parts = []
    
    # Add decision context
    if decision.question:
        context_parts.append(f"Decision Question: {decision.question}")
    if decision.context:
        context_parts.append(f"Context: {decision.context}")
    if decision.objectives:
        obj_str = json.dumps(decision.objectives, ensure_ascii=False)
        context_parts.append(f"Objectives: {obj_str}")
    if decision.constraints:
        const_str = json.dumps(decision.constraints, ensure_ascii=False)
        context_parts.append(f"Constraints: {const_str}")
    if decision.criteria:
        crit_str = json.dumps(decision.criteria, ensure_ascii=False)
        context_parts.append(f"Criteria: {crit_str}")
    
    # Add evidence
    if evidence:
        evidence_texts = [e.content for e in evidence[:5]]  # Limit evidence
        context_parts.append("\nRelevant Evidence:")
        for i, ev in enumerate(evidence_texts, 1):
            context_parts.append(f"{i}. {ev}")
    
    user_message = "\n\n".join(context_parts)
    
    # Build messages for LLM
    messages = [
        {"role": "system", "content": agent.system_instructions},
        {"role": "user", "content": f"""Please analyze the following decision from your perspective as {agent.role}.

{user_message}

Respond with a JSON object matching this schema:
{json.dumps(agent.output_schema, indent=2)}

Ensure your response is valid JSON only, no markdown or extra text."""}
    ]
    
    try:
        # Call AI through platform
        result = await platform.ai.chat(
            messages=messages,
            model=model,
            temperature=0.7,
            max_tokens=1000,
            response_format="json",
        )
        
        # Parse response
        content = result.get("content", "")
        tokens_used = result.get("tokens_used", 0)
        
        # Try to parse JSON
        try:
            output_data = json.loads(content)
        except json.JSONDecodeError:
            # Fallback: wrap raw content
            output_data = {
                "summary": content[:500],
                "claims": [],
                "assumptions": [],
                "risks": [],
                "opportunities": [],
                "recommendations": [],
                "confidence": 0.5,
                "raw_response": content,
            }
        
        return True, output_data, tokens_used
        
    except Exception as e:
        logger.error(f"Agent execution failed: {e}")
        return False, {"error": str(e)}, 0


# ═══ Evidence/Context Retrieval ═══

async def gather_context(
    db: Session,
    decision: models.Decision,
    tenant_id: int,
) -> List[models.Evidence]:
    """
    Gather context for decision analysis.
    
    Priority:
    1. User-provided context (always available)
    2. Platform Knowledge retrieval (if available)
    
    Does NOT block if Knowledge is unavailable.
    """
    evidence = []
    
    # Try Platform Knowledge retrieval
    try:
        knowledge_results = await platform.knowledge.search(
            query=decision.question,
            tenant_id=tenant_id,
            limit=5,
        )
        
        for result in knowledge_results:
            ev = models.Evidence(
                tenant_id=tenant_id,
                content=result.get("content", ""),
                source_type="knowledge",
                source_id=result.get("id"),
                domain=result.get("domain"),
                provider="platform_knowledge",
                retrieval_query=decision.question,
            )
            db.add(ev)
            evidence.append(ev)
            
    except Exception as e:
        # Knowledge unavailable - continue with user context only
        logger.info(f"Knowledge retrieval skipped: {e}")
    
    db.commit()
    return evidence


# ═══ Cross-Review ═══

def detect_conflicts(
    db: Session,
    decision: models.Decision,
    agent_outputs: Dict[str, Dict[str, Any]],
) -> List[models.Conflict]:
    """
    Detect conflicts between agent analyses.
    
    Looks for:
    - Conflicting claims
    - Incompatible assumptions
    - Material disagreements on key points
    
    Returns list of Conflict records.
    """
    conflicts = []
    
    agent_names = list(agent_outputs.keys())
    
    # Compare each pair of agents
    for i, name_a in enumerate(agent_names):
        for name_b in agent_names[i+1:]:
            output_a = agent_outputs[name_a]
            output_b = agent_outputs[name_b]
            
            if not output_a or not output_b:
                continue
            
            claims_a = set(output_a.get("claims", []))
            claims_b = set(output_b.get("claims", []))
            assumptions_a = set(output_a.get("assumptions", []))
            assumptions_b = set(output_b.get("assumptions", []))
            
            # Check for assumption conflicts
            conflicting_assumptions = []
            for asum in assumptions_a:
                for bsum in assumptions_b:
                    if _are_conflicting(asum, bsum):
                        conflicting_assumptions.append((asum, bsum))
            
            if conflicting_assumptions:
                conflict = models.Conflict(
                    decision_id=decision.id,
                    conflict_type="assumption_conflict",
                    description=f"Conflicting assumptions between {name_a} and {name_b}",
                    resolution_status="pending",
                )
                db.add(conflict)
                conflicts.append(conflict)
    
    db.commit()
    return conflicts


def _are_conflicting(stmt_a: str, stmt_b: str) -> bool:
    """
    Simple heuristic to detect potentially conflicting statements.
    
    In production, this would use NLP/LLM-based contradiction detection.
    For MVP, we use keyword-based heuristics.
    """
    # Negation patterns
    negations = ["not ", "no ", "never ", "cannot ", "won't ", "don't "]
    
    # Check if one statement negates the other
    a_lower = stmt_a.lower()
    b_lower = stmt_b.lower()
    
    # Direct containment with negation
    for neg in negations:
        if neg + a_lower in b_lower or neg + b_lower in a_lower:
            return True
    
    # Opposite quantifiers
    opposites = [
        ("increase", "decrease"),
        ("grow", "shrink"),
        ("high", "low"),
        ("risky", "safe"),
        ("profitable", "unprofitable"),
    ]
    
    for opp_a, opp_b in opposites:
        if opp_a in a_lower and opp_b in b_lower:
            return True
        if opp_b in a_lower and opp_a in b_lower:
            return True
    
    return False


# ═══ Synthesis ═══

async def synthesize_analysis(
    db: Session,
    decision: models.Decision,
    agent_outputs: Dict[str, Dict[str, Any]],
    conflicts: List[models.Conflict],
    evidence: List[models.Evidence],
    model: str = "gpt-4o-mini",
) -> Dict[str, Any]:
    """
    Synthesize all analyses into a coherent decision support document.
    
    Inputs:
    - Original decision
    - All agent outputs
    - Detected conflicts
    - Evidence collected
    
    Output is structured decision support, NOT a final decision.
    Human authority is explicitly preserved.
    """
    # Build synthesis prompt
    analyses_summary = []
    for agent_name, output in agent_outputs.items():
        if output:
            analyses_summary.append(f"\n=== {agent_name.upper()} ===")
            analyses_summary.append(f"Summary: {output.get('summary', 'N/A')}")
            if output.get("recommendations"):
                analyses_summary.append(f"Recommendations: {', '.join(output['recommendations'][:3])}")
    
    conflicts_summary = []
    for conflict in conflicts:
        conflicts_summary.append(f"- {conflict.description}")
    
    user_message = f"""Decision Question: {decision.question}

Context: {decision.context or 'No additional context provided'}

=== AGENT ANALYSES ===
{''.join(analyses_summary)}

=== CONFLICTS IDENTIFIED ===
{chr(10).join(conflicts_summary) if conflicts_summary else 'None detected'}

=== EVIDENCE GAPS ===
{"Limited evidence available" if len(evidence) < 3 else "Sufficient evidence gathered"}

Synthesize this into a structured decision support document. Do NOT make the final decision - that is for the human decision-maker.

Respond with JSON matching this schema:
{{
    "executive_summary": "string",
    "decision_question": "string",
    "options": ["list of options considered"],
    "key_findings": ["list of key findings"],
    "conflicts": ["list of unresolved conflicts"],
    "risks": ["list of material risks"],
    "unknowns": ["list of unknown factors"],
    "recommended_next_steps": ["list of recommended actions"],
    "confidence": "float 0-1"
}}
"""
    
    messages = [
        {"role": "system", "content": """You are a decision synthesis assistant. Your role is to synthesize multiple analyses into a coherent decision support document.

CRITICAL: You do NOT make the final decision. You provide structured support for human decision-making.

Always preserve human authority over the final decision."""},
        {"role": "user", "content": user_message}
    ]
    
    try:
        result = await platform.ai.chat(
            messages=messages,
            model=model,
            temperature=0.5,
            max_tokens=1500,
            response_format="json",
        )
        
        content = result.get("content", "")
        
        try:
            synthesis = json.loads(content)
        except json.JSONDecodeError:
            synthesis = {
                "executive_summary": content[:500],
                "decision_question": decision.question,
                "options": [],
                "key_findings": [],
                "conflicts": [c.description for c in conflicts],
                "risks": [],
                "unknowns": [],
                "recommended_next_steps": [],
                "confidence": 0.5,
            }
        
        return synthesis
        
    except Exception as e:
        logger.error(f"Synthesis failed: {e}")
        return {
            "executive_summary": f"Analysis completed but synthesis encountered an error: {str(e)}",
            "decision_question": decision.question,
            "options": [],
            "key_findings": [],
            "conflicts": [c.description for c in conflicts],
            "risks": [],
            "unknowns": [],
            "recommended_next_steps": ["Review individual agent analyses"],
            "confidence": 0.3,
        }


# ═══ Decision Dossier ═══

def create_dossier(
    db: Session,
    decision: models.Decision,
    run: models.Run,
    agent_outputs: Dict[str, Dict[str, Any]],
    synthesis: Dict[str, Any],
    conflicts: List[models.Conflict],
    evidence: List[models.Evidence],
) -> Dict[str, Any]:
    """
    Create a persistent dossier for the completed run.
    
    The dossier is a comprehensive record containing:
    - Decision and revision info
    - Run metadata
    - Participating agents
    - Evidence collected
    - Conflicts detected
    - Synthesis output
    - Timestamps and provenance
    
    Returns the dossier as a dictionary (can be stored or returned via API).
    """
    dossier = {
        "decision_id": decision.id,
        "decision_title": decision.title,
        "decision_question": decision.question,
        "run_id": run.id,
        "run_number": run.run_number,
        "completed_at": datetime.utcnow().isoformat(),
        "agents_participated": list(agent_outputs.keys()),
        "agent_analyses": agent_outputs,
        "synthesis": synthesis,
        "conflicts_count": len(conflicts),
        "conflicts": [{"id": c.id, "description": c.description, "type": c.conflict_type} for c in conflicts],
        "evidence_count": len(evidence),
        "evidence_summary": [{"id": e.id, "source_type": e.source_type, "preview": e.content[:100]} for e in evidence],
        "human_decision_status": decision.human_decision_status.value if decision.human_decision_status else None,
    }
    
    return dossier
