# Council: Architecture Recommendation

## 1. Executive Architecture Summary

**Council should be built as an evidence-backed decision workflow system—not as a collection of AI personas governed by a “GOD Agent.”**

Its central product artifact should be a **versioned decision dossier** containing:

- The decision being considered.
- Alternatives, including doing nothing.
- Objectives, constraints, and evaluation criteria.
- Evidence and its provenance.
- Assumptions and missing information.
- Financial or other quantitative models.
- Findings from relevant analytical perspectives.
- Material disagreements and unresolved issues.
- Scenarios and sensitivity analysis.
- A conditional recommendation.
- Required human approvals and next actions.

The recommended architecture is:

> **A modular application with durable, deterministic orchestration; bounded LLM-based planning and analysis; a dynamically selected capability registry; controlled tools; and an explicit evidence and decision model.**

### Primary architectural decisions

| Question | Recommendation |
| --- | --- |
| Is GOD a single agent? | No. Split its responsibilities among application services, a constrained planner, validators, and a synthesizer. |
| Should Council use multiple agents? | Sometimes. Use multiple independent analyses when they add measurable value—not by default for every request. |
| What is an agent? | A temporary, bounded execution of a capability against a typed task contract. |
| Should experts be dynamically selected? | Yes, within approved decision templates, mandatory coverage rules, and cost limits. |
| Should experts debate freely? | No. Use structured cross-review and targeted revision. |
| What controls execution? | Application code and persisted workflow state, not model-generated instructions. |
| What is the system of record? | PostgreSQL plus versioned object storage. |
| What is the initial deployment model? | Modular monolith, separately deployed API and workers. |
| Is a vector database required? | No. Add retrieval indexing when actual source volume and retrieval evaluations justify it. |
| Is AI Knowledge required? | No. Integrate it later through an evidence-provider contract. |
| Does Council make organizational decisions? | No. It recommends, explains, and records; accountable humans decide. |

### The central quality principle

**More agents do not necessarily produce better decisions.**

Multiple calls to the same model, using similar prompts and the same evidence, can generate correlated mistakes and a false appearance of consensus. Council must earn its complexity through evaluation against simpler baselines.

---

## 2. First-Principles Product Boundaries

Before choosing orchestration technology, distinguish four different activities:

1. **Decision framing:** What exactly must be decided?
2. **Evidence development:** What is known, assumed, disputed, or missing?
3. **Option evaluation:** How do alternatives perform against objectives and constraints?
4. **Decision governance:** Who is authorized to decide, under what conditions?

LLMs can assist with all four, but should not be authoritative over:

- Access control.
- Financial arithmetic.
- Source authenticity.
- Legal clearance.
- Organizational policy.
- Workflow authorization.
- Budget enforcement.
- Final human approval.

### Important assumptions to challenge

#### “A professional title creates expertise”

It does not. Calling a prompt “Chief Financial Officer” does not establish financial competence.

A useful capability requires:

- A defined analytical method.
- Appropriate evidence.
- Validated tools.
- Explicit limits.
- Domain-specific evaluation cases.

#### “Consensus means confidence”

It does not. Agreement may reflect a shared unsupported assumption or common model bias.

#### “Every question requires a council”

It does not. Some requests need clarification, a calculation, or a single structured analysis.

#### “A persuasive report is the product”

It is only the presentation layer. The underlying product is a reproducible, inspectable decision process.

#### “Comprehensive analysis is always desirable”

It is not. Analysis has a cost and a deadline. Council should prioritize information likely to change the decision.

---

# 3. Architecture Alternatives

## Alternative A: Single Analyst with a Structured Pipeline

### Architecture

```text
User
  → Decision framing
  → Evidence retrieval and calculations
  → One comprehensive analyst
  → Structured validation
  → Report
```

A single principal analysis call evaluates the problem across several dimensions. Other calls may handle framing or validation, but there are no independent specialists.

### Assessment

| Dimension | Assessment |
| --- | --- |
| Advantages | Fast implementation, low cost, coherent output, simple debugging. |
| Disadvantages | Weak independence; important perspectives can be omitted; errors may survive self-review. |
| Complexity | Low. |
| Cost | Lowest of the alternatives. |
| Scalability | Excellent for standard short analyses. |
| Reliability | Operationally strong; analytical quality depends heavily on one reasoning path. |
| Development speed | Fastest. |
| AI quality | Good baseline for well-scoped decisions; potentially weaker on contested, multidisciplinary problems. |
| Operational complexity | Low. |

**Best use:** Prototype, lightweight decision mode, and mandatory evaluation baseline.

---

## Alternative B: Deterministic Workflow with Bounded Analytical Capabilities

### Architecture

```text
User
  → Frame decision
  → Propose and validate plan
  → Collect evidence
  → Execute selected analyses
  → Review claims and conflicts
  → Perform bounded revisions
  → Evaluate options
  → Synthesize and validate report
```

An LLM proposes analytical work. Application policy validates the plan and controls execution.

### Assessment

| Dimension | Assessment |
| --- | --- |
| Advantages | Strong auditability, predictable budgets, controlled tool use, meaningful independent analysis. |
| Disadvantages | Requires explicit contracts, workflow design, and evaluation infrastructure. |
| Complexity | Moderate. |
| Cost | Moderate and bounded. |
| Scalability | Strong; tasks can run independently on workers. |
| Reliability | Strong through persisted state, retries, partial-result handling, and deterministic gates. |
| Development speed | Moderate; feasible for a focused MVP. |
| AI quality | Potentially strong, particularly for multidisciplinary problems; must be demonstrated empirically. |
| Operational complexity | Moderate. |

**Best use:** Recommended foundation for Council.

---

## Alternative C: Autonomous Supervisor with Specialist Agents

### Architecture

```text
User
  → Supervisor agent
       ↔ Specialist agents
       ↔ Research agents
       ↔ Tools
       ↔ Critic agents
  → Supervisor synthesis
```

The supervisor dynamically assigns work, interprets results, initiates debates, and decides when to stop.

### Assessment

| Dimension | Assessment |
| --- | --- |
| Advantages | Flexible, useful for open-ended exploration, minimal need to enumerate every execution path. |
| Disadvantages | Unpredictable loops, unstable stopping behavior, harder reproducibility, greater injection and authorization risk. |
| Complexity | Superficially simple prototype; difficult production implementation. |
| Cost | High variance and potentially high. |
| Scalability | Worker scaling is possible, but task explosion complicates capacity planning. |
| Reliability | Weaker unless substantial deterministic controls are added. |
| Development speed | Fast demo, slower production hardening. |
| AI quality | Can discover useful angles; debate can also amplify errors and irrelevant work. |
| Operational complexity | High. |

**Best use:** A future, sandboxed research mode—not the core production workflow.

---

## Alternative D: Decision-Template and Quantitative-Model Engine

### Architecture

```text
Decision-type template
  → Required inputs
  → Domain calculations
  → Rules and scenario models
  → LLM explanation and exception analysis
  → Report
```

Most intelligence is encoded in domain templates and validated analytical models.

### Assessment

| Dimension | Assessment |
| --- | --- |
| Advantages | Strong repeatability, excellent quantitative reliability, relatively low inference cost. |
| Disadvantages | Narrow coverage; expensive domain authoring; unfamiliar decisions fit poorly. |
| Complexity | Moderate platform complexity, high domain-content investment. |
| Cost | Low to moderate inference cost. |
| Scalability | Excellent. |
| Reliability | High within validated domains. |
| Development speed | Fast for one narrow decision type, slow for broad coverage. |
| AI quality | Strong within templates, weaker outside them. |
| Operational complexity | Low to moderate. |

**Best use:** Domain-specific capability packs inside Alternative B.

---

