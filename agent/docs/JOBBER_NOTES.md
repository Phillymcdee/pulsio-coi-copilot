# JOBBER_NOTES — OAuth & Webhooks (with stubs)

## OAuth
- Flow: User installs from Jobber → redirect to `/auth/jobber` → consent → callback `/auth/jobber/callback` with code → exchange for tokens.
- Store `access_token`, `refresh_token`, `expires_at`, `jobber_account_id`.

## Webhooks
- Configure in Jobber Developer Center (app-level).
- Start with topics: `CLIENT_CREATE`, `JOB_CREATE`, `JOB_CLOSE` (exact casing per docs), optionally invoice events if available.
- Verify signatures if provided; respond 200 quickly; queue work.

## Routes (Express/TS)
See `ROUTES_STUB.md`.
