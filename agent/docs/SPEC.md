# SPEC — COI & Compliance Copilot (MVP)

## Goal
Collect → Parse → Validate → Remind → Report for contractor insurance docs (COIs) inside the Jobber ecosystem.

## Scope (v1)
- Jobber OAuth 2.0 install + token refresh
- Webhooks: job.created, job.closed, invoice.created/paid (as available)
- Public vendor upload link (COI intake)
- OCR + ACORD-25 parser (dates/limits/endorsements)
- JSON rules per account (min GL, AI, Waiver, Auto limits)
- Reminder engine (30/14/7 days before expiry)
- Compliance Snapshot PDF
- Dashboard: Missing, Expiring, At-Risk

## Non-Goals
- Broker integrations, multi-platform, complex rule UI, perfect parsing.

## Acceptance Criteria
- Installing app via Jobber OAuth stores tokens and account linkage.
- Receiving a relevant webhook for a client with missing/expired COI triggers an upload request.
- Uploading a COI extracts `effective`, `expires`, GL limit; user can confirm/edit fields before save.
- Rules engine flags violations; dashboard surfaces lists.
- Daily cron sends 30/14/7 reminders and logs events.
- Snapshot PDF renders with status & violations.