# 4. Architecture Decision Matrix

Scores are architectural judgments, not measured performance. Five is best; weights reflect the stated product goals.

| Criterion | Weight | A: Single analyst | B: Bounded workflow | C: Autonomous agents | D: Template engine |
| --- | ---: | ---: | ---: | ---: | ---: |
| Decision-quality potential | 25% | 3 | 4 | 4 | 4 |
| Reliability and auditability | 20% | 4 | 5 | 2 | 5 |
| Implementation simplicity | 15% | 5 | 3 | 2 | 3 |
| Cost predictability | 15% | 5 | 4 | 1 | 5 |
| Breadth and extensibility | 15% | 3 | 5 | 5 | 2 |
| Operational scalability | 10% | 5 | 4 | 2 | 5 |
| **Weighted score** | **100%** | **4.00** | **4.20** | **2.80** | **4.00** |

### Selection

Choose **Alternative B**, incorporating:

- Alternative A as lightweight mode and evaluation baseline.
- Alternative D for validated quantitative and domain-specific capabilities.
- Limited elements of Alternative C only inside bounded research tasks.

The recommendation depends on a product hypothesis:

> Independent, structured perspectives and cross-review materially improve decision usefulness enough to justify additional cost and latency.

If evaluations do not support that hypothesis for a decision type, use the simpler pipeline.

---

# 5. Product Architecture

## 5.1 Logical components

```text
                       Web Application / API Clients
                                   │
                                   ▼
                         API and Identity Boundary
                                   │
                ┌──────────────────┴──────────────────┐
                │                                     │
        Decision Workspace                    Organization Settings
                │                             Roles / Policies / Limits
                ▼
       Decision Workflow Controller
                │
       ┌────────┼───────────────┬────────────────┐
       ▼        ▼               ▼                ▼
    Framing   Planning       Evidence         Report
    Service   & Coverage     Service          Service
              Validation
                │
                ▼
           Durable Task Queue
                │
          Analysis Workers
                │
       ┌────────┼─────────────────────┐
       ▼        ▼                     ▼
   LLM Gateway  Tool Gateway     Capability Runtime
       │        │
       │        ├─ Financial calculators
       │        ├─ Document extraction
       │        ├─ Approved retrieval providers
       │        └─ Future AI Knowledge adapter
       ▼
 Approved Model Providers

Shared persistence:
PostgreSQL · Object Storage · Audit Events · Telemetry
```

These are **logical modules**, not an instruction to deploy a dozen microservices.

## 5.2 Deployment boundary

For MVP:

- One backend codebase.
- One API deployment.
- One worker deployment, horizontally scalable.
- One PostgreSQL instance.
- One object-storage service.
- One frontend deployment.

Separate services only when there is a concrete reason:

- Independent security boundary.
- Different scaling profile.
- Team ownership.
- Reliability isolation.
- Deployment or residency requirements.

## 5.3 Communication patterns

- **Synchronous HTTP:** user commands, reads, configuration.
- **Asynchronous jobs:** model calls, extraction, calculations, report generation.
- **Server-Sent Events:** live progress; polling fallback.
- **Transactional outbox:** reliable publication of committed workflow events.
- **Internal function calls:** communication between modules in the modular monolith.

No Kafka or general-purpose event bus is necessary for MVP.

## 5.4 State management

PostgreSQL owns authoritative state.

Separate:

- **Decision:** the long-lived business question.
- **Decision revision:** an immutable snapshot of the question, alternatives, inputs, and criteria.
- **Run:** an execution against a particular revision.
- **Task:** a planned analytical activity.
- **Attempt:** an individual execution of that task.
- **Report version:** a published output tied to a run.

A chat conversation is a user interface to this state—not the state model itself.

---

# 6. Agent Architecture and Taxonomy

## 6.1 Replace permanent personas with capabilities

An agent should be:

> A stateless or short-lived capability execution with a task, authorized inputs, allowed tools, a budget, and a validated output schema.

Do not build twelve permanently running experts.

A capability definition contains:

- Scope and exclusions.
- Supported decision types.
- Required inputs.
- Analytical method.
- Permitted tools.
- Evidence requirements.
- Output schema.
- Model requirements.
- Evaluation suite.
- Prompt and implementation versions.

## 6.2 Use a hybrid taxonomy

### Layer A: Decision-type templates

Examples:

- Capital investment or acquisition.
- Technology architecture change.
- Market entry.
- Vendor selection.
- Organizational restructuring.

Templates specify expected alternatives, common evidence needs, and required coverage.

They are scaffolds, not rigid forms that force every case into a predefined answer.

### Layer B: Analytical methods

Reusable capabilities include:

- Alternatives generation.
- Financial modeling.
- Sensitivity and scenario analysis.
- Constraint checking.
- Dependency analysis.
- Risk assessment.
- Assumption testing.
- Implementation feasibility.
- Evidence critique.
- Value-of-information assessment.

### Layer C: Domain lenses

Domain knowledge configures those methods:

- Commercial and strategic.
- Financial and economic.
- Operational and technical.
- Workforce and organizational.
- Legal and regulatory.
- Security and data governance.

### Layer D: Deterministic tools

Tools perform activities that should not rely on prose reasoning:

- Cash-flow projection.
- NPV calculation.
- Unit and currency validation.
- Scenario calculation.
- Document parsing.
- Citation resolution.
- Policy rule evaluation.

### Example

Instead of activating separate “Finance,” “Investment,” and “Economics” agents:

```text
Capability: capital_investment_evaluation
Methods:
  - cash-flow modeling
  - financing analysis
  - sensitivity analysis
Domain configuration:
  - manufacturing
  - relevant jurisdiction
  - selected reporting currency
Tools:
  - validated investment model
```

A separate macroeconomic analysis is justified only when economic assumptions are material enough to warrant dedicated work.

## 6.3 What should be merged or decomposed?

- **Finance and investment:** usually one analytical capability.
- **Market and competition:** often one commercial analysis.
- **Technology and architecture:** usually merged for a technical decision.
- **Security and data:** separate when privacy, residency, or threat analysis is material.
- **Risk:** both a cross-cutting method and, where justified, an independent review—not merely another generic persona.
- **Legal and compliance:** issue-spotting and obligation mapping; not automated legal clearance.
- **Innovation:** usually an alternative-generation method, not a standing expert.
- **Economics:** activate separately when inflation, exchange rates, interest rates, or macro exposure materially affect the decision.

## 6.4 Lifecycle

```text
Registered capability
  → Selected for a task
  → Context assembled
  → Execution attempt
  → Schema and policy validation
  → Persisted result
  → Terminated
```

No agent needs an independent inbox, permanent memory, or authority to create unlimited new agents.

---

# 7. GOD / Orchestration Architecture

**“GOD Agent” is the wrong production abstraction.**

It combines reasoning, scheduling, policy enforcement, and final judgment into one opaque component. That makes failures harder to diagnose and grants too much authority to model output.

Replace it with a **Decision Workflow Controller**.

## 7.1 Responsibility decomposition

| Responsibility | Owner |
| --- | --- |
| Interpret and structure the request | Framing capability |
| Ask clarifying questions | Framing capability, controlled by workflow policy |
| Propose analyses | Planner capability |
| Enforce required coverage | Deterministic coverage validator |
| Authorize tools and models | Application policy |
| Schedule work | Durable workflow controller |
| Detect numeric contradictions | Deterministic checks |
| Detect semantic conflicts | Review capability |
| Authorize additional work | Workflow controller under budget and iteration limits |
| Evaluate options | Structured evaluation service plus analytical capabilities |
| Draft final report | Synthesis capability |
| Validate publication | Deterministic gates and evidence review |
| Make business decision | Authorized human |

