# ROUTES_STUB (Express/TypeScript)

```ts
import express from "express";
export const router = express.Router();

// 1) OAuth
router.get("/auth/jobber", async (req, res) => {
  // redirect to Jobber OAuth authorize URL with client_id, redirect_uri, scopes
});

router.get("/auth/jobber/callback", async (req, res) => {
  // exchange code for tokens; persist account + tokens; redirect to app
});

// 2) Webhooks
router.post("/webhooks/jobber", async (req, res) => {
  // verify signature if provided, enqueue processing, respond 200 immediately
  res.sendStatus(200);
});

// 3) Public upload
router.get("/u/:token", async (req, res) => {
  // render upload page or return signed upload policy
});

router.post("/u/:token/upload", async (req, res) => {
  // accept file, OCR+parse, present confirmation UI payload
});

// 4) PDF snapshot
router.get("/vendors/:id/snapshot.pdf", async (req, res) => {
  // render HTML and convert to PDF
});
```
