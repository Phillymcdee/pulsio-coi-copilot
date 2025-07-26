# Pulsio – Design & Implementation Blueprint (Replit‑Native)

*Use this file verbatim as the prompt for Replit’s AI agent to scaffold the entire app.*

---

## A. "Time‑to‑Value < 10 min" Journey

```
 Marketing site → 2‑click sign‑up → OAuth QuickBooks → 4‑step wizard
              ↓                                 ↓
         Live dashboard (first reminders & docs in under 90 s)
```

Goal: user experiences **first vendor doc received** inside one coffee break.

---

## B. Routes & Component Map

| Route          | Purpose                           | Key Components                                            |
| -------------- | --------------------------------- | --------------------------------------------------------- |
| `/`            | Marketing splash                  | `Hero`, `PainCards`, `ROISection`, `Footer`               |
| `/signup`      | Account creation (email / Google) | `SignupForm`                                              |
| `/connect/qbo` | Intuit OAuth hand‑off             | `QBOConnectButton`, `TroubleHelp`                         |
| `/onboarding`  | 4‑step wizard (see C)             | `Wizard`                                                  |
| `/dashboard`   | Live value feed                   | `StatsBar`, `MissingDocsTable`, `SavingsCard`, `Timeline` |
| `/vendors/:id` | Vendor drill‑down                 | `VendorHeader`, `DocStatus`, `ReminderLog`                |
| `/settings`    | Templates & cadence               | `EmailTemplateEditor`, `CadencePicker`, `BillingPanel`    |
| `/help`        | FAQ + chat                        | `FAQ`, `ChatWidget`                                       |

All pages use **Tailwind CSS** + **Headless UI**. Mobile breakpoint: `sm` 640 px.

---

## C. Four‑Step Onboarding Wizard

| # | Screen                                                                        | Delight Cue                                               |
| - | ----------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1 | **Connect QuickBooks** – big Intuit blue CTA                                  | 200 ms confetti burst on success                          |
| 2 | **Reminder Cadence** – radio preset + cron modal                              | Tooltip: “Faster reminders capture discounts.”            |
| 3 | **Email + SMS Template** – Monaco markdown editor + live merge‑tag preview    | Instant vendor‑name rendering                             |
| 4 | **Send Test & Launch** – checkbox to self‑test; CTA **Start Collecting Docs** | Progress bar → 100 %, redirect `/dashboard?firstRun=true` |

No required typing unless user edits copy. Wizard state saved in localStorage for resume.

---

## D. Dashboard (First‑Run State)

```
┌───────────────────────────────────────────────┐
│ ✅ QBO connected (2 min ago)                │
│ 🚀 3 reminders sent • 0/17 docs received     │
└───────────────────────────────────────────────┘
```

Cards (Tailwind `grid-cols‑1 md:grid-cols‑3`):

1. **Missing Docs**
2. **Money at Risk** (discount \$) – turns green when captured
3. **Risk Meter** – COIs expiring ≤ 30 days

Below: **Timeline** populated by SSE (section F).

---

## E. Vendor Detail Page

| Left column                  | Right column                        |
| ---------------------------- | ----------------------------------- |
| Status pill (🟥 Missing W‑9) | Action dropdown (Resend / Exempt)   |
| Documents card for W‑9 & COI | Reminder log accordion              |
| Recent bills list            | Internal notes textarea (auto‑save) |

---

## F. Live Notifications (SSE, Zero 3rd‑Party)

```ts
// server/events.ts
import { EventEmitter } from 'events';
export const bus = new EventEmitter();

// SSE route
app.get('/events', (req,res)=>{
  res.set({ 'Cache-Control':'no-cache', 'Content-Type':'text/event-stream', Connection:'keep-alive' });
  const push = (payload:any)=> res.write(`data:${JSON.stringify(payload)}\n\n`);
  bus.on('push', push);
  req.on('close', ()=> bus.off('push', push));
});

// Emit example
bus.emit('push',{event:'doc.received', vendorId, ts:Date.now()});
```

React hook `useSSE` subscribes and feeds `Timeline` component.

---

## G. Background Sync & Cron

```ts
import cron from 'node-cron';
cron.schedule('*/20 * * * *', async () => {
  await syncQuickBooks();      // vendor & bill delta
  await autoSendReminders();   // email/SMS where docs missing
});
```

Runs inside the same Node process; Replit keeps container awake.

---

## H. Object Storage (Replit)

*Use Replit’s native bucket service vs S3.*

```ts
import { createClient } from '@replit/object-storage';
const store = createClient();

export const putPdf = async (key: string, file: Buffer) => {
  await store.putFile(key, file, { contentType: 'application/pdf' });
  return store.getUrl(key);             // public, signed URL optional
};
```

Bucket prefix `accountId/vendorId/filename.pdf`.

---

## I. Settings Components

- **CadencePicker.tsx** – radio presets + `react-day-picker` modal; stores CRON string.
- **EmailTemplateEditor.tsx** – Monaco + merge‑tag autocomplete (`{{vendor_name}}`, `{{company_name}}`, `{{coi_link}}`).
- **BillingPanel.tsx** – Stripe portal iframe; plan display.

---

## J. Micro‑copy & Tone

| Trigger             | Toast/Banner                                               |
| ------------------- | ---------------------------------------------------------- |
| First reminder sent | “🎉 We just nudged your first vendor—docs incoming!”       |
| Doc received        | “✅ {{vendor\_name}} uploaded W‑9. Payment unlocked.”       |
| Discount captured   | “💰 \${{amount}} discount secured. High‑five!”             |
| COI expiring        | “⚠️ {{vendor\_name}}’s COI expires in 3 days—we’re on it.” |

Voice: upbeat, professional, avoids jargon.

---

## K. Accessibility & Mobile

- Colour + icon redundancy.
- `aria-live="polite"` for real‑time updates.
- Cards stack on `sm`; sticky FAB “Request Docs Now”.

---

## L. Secrets (Replit Secrets Vault)

```
DATABASE_URL
QBO_CLIENT_ID
QBO_CLIENT_SECRET
SENDGRID_API_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_FROM_NUMBER
SESSION_SECRET
STRIPE_SECRET_KEY
VITE_STRIPE_PUBLIC_KEY
```

---

## M. Key Success Metrics (instrument via Postgres columns)

| Metric                | Table .column                    | Target            |
| --------------------- | -------------------------------- | ----------------- |
| `timeToFirstDoc`      | `Account.timeToFirstDoc`         | < 30 min          |
| Auto‑collection %     | derived from `Document` statuses | ≥ 85 % in 14 days |
| Discounts captured \$ | join `Bill` + `Discount`         | ≥ \$100 / month   |

---

## N. Drop‑in Replit AI Agent Prompt

> **“Generate a full‑stack Replit app named ‘Pulsio’ using the following blueprint. Use Node 18 + Express + Replit Postgres + Replit Object Storage. Include SSE, cron jobs, Tailwind React SPA, QuickBooks OAuth, SendGrid & Twilio integrations. Scaffold authentication, onboarding wizard, dashboard, vendor detail, settings, and Stripe billing as described.”**\
> *(Paste sections A through M above after this line.)*

---

**Pulsio** ships delight and hard‑dollar value in under 10 minutes—this blueprint gives your Replit AI agent every detail it needs to build the MVP end‑to‑end. Enjoy the launch!

