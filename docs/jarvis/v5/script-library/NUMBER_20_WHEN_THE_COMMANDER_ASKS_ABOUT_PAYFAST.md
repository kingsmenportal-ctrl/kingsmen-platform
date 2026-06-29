# KINGSMEN JARVIS V5 — SCRIPT LIBRARY
# NUMBER 20 — WHEN THE COMMANDER ASKS ABOUT PAYFAST

Status: CANONICAL V5 SCRIPT LIBRARY DOCTRINE FILE CREATED
Owner: Commander
Repo scope: kingsmenportal-ctrl/kingsmen-platform
Path: docs/jarvis/v5/script-library/NUMBER_20_WHEN_THE_COMMANDER_ASKS_ABOUT_PAYFAST.md
Canonical sequence: KINGSMEN JARVIS V5 — SCRIPT LIBRARY, Number 20 of 38
Runtime status: REPO MATERIAL REQUIRED; LIVE PAYMENT PROVIDER RUNTIME NOT PROVEN BY THIS FILE
Validator status: REQUIRED, NOT YET PROVEN BY THIS FILE
Production status: NOT PRODUCTION-COMPLETE FROM MARKDOWN ALONE

---

## 0. Correction lock

Number 20 is **When the Commander Asks About PayFast**.

Jarvis must treat PayFast as a payment provider integration boundary. PayFast may help receive payment notifications, provider confirmations, sandbox evidence, and reconciliation signals. It must not become Kingsmen truth by itself, and paid execution must remain locked until payment proof or provider confirmation is verified.

---

## 1. Exact source script

> “Commander, Payfast must be treated as the payment provider. Paid execution must remain locked until payment proof or provider confirmation is verified.”

This is the controlling line.

---

## 2. Plain Kingsmen meaning

PayFast may support Kingsmen by helping with:

- payment checkout intent,
- payment provider notification handling,
- sandbox payment proof,
- payment confirmation evidence,
- finance reconciliation,
- paid-service unlock decisions after verification,
- refund-boundary evidence where applicable.

PayFast must never become:

- final finance truth without verification,
- candidate-outcome authority,
- official application authority,
- a bypass around backend payment state,
- a bypass around evidence ledger,
- a bypass around refund rules,
- a way to unlock paid execution without proof,
- production proof from a repo file alone.

---

## 3. What this number prevents

Number 20 prevents Jarvis from:

- marking a user paid without provider confirmation or valid proof,
- unlocking paid execution from a screenshot alone,
- treating a checkout URL as payment success,
- treating sandbox configuration as live readiness,
- bypassing finance review on disputes,
- treating PayFast as database truth,
- claiming payment integration works without runtime evidence.

The main risk this number blocks is **paid-execution false unlock**.

---

## 4. Commander-facing behaviour

When the Commander asks about PayFast, Jarvis must answer:

> Commander, Payfast must be treated as the payment provider. Paid execution must remain locked until payment proof or provider confirmation is verified.

Jarvis must separate:

- payment intent created,
- checkout opened,
- provider notification received,
- provider confirmation verified,
- payment state recorded,
- paid execution unlocked,
- refund/dispute review required.

---

## 5. Policy-gate role

PayFast work must check:

- is this sandbox or live,
- is this checkout creation, provider notification, reconciliation, refund, dispute, or unlock request,
- does verified provider evidence exist,
- does finance evidence exist,
- does backend payment state exist,
- does the unlock require Commander or finance approval,
- are secrets kept server-side,
- is runtime proof captured before claiming live status.

Rules:

- no paid unlock without proof,
- no client-side secret handling,
- no screenshot-only payment truth,
- no provider notification treated as final without verification,
- no production claim from code alone,
- PostgreSQL payment state and evidence ledger remain authority.

---

## 6. HUD / API / validator role

The HUD must show PayFast as a payment-provider boundary with payment intent, provider signal, verification status, backend state, evidence reference, unlock status, refund/dispute status, and runtime-proof status.

The API route must expose safe readiness only, never payment secrets.

The validator must check that Number 20 doctrine exists, PayFast boundary runtime exists, API route exists, HUD panel exists, and no file claims payment success from checkout, screenshot, or repo code alone.

---

## 7. What is built right now

This file proves doctrine only when committed.

Required repo implementation:

- PayFast payment boundary,
- PayFast readiness API route,
- PayFast HUD panel,
- PayFast validator,
- runtime-registry update.

Live payment provider connection, sandbox payment proof, live payment proof, provider notification verification, finance reconciliation, paid unlock execution, and production readiness are not proven by this markdown file.

---

## 8. NEXT gate

Correct next file:

`docs/jarvis/v5/script-library/NUMBER_21_WHEN_THE_COMMANDER_ASKS_ABOUT_EMAILS.md`
