# AI-Powered Vehicle Insurance Claims Processing
## Full Product Requirements Document (Extended Version)

---

## Executive Summary

**Mission:** Help the claims team pay the right amount, as fast as possible, with minimal fraud.

**Vision:** Policyholders submit claims in minutes. Agents focus on judgment and relationships. Every decision is backed by AI-generated evidence.

Today, claims agents spend most of their time on information collection, damage review, and cost estimation. These are repeatable tasks that leave little bandwidth for the work that requires human judgment: resolving liability conflicts, managing customer anxiety, and approving complex claims.

This product introduces a multi-agent AI pipeline that absorbs the overhead and surfaces decision-ready claim packages to agents. Every human decision is preserved. AI accelerates the path to it.

Why AI and not traditional software: the variability in damage types, cost databases, policy conditions, and fraud patterns makes rule-based automation insufficient. Only a learning system that improves with feedback can handle this complexity at scale.

---

## Problem Statement

**Current workflow**
- Policyholder reports incident via phone or web form
- Claims agent manually collects incident details, verifies policy, coordinates evidence
- Agent reviews photos, cross-references repair cost databases, generates estimate
- Senior adjuster reviews and approves
- Entire process is sequential, agent-dependent, and reliant on individual expertise

**Where it breaks down**

*Slower TAT:*
- Incomplete or inaccurate policyholder information triggers repeated back-and-forth
- Straightforward claims sit in the same queue as complex ones
- No intelligent triage

*Inaccurate estimates:*
- Assessment relies on individual agent expertise and inconsistent database usage
- Estimate quality varies significantly across agents
- Creates disputes with policyholders and repair shops

*Fraud exposure:*
- Manual review cannot systematically detect soft fraud, double-dipping, or unauthorised drivers at scale
- Fraud signals are missed or caught too late

**The consequence**

Claims agents spend most of their time on the lowest-judgment work in the process. The highest-value work: liability resolution, customer management, and approval decisions is under-resourced and rushed.

**What needs to be true**

Eliminate agent involvement in low-judgment work so every claim that reaches a human reviewer arrives complete, structured, and evidence-backed. Human judgment remains central to every decision. The goal is not to replace that judgment, but to ensure it is never wasted on administration.

---

## Goals and Success Metrics

**Business goals**
- Reduce claims processing cost per claim through automation
- Reduce fraud exposure across the claims portfolio
- Improve estimate accuracy to reduce disputes
- Improve policyholder retention through faster, more transparent claims

**User goals**

| User | Goal |
|---|---|
| Policyholder | Submit a complete claim in one interaction with immediate confirmation |
| Claims Agent | Receive decision-ready packages, focus on judgment not administration |
| Senior Adjuster | Review structured, evidence-backed estimates with clear approval paths |

**Industry benchmarks** *(proxies, to be replaced with client actuals)*
- Average repair cycle time: 18.9 days (J.D. Power, 2024)
- 82% of insurance executives report claims take more than 30 days to close (Five Sigma, 2023)
- 10-20% of insurance claims estimated to be fraudulent (Coalition Against Insurance Fraud)
- 46% of auto insurance consumers frustrated with lengthy claims (LexisNexis, 2024)

**Tier 1: Business metrics** *(lagging)*

| Metric | Mission Objective | Baseline | Target |
|---|---|---|---|
| Time from FNOL to estimate generated | Faster TAT | 5-7 days (J.D. Power, 2024) | <24 hours |
| Claim intake completion rate (first submission) | Faster TAT | ~60% (industry proxy) | >90% |
| Damage assessment accuracy vs. settled amount | Right Amount | Unknown | Within 10% variance |
| Fraud flag precision (true positive rate) | Minimal Fraud | Manual, inconsistent | >75% by V1 |
| Fraud flag false positive rate | Minimal Fraud + Faster TAT | Unknown | <10% |
| Policyholder CSAT post-interaction | Customer Experience | 871/1000 (J.D. Power) | Maintain or improve |
| Claims agent time on intake and assessment | All three | ~60% of work time | <20% by V2 |

**Tier 2: Agent-level metrics** *(leading indicators)*

