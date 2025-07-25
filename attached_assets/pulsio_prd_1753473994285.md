# Pulsio – Product Requirements Document (MVP 2.0)

*Draft – July 2025*

---

## 1 Executive Summary
**Pulsio** automates the collection of subcontractor W‑9s and Certificates of Insurance (COIs) for trade‑service contractors using **QuickBooks Online (QBO)**. Missing documents delay payments, forfeit early‑pay discounts, and expose firms to IRS penalties and insurance risk. Pulsio plugs into QBO, detects gaps, and sends intelligent email/SMS reminders. Documents land in minutes, cash stays in pocket, and office managers get their evenings back.

---

## 2 Why Now?
| Driver | Detail |
|--------|--------|
| **API readiness** | QBO OAuth v3 + webhooks allow reliable vendor & bill events. |
| **Compliance pressure** | 2024 IRS penalty to **$330**/incorrect 1099; insurers tighten COI audits. |
| **Cash incentives** | 2 %/10 early‑payment discounts commonplace post‑COVID. |
| **Solo‑founder tooling** | Replit provides Postgres **and Object Storage** (see <https://docs.replit.com/cloud-services/storage-and-databases/object-storage>) eliminating external S3. |

---

## 3 Target Market & ICP
* **Business type:** HVAC, plumbing, electrical, roofing, landscaping contractors
* **Size:** 10 – 60 employees
* **Stack:** QuickBooks Online Plus/Advanced
* **Buyer:** Owner‑operator (economic) + Office/AP manager (champion)

Pain score: **7 – 9 / 10**

---

## 4 Problem Statement (First Principles)
1. **IRS matching** – Missing/invalid W‑9 ⇒ payer fined & must backup‑withhold.
2. **Liability gap** – Expired COI shifts accident claims onto the contractor.
3. **Cash leakage** – Early‑pay discounts lost while waiting for docs.
4. **Admin drag** – 3‑6 h/week spent chasing vendors & updating spreadsheets.

---

## 5 Value Hypothesis
* **$5 k–$15 k/year** recovered via discounts & avoided penalties.
* **150–250 staff hours** freed from drudge work.
* **Lower stress**: clean audit trail, predictable payments.

---

## 6 User Workflow (Time‑to‑Value < 10 min)
1. Visit pulsio.app → **Sign Up** (email / Google).
2. Click **Connect QuickBooks** (OAuth).
3. Complete 4‑step onboarding wizard (cadence → template → test → finish).
4. Pulsio pulls vendors & bills, sends first reminders within **90 s**.
5. Dashboard shows live timeline (via SSE) of reminders & uploads.

---

## 7 Feature Requirements
| Epic | MVP Must‑have | Post‑MVP (v1+) |
|------|---------------|-----------------|
| **Vendor sync** | Import vendors/bills, detect missing/expired docs. | Historical import; vendor tagging. |
| **Reminder engine** | Email + SMS; configurable cadence; merge tags. | Multi‑language; WhatsApp. |
| **Upload portal** | Magic‑link, drag‑drop, store file in **Replit Object Storage**; OCR vendor name. | Mobile auto‑crop; e‑signature. |
| **Dashboard** | Counts, discounts at risk, risk meter, live timeline. | Trends & benchmarking. |
| **Notifications** | Daily email digest; in‑app SSE; critical SMS. | Slack, push. |
| **Compliance archive** | Secure storage in Replit Object Storage; metadata in Postgres. | Audit ZIP export. |
| **Billing & auth** | Stripe subscriptions ($99/199/399), JWT sessions. | Team roles, annual plans. |

---

## 8 Technical Architecture (Replit‑Native Only)
| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | React (Vite) + Tailwind + Headless UI | Fast UI dev. |
| Realtime | Express **Server‑Sent Events** (`/events`) | No external PaaS. |
| Backend | Node 18 + Express | Minimal dependencies. |
| Database | Replit Postgres (Prisma ORM) | Free, always‑on. |
| Object Storage | **Replit Object Storage** buckets for W‑9/COI PDFs | Eliminates S3. |
| Background jobs | `node-cron` inside server (every 20 min) | Sync QBO; send reminders. |
| Auth | JWT cookie + bcrypt + Google SSO | Simple, self‑hosted. |
| Integrations | QBO, SendGrid, Twilio | Stable & affordable. |

---

## 9 Data Schema (Prisma)
```prisma
enum DocState { MISSING RECEIVED EXPIRED }
enum ReminderType { W9 COI }

model Vendor {
  id          String   @id @default(cuid())
  qboId       String   @unique
  name        String
  email       String?
  phone       String?
  w9Status    DocState @default(MISSING)
  coiStatus   DocState @default(MISSING)
  coiExpiry   DateTime?
  reminders   Reminder[]
  documents   Document[]
}

model Document {
  id        String   @id @default(cuid())
  vendorId  String   @index
  type      ReminderType
  url       String   // Replit object‑storage URL
  uploadedAt DateTime @default(now())
  expiresAt DateTime?
  Vendor    Vendor   @relation(fields:[vendorId], references:[id])
}

model Reminder {
  id        String   @id @default(cuid())
  vendorId  String   @index
  type      ReminderType
  channel   String   // email or sms
  sentAt    DateTime @default(now())
  status    String
  Vendor    Vendor   @relation(fields:[vendorId], references:[id])
}

model Account {
  id        String   @id @default(cuid())
  companyName String
  cadence    String   // cron expression
  template   String   // HTML/markdown
  stripeCustomerId String
  plan       String   // starter/pro/agency
  timeToFirstDoc Int?
}
```

---

## 10 Success Criteria
| Metric | Target |
|--------|--------|
| **Time‑to‑first‑doc** | < 30 min median |
| **Doc auto‑collection rate** | ≥ 85 % within 14 days |
| **Discount dollars captured** | ≥ $100 / account / month |
| **Paid‑churn** | < 5 % / month by month 6 |

---

## 11 Pricing & Revenue
| Plan | Limit | Price | Customer share |
|------|-------|-------|---------------|
| Starter | 200 reminders/mo | **$99** | 60 % |
| Pro | 500 reminders + multi‑location | $199 | 30 % |
| Agency | Unlimited + white‑label | $399+ | 10 % |

Gross margin > 80 % (Replit infra bundled; Twilio/SMS minimal).

---

## 12 Go‑to‑Market (First Year)
1. **Beta (Months 0‑3)** – 10 contractors, free 60 days, collect case studies.
2. **Content SEO** – blogs on “automatic W‑9 collection”; rank for long‑tail.
3. **ProAdvisor channel** – partner with QuickBooks consultants.
4. **Trade‑association webinars** – \$3 k sponsorship; demo live savings.
5. **Intuit App Store listing** – Month 6.

---

## 13 Roadmap
| Month 0‑2 | Scaffold app (auth, QBO OAuth, SSE, cron, Replit storage). |
| Month 3‑4 | Upload portal, reminder engine, Stripe billing, dashboard. |
| Month 5‑6 | Beta iteration, metrics tracking, COI expiry logic. |
| Month 7‑9 | Multi‑location, agency white‑label, mobile responsive. |
| Month 10‑12 | Marketplace launch, 100 paying customers. |

---

## 14 Risk & Mitigation
| Risk | Mitigation |
|------|-----------|
| QBO API rate limits | Cache & incremental sync; maintain Intuit partner access. |
| Vendor non‑response | Escalation sequence, owner SMS prompt. |
| Data security | HTTPS only; Replit Object Storage with signed URLs; quarterly audit. |
| Solo capacity | Use Replit AI agent for feature scaffolding; outsource support as MRR grows. |

---

## 15 Probability of Success (Solo‑Founder Lens)
* **Market feasibility** — 70 %
* **Execution risk (Replit stack)** — low
* **Competitive pressure** — medium

> **Overall blended probability ≈ 55 %** to reach **$25 k MRR within 24 months**.

---

**Pulsio** removes the grunt work of vendor‑document collection, captures hard‑dollar savings, and lets office managers reclaim their evenings— all built & run entirely inside Replit’s developer‑friendly cloud.

