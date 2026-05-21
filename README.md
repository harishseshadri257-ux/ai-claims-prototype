# AI-Powered Vehicle Insurance Claims Prototype

This is a take-home PM assignment prototype by Harish Seshadri demonstrating an AI-powered claims processing workflow for a vehicle insurance company. It covers the core claims agent experience — damage assessment and cost estimation — with a senior adjuster review layer on top. Built with Next.js (App Router) and Tailwind CSS. All AI responses are mocked; there is no backend or live model inference.

---

## How to Run

**Prerequisites:** Node.js 18+, npm

```bash
git clone https://github.com/harishseshadri257-ux/ai-claims-prototype
cd ai-claims-prototype
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Prototype Walkthrough

**Claims Queue**
The landing screen. Lists all incoming claims with claim ID, policyholder name, state badge, coverage type, estimated total, and submission date. A "New Claim Request" modal allows intake of a new claim with policy details, incident metadata, and a damage photo upload. Claims in the PENDING_APPROVAL state surface a "Review as Adjuster" shortcut button.

**Screen 2 — NEW**
The starting state for a claim. Displays a persistent claim summary card (policy number, coverage type, incident type, liable party, police report) and a verification flags row (Policy Active, Driver License Verified, Police Report Filed). 
The agent can view submitted photos and upload additional photos before triggering the labeller. 
A "Run Damage Labeller" CTA transitions the claim to ASSESSING with a simulated 2-second loading state.

**Screen 3 — ASSESSING**
The damage assessment workspace. Shows the damage photo with bounding box overlays colour-coded by severity. 
Clicking a box highlights the corresponding row in the damage labels table below. 
The table lists each detected part with severity badge, confidence score, bounding box ID, and status. 
Labels with confidence below 80% are flagged with a warning and require explicit acknowledgement before approval. 
Each label can be approved, adjusted (with severity change and a required Agent Notes field), or overridden (with a required Override Reason field). 
Trace panels expand per row to show model name, dataset, and agent notes. 
An AI disclaimer banner sits at the top of the section. Once all labels are resolved, a "Run Cost Estimator" CTA advances the claim.

**Screen 4 — ESTIMATE_GENERATED**
Shows two sections. The first is a read-only resolved damage labels summary with the Agent Notes column surfaced for any adjusted or overridden labels. 
The second is the itemised cost estimate with a parts and labour sub-row per line item, source attribution badges per row (expandable to show full source detail), status badges, and approve/adjust actions per item. 
An AI disclaimer banner sits at the top of the cost section. 
A three-line total (parts subtotal, labour subtotal, grand total) sits at the bottom. 
Once all cost items are resolved, a "Preview Estimate" CTA advances the claim.

**Screen 5 — PENDING_APPROVAL**
A read-only estimate preview showing the full damage assessment and cost estimate for agent sign-off. The agent submits the claim for adjuster review via a single CTA. On submission, the view transitions to a confirmation state with a link back to the queue.

**Screen 6 — Senior Adjuster Review**
A separate dashboard view accessible from the claims queue. 
Shows a condensed claim summary, the full damage assessment summary (with Agent Notes column and expandable trace panels), and the full cost estimate with parts/labour breakdown and expandable source badges. 
The adjuster approves or rejects via two large CTAs. Approval requires a confirmation modal. 
Rejection requires selecting a structured reason from a dropdown and optionally adding notes.

**Screen 7 — Post-Approval**
End-state screens for both outcomes. 
On approval: a success banner, a pre-drafted customer communication (editable-ready), a list of three authorised repair shops, and a "Send Communication to Customer" CTA with a toast confirmation. 
On rejection: a summary card showing the rejection reason and notes, with a link back to the queue.

---

## How the Prototype Maps to the PRD

| PRD Feature | Prototype Implementation |
|---|---|
| F2 Damage Labeller Agent | Mocked — bounding box overlays with confidence scores, trace panels showing model and dataset attribution |
| F3 Cost Estimator Agent | Mocked — itemised parts and labour estimate with RAG-style source attribution per line item |
| F4 Claims Agent Dashboard | Fully implemented — state-driven UI with persistent claim summary, next action banners, and progressive state machine |
| F6 Senior Adjuster Review | Fully implemented — approve/reject flow with structured reason and end-state screens |
| Intake Agent | Not in prototype scope — New Claim Request modal as an alternative to intake agent handoff |
| F5 Fraud Detection | Not in prototype scope — V1 feature per PRD prioritisation |
| F7 Continuous Improvement | Not in prototype scope — V2 feature per PRD prioritisation |

---

## How Mock AI Works

**Damage Labeller.** In production this would be a fine-tuned computer vision model (e.g. YOLO-based) trained on labelled vehicle damage datasets. In the prototype, damage labels, bounding box coordinates, confidence scores, and trace data are hardcoded in `data/mockClaims.ts`. The 2-second loading state simulates inference latency.

**Cost Estimator.** In production this would be a fine-tuned LLM with RAG over a repair cost database and historical claims data. In the prototype, itemised cost estimates with parts, labour, and source attribution are hardcoded in `data/mockClaims.ts`. Source detail text simulates RAG retrieval from Mitchell RepairDB v4.2 and historical claim records.

**Human-in-the-loop.** All approve, adjust, and override interactions are fully functional and update local React state. In production these interactions would be captured by a feedback layer (e.g. Scale AI Dialect) and structured as labelled retraining signals for model improvement.

---

## Repo Structure

```
/app                        Next.js pages and routing
/app/claims/[id]            Claims agent assessment flow
/app/adjuster/[id]          Senior adjuster review flow
/components                 Reusable UI components
/data/mockClaims.ts         All mock claim data including AI outputs, bounding boxes, cost estimates
/docs                       PRD and architecture notes
/public/images              Damage photo assets
CLAUDE.md                   Claude Code context file
```

---

## Assignment Context

Built as part of a PM take-home assignment for an AI Product Manager role. The PRD is available in `/docs`. The prototype demonstrates the core claims agent workflow — damage assessment and cost estimation — with mocked AI responses. The full product vision including intake agent, fraud detection, and continuous improvement layer is documented in the PRD.