| Agent | Metric | Tied To |
|---|---|---|
| Intake Agent | Claim completion rate on first submission | Faster TAT, FNOL time |
| Intake Agent | LLM-as-judge friendliness score | Policyholder CSAT |
| Intake Agent | Photo quality pass rate on first submission | Labeller accuracy, FNOL time |
| Labeller Agent | Precision/recall on damage identification | Assessment accuracy vs. settled amount |
| Labeller Agent | Human override rate | Assessment accuracy, agent time saved |
| Labeller Agent | Confidence score distribution (% above threshold) | Assessment accuracy, FNOL time |
| Cost Estimator Agent | Line item acceptance rate | Assessment accuracy vs. settled amount |
| Cost Estimator Agent | Estimate variance vs. repair shop final price | Right Amount |
| Cost Estimator Agent | RAG retrieval precision | Assessment accuracy, Right Amount |
| Fraud Detection Agent | True positive rate | Minimal Fraud |
| Fraud Detection Agent | False positive rate | Faster TAT, Policyholder CSAT |

---

## Target Users and Personas

| Persona | Role | Core Need | Pain Point | AI Readiness | Trust Concerns |
|---|---|---|---|---|---|
| Policyholder | Incident reporter | Fast, stress-free claim submission | Complex forms, long wait times, uncertainty | High: comfortable with chat interfaces | Will AI fairly assess my damage? |
| Claims Agent | Intake, assessment, resolution | Decision-ready claim packages | Overwhelmed by admin, inconsistent estimates | Medium: open to AI, protective of expertise | Will AI replace my judgment? |
| Senior Adjuster | Approval and escalation | Structured, evidence-backed packages | Reviewing incomplete claims wastes time | Medium: values consistency and auditability | Is the AI estimate defensible? |

**AI readiness notes**
- Policyholders: low adoption friction if the experience is smooth
- Claims agents: need transparency into AI reasoning. Confidence scores and itemised breakdowns are non-negotiable. Black box outputs will be rejected.
- Senior adjusters: need audit trails. Every AI decision must be traceable for compliance and dispute resolution.

---

## User Journey

**Phase 1: Intake (Policyholder and AI Intake Agent)**

| Step | Actor | Action | AI Role |
|---|---|---|---|
| 1 | Policyholder | Initiates claim via web/app chat | AI intake agent opens conversation |
| 2 | AI Intake Agent | Verifies policy, identity, coverage | Calls policy database, returns verification |
| 3 | Policyholder | Describes incident | AI extracts structured data, prompts for missing fields |
| 4 | AI Intake Agent | Determines documentation requirements | Minor: photos only. Major: photos + police report |
| 5 | Policyholder | Submits damage photos | AI checks quality and completeness |
| 6 | AI Intake Agent | Creates incident and claim objects, confirms to policyholder | Hands off to assessment pipeline |

*Failure states: Policy inactive: agent notified. Incomplete photos: AI prompts resubmission. Police report missing: claim parked, policyholder nudged.*

**Phase 1.5: Fraud Detection (Parallel, non-blocking)**

| Step | Actor | Action |
|---|---|---|
| 1 | Fraud Detection Layer | Checks photos and incident data for manipulation, duplicate claims, policy anomalies |
| 2 | Fraud Detection Layer | Scores claim: Low / Medium / High |
| 3 | If High | Flags for claims agent review before assessment proceeds |

**Phase 2: Assessment (Claims Agent and AI Assessment Agents)**

| Step | Actor | Action | AI Role |
|---|---|---|---|
| 1 | Labeller Agent | Analyzes submitted photos | Generates bounding boxes, part ID, severity, confidence scores |
| 2 | Claims Agent | Reviews labelled output | Approves, adjusts, or overrides labels |
| 3 | Cost Estimator Agent | Takes approved labels, generates estimate | Cross-references repair DB, applies fine-tuned model |
| 4 | Claims Agent | Reviews itemised estimate | Approves, adjusts, or escalates. Makes total loss vs. repair call. |

*Failure states: Confidence below threshold: human review flagged. Rare car model or complex damage: escalated immediately.*

**Phase 3: Resolution (Claims Agent, Senior Adjuster, and AI)**

