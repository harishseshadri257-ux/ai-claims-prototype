# CLAUDE.md — AI Claims Prototype

## What this is
A prototype of an AI-powered vehicle insurance claims processing dashboard. Built as a PM take-home assignment. All AI responses are mocked.

## Core brief
Automate the manual damage review and cost estimation steps in a vehicle insurance claims workflow. Primary user is the claims agent.

## Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Mock data only — no backend, no API calls

## What we are building
Two views:
1. **Claim Queue** — list of incoming claims with state, fraud score, and age
2. **Claim Detail** — full claims agent workflow view with four panels:
   - Policy and incident summary
   - Fraud risk score with contributing signals
   - Damage assessment panel (mock labeller output — photo + labels + confidence scores)
   - Cost estimate panel (mock cost estimator output — itemized line items with source attribution)

## State machine
Each claim moves through these states in order:
NEW → ASSESSING → ESTIMATE_GENERATED → PENDING_APPROVAL → APPROVED / REJECTED

## Key UX principles
- State-driven: UI always surfaces the next required action
- Every AI output has a confidence score
- Every AI output is approvable, adjustable, or overridable at line-item level
- Every cost estimate line item has a source attribution
- No black box outputs — reasoning always visible

## Mock data location
All mock data lives in `/data/mockClaims.ts`

## Component structure
/app — Next.js pages
/components — UI components
/data — mock claims data