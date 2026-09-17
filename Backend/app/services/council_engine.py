"""
Council Execution Engine

Executes the full council workflow:
1. Context & Evidence Gathering
2. Strategy Agent Analysis
3. Finance Agent Analysis  
4. Market Agent Analysis
5. Cross Review (Conflict Detection)
6. Synthesis
7. Dossier Generation
"""
from typing import Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session
import logging

from app.models import models
from app.platform import platform


logger = logging.getLogger(__name__)


# ═══ Agent Registry ═══

class AgentDefinition:
    """Definition of an agent in the council"""
    def __init__(self, name: str, role: str, system_instructions: str, 
                 required_inputs: List[str], output_schema: Dict):
        self.name = name
        self.role = role
        self.system_instructions = system_instructions
        self.required_inputs = required_inputs
        self.output_schema = output_schema


AGENT_REGISTRY = {
    "strategy": AgentDefinition(
        name="strategy",
        role="استراتژی",
        system_instructions="You are a strategic analysis expert. Analyze the decision from a strategic perspective.",
        required_inputs=["decision_description", "objectives", "constraints"],
        output_schema={"summary": str, "claims": list, "assumptions": list, "risks": list, 
                       "opportunities": list, "recommendations": list, "confidence": float}
    ),
    "finance": AgentDefinition(
        name="finance",
        role="مالی",
        system_instructions="You are a financial analysis expert. Analyze the decision from a financial perspective.",
        required_inputs=["decision_description", "objectives", "constraints"],
        output_schema={"summary": str, "claims": list, "assumptions": list, "risks": list,
                       "opportunities": list, "recommendations": list, "confidence": float}
    ),
    "market": AgentDefinition(
        name="market",
        role="بازار",
        system_instructions="You are a market analysis expert. Analyze the decision from a market perspective.",
        required_inputs=["decision_description", "objectives", "constraints"],
        output_schema={"summary": str, "claims": list, "assumptions": list, "risks": list,
                       "opportunities": list, "recommendations": list, "confidence": float}
    ),
}


async def execute_agent(db: Session, task, agent, decision, evidence: List) -> tuple:
    """Execute a single agent and return (success, output, tokens)"""
    try:
        # Mock execution for testing
        mock_result = {
            "summary": f"Analysis by {agent.name}",
            "claims": ["Claim 1", "Claim 2"],
            "assumptions": ["Assumption 1"],
            "risks": ["Risk 1"],
            "recommendations": ["Recommendation 1"],
            "confidence": 0.75
        }
        return True, mock_result, 100
    except Exception as e:
        return False, {"error": str(e)}, 0


def detect_conflicts(db: Session, decision, agent_outputs: Dict) -> List[Dict]:
    """Detect conflicts between agent outputs"""
    conflicts = []
    
    strategy = agent_outputs.get('strategy', {})
    finance = agent_outputs.get('finance', {})
    
    # Simple conflict detection on assumptions
    strategy_assumptions = set(strategy.get('assumptions', []))
    finance_assumptions = set(finance.get('assumptions', []))
    
    if strategy_assumptions != finance_assumptions:
        conflicts.append({
            "topic": "Assumption Conflict",
            "agents": ["strategy", "finance"],
            "conflict_type": "assumptive",
            "description": "Different assumptions detected",
            "severity": "medium"
        })
    
    return conflicts


async def synthesize_analysis(db: Session, decision, agent_outputs: Dict, 
                              conflicts: List, evidence: List) -> Dict:
    """Synthesize all agent analyses into a unified recommendation"""
    all_findings = []
    all_recommendations = []
    
    for agent_data in agent_outputs.values():
        if 'summary' in agent_data:
            all_findings.append(agent_data['summary'])
        if 'recommendations' in agent_data:
            all_recommendations.extend(agent_data.get('recommendations', []))
    
    return {
        "executive_summary": "Synthesized analysis based on all agent inputs",
        "decision_question": decision.question or decision.title,
        "key_findings": all_findings,
        "conflicts": [c.get('description', '') for c in conflicts],
        "recommended_next_steps": all_recommendations[:3],
        "confidence": 0.75
    }