| Step | Actor | Action | AI Role |
|---|---|---|---|
| 1 | AI | Generates formal cost estimate | Structured output from approved assessment |
| 2 | AI | Notifies senior adjuster | Automated nudge with claim summary |
| 3 | Senior Adjuster | Reviews and approves or rejects | Human decision only |
| 4 | AI | Generates policyholder communication | Templated output with claim-specific data |

*Failure states: Adjuster rejects: returned to claims agent with reason. Total loss flagged: separate escalation path.*

---

## Use Cases

**Phase 1: Intake**

| Priority | Use Case | Notes |
|---|---|---|
| P0 | Policyholder submits complete, valid claim in single interaction | Happy path |
| P1 | Policyholder has incomplete information | AI parks claim, sends completion nudge |
| P1 | Unclear or low-quality photos | AI prompts resubmission with guidance |
| P2 | Policy inactive or incident outside coverage | AI informs policyholder, notifies agent |
| P2 | Human injury involved | Flagged for specialist handling, escalated immediately |
| P2 | Liable party conflict | AI captures both statements, flags conflict, escalates |

**Phase 2: Assessment**

| Priority | Use Case | Notes |
|---|---|---|
| P0 | AI generates complete, accurate itemised estimate from photos | Happy path |
| P1 | Overlapping or complex damage, confidence below threshold | Labeller flags for claims agent review |
| P1 | Rare or unusual vehicle model | Escalated with partial AI output as starting point |
| P2 | Total loss determination | Cost estimator flags, claims agent makes final call |
| P2 | Claim involves injury liability costs | Flagged out of scope, routed separately |

**Phase 3: Resolution**

| Priority | Use Case | Notes |
|---|---|---|
| P0 | Adjuster approves, policyholder communication generated | Happy path |
| P1 | Adjuster has questions on estimate | Returned to claims agent with adjuster notes |
| P2 | Adjuster rejects claim entirely | Structured rejection communication generated |

**Fraud Detection (Cross-cutting)**

| Priority | Use Case | Notes |
|---|---|---|
| P0 | Claim passes fraud scoring, proceeds to assessment | Low risk |
| P1 | Medium fraud risk, flagged for agent awareness | Proceeds with agent notification |
| P2 | High fraud risk, claim held for human review | Agent reviews before assessment begins |

---

## Solution Overview

**Three surfaces**
- Policyholder chat interface (mobile): intake
- Claims agent dashboard (web): assessment and resolution
- Senior adjuster review interface (web): approval

**Surface 1: Policyholder Chat Interface (Mobile)**
- Conversational interface, one question at a time
- Identity verification, incident description, photo submission in one session
- Immediate claim confirmation with reference ID and next steps
- Warm, empathetic tone. No jargon.

**Surface 2: Claims Agent Dashboard**
- Every claim arrives pre-populated with policy status, incident summary, AI damage labels, itemised cost estimate
- Next required action surfaced automatically based on claim state
- All AI outputs transparent, editable, and overridable at line-item level

**Surface 3: Senior Adjuster Review Interface**
- Condensed, decision-ready claim summary
- Single approve or reject action
- Rejection reason routed automatically to claims agent

**What AI owns**
- Policy and identity verification
- Incident data extraction and structuring
- Photo quality validation
- Damage labelling and confidence scoring
- Cost estimation and database cross-referencing
- Fraud risk scoring
- Formal estimate generation
- Policyholder communications (reviewed before sending)

**What remains human**
- Liable party conflict resolution
- Total loss vs. repair final call
- Fraud hold review
- Estimate approval and rejection

**UX principles**
- Transparency: every AI output includes confidence scores and reasoning signals
- Editability: every AI output overridable at itemised level
- State-driven: UI always surfaces the next action
- Auditability: every decision logged with timestamp and actor
- Native observability: every AI inference traceable to its source

---

## AI System Design

**Architecture overview**

Four specialised agents operate as a sequential pipeline with a parallel fraud detection layer. Each agent has discrete inputs, outputs, confidence scoring, and an independent feedback loop.

**Agent 1: Intake Agent**

