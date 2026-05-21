# Architecture Notes — AI Claims Prototype

---

## 1. System Architecture Overview

The system is a four-agent sequential pipeline. Each agent produces a structured output that becomes the structured input for the next agent.

**Intake Agent**
- Type: conversational LLM
- Input: policyholder-submitted incident report (text + photos)
- Output: verified claim object containing policyholder identity, policy number, incident metadata, liability classification, and uploaded photos
- Responsibility: verify identity, validate policy status, confirm driver license, collect police report reference

**Fraud Detection Agent**
- Type: multimodal classifier (images + structured incident data)
- Input: claim object from Intake Agent
- Output: fraud risk score (Low / Medium / High) with contributing signals
- Runs in parallel with the claim arriving at the Claims Agent Dashboard — it does not block the pipeline except on High risk scores, which require mandatory human review before the claim can advance

**Damage Labeller Agent**
- Type: fine-tuned computer vision model (e.g. YOLO-based)
- Input: submitted damage photos
- Output: per-part bounding boxes, part ID, severity classification (Minor / Moderate / Severe), and confidence score per label
- Trace data logged at inference: model name, training dataset, bounding box ID

**Cost Estimator Agent**
- Type: fine-tuned LLM with RAG over a repair cost database and historical claims data
- Input: agent-approved damage labels + vehicle metadata (make, model, year)
- Output: itemised estimate with parts cost, labour hours, labour rate, and source attribution per line item
- Source attribution cites specific repair DB entries or historical claim references used in retrieval

**Pipeline flow**

```
Policyholder
    |
    v
Intake Agent --> Claim Object
    |                   |
    |           Fraud Detection (parallel)
    |                   |
    v                   v
Claims Dashboard (NEW) + Fraud Score
    |
    v
Damage Labeller --> Labels + Bounding Boxes
    |
    v
Claims Agent Review (approve / adjust / override)
    |
    v
Cost Estimator --> Itemised Estimate
    |
    v
Claims Agent Review --> Submit for Approval
    |
    v
Senior Adjuster --> Approve / Reject
    |
    v
Customer Communication (AI-drafted)
```

---

## 2. How Mock Data Maps to Real AI Components

| Prototype Element | What it represents in production | Location in codebase |
|---|---|---|
| Hardcoded damage labels with bounding boxes | Output of a fine-tuned computer vision model (e.g. YOLO-based) | `data/mockClaims.ts` |
| Confidence scores per label | Model certainty score from CV inference | `data/mockClaims.ts` |
| Bounding box coordinates | Pixel-level damage localisation from object detection | `data/mockClaims.ts` |
| Trace data (model name, dataset) | Model card metadata logged at inference time | `data/mockClaims.ts` |
| Itemised cost estimate with parts and labour | Output of fine-tuned LLM + RAG retrieval over repair cost DB | `data/mockClaims.ts` |
| Source attribution per line item | RAG retrieval citation: repair DB entry or historical claim reference | `data/mockClaims.ts` |
| 2-second loading state | Simulated inference latency for CV and LLM models | `app/claims/[id]/page.tsx` |
| Agent notes on adjust/override | Feedback signal captured for model retraining | `app/claims/[id]/page.tsx` |

---

## 3. Agent Interaction Flow

1. Policyholder submits incident via Intake Agent. Output: verified incident object and claim request object with photos attached.

2. Fraud Detection Agent runs in parallel on photos and incident metadata. Output: fraud risk score and contributing signals attached to the claim object.

3. Claim arrives at the Claims Agent Dashboard in NEW state with intake output and fraud score attached.

4. Claims Agent triggers the Damage Labeller. Input: submitted photos. Output: bounding boxes, part ID, severity classification, and confidence score per detected part.

5. Claims Agent reviews labels. Each label is approved, adjusted with a severity change and required Agent Notes, or overridden with a required Override Reason. Approved labels are passed to the Cost Estimator.

6. Cost Estimator Agent runs. Input: approved damage labels, vehicle metadata, repair cost DB. Output: itemised parts and labour estimate with source attribution per line item.

7. Claims Agent reviews and approves or adjusts each cost line item. Submits the resolved estimate to the Senior Adjuster.

8. Senior Adjuster approves or rejects. On approval, an AI-drafted customer communication is generated with repair shop options and sent to the policyholder.

---

## 4. Human-in-the-Loop Design

**Three-level interaction model**

| Action | What the agent does | Signal captured |
|---|---|---|
| Approve | Accepts AI output as-is | Positive training signal |
| Adjust | Modifies at line-item level with required notes | Correction delta logged with notes as context |
| Override | Rejects AI output entirely with required reason | Strong retraining signal |

Notes fields on Adjust and Override are required, not optional. They provide structured natural-language context that makes the feedback signal interpretable for retraining, rather than a bare label flip.

**Confidence threshold enforcement**

Labels below 80% confidence require explicit acknowledgement before the agent can approve them. This is not purely a UX guard. It creates a clear accountability boundary: the agent is attesting they have manually reviewed a low-certainty inference before accepting it. The 80% threshold is configurable per model version and can be tightened as the model matures.

**Feedback capture layer**

In production, all approve, adjust, and override interactions are intercepted by a feedback capture layer (analogous to Scale AI Dialect) that structures them as labelled retraining inputs automatically. The prototype uses local React state to simulate the same interactions. The data shape is identical: label ID, original AI output, final accepted value, agent notes, and timestamp. This means the interaction design can be validated in the prototype before the feedback infrastructure is built.

---

## 5. State Machine

Each claim moves through a fixed sequence of states. The UI always surfaces the next required action for the current state.

```
NEW -> ASSESSING -> ESTIMATE_GENERATED -> PENDING_APPROVAL -> APPROVED
                                                          \-> REJECTED
```

| State | Owner | Entry condition | Exit condition |
|---|---|---|---|
| NEW | Claims Agent | Claim submitted by Intake Agent | Agent triggers Damage Labeller |
| ASSESSING | Claims Agent | Labeller output received | All damage labels resolved |
| ESTIMATE_GENERATED | Claims Agent | All labels approved, Cost Estimator run | All cost items resolved |
| PENDING_APPROVAL | Claims Agent | Estimate submitted for review | Senior Adjuster decision |
| APPROVED | Senior Adjuster | Adjuster approves estimate | Communication sent to policyholder |
| REJECTED | Senior Adjuster | Adjuster rejects estimate | Claim reassigned for reassessment |