## 7.2 Execution model

Use a **bounded directed task graph** whose allowable structure is defined by application code.

The planner may propose:

- A capability from the registry.
- An objective.
- Input references.
- Dependencies.
- Expected outputs.
- Reasons the task is necessary.

It may not define:

- Arbitrary executable code.
- New tool permissions.
- Unapproved models.
- Unbounded recursion.
- Unlimited task counts.
- New workflow states.
- Its own spending authority.

## 7.3 MVP state machine

```text
DRAFT
  → FRAMING
  → AWAITING_INPUT, if necessary
  → PLANNING
  → EVIDENCE_PREPARATION
  → ANALYZING
  → REVIEWING
  → REVISING, optional and bounded
  → SYNTHESIZING
  → VALIDATING
  → COMPLETED | COMPLETED_WITH_GAPS

Any active state:
  → FAILED | CANCELLED
```

Important distinction:

- **Technical run status:** did execution complete?
- **Recommendation status:** proceed, reject, conditional, or insufficient information?

A successfully completed run can correctly conclude “insufficient information.”

---

# 8. Council Formation Mechanism

Dynamic formation is appropriate, but unrestricted LLM routing is not.

Use **hybrid routing**.

## 8.1 Formation process

### Step 1: Extract a decision profile

Structured fields include:

- Decision type.
- Industry.
- Jurisdiction.
- Financial exposure.
- Reversibility.
- Time horizon.
- Stakeholders.
- Workforce impact.
- Personal-data exposure.
- Safety implications.
- Regulatory exposure.
- Evidence availability.
- Deadline and analysis budget.

Unknown fields remain unknown. The model must not invent a jurisdiction or assume regulatory requirements do not apply.

### Step 2: Apply mandatory coverage rules

Examples:

| Trigger | Required coverage |
| --- | --- |
| Material capital commitment | Financial analysis and downside scenario |
| Acquisition | Ownership, liabilities, and transaction diligence issues |
| Workforce change | Organizational impact and employment obligations |
| Personal-data processing | Privacy and security |
| Safety-critical operation | Safety and operational risk |
| Cross-border activity | Relevant jurisdictional and compliance issues |
| Unknown jurisdiction with legal exposure | Clarification or explicit unresolved legal gate |

These rules are product policies authored with domain input, not universal truths.

### Step 3: Let the planner add problem-specific work

The planner selects additional capabilities and provides a justification for each.

### Step 4: Validate coverage and dependencies

Create a matrix:

| Material concern | Capability/task | Required evidence | Blocking if unresolved? |
| --- | --- | --- | --- |
| Investment viability | Financial evaluation | Cash flows, CAPEX, working capital | Yes |
| Ownership validity | Transaction issue review | Title and corporate documents | Yes |
| Market demand | Commercial analysis | Demand and pricing evidence | Context-dependent |
| Operational readiness | Operations analysis | Capacity and maintenance data | Context-dependent |

### Step 5: Validate budget and approve the plan

- Enforce maximum task count.
- Enforce allowed capabilities.
- Check expected token and tool cost.
- Detect unnecessary overlap.
- Identify questions that should be asked before expensive analysis.
- Obtain user approval for material scope or budget expansion.

## 8.2 Coverage is not headcount

“Six experts responded” is not a meaningful completion criterion.

The criterion is:

> All material concerns have either been analyzed adequately or are explicitly identified as unresolved, with an appropriate effect on the recommendation.

## 8.3 Initial execution modes

- **Brief:** one structured analyst plus validation.
- **Standard:** two to four analytical capabilities plus cross-review.
- **Deep:** additional research and scenarios, introduced after quality and cost evaluation.

A user may request another perspective, but cannot remove mandatory gates while retaining a claim that the analysis cleared those gates.

---

# 9. Agent Contract

Use versioned JSON Schema or equivalent typed contracts.

## 9.1 Task input

```json
{
  "schema_version": "1.0",
  "task_id": "task_123",
  "run_id": "run_456",
  "decision_revision_id": "revision_7",
  "capability": "capital_investment_evaluation",
  "capability_version": "1.2",
  "objective": "Compare acquisition, phased investment, and no action",
  "decision_frame_ref": "frame_7",
  "input_artifact_refs": ["artifact_10", "artifact_11"],
  "evidence_refs": ["evidence_1", "evidence_2"],
  "assumption_refs": ["assumption_3"],
  "dependency_result_refs": [],
  "requested_outputs": [
    "option_findings",
    "financial_model",
    "sensitivity",
    "missing_information"
  ],
  "budget": {
    "max_input_tokens": 12000,
    "max_output_tokens": 3000,
    "max_tool_calls": 4,
    "deadline_seconds": 120
  },
  "output_schema": "analysis_result_v1"
}
```

Tenant identity, authorization, credentials, and actual tool permissions are held in a **server-controlled execution envelope**. They are not trusted because a model or client included them in JSON.

## 9.2 Task output

```json
{
  "schema_version": "1.0",
  "task_id": "task_123",
  "status": "completed_with_gaps",
  "findings": [
    {
      "finding_id": "finding_1",
      "statement": "Available data is insufficient to establish investment viability.",
      "applies_to_option": "acquire_and_develop",
      "materiality": "critical",
      "claim_type": "analytical_conclusion",
      "evidence_refs": ["evidence_1"],
      "assumption_refs": [],
      "calculation_refs": [],
      "support_level": "limited",
      "rationale_summary": "Purchase budget is known, but operating cash flows and additional capital requirements are not.",
      "counterevidence_refs": []
    }
  ],
  "missing_information": [
    {
      "item": "Historical and projected operating cash flows",
      "decision_impact": "Could reverse the recommendation",
      "blocking": true
    }
  ],
  "risks": [],
  "conflict_candidates": [],
  "recommended_follow_up_tasks": [],
  "option_assessments": []
}
```

## 9.3 Contract requirements

Every result must distinguish:

- Sourced fact.
- User assertion.
- Assumption.
- Calculation.
- Analytical inference.
- Recommendation.
- Unresolved question.

The runtime adds trusted metadata:

- Model and provider version.
- Prompt version.
- Token usage.
- Cost.
- Latency.
- Tool calls.
- Attempt identifier.
- Validation results.

Store concise rationales and reproducible artifacts. **Do not require or retain hidden chain-of-thought as an audit mechanism.**

---

# 10. Council Execution Protocol

## Phase 1: Frame the decision

Establish:

- Decision owner.
- Decision deadline.
- Options, including status quo.
- Objectives and priorities.
- Hard constraints.
- Success and failure criteria.
- Reversibility.
- Required approvals.

If the user asks “Should we buy this factory?”, Council should clarify whether the relevant decision is:

- Enter diligence.
- Sign a nonbinding agreement.
- Commit capital.
- Acquire the business.
- Approve a development plan.

These are different decisions.

## Phase 2: Establish the evidence baseline

- Ingest and scan documents.
- Extract text and tables.
- Normalize dates, units, and currencies.
- Record source and access metadata.
- Identify missing critical inputs.
- Create a versioned evidence manifest.

The execution snapshot is versioned. New evidence creates a new snapshot and invalidates affected downstream tasks.

## Phase 3: Plan and authorize

- Propose capabilities.
- Apply mandatory coverage.
- Resolve dependencies.
- Estimate cost.
- Approve scope.

## Phase 4: Independent first-pass analyses

Parallelize tasks that do not depend on each other.

Analysts receive the same approved frame and relevant evidence but do not see other analysts’ conclusions during the first pass.

This reduces anchoring; it does not create true statistical independence.

Some tasks must be sequential:

```text
Market assumptions
  → Revenue scenarios
  → Financial model
  → Investment evaluation
```

## Phase 5: Structured review