| | |
|---|---|
| Model Type | Conversational LLM |
| Model | Claude / GPT-4.1 with structured output enforcement |
| Inputs | Policyholder messages, policy database |
| Outputs | Verified incident object, claim request object |
| Human trigger | Invalid policy, injury, liable party conflict |
| Feedback loop | Claim completion rate, resubmission rate, escalation rate |

**Agent 2: Fraud Detection Agent**

| | |
|---|---|
| Model Type | Multimodal classifier + anomaly detection |
| Model | Fine-tuned vision model + claims history embedding retrieval |
| Inputs | Submitted photos, incident metadata, policy history, claims history |
| Outputs | Fraud risk score (Low/Medium/High), contributing signal breakdown |
| Human trigger | High risk score: claim held, agent reviews before proceeding |
| Feedback loop | Agent override rate, confirmed fraud vs. flagged (precision/recall) |

**Agent 3: Labeller Agent**

| | |
|---|---|
| Model Type | Computer vision: object detection + severity classification |
| Model | Fine-tuned vision model (e.g. YOLO-based), trained on labelled vehicle damage datasets |
| Inputs | Submitted damage photos |
| Outputs | Bounding boxes, part ID, severity classification, confidence score per label |
| Human trigger | Confidence below configurable threshold, rare vehicle model, overlapping damage |
| Feedback loop | Agent approval rate, override rate, confidence calibration over time |

**Agent 4: Cost Estimator Agent**

| | |
|---|---|
| Model Type | Fine-tuned LLM + RAG pipeline |
| Model | Fine-tuned on historical claims data. RAG over repair cost database. |
| Inputs | Approved damage labels, vehicle make/model/year, repair cost database |
| Outputs | Itemised estimate (parts + labour) per damaged part, total estimate, total loss flag |
| Human trigger | All estimates: agent approves at line-item level. Total loss: mandatory human decision. |
| Feedback loop | Acceptance rate per line item, estimate variance vs. final settled amount |

**Human-AI interaction model**

AI is never a gatekeeper. Every claim reaches a human reviewer. Three interaction levels:
- Approve: agent accepts AI output. Logged as positive signal.
- Adjust: agent modifies at line-item level. Delta logged as correction signal.
- Override: agent rejects entirely. Reason logged as strong retraining signal.

**Continuous improvement infrastructure**