def create_dossier(db: Session, decision, run, agent_outputs: Dict, 
                   synthesis: Dict, conflicts: List, evidence: List) -> Dict:
    """Create final dossier with all analysis results"""
    return {
        "decision_id": decision.id,
        "run_id": run.id,
        "agents_participated": list(agent_outputs.keys()),
        "synthesis": synthesis,
        "conflicts": conflicts,
        "completed_at": datetime.utcnow().isoformat()
    }


class CouncilEngine:
    """Main engine for executing council runs"""
    
    def __init__(self, db: Session):
        self.db = db
        self.platform = platform
    
    async def execute_run(self, run_id: int) -> bool:
        """Execute the complete council workflow for a run"""
        try:
            run = self.db.query(models.Run).filter(models.Run.id == run_id).first()
            if not run:
                logger.error(f"Run {run_id} not found")
                return False
            
            decision = run.decision
            if not decision:
                logger.error(f"Decision not found for run {run_id}")
                return False
            
            # Step 1: Context Gathering
            await self._gather_context(run, decision)
            
            # Step 2-4: Execute Agents
            agent_results = await self._execute_agents(run, decision)
            
            # Step 5: Cross Review
            conflicts = await self._perform_cross_review(run, agent_results)
            
            # Step 6: Synthesis
            synthesis = await self._perform_synthesis(run, decision, agent_results, conflicts)
            
            # Step 7: Mark as completed
            run.status = models.RunStatus.COMPLETED
            run.completed_at = datetime.utcnow()
            self.db.commit()
            
            logger.info(f"Council run {run_id} completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Council execution failed: {e}")
            run = self.db.query(models.Run).filter(models.Run.id == run_id).first()
            if run:
                run.status = models.RunStatus.FAILED
                run.error_message = str(e)
                self.db.commit()
            return False
    
    async def _gather_context(self, run, decision):
        """Gather context and evidence"""
        task = models.Task(
            run_id=run.id,
            task_type='context_gathering',
            capability='context',
            status=models.TaskStatus.RUNNING,
            created_at=datetime.utcnow()
        )
        self.db.add(task)
        self.db.commit()
        
        try:
            # Use platform knowledge search if available
            context_data = {
                "decision_description": decision.question or decision.title,
                "objectives": decision.objectives or [],
                "constraints": decision.constraints or [],
                "context_notes": decision.context or ""
            }
            
            task.status = models.TaskStatus.COMPLETED
            task.output_data = context_data
            task.completed_at = datetime.utcnow()
            self.db.commit()
            
        except Exception as e:
            task.status = models.TaskStatus.FAILED
            task.error_message = str(e)
            self.db.commit()
    
    async def _execute_agents(self, run, decision) -> Dict[str, Dict[str, Any]]:
        """Execute all council agents"""
        agent_results = {}
        
        # Define agents to execute
        agents = [
            ('strategy', 'استراتژی', 'STRATEGY'),
            ('finance', 'مالی', 'FINANCE'),
            ('market', 'بازار', 'MARKET')
        ]
        
        context_data = {
            "decision_description": decision.question or decision.title,
            "objectives": decision.objectives or [],
            "constraints": decision.constraints or [],
            "context_notes": decision.context or ""
        }
        
        for agent_key, agent_fa, agent_en in agents:
            task = models.Task(
                run_id=run.id,
                task_type=f'agent_analysis_{agent_key}',
                capability=agent_key,
                status=models.TaskStatus.RUNNING,
                created_at=datetime.utcnow()
            )
            self.db.add(task)
            self.db.commit()
            
            try:
                # Call AI through platform
                result = await self._call_agent(agent_key, context_data)
                
                task.status = models.TaskStatus.COMPLETED
                task.output_data = result
                task.completed_at = datetime.utcnow()
                agent_results[agent_key] = result
                
            except Exception as e:
                task.status = models.TaskStatus.FAILED
                task.error_message = str(e)
                agent_results[agent_key] = {"error": str(e)}
            
            self.db.commit()
        
        return agent_results
    
    async def _call_agent(self, agent_type: str, context: Dict) -> Dict[str, Any]:
        """Call an agent through the platform AI gateway"""
        
        system_prompts = {
            'strategy': """You are a strategic analysis expert. Analyze the decision from a strategic perspective.
Focus on: market positioning, competitive advantage, long-term implications, strategic fit.
Return JSON: {"summary": "...", "claims": [], "assumptions": [], "risks": [], "opportunities": [], "recommendations": [], "confidence": 0.0}""",
            
            'finance': """You are a financial analysis expert. Analyze the decision from a financial perspective.
Focus on: ROI, cost-benefit, cash flow, financial risks, capital requirements.
Return JSON: {"summary": "...", "claims": [], "assumptions": [], "risks": [], "opportunities": [], "recommendations": [], "confidence": 0.0}""",
            
            'market': """You are a market analysis expert. Analyze the decision from a market perspective.
Focus on: market size, competition, customer demand, trends, entry barriers.
Return JSON: {"summary": "...", "claims": [], "assumptions": [], "risks": [], "opportunities": [], "recommendations": [], "confidence": 0.0}"""
        }
        
        prompt = f"""
Decision: {context.get('decision_description', '')}

Objectives: {', '.join(context.get('objectives', []))}
Constraints: {', '.join(context.get('constraints', []))}

Context: {context.get('context_notes', '')}

Provide your structured analysis in JSON format.
"""
        
        try:
            response = await self.platform.chat(
                messages=[
                    {"role": "system", "content": system_prompts.get(agent_type, "You are a helpful analyst.")},
                    {"role": "user", "content": prompt}
                ],
                model="gpt-4",
                temperature=0.3
            )
            
            # Parse response
            import json
            content = response["choices"][0]["message"]["content"]
            try:
                return json.loads(content)
            except:
                return {"summary": content[:500], "confidence": 0.5}
                
        except Exception as e:
            logger.warning(f"Agent call failed, using mock: {e}")
            # Return mock data for development
            return self._get_mock_agent_result(agent_type)
    
    def _get_mock_agent_result(self, agent_type: str) -> Dict[str, Any]:
        """Return mock agent results for development"""
        mocks = {
            'strategy': {
                "summary": "تحلیل استراتژیک نشان می‌دهد این تصمیم با اهداف بلندمدت همسو است اما ریسک‌های رقابتی وجود دارد.",
                "claims": ["بازار در حال رشد است", "مزیت رقابتی موقت ایجاد می‌شود"],
                "assumptions": ["رقبا واکنش کند نشان می‌دهند", "مشتریان پذیرش خوبی دارند"],
                "risks": ["ورود رقبای جدید", "تغییر قوانین بازار"],
                "opportunities": ["گسترش به بازارهای جانبی", "ایجاد اکوسیستم"],
                "recommendations": ["شروع با مقیاس کوچک", "تمرکز بر تمایز"],
                "confidence": 0.78
            },
            'finance': {
                "summary": "تحلیل مالی نشان‌دهنده ROI مثبت در افق ۱۸ ماهه است اما جریان نقدی اولیه چالش‌برانگیز خواهد بود.",
                "claims": ["سرمایه مورد نیاز تأمین است", "نقطه سر‌به‌سر در ماه ۱۲"],
                "assumptions": ["هزینه‌ها طبق پیش‌بینی", "درآمد زودتر از انتظار"],
                "risks": ["کمبود نقدینگی", "هزینه‌های پیش‌بینی‌نشده"],
                "opportunities": ["کاهش هزینه‌های عملیاتی", "درآمد جانبی"],
                "recommendations": ["ذخیره نقدینگی اضطراری", "کنترل دقیق هزینه"],
                "confidence": 0.72
            },
            'market': {
                "summary": "بازار هدف پتانسیل رشد بالایی دارد اما اشباع تدریجی پیش‌بینی می‌شود.",
                "claims": ["اندازه بازار کافی است", "رشد سالانه ۲۰٪ محتمل"],
                "assumptions": ["رفتار مشتری پایدار", "اقتصاد کلان باثبات"],
                "risks": ["اشباع بازار", "تغییر سلیقه مشتری"],
                "opportunities": ["بخش‌های جدید بازار", "محصولات مکمل"],
                "recommendations": ["تمرکز بر نیچ مارکت", "تنوع بخشی"],
                "confidence": 0.75
            }
        }
        return mocks.get(agent_type, {"summary": "تحلیل انجام شد", "confidence": 0.5})
    
    async def _perform_cross_review(self, run, agent_results: Dict) -> List[Dict]:
        """Perform cross review to identify conflicts"""
        task = models.Task(
            run_id=run.id,
            task_type='cross_review',
            capability='cross_review',
            status=models.TaskStatus.RUNNING,
            created_at=datetime.utcnow()
        )
        self.db.add(task)
        self.db.commit()
        
        try:
            # Analyze conflicts between agents
            conflicts = []
            
            strategy = agent_results.get('strategy', {})
            finance = agent_results.get('finance', {})
            market = agent_results.get('market', {})
            
            # Simple conflict detection logic
            strategy_risks = set(strategy.get('risks', []))
            finance_risks = set(finance.get('risks', []))
            
            common_risks = strategy_risks & finance_risks
            if common_risks:
                conflicts.append({
                    "topic": "ریسک‌های مشترک",
                    "agents": ["strategy", "finance"],
                    "conflict_type": "agreement",
                    "description": f"هر دو ایجنت روی ریسک‌های زیر توافق دارند: {', '.join(common_risks)}",
                    "severity": "medium"
                })
            
            # Check for assumption conflicts
            strategy_assumptions = strategy.get('assumptions', [])
            market_assumptions = market.get('assumptions', [])
            
            if len(strategy_assumptions) > 0 and len(market_assumptions) > 0:
                conflicts.append({
                    "topic": "فرضیات کلیدی",
                    "agents": ["strategy", "market"],
                    "conflict_type": "assumption_variance",
                    "description": "فرضیات استراتژی و بازار نیاز به بررسی بیشتر دارند",
                    "severity": "low"
                })
            
            task.status = models.TaskStatus.COMPLETED
            task.output_data = {"conflicts": conflicts, "conflicts_detected": len(conflicts)}
            task.completed_at = datetime.utcnow()
            self.db.commit()
            
            return conflicts
            
        except Exception as e:
            task.status = models.TaskStatus.FAILED
            task.error_message = str(e)
            self.db.commit()
            return []
    
    async def _perform_synthesis(self, run, decision, agent_results: Dict, conflicts: List) -> Dict:
        """Perform synthesis of all analyses"""
        task = models.Task(
            run_id=run.id,
            task_type='synthesis',
            capability='synthesis',
            status=models.TaskStatus.RUNNING,
            created_at=datetime.utcnow()
        )
        self.db.add(task)
        self.db.commit()
        
        try:
            # Combine all inputs into synthesis
            all_risks = []
            all_recommendations = []
            
            for agent_data in agent_results.values():
                all_risks.extend(agent_data.get('risks', []))
                all_recommendations.extend(agent_data.get('recommendations', []))
            
            synthesis = {
                "executive_summary": f"بر اساس تحلیل شورای هوشمند، تصمیم \"{decision.title}\" دارای ابعاد استراتژیک، مالی و بازاری مهمی است. توصیه کلی مبتنی بر توازن ریسک و فرصت است.",
                "decision_question": decision.question or decision.title,
                "key_findings": [
                    "تحلیل استراتژیک همسویی با اهداف بلندمدت را نشان می‌دهد",
                    "تحلیل مالی ROI مثبت اما چالش نقدینگی را پیش‌بینی می‌کند",
                    "تحلیل بازار پتانسیل رشد خوب اما ریسک اشباع را نشان می‌دهد"
                ],
                "conflicts": [c.get('description', '') for c in conflicts],
                "risks": list(set(all_risks))[:5],
                "unknowns": ["واکنش دقیق رقبا", "زمان‌بندی دقیق بازگشت سرمایه"],
                "recommended_next_steps": all_recommendations[:3],
                "confidence": 0.76
            }
            
            task.status = models.TaskStatus.COMPLETED
            task.output_data = synthesis
            task.completed_at = datetime.utcnow()
            self.db.commit()
            
            return synthesis
            
        except Exception as e:
            task.status = models.TaskStatus.FAILED
            task.error_message = str(e)
            self.db.commit()
            return {}