Reviewers inspect claims, assumptions, and calculations—not just prose reports.

Checks include:

- Unsupported material claims.
- Citation relevance.
- Conflicting figures.
- Unit and date mismatches.
- Scenario inconsistencies.
- Missing alternatives.
- Ignored constraints.
- Shared dependencies that create correlated failure.
- Recommendations that exceed the available evidence.

## Phase 6: Conflict classification

Classify disagreements before attempting resolution:

1. **Factual:** different claims about the same state of the world.
2. **Assumptive:** different forecasts or scenario inputs.
3. **Methodological:** different valuation or evaluation methods.
4. **Value-based:** different priorities or risk tolerances.
5. **Scope-based:** different time horizons, options, or definitions.

Do not treat statements about different scenarios as contradictions.

Resolution can be:

- Correct the data.
- Run both assumptions.
- Compare methods.
- Ask the decision owner for priorities.
- Preserve a material unresolved disagreement.

No majority vote among agents.

## Phase 7: Bounded follow-up

For MVP:

- At most one targeted revision round.
- Follow-up only for material issues.
- No generic “debate until agreement.”

Use a value-of-information heuristic: prioritize work likely to change the choice, a binding condition, or the confidence in a critical input.

## Phase 8: Evaluate options

Apply this order:

1. Identify hard-constraint violations.
2. Compare feasible options against explicit objectives.
3. Evaluate downside, uncertainty, and reversibility.
4. Test sensitivity to important assumptions.
5. Identify unresolved information that could reverse the choice.
6. Recommend an action or defer.

Weighted scoring is optional and requires explicit weights and sensitivity analysis. Avoid opaque composite scores.

## Phase 9: Synthesize

The final report should include:

- Executive recommendation.
- Decision and alternatives.
- Conditions and disqualifiers.
- Major findings.
- Evidence basis.
- Calculations and scenarios.
- Agreements and material disagreements.
- Risks and opportunities.
- Missing information.
- Evidence strength and recommendation sensitivity.
- Next actions, owners, and deadlines.
- Traceable appendix.

## Phase 10: Publication gates

Before publication:

- All material claims have a support path or are explicitly labeled unsupported/assumed.
- Calculation references resolve.
- Mandatory coverage is present or disclosed as missing.
- The recommendation respects unresolved blocking issues.
- Evidence permissions are enforced.
- Report and underlying run are version-linked.

Structural validation does not prove factual truth. The interface must not imply that it does.

---

# 11. Example: Manufacturing Investment

User:

> “I am considering investing 500 billion toman to acquire and develop a manufacturing factory. Should we proceed?”

## 11.1 The immediate architectural behavior

Do not launch twelve experts and generate a confident investment recommendation.

First establish:

- What exactly does the stated amount cover?
- Does it include purchase price, refurbishment, working capital, taxes, fees, and contingency?
- What currency unit and reporting date apply?
- What is the location and jurisdiction?
- What product does the factory manufacture?
- What are current capacity, utilization, and margins?
- What financing is proposed?
- What alternatives exist?
- What return, liquidity, and downside constraints does the investor have?

**Toman, rial, nominal values, and real values must never be silently mixed.**

Currency conversion requires an explicit unit definition, rate source, rate date, and applicable rate convention. Financial models must also keep discount rates consistent with currency and inflation assumptions.

## 11.2 Initial council

A plausible plan:

1. Commercial and strategic analysis.
2. Investment modeling.
3. Operational and development feasibility.
4. Transaction, regulatory, and liability issue review.
5. Cross-cutting evidence and downside review.

Workforce or environmental analysis becomes separate when material.

## 11.3 Required calculations

Where inputs exist:

- Total initial and staged capital requirement.
- Operating cash flow.
- Working-capital needs.
- Financing costs and debt-service capacity.
- NPV and payback.
- IRR where mathematically appropriate.
- Break-even utilization.
- Downside liquidity needs.
- Sensitivity to pricing, demand, energy costs, exchange rates, and delays.

The calculator must flag situations where IRR is ambiguous or misleading; NPV and cash-flow profiles remain visible.

Scenario probabilities should not be invented simply to create an expected-value number.

## 11.4 Appropriate result with only the initial prompt

**Recommendation: Insufficient information to approve the acquisition or capital commitment.**

Council can still provide:

- A proposed diligence plan.
- A capital model template.
- Critical information requests.
- Potential decision gates.
- A comparison of full commitment versus staged diligence.

“Proceed with diligence” is not equivalent to “proceed with the investment.”

---

# 12. Data Architecture

## 12.1 Primary entities

| Entity | Purpose |
| --- | --- |
| `tenants` | Organization boundary and policy settings |
| `users` / `memberships` | Identity and organization roles |
| `decisions` | Long-lived decision workspace |
| `decision_revisions` | Versioned frame, options, objectives, constraints |
| `messages` | Conversation history, separate from authoritative state |
| `decision_runs` | Execution metadata, status, budget, snapshot references |
| `run_tasks` | Planned work, dependencies, state, result references |
| `task_attempts` | Retries, provider calls, errors, execution metadata |
| `capability_versions` | Registered capability definitions |
| `source_documents` | Origin, permissions, versions, classification |
| `evidence_items` | Specific source-backed assertions or excerpts |
| `claims` / `findings` | Analytical outputs |
| `assumptions` | Explicit unknowns and scenario inputs |
| `calculations` | Inputs, formulas/code version, outputs, units |
| `provenance_edges` | Supports, contradicts, derived-from, depends-on |
| `conflicts` | Disagreements and resolution records |
| `reports` | Versioned structured output and rendered artifacts |
| `human_decisions` | Human choice, rationale, conditions, approvals |
| `usage_ledger` | Model/tool usage, reserved and actual cost |
| `audit_events` | Security and business-state changes |
| `outbox_events` | Committed events awaiting delivery |

Use normal relational columns for identities, tenancy, status, and joins. Use JSONB for versioned analytical schemas where flexibility is useful.

Do not hide the entire application inside unstructured JSON documents.

## 12.2 Object storage

Store:

- Uploaded documents.
- Extracted text and tables.
- Large calculation artifacts.
- Rendered reports.
- Restricted raw model responses when justified by retention policy.

PostgreSQL stores metadata and object references.

## 12.3 Provenance graph

A graph database is unnecessary initially.

Represent relationships in an edge table:

```text
Source excerpt
  → supports
Evidence assertion
  → used_by
Calculation
  → supports
Finding
  → contributes_to
Option assessment
  → contributes_to
Recommendation
```

Edges include relationship type, qualifiers, creator, and version.

Move to a graph-specific store only if query complexity and volume demonstrate a need.

## 12.4 Versioning and retention

- Published reports are immutable versions.
- Corrections produce superseding versions.
- Material input changes create a new decision revision or evidence snapshot.
- Dependent analyses are invalidated and rerun.
- Reuse requires matching inputs, versions, permissions, and freshness.

Audit immutability does not mean retaining sensitive content forever. Support retention expiry, legal holds, and authorized deletion. Preserve permitted tombstone metadata while clearly marking when deleted artifacts prevent full reconstruction.

---

# 13. API Architecture

Use REST for commands and resources, SSE for progress, and versioned schemas.

## 13.1 Representative endpoints

```text
POST   /v1/decisions
GET    /v1/decisions/{decision_id}
POST   /v1/decisions/{decision_id}/revisions

POST   /v1/decisions/{decision_id}/messages
POST   /v1/decisions/{decision_id}/uploads

POST   /v1/decisions/{decision_id}/runs
GET    /v1/runs/{run_id}
GET    /v1/runs/{run_id}/events

POST   /v1/runs/{run_id}/answers
POST   /v1/runs/{run_id}/approve-plan
POST   /v1/runs/{run_id}/cancel

GET    /v1/runs/{run_id}/findings
GET    /v1/runs/{run_id}/conflicts
GET    /v1/runs/{run_id}/report

GET    /v1/evidence/{evidence_id}
GET    /v1/calculations/{calculation_id}

POST   /v1/decisions/{decision_id}/human-decisions
```

Some endpoints remain internal in MVP.

## 13.2 API behavior

- Long-running commands return `202 Accepted` and a run identifier.
- Creation endpoints support idempotency keys.
- Updates use revision checks or ETags.
- APIs expose structured states, not only generated text.
- Pagination and resource limits apply.
- Signed download links are short-lived and authorization-checked.
- Every request receives a correlation identifier.
- Authentication and authorization apply equally to streaming endpoints.

The client never selects arbitrary tool credentials, provider secrets, or capability code.

## 13.3 Future integrations

Add:

- Signed webhooks.
- Service accounts.
- Scoped API tokens.
- Connector APIs.
- Approval callbacks.

Webhook delivery must support retries and duplicate handling.

---

# 14. Model Routing, Context, and Memory

## 14.1 LLM gateway

All model access goes through a gateway responsible for:

- Provider adapters.
- Model-policy enforcement.
- Structured-output invocation.
- Timeouts and rate limits.
- Token accounting.
- Cost attribution.
- Retry classification.
- Approved fallbacks.
- Redacted telemetry.
- Provider retention and residency restrictions.

This can begin as an internal module rather than a separate service.

## 14.2 Routing policy

Use task requirements, not “CEO importance,” to select a model.

| Task | Default strategy |
| --- | --- |
| Classification and extraction | Lower-cost model, strict schema |
| Framing and planning | Model evaluated for structured planning |
| Material analysis | Strong model appropriate to domain and language |
| Financial computation | Deterministic tool |
| Conflict review | Strong review model; consider different model family if evaluations justify it |
| Synthesis | Model evaluated for faithful evidence-grounded summarization |
| Authorization and publication checks | Application code |

Route using:

- Task complexity.
- Evidence size.
- Required language.
- Tool and schema support.
- Data classification.
- Provider availability.
- Measured quality.
- Remaining budget.

A cheaper model is not an acceptable fallback if it violates quality or data-handling policy.

## 14.3 Context assembly

Each task receives:

1. Capability instructions.
2. Approved decision frame.
3. Relevant constraints and criteria.
4. Relevant evidence excerpts with identifiers.
5. Necessary dependency outputs.
6. Explicit assumptions and unresolved questions.
7. Output contract.

Do not send the entire chat and every document to every analyst.

Use retrieval and bounded, provenance-preserving summaries. A generated summary is not a replacement for its underlying evidence.

## 14.4 Memory

Use three explicit memory categories:

- **Working context:** temporary task inputs.
- **Decision memory:** versioned state and artifacts for a decision.
- **Organization context:** approved policies, objectives, terminology, and preferences.

Organization context requires ownership, permissions, provenance, and revision history.

Do not introduce invisible, self-updating agent memory. Never share tenant memory across organizations.

---

# 15. Evidence and Auditability Architecture

## 15.1 Evidence classes

1. **User assertion:** supplied but not independently verified.
2. **Source-backed statement:** tied to an accessible source.
3. **Derived calculation:** reproducible from identified inputs.
4. **Analytical inference:** conclusion based on evidence and assumptions.
5. **Assumption:** explicitly hypothetical or unverified.
6. **External professional approval:** a separately recorded human artifact, if supplied.

Agent agreement is not an evidence class.

## 15.2 Evidence metadata

Each item should include:

- Source identifier and version.
- Original URL or document reference.
- Publisher or owner.
- Retrieval timestamp.
- Effective date or “as of” date.
- Page, table, paragraph, or exact text span.
- Content hash.
- Extraction method.
- Jurisdiction and units where relevant.
- Access-control metadata.
- Known limitations.
- Relationships to claims.

A content hash supports artifact integrity; it does not establish truth.

## 15.3 Validation layers

1. **Existence:** does the referenced source exist?
2. **Location:** does the cited passage exist in that version?
3. **Relevance:** does it address the claim?
4. **Support:** does it actually support the claim?
5. **Applicability:** is it current, jurisdictionally relevant, and scoped correctly?
6. **Consistency:** is it contradicted by other material evidence?

Some checks are deterministic; others require reviewed classifiers, LLM assistance, or humans. A valid citation alone is insufficient.

## 15.4 Uncertainty presentation

Avoid a single invented “87% confidence.”

Show:

- Evidence sufficiency.
- Source quality and freshness.
- Assumption sensitivity.
- Model or methodological limitations.
- Unresolved disagreement.
- Recommendation stability across scenarios.

Numerical probabilities are appropriate only when grounded in an explicit method and suitable data. Any learned confidence estimates require calibration against outcomes.

## 15.5 AI Knowledge integration

Define a provider-neutral interface:

```text
EvidenceProvider.search(
  query,
  domain,
  jurisdiction,
  as_of,
  authorization_scope,
  limits
) → EvidenceBundle
```

The bundle should contain:

- Retrieved passages.
- Source identifiers.
- Source versions and dates.
- Citation locations.
- Access metadata.
- Provider limitations.

If AI Knowledge returns only a synthesized answer, treat that answer as an external analytical artifact—not as primary evidence. Require underlying citations for material factual use.

Council remains responsible for authorization, applicability checks, and how retrieved content affects its recommendation.

---

# 16. Security Architecture

## 16.1 Tenant isolation

Multi-tenancy is an MVP foundation, not a future retrofit.

Use:

- `tenant_id` on tenant-owned records.
- Tenant-scoped foreign keys or equivalent integrity checks.
- PostgreSQL row-level security where appropriate.
- Tenant-scoped object authorization.
- Tenant-aware queues, caches, retrieval indexes, and telemetry.

Background workers must re-establish verified tenant context for each task. Database session settings must not leak through pooled connections; use transaction-scoped context.

Cross-tenant administrative functions require separate privileged paths and auditing.

## 16.2 Authentication and authorization

MVP:

- Managed identity provider.
- Organization membership.
- Admin, member, and viewer roles.
- Decision-level access.
- Server-side authorization.

V1:

- SAML/OIDC enterprise SSO.
- SCIM.
- Approval roles.
- Attribute-based and document-level policies where needed.

## 16.3 Derived-data permissions

Reports can leak source information even if the original document remains protected.

Default rule:

> A user may view an unredacted derived artifact only if authorized for its contributing restricted sources.

If broader distribution is required, generate a separate redacted report from an authorized evidence set. Do not simply hide citations while leaving sensitive conclusions intact.

## 16.4 Prompt injection

Treat retrieved content, uploaded documents, and external tool responses as untrusted data.

Controls:

- Separate instructions from source content.
- Never accept source-embedded tool commands.
- Bind tool permissions outside the prompt.
- Use allowlisted tools and validated arguments.
- Restrict network egress.
- Quarantine suspicious content where useful.
- Test source-based injection attacks.
- Require approval for side effects.

Prompt wording and injection detectors are not sufficient security boundaries.

## 16.5 Exfiltration and tool safety

- No arbitrary shell access.
- No unrestricted outbound HTTP.
- No cloud-metadata or private-network access through fetch tools.
- Validate redirects and destination addresses.
- Secrets never enter model context.
- Per-connector, least-privilege credentials.
- Sandboxed document processing.
- File-type, size, archive-expansion, and malware limits.
- DLP and export restrictions where required.

MVP tools should be read-only, apart from writing Council’s own artifacts.

## 16.6 Data privacy

- TLS in transit.
- Encryption at rest.
- Secrets manager.
- Configurable retention.
- Restricted raw-content logging.
- Approved provider contracts and retention settings.
- Data-residency constraints included in routing.
- No training on customer data without explicit contractual authorization.
- Documented deletion and backup-retention behavior.

Dedicated deployments and customer-managed keys belong later unless required by the initial customer segment.

---

# 17. Failure and Recovery Strategy

## 17.1 Execution guarantees

Assume **at-least-once task delivery**.

Do not promise exactly-once model execution. A provider may complete a paid request even if the response is lost.

Make internal effects idempotent:

- Stable task identifiers.
- Unique completion records.
- Attempt fencing.
- Compare-and-swap state transitions.
- Atomic report publication.
- Idempotent usage reconciliation where possible.

## 17.2 Failure handling

| Failure | Response |
| --- | --- |
| Model timeout | Cancel locally, record uncertainty about provider completion, apply bounded retry policy |
| Provider outage | Circuit breaker and policy-approved fallback |
| Rate limiting | Backoff with jitter; respect provider limits |
| Invalid output schema | Limited repair attempt; then fail or use approved fallback |
| Unsupported claim | Remove, relabel, request evidence, or block affected conclusion |
| Tool failure | Retry if transient; otherwise mark evidence/calculation gap |
| Worker crash | Recover queued work; resume from committed task state |
| Duplicate delivery | Return stored completion or reject stale attempt |
| Late result after cancellation | Ignore state mutation; retain usage accounting |
| Missing noncritical analysis | Publish with explicit limitation |
| Missing critical coverage | Do not publish an unconditional positive recommendation |
| Stale evidence | Refresh or disclose and block where material |
| Budget exhaustion | Stop additional work and produce a bounded partial result |

## 17.3 Retry policy

- Separate transport errors from semantic failures.
- Retry only transient errors automatically.
- Set per-attempt timeout and overall run deadline.
- Cap retries and repair calls.
- Charge retries against the run budget.
- Record whether fallback changed analytical capability.

Repeated schema repair is not a substitute for a reliable output contract.

## 17.4 Human pauses

When awaiting clarification or approval:

- Persist the state.
- Release the worker.
- Resume through a new queued task.
- Recheck permissions, evidence freshness, and remaining budget.

## 17.5 Recovery scope

For MVP, use a fixed state machine with persisted task results and an established PostgreSQL-backed job library.

For longer workflows with extensive timers, callbacks, and branching, move execution to a durable workflow engine such as Temporal. Keep domain artifacts outside the engine so migration does not require redesigning the decision model.

---

# 18. Cost Control Strategy

## 18.1 Cost model

For a decision:

\[
C =
\sum_i \frac{T_{in,i}P_{in,i} + T_{out,i}P_{out,i}}{10^6}
- C_{\text{retrieval}}
- C_{\text{tools}}
- C_{\text{storage/compute}}
\]

Where model prices are per million tokens.

Track:

- Estimated cost.
- Reserved budget.
- Actual cost.
- In-flight exposure.
- Retry cost.
- Cost by capability.
- Cost per useful completed decision.

Parallel execution reduces latency, not total inference cost.

## 18.2 Budget enforcement

At run creation:

- Assign an analysis tier.
- Set a monetary or internal-credit ceiling.
- Reserve estimated capacity.
- Cap concurrency and tool usage.
- Keep margin for validation and final reporting.

Before each task:

- Check remaining budget.
- Reserve its maximum allowed exposure.
- Reject unauthorized expansion.

Provider usage may be reported late, so enforce conservative in-flight limits rather than pretending actual spend is instantly known.

## 18.3 MVP call budget

A standard run might contain:

- One framing/planning call.
- Two to four analytical calls.
- One review call.
- Zero or one targeted revision call.
- One synthesis call.

Approximately **five to eight principal LLM calls**, excluding approved extraction or retrieval subcalls.

This is a starting constraint, not a claim that every decision needs that many calls.

## 18.4 Main optimizations

1. Clarify missing critical information early.
2. Use smaller capability-specific context.
3. Merge overlapping analyses.
4. Use deterministic calculations.
5. Stop follow-up when it is unlikely to affect the decision.
6. Cache extraction and stable retrieval results.
7. Reuse unaffected artifacts across revisions.
8. Route simple tasks to less expensive qualified models.
9. Limit output size.
10. Avoid full-transcript agent conversations.

Cache keys must include tenant/security scope, source versions, model and prompt versions, task inputs, and freshness policy. Cross-tenant caching should be limited to explicitly public, nonsensitive artifacts.

---

# 19. Observability and Decision-Quality Evaluation

Operational observability and analytical quality are separate concerns.

## 19.1 Trace hierarchy

```text
Decision revision
  └─ Run
      ├─ Framing
      ├─ Planning
      ├─ Evidence preparation
      ├─ Analysis task
      │   ├─ Model attempt
      │   └─ Tool invocation
      ├─ Review
      ├─ Revision
      ├─ Synthesis
      └─ Publication checks
```

Use consistent decision, run, task, attempt, and trace identifiers.

## 19.2 Operational metrics

- Queue wait time.
- Run completion rate.
- Phase and task latency.
- Provider errors.
- Retry and timeout rates.
- Token usage.
- Cost and budget overruns.
- Worker saturation.
- Cancellation effectiveness.
- Recovery success after worker termination.
- Cross-tenant authorization violations.
- Evidence retrieval failure rate.

Avoid placing sensitive content or high-cardinality identifiers directly into general metrics labels.

## 19.3 Analytical metrics

- Material-claim support coverage.
- Citation correctness and source support.
- Calculation correctness.
- Mandatory coverage recall.
- Missing-information detection.
- Constraint adherence.
- Conflict detection precision and recall.
- Preservation of material dissent.
- Recommendation consistency with findings.
- Sensitivity to irrelevant wording.
- Appropriate abstention.
- Human-rated usefulness.
- Cost per quality-adjusted result.

“Number of agents” and “number of citations” are not quality metrics.

## 19.4 Evaluation program

Maintain a versioned test set containing:

- Well-specified decisions.
- Incomplete inputs.
- Conflicting sources.
- Incorrect user assumptions.
- Currency and unit traps.
- Outdated legal or market evidence.
- Malicious documents.
- Impossible constraints.
- Cases where the right output is “insufficient information.”
- Cases where a simpler analysis should suffice.

Compare:

1. Single analyst.
2. Multiple analyses without review.
3. Multiple analyses with structured review.
4. Template-driven analysis.

Use expert review and deterministic checks. LLM judges can assist but should not be the sole quality authority.

Real-world decision outcomes are valuable but confounded by execution and external events; they are not clean labels for whether a recommendation was correct.

## 19.5 Release discipline

Version and evaluate:

- Models.
- Prompts.
- Capability definitions.
- Routing rules.
- Tools.
- Report schemas.

Use shadow runs or canaries before broad rollout. An untested model upgrade is a product behavior change.

---

# 20. Technology Stack Recommendation

