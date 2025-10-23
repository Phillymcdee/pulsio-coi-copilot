# Agent 3 — Project Brief (COI & Compliance Copilot)

## Objective
Refactor an existing Node/TS app into a Jobber-first COI & Compliance Copilot:
collect → parse → validate → remind → report. Ship a private MVP.

## Files to read first
- /agent/docs/SPEC.md
- /agent/docs/JOBS.md
- /agent/docs/JOBBER_NOTES.md
- /agent/docs/COI_RULES_SCHEMA.md
- /agent/docs/PARSER_SKELETON.md
- /agent/docs/ROUTES_STUB.md
- /agent/docs/QA_CHECKLIST.md
- /agent/docs/UX_JOURNEY.md

## Constraints
- TypeScript end-to-end; keep Drizzle/Postgres.
- Keep existing email/SMS services.
- Minimal UI changes (copy + a Snapshot button).
- No multi-platform integrations (Jobber only).
- Add feature flags: FEATURE_JOBBER=true, FEATURE_QBO=false.

## Definition of Done (MVP)
- Jobber OAuth & token persistence work end-to-end.
- Webhooks received and trigger “request COI” when missing/expired.
- Public upload → OCR → parse → confirm → save → rules evaluate.
- Reminders at 30/14/7 days; events logged.
- `/vendors/:id/snapshot.pdf` returns a readable PDF.
- All checks in /agent/docs/QA_CHECKLIST.md pass.

## Non-Goals (v1)
Broker integrations, advanced endorsement parsing UI, per-client rule profiles, multi-tenant billing beyond Stripe basics.

## Coding Guidelines
- Small PR-sized commits.
- New code in `server/services/jobber.ts`, `server/webhooks/jobber.ts`, `server/services/coiParser.ts`, `server/services/coiRules.ts`.
- Migrations for schema changes; keep types in `shared/`.
- Add unit tests for parser & rules with provided fixtures.
