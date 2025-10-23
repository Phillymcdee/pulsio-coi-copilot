# QA_CHECKLIST — Pre‑Pilot

- [ ] OAuth install works; tokens saved & refresh tested
- [ ] Webhook hits received and logged; retries handled
- [ ] Upload link flow tested on mobile
- [ ] OCR parses effective/expiry on sample ACORD‑25 PDFs
- [ ] Rules evaluator flags GL<min and missing AI
- [ ] 30/14/7 reminders fire (use date mocks)
- [ ] Snapshot PDF downloads and opens
- [ ] PII/logging: redact documents from logs; secure upload tokens