| Area | Recommendation | Rationale |
| --- | --- | --- |
| Backend | Python, FastAPI, Pydantic | Strong AI/data ecosystem, typed validation, straightforward API development |
| Domain architecture | Modular monolith | Simplifies transactions, deployment, and early changes |
| Persistence access | SQLAlchemy and Alembic | Mature database access and schema migration tooling |
| Database | Managed PostgreSQL | Transactions, relational integrity, JSONB, row-level security, broad operational support |
| Object storage | S3-compatible managed storage | Durable, versionable storage for documents and artifacts |
| MVP queue | PostgreSQL-backed library such as Procrastinate | Avoids operating another infrastructure system; use an established library rather than inventing a general queue |
| Workflow state | Application-owned fixed state machine | Sufficient for a bounded MVP; inspectable and testable |
| Advanced workflows | Temporal when justified | Durable timers, human pauses, retries, and long-running orchestration |
| Cache | None required initially; Redis later | Introduce for measured rate-limit or caching needs, not by habit |
| Event bus | None in MVP; transactional outbox | Reliable local event delivery without distributed-system overhead |
| Agent runtime | Thin typed capability executor | Keeps behavior explicit; avoids framework-driven architecture |
| LLM integration | Internal gateway with provider adapters | Centralized policy, usage, routing, and fallback control |
| Adapter implementation | Official SDKs or an evaluated adapter library | Choose based on provider support; do not make a library’s API the domain contract |
| Search | PostgreSQL full-text search initially | Adequate for a small evidence corpus |
| Vector retrieval | pgvector when evaluated need appears | Low additional operational burden |
| Quantitative tools | Tested Python services using appropriate numeric libraries | Reproducible calculations; Decimal for monetary normalization where appropriate |
| Frontend | React/Next.js with TypeScript | Strong ecosystem for document-centric and interactive SaaS interfaces |
| Identity | Managed OIDC provider | Avoid building authentication infrastructure |
| Observability | OpenTelemetry plus managed logs, metrics, traces, and error tracking | Portable instrumentation and lower operational effort |
| Deployment | Managed container platform | Simpler than Kubernetes for the initial scale |
| Containerization | Docker | Reproducible API and worker builds |
| Secrets | Cloud secrets manager | Rotation and least-privilege access |
| Infrastructure | Infrastructure as code | Repeatable environments and auditable changes |

### Important implementation notes

- Validate the chosen job library’s crash recovery, retry, and transaction behavior before committing.
- If enqueueing cannot share the business transaction, use an outbox.
- Do not use web-process background tasks for durable decision execution.
- Do not add Kubernetes, Kafka, a graph database, and a standalone vector database simultaneously.
- Generated code execution, if introduced later, belongs in a hardened sandbox—not inside the API or main worker process.

---

# 21. MVP Architecture

## 21.1 Scope

The MVP should support two contrasting decision types:

1. Capital investment.
2. Technology architecture change.

This tests whether the abstraction is genuinely reusable without attempting all organizational domains.

Offer an explicitly limited general-question mode if desired, but do not market it as equally validated.

## 21.2 MVP capabilities

- Decision framing and clarification.
- Alternatives and constraints capture.
- Two to four selected analytical capabilities.
- User-document evidence ingestion.
- Basic controlled retrieval if a reliable provider is available.
- Validated calculations for supported use cases.
- One cross-review pass.
- One optional targeted revision.
- Structured recommendation.
- Evidence-linked report.
- Explicit gaps and abstention.
- Saved decision history.
- Human decision recording.

Without reliable external retrieval, the system must clearly state that its analysis is based on supplied evidence rather than imply comprehensive current research.

## 21.3 MVP SaaS foundations

Required now:

- Tenant isolation.
- Authentication.
- Basic organization roles.
- Decision access control.
- Usage limits.
- Audit events.
- Backups.
- Cancellation and retries.
- Provider secret management.
- Operational telemetry.

These are not optional enterprise luxuries for a SaaS product handling sensitive decisions.

## 21.4 User experience

The workspace should show:

1. **Decision frame:** “Is this the right question?”
2. **Analysis plan:** “What will Council examine?”
3. **Evidence and gaps:** “What do we know?”
4. **Progress:** meaningful phase status, not simulated expert chatter.
5. **Report:** recommendation, conditions, alternatives, dissent.
6. **Evidence drill-down:** sources and calculations.
7. **Human action:** approve, reject, defer, or request revision.

## 21.5 MVP acceptance criteria

- A full decision can be submitted, analyzed, and inspected.
- A worker crash does not silently lose committed progress.
- Repeating a request does not create duplicate published results.
- All material published claims have provenance or explicit assumption/gap labels.
- Missing critical information prevents an unconditional positive recommendation.
- Calculations reproduce from stored inputs and tool versions.
- Cancellation stops new work.
- Tenant-isolation tests cover API, workers, storage, and retrieval.
- Budget limits constrain task creation and in-flight spending.
- The standard workflow demonstrates enough value over the single-analyst baseline to justify its extra cost.

Do not promise a universal latency or cost figure before measuring document volume, provider performance, and chosen models.

---

# 22. V1 Architecture

V1 should deepen reliability and evidence quality rather than merely add more agents.

### Product

- Additional validated decision templates.
- Decision revision comparison.
- Collaboration and comments.
- Approval workflows.
- Reusable organization policies.
- Scenario editing.
- Executive and technical report views.
- Public API and webhooks.

### Intelligence

- Better evidence retrieval.
- Stronger domain calculation packs.
- Calibrated routing.
- More systematic contradiction detection.
- Improved value-of-information prioritization.
- Bounded multi-step research.
- AI Knowledge integration.

### Platform

- Durable workflow engine if human pauses and branching justify it.
- Enterprise SSO.
- Connector permissions.
- More detailed document-level access.
- Per-tenant concurrency controls.
- Provider failover policies.
- Retrieval indexing.
- Production quality dashboards.

### Governance

- Recorded professional review.
- Explicit approval gates.
- Policy-version tracking.
- Outcome follow-up.
- Review of model and capability changes.

---

# 23. Future Architecture

Introduce these only when validated by customers or scale.

## 23.1 Enterprise-scale execution

- Separate evidence ingestion and retrieval services.
- Separate secure tool execution service.
- Dedicated financial/modeling compute pools.
- Regional execution and data residency.
- Tenant-specific worker pools.
- Dedicated deployment options.
- Customer-managed encryption keys.
- Advanced disaster recovery.

## 23.2 Advanced decision intelligence

- Portfolio-level capital allocation.
- Cross-decision dependency analysis.
- Monitoring of assumptions after a decision.
- Re-evaluation when evidence changes.
- Probabilistic models with calibrated inputs.
- Simulations and optimization.
- Industry-specific decision packs.
- Verified human-expert participation.

## 23.3 Carefully bounded autonomy

A future research subworkflow may explore an open-ended question, but it still needs:

- Explicit scope.
- Tool allowlists.
- Time and spend limits.
- Evidence contracts.
- Checkpoints.
- Termination rules.
- Human escalation.

Any ability to execute business actions should be a separate product boundary with transaction authorization and approval controls.

Council analysis must never silently become permission to move money, sign contracts, change infrastructure, or make employment decisions.

---

# 24. Major Architectural Risks

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| False expertise | Professional personas can imply qualifications the system does not possess | Capability-specific methods, evaluations, limits, and human review |
| Correlated model errors | Multiple analysts can reinforce the same mistake | Independent first passes, evidence checks, baseline comparisons, selective model diversity |
| False precision | Scores and confidence percentages can mislead executives | Evidence strength, scenario sensitivity, calibrated probabilities only |
| Unsupported synthesis | A final model may invent a bridge between valid findings and a recommendation | Claim-level provenance, recommendation consistency checks, publication gates |
| Coverage omissions | Planner may miss legal, safety, financial, or workforce issues | Mandatory coverage rules and explicit unknowns |
| Data availability | Strong reasoning cannot replace absent financial or operational data | Input readiness checks and appropriate abstention |
| Source laundering | An external AI answer may be mistaken for primary evidence | Source-class labels and underlying citation requirements |
| Prompt injection and exfiltration | Business documents and external pages may contain malicious instructions | Tool isolation, egress controls, least privilege, adversarial tests |
| Tenant leakage | Outputs can expose confidential inputs across users or organizations | End-to-end authorization, derived-artifact permissions, isolation tests |
| Workflow overengineering | Platform complexity can consume the MVP | Fixed bounded workflow, modular monolith, no unnecessary distributed services |
| Workflow underengineering | In-process calls fail on restarts and long analyses | Durable queue, persisted state, idempotency, recovery tests |
| Cost escalation | Research and repair loops can become unbounded | Reserved budgets, call caps, iteration limits, stop policies |
| User overreliance | A polished report may be treated as professional clearance | Explicit accountability, conditions, review gates, uncertainty presentation |
| Geographic and language mismatch | Generic models may mishandle local markets, laws, units, or accounting conventions | Localized evaluations, jurisdiction-aware sources, normalization |
| Poor evaluation | Attractive demos can conceal unreliable recommendations | Expert-reviewed test sets and ablation against simpler architectures |