A dedicated feedback capture layer (analogous to Scale AI's Dialect) intercepts all human decisions, extracts reasoning, and structures them as labelled retraining inputs automatically. No manual retraining pipelines required. Confidence thresholds tighten over time as feedback accumulates.

---

## Data Requirements

| Data Source | Purpose | Risks |
|---|---|---|
| Policy database | Identity verification, coverage type, plan validity | PII exposure, requires secure API access |
| Historical claims data | Fine-tuning cost estimator, fraud pattern detection | PII: requires anonymisation before training |
| Repair cost database | RAG pipeline for cost estimator | Staleness risk: requires regular updates |
| Vehicle damage image datasets | Training labeller agent | Labelling quality, rare vehicle model gaps |
| Police reports | Incident verification, liable party confirmation | Inconsistent format across jurisdictions |
| Fraud case history | Training fraud detection agent | Class imbalance: fraud is a small % of total claims |

**Data quality requirements**
- Labeller agent: high-quality, consistently labelled damage images across vehicle types, severities, and lighting conditions
- Cost estimator: historical claims with final settled amounts, not just initial estimates
- Fraud detection: confirmed fraud case labels, carefully handled to avoid class imbalance

**Privacy considerations**
- All policyholder PII anonymised before model training
- Photo data (license plates, faces) redacted before training pipeline
- Data retention policies must comply with applicable insurance regulations per jurisdiction

---

## AI Evaluation Framework

**Offline evaluation**

| Agent | Metric | Method |
|---|---|---|
| Intake Agent | Structured output completeness | % of claim objects fully populated on first submission |
| Intake Agent | Tone and user comfort (LLM-as-judge) | Sample conversations scored on friendliness, clarity, empathy |
| Labeller Agent | Precision/recall on damage identification | Held-out labelled dataset vs. human annotations |
| Labeller Agent | Confidence calibration | Whether confidence scores accurately predict correctness |
| Labeller Agent | Latency | P95 inference time target: <5 seconds per image batch |
| Cost Estimator | Estimate variance vs. settled amount | Held-out historical claims |
| Cost Estimator | Line item accuracy | Per-part estimate vs. repair database ground truth |
| Cost Estimator RAG | Retrieval recall | % of cases where relevant data exists but was not retrieved |
| Cost Estimator RAG | Retrieval precision | % of retrieved items correct for vehicle model and damage type |
| Cost Estimator RAG | Faithfulness | Right information retrieved but not correctly attributed |
| Cost Estimator RAG | Answer completeness | All relevant repair items retrieved and represented |
| Fraud Detection | Precision/recall on fraud flags | Held-out confirmed fraud cases vs. clean claims |

**Online evaluation**

| Agent | Metric | Signal Source |
|---|---|---|
| Intake Agent | Claim completion rate on first submission | % of claims requiring no follow-up |
| Intake Agent | CSAT post-interaction | Policyholder survey at end of intake |
| Labeller Agent | Human override rate | Claims agent corrections in dashboard |
| Labeller Agent | Confidence threshold breach rate | % of claims escalated for low confidence |
| Labeller Agent | Latency in production | P95 inference time monitored continuously |
| Cost Estimator | Line item acceptance rate | Agent approvals vs. adjustments |
| Cost Estimator | Estimate vs. repair shop final price variance | Post-repair settlement data |
| Fraud Detection | True positive rate | Confirmed fraud cases that were flagged |
| Fraud Detection | False positive rate | Clean claims incorrectly held for review |

**Human QA**
- Monthly senior adjuster spot-check of AI-approved estimates
- Quarterly claims agent calibration sessions to identify model drift via override patterns
- Quarterly edge case review board: all escalated claims reviewed for new training requirements

**Ship thresholds**
- Intake Agent: >90% claim completion rate, LLM-as-judge friendliness >4/5
- Labeller Agent: >85% precision on standard damage types, P95 latency <5 seconds
- Cost Estimator: estimate variance within 15%, RAG retrieval precision >90%
- Fraud Detection: >75% precision, <10% false positive rate

---

## Risks and Mitigations

**AI and product risks**

| Risk | Impact | Mitigation |
|---|---|---|
| Labeller misidentifies damage | Inaccurate estimate, dispute | Configurable confidence threshold, auto-escalate below threshold |
| Cost estimator retrieves wrong repair data | Inaccurate estimate | RAG retrieval precision eval pre-deployment. Agent approves at line-item level. |
| Fraud detection false positives | Policyholder frustration, increased TAT | <10% false positive rate as ship threshold |
| Intake agent fails to collect complete information | Incomplete claim, delayed processing | Claim parked with completion nudge. Dropout rate monitored. |
| AI estimate disputed by repair shop | Negotiation friction, cost overrun | Post-repair settlement variance tracked as ongoing eval metric |
| Model drift over time | Declining accuracy, increasing override rates | Quarterly edge case review board. Override rate monitored as drift signal. |
| Over-reliance on AI by claims agents | Systematic errors go uncorrected | Monthly adjuster spot-checks. Override rate drop monitored for rubber-stamping. |

**Regulatory and compliance risks**

| Risk | Impact | Mitigation |
|---|---|---|
| AI estimates used without adequate human oversight | Legal liability, regulatory penalty | All estimates require human approval. Full audit trail maintained. |
| Policyholder PII used in training without consent | Regulatory penalty, reputational damage | PII anonymised before training. Data usage reviewed per jurisdiction. |

---

## Technical Requirements

**System architecture**
- Multi-agent pipeline with discrete, independently deployable agents
- Agents communicate via structured data contracts
- Fraud detection runs as a parallel, non-blocking process
- All agent outputs stored with versioning for audit and retraining

**API and integration requirements**
- Secure API: policy database (real-time verification)
- Secure API: repair cost database (RAG pipeline, <500ms retrieval latency)
- Police report ingestion: structured parser for inconsistent formats across jurisdictions
- Repair shop database: read access for approved shop mapping at resolution

**Data infrastructure**
- Vector database for repair cost RAG pipeline
- Claims data warehouse with final settled amounts
- Feedback capture layer: intercepts all human actions in real time
- PII anonymisation pipeline before training
- Photo storage with metadata and quality validation status

**Model infrastructure**
- Labeller agent: GPU inference required, P95 latency <5 seconds
- Cost estimator: total latency target <10 seconds
- Model versioning: enables rollback if new version underperforms
- Confidence score generation co-located with inference

**Security requirements**
- All policyholder data encrypted at rest and in transit
- Role-based access control across agents, claims agents, adjusters, admins
- Audit log: immutable, timestamped for all AI decisions and human overrides
- Photo redaction pipeline: license plates and faces removed before training

---

## UX/UI Requirements

**Surface 1: Policyholder Chat Interface (Mobile)**
- Mobile-first conversational interface, one question at a time
- Inline photo upload with native camera access
- Real-time photo quality validation feedback
- Policy verification status shown inline
- Claim confirmation screen: reference ID, summary, expected timeline
- Tone: warm, empathetic, no jargon

**Surface 2: Claims Agent Dashboard (Web)**
- State-driven layout: next required action always prominently surfaced
- Persistent claim summary card across all states
- Damage assessment panel: labelled photos with bounding boxes, confidence scores, approve/adjust/override per label
- Cost estimate panel: itemised parts and labour with source attribution per item
- Feedback input: override reason required, feeds retraining pipeline
- Claim queue: sortable by state, age, estimated value
- Audit trail panel: full history of AI decisions and human actions

**Surface 3: Senior Adjuster Review Interface (Web)**
- Condensed claim summary
- Single approve or reject action, mandatory structured reason on rejection
- Rejection reason routed automatically to claims agent
- Full audit trail visible

**Shared UX principles**
- Transparency: every AI output includes confidence scores
- Editability: every AI output overridable at itemised level
- State-driven: UI always surfaces next action
- Recoverability: every action reversible until claim moves to next state
- Auditability: every decision logged
- Native observability: every AI inference traceable to its source

---

## Rollout Plan

**MVP: Core Claims Pipeline**

Scope: F2 (Labeller) + F3 (Cost Estimator) + F4 (Claims Dashboard) + F6 (Adjuster Review). F1 (Intake Agent) included as quality infrastructure assumption.

What ships:
- Policyholder mobile chat interface
- Claims agent dashboard with state-driven workflow
- Senior adjuster review interface

What does not ship:
- Fraud detection agent
- Automated policyholder comms (drafted manually in MVP)
- Repair shop mapping (manual in MVP)

Exit criteria:
- Claim completion rate on first submission >80%
- Labeller confidence score distribution: >70% of labels above threshold without escalation
- Cost estimator line item acceptance rate >70%

**V1: Closing the Loop**

Scope: F5 (Fraud Detection) + F8 (Automated Policyholder Comms) + repair shop mapping + total loss gate

Exit criteria:
- Fraud detection false positive rate <10%
- Policyholder CSAT >4/5
- Claims agent time on intake and assessment <30%
- Estimate variance vs. repair shop within 15%

**V2: Intelligence and Scale**

Scope: F7 (Continuous Improvement Layer) + confidence threshold optimisation + liable party conflict resolution assistance

Exit criteria:
- Override rate declining quarter-over-quarter
- Claim completion rate >90%
- Claims agent time on intake and assessment <20%
- Fraud true positive rate >75%

---

## Future Opportunities

- **Autonomous straight-through processing:** as confidence thresholds tighten and override rates drop, low-complexity claims below a value threshold could be approved without human intervention. Faster TAT, lower cost per claim.
- **Predictive risk scoring at policy inception:** extend fraud and damage models upstream to assess risk at point of policy purchase. Informs underwriting decisions and premium pricing.
- **Cross-insurer fraud network:** double-dipping and staged accident fraud operates across insurers. A shared fraud signal network across participating insurers improves fraud detection precision beyond what any single insurer's data can achieve.

---

*This is the extended full PRD. The 3-page condensed version submitted as the assignment deliverable is available separately.*
