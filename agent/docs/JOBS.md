# JOBS — Day-by-Day Plan (10 Days)

**Day 0 (prep)**
- Fork repo to `coi-copilot`. Create `.env` from `ENV.example`. Add feature flags.

**Day 1**
- Implement Jobber OAuth endpoints: `/auth/jobber`, `/auth/jobber/callback`.
- Token store table with `accessToken`, `refreshToken`, `expiresAt`, `jobberAccountId`.

**Day 2**
- Webhook receiver `/webhooks/jobber`. Verify signature. Persist payloads (for debugging).
- Subscribe to topics in dev app dashboard. Start with `CLIENT_CREATE`, `JOB_CREATE`, `JOB_CLOSE`, and an invoice event.

**Day 3**
- Vendor model: ensure mapping `vendor.jobberId`. Build helper to find/create vendor on incoming webhook.
- “Request COI” queue item + email/SMS via existing providers.

**Day 4**
- Public upload: `GET /u/:token`, `POST /u/:token/upload`. Save file, OCR, parse, show confirm UI.

**Day 5**
- `coiRules` JSON column + evaluator; violations list. Update dashboard cards.

**Day 6**
- Cron sweep for 30/14/7 reminders. Unit tests for rules + date math.

**Day 7**
- Compliance Snapshot: HTML template -> PDF route `/vendors/:id/snapshot.pdf`.

**Day 8**
- QA checklist, seed script, fixture COIs. Pilot enablement toggles.

**Day 9–10**
- Fixes, copy polish, first 3–5 pilots onboarded.