The largest remaining risk is **not orchestration technology**. It is proving that Council reliably improves decision quality on real, incomplete, organization-specific problems.

---

# 25. Architecture Decision Records

| ADR | Decision | Consequence / revisit trigger |
| --- | --- | --- |
| ADR-001 | Council is decision support, not an autonomous executive | Human decisions are separate recorded events |
| ADR-002 | Use bounded deterministic orchestration | Less autonomous flexibility; greater control and auditability |
| ADR-003 | Replace GOD with decomposed responsibilities | Planning, authorization, scheduling, and synthesis remain independently testable |
| ADR-004 | Capabilities are typed executions, not persistent personas | Easier testing, routing, replacement, and cost attribution |
| ADR-005 | Use hybrid council formation | LLM flexibility is constrained by coverage and policy |
| ADR-006 | Use a modular monolith initially | Extract services only for demonstrated scaling or security needs |
| ADR-007 | PostgreSQL is the authoritative state store | Strong transactional consistency and simple operational model |
| ADR-008 | Use versioned evidence and claim-level provenance | Higher artifact-management effort, substantially better auditability |
| ADR-009 | Quantitative reasoning uses validated tools | Lower arithmetic risk; requires maintaining domain models |
| ADR-010 | No agent-majority voting | Preserve factual, methodological, and value-based disagreement |
| ADR-011 | AI Knowledge is an optional evidence provider | Council remains operational without it |
| ADR-012 | No hidden chain-of-thought dependency | Audit uses sources, assumptions, calculations, concise rationales, and execution metadata |
| ADR-013 | Build multi-tenancy and security foundations in MVP | Avoids a dangerous and expensive later retrofit |
| ADR-014 | Introduce vector search only after retrieval evaluation | Avoids premature infrastructure and unnecessary embeddings |
| ADR-015 | Bound analysis rounds and spending | Some research remains incomplete; gaps must be visible |
| ADR-016 | Model changes require regression evaluation | Slower upgrades, more stable product behavior |
| ADR-017 | Keep the single-analyst baseline in production architecture | Simpler execution remains available when multi-perspective work adds little value |
| ADR-018 | Adopt advanced workflow infrastructure when complexity warrants it | Domain records and contracts must remain engine-independent |

---

# 26. Recommended Implementation Sequence

## Stage 0: Define quality before building orchestration

Produce:

- Two initial decision templates.
- Decision and report schemas.
- Evidence classes.
- Materiality definitions.
- Publication and abstention rules.
- Expert-reviewed evaluation cases.
- Initial privacy and threat model.

**Exit condition:** The team can explain what constitutes a good, bad, unsupported, and appropriately deferred answer.

## Stage 1: Build the decision workspace and single-analyst baseline

Implement:

- Tenant and identity foundation.
- Decision/revision model.
- Document upload.
- Structured framing.
- LLM gateway.
- One analyst.
- Structured report.
- Basic provenance.

**Exit condition:** A useful end-to-end decision dossier can be produced and inspected.

## Stage 2: Add durable execution

Implement:

- Worker queue.
- Persisted workflow state.
- Task attempts.
- Idempotency.
- Retries and cancellation.
- Usage accounting.
- SSE progress.
- Outbox delivery.

**Exit condition:** Crash, retry, and duplicate-delivery tests pass.

## Stage 3: Add analytical capabilities

Implement:

- Capability registry.
- Task contracts.
- Hybrid planning.
- Coverage rules.
- Parallel and dependent tasks.
- Validated quantitative tools.

**Exit condition:** Both supported decision types use the same runtime without domain-specific orchestration hacks.

## Stage 4: Add structured cross-review

Implement:

- Claim extraction.
- Conflict classification.
- Unsupported-claim checks.
- Targeted revisions.
- Option evaluation.
- Publication gates.

**Exit condition:** Measured improvement over the baseline justifies the additional cost for at least the intended standard-mode cases.

## Stage 5: Harden the MVP

Implement and test:

- Prompt injection defenses.
- Tenant isolation.
- Source and derived-artifact permissions.
- Provider outage recovery.
- Budget exhaustion.
- Data deletion.
- Backup restoration.
- Human decision capture.

**Exit condition:** Safe pilot operation with explicit product limitations.

## Stage 6: Pilot with real decision owners

Measure:

- Which missing inputs block usefulness.
- Which perspectives users actually value.
- Whether recommendations change after review.
- Whether evidence drill-down is used.
- Time saved in preparing decisions.
- Cost and latency distribution.
- Cases of inappropriate confidence or abstention.

Use findings to choose V1 scope rather than expanding the agent roster speculatively.

---

# 27. Final Architecture Decision

## Why this architecture is superior

It places each responsibility where it can be controlled:

- LLMs interpret, analyze, critique, and summarize.
- Application code enforces workflow, permissions, coverage, and budgets.
- Deterministic tools calculate.
- Evidence records ground claims.
- Humans authorize consequential decisions.

It supports complex analysis without making autonomous agent behavior the reliability foundation.

## Assumptions it depends on

- Initial decisions are analytical, not real-time transactional commands.
- Users can provide at least some relevant organizational evidence.
- A narrow initial set of decision types is commercially acceptable.
- External model providers meet initial privacy requirements.
- Additional analytical perspectives can demonstrate value over a simpler baseline.

## Risks that remain

- Local or specialized knowledge may be incomplete.
- Evidence may be unavailable or unreliable.
- Models may share systematic biases.
- Recommendations may remain sensitive to uncertain assumptions.
- Human users may over-trust polished outputs.
- Decision-quality measurement will remain partly judgment-based.

## What should not be built yet

- A GOD super-agent.
- Twelve standing executive personas.
- Open-ended agent debate.
- A custom general-purpose workflow engine.
- An agent marketplace.
- Automatic fine-tuning on customer decisions.
- A graph database without demonstrated query needs.
- Kubernetes or Kafka without operational justification.
- Autonomous financial, legal, HR, or infrastructure actions.
- Broad claims of validated expertise across every business domain.

## What can change later without major refactoring

With stable domain contracts:

- Model providers and model families.
- Prompt implementations.
- Retrieval providers, including AI Knowledge.
- Capability inventory.
- Queue and workflow engine.
- Search implementation.
- Deployment topology.
- Report rendering.
- Provider-routing policy.

These changes will still require testing and migration work; abstraction reduces coupling, not all effort.

## What must be locked before implementation

1. Decision, revision, run, task, and report semantics.
2. Tenant and authorization boundaries.
3. Evidence provenance and source-permission model.
4. Agent/task contract and versioning strategy.
5. Human-versus-system authority.
6. Recommendation and abstention semantics.
7. Budget ownership and enforcement.
8. Retention, privacy, and provider constraints.
9. Initial supported decision types.
10. Evaluation and release criteria.

## Bottom line

**Build Council as a disciplined decision system that uses AI—not as an AI society that happens to produce a report.**

Its defensible value will come from reliable framing, relevant evidence, reproducible analysis, visible disagreement, and accountable human decisions. The number of agents is an implementation detail.
