# COI Copilot — Journey & UX Guide (Agent Context)

## 1) Personas
- **Owner / Ops Manager (primary):** Runs schedules in Jobber; wants zero insurance risk and no chasing paperwork.
- **Subcontractor / Vendor (secondary):** Receives link, uploads COI from phone, done.
- **Back-office Admin (optional):** Views status, downloads reports.

## 2) Key Triggers
- **Install:** Admin authorizes via Jobber OAuth; app sets default rules and subscribes to webhooks.
- **Operational:** `JOB_CREATE`, `JOB_CLOSE`, (optionally invoice events) trigger compliance checks and COI requests.
- **Time-based:** COI expiry windows at **30/14/7** days trigger reminders.

## 3) Happy-Path Storyboard
### A. Install & First-Run (Admin)
- **Action:** Click “Install from Jobber” → consent → lands on dashboard.
- **System:** Save tokens; set default rules (GL ≥ $2M; Additional Insured required), register webhooks.
- **UI:** Dashboard tiles (Missing / Expiring / At Risk = 0). Banner: “Enable auto-requests on new jobs?” [Enable].

### B. Job Scheduled (Ops)
- **Action:** Schedule a sub on a job in Jobber.
- **System:** Webhook → look up vendor → if COI missing/expired, generate **Upload Link** + send email/SMS.
- **UI (Ops):** Timeline note: “COI requested from {Vendor} for Job #{id}”.

### C. Upload & Parse (Vendor)
- **Action:** Vendor taps link, uploads PDF/photo.
- **System:** OCR + parser extract: **Effective, Expiry, GL, Additional Insured, Waiver**; low-confidence fields flagged.
- **UI (Vendor):** “Confirm details” screen → Submit → success state (“We’ll remind you before it expires”).

### D. Rule Check & Status (Ops/Admin)
- **System:** Evaluate doc vs rules; set `expiresAt`, record violations.
- **UI (Ops):** Vendor Detail shows Status pill (✅/⚠️/❌), parsed fields, violations, **Download Snapshot (PDF)**.

### E. Reminders (Time-based)
- **System:** Daily cron sends reminders at **30/14/7** days; logs to timeline; dashboard counts update.
- **UI:** Tiles show **Missing COIs**, **Expiring soon**, **At Risk** lists.

### F. Audit/Report
- **Action:** Ops clicks **Download Compliance Snapshot (PDF)**.
- **UI:** PDF with vendor name, Effective/Expiry, GL, AI/Waiver, rule verdict + violations, timestamp.

## 4) Edge Cases
- **Unreadable scans:** Require vendor confirmation for flagged fields.
- **Multiple lines:** Store best-match GL; allow manual override.
- **Wrong doc type:** Reject with helper copy (ask for ACORD 25).
- **Ops override:** “Mark compliant until [date]” with note.

## 5) Screen Specs (MVP)
### Dashboard
- **Tiles:** Missing • Expiring • At Risk.
- **Table:** Vendor • Status • Expiry • Violations • Actions (View, Snapshot).

### Vendor Detail
- **Header:** Vendor name + Status pill.
- **Panels:** Latest COI summary (Effective, Expiry, GL, AI, Waiver), Violations, Timeline.
- **Actions:** Request COI again • Download Snapshot.

### Public Upload (Vendor)
- **Intro copy:** “Upload your Certificate of Insurance (ACORD 25).”
- **File input:** PDF/PNG/JPG. After upload, confirm extracted fields.
- **Success:** “All set—thanks! We’ll remind you before it expires.”

## 6) Copy Snippets
- **Reminder subject:** “Action needed: your insurance certificate expires soon.”
- **Upload helper:** “Tip: Ask your broker for an ACORD 25 PDF.”
- **Violation message:** “General Liability below required minimum of $2M.”

## 7) Definition of Done (MVP)
- Install <2 mins; tokens stored; webhooks firing.
- First **COI request** auto-triggered from a Jobber event.
- Upload→Parse→Confirm in <60s on standard PDFs.
- 80%+ auto-fill on ACORD 25; simple corrections allowed.
- 30/14/7 reminders verified; timeline entries present.
- Snapshot PDF downloads and is readable by non-technical users.

## 8) Metrics
- **Coverage:** % vendors with valid COI.
- **Time to compliant:** First request → valid COI.
- **Parse correction rate:** % needing edits.
- **Reminder conversion:** Reminder → upload.
- **Exposure:** Jobs linked to non-compliant vendors.

---
**File placement suggestion:** `/agent/docs/UX_JOURNEY.md` and reference it from `/agent/AGENT_CONTEXT.md` under “Files to read first.”
