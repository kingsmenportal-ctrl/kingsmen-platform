# Kingsmen One — Rebuild Doctrine

**Status:** Authoritative product and implementation direction  
**Recorded:** 2026-11-19  
**Source repository:** `kingsmenportal-ctrl/kingsmen-platform`

## Objective

Make Kingsmen easier to build, manage, secure and operate without discarding valuable existing code, data, business rules, designs or evidence. The current `main` branch and Supabase staging project remain the legacy source of truth until a reviewed migration path is approved. This rebuild branch is additive and does not replace production or staging.

## Core architecture

- One Kingsmen product with a shared identity model and a shared application experience.
- Next.js, React and TypeScript as the primary web application.
- Supabase/PostgreSQL as the authoritative data layer; Supabase Auth and private Storage for identity and files.
- GitHub as source, migration, review and test history; Netlify as the controlled frontend deployment path.
- Notion remains governance/documentation, not a second live database.
- No Neon database, no second production backend by default, no memory-only production persistence, no second product or prototype dependency.
- The existing API and services are not deleted blindly. Audit actual dependencies first; remove or consolidate a service only through a tested, reversible change.
- Keep a small routine CI suite, specialist security checks and independently releasable streams. Evidence must state what actually passed.

## Canonical six pathways

These six categories are the official taxonomy and must be available irrespective of candidate plan:

1. Higher Education
2. TVET
3. SETA Programmes & Learnerships
4. Internships
5. Apprenticeships
6. Employment

Bursaries, accommodation, transport and funding support can be cross-cutting services; they must not displace or merge the six pathways.

## Candidate product journey

1. One candidate account with a reusable profile, verified identity linkage and explicit consent.
2. Search a shared, source-backed catalogue across all six pathways.
3. Use one Kingsmen application engine with opportunity-specific questions, reusable profile data and required documents.
4. Save a draft, submit to Kingsmen, track events and receive accurate updates inside the portal.
5. Route applications through a permitted and evidenced provider path. Kingsmen must not label a record provider-submitted or provider-received without evidence.
6. For CAO, create one Kingsmen parent application with ordered programme-choice child records.

### Status truth

- **Draft:** candidate has not submitted to Kingsmen.
- **Submitted to Kingsmen:** Kingsmen has durably received the candidate's submission.
- **Under review / Action required:** Kingsmen operations is processing it or the candidate must respond.
- **Prepared for provider:** an authorised route has prepared the application; it has not necessarily been sent.
- **Provider receipt confirmed:** evidence confirms receipt by the external provider.
- **Decision recorded:** a verified provider decision has been recorded.

Candidate-reported activity, Kingsmen receipt, provider submission, provider receipt and provider decision are distinct events. No acceptance, funding or employment outcome is guaranteed.

## Catalogue verification

An official URL alone is not proof that an opportunity is open. A recommendable open opportunity requires an authoritative source, source evidence, eligibility information, a relevant deadline/intake where applicable, a freshness check and a recorded verification decision. Stale, provisional, cancelled, lapsed and unresolved records must remain distinguishable from verified-open records.

## Founder Control Plane and Jarvis

Use shared operational workspaces for candidates, applications/routes, catalogue verification, documents/identity review, finance/capacity, governance/recovery, and Jarvis. These are views over real business records, not independent data stores.

Jarvis is an optional, permission-bounded assistant. It may inspect evidence, summarise queues, draft communications and request approval. It cannot invent truth, grant entitlements, approve identity, bypass RLS, or submit to an external provider without provider authorisation, candidate consent and the required founder approval. Deterministic platform workflows must continue when an AI service is unavailable.

MAP/manual processing and Phoenix/recovery remain first-class fallbacks. Browser automation starts in read-only research and QA mode; no CAPTCHA, OTP or provider control bypass.

## Documents, finance and communications

- Document Vault accepts PDF/JPEG/PNG up to 10 MiB; validate content and size server-side, calculate SHA-256, retain private storage paths and use short-lived signed links.
- Separate sensitive identity evidence from ordinary application documents; reviewer decisions and reasons are attributable and auditable.
- Use one canonical plan catalogue, prices in integer ZAR cents, server-side entitlement calculations and an append-only usage/payment history. Never use browser redirects alone to grant entitlements.
- PayFast begins in sandbox. Validate notification signature, merchant, amount, currency and idempotency server-side.
- Email is primary communication; use an outbox, retries and delivery evidence. WhatsApp is urgent-only; SMS is deferred/backup as approved.
- No candidate data, service-role keys, payment credentials or private documents in Git, chat, logs or public reports.

## Commercial rules to preserve

| Plan | Price | Priority applications | Concurrent capacity |
|---|---:|---:|---:|
| Foundational Accord | R169.99 | 5 | 4 |
| Collegiate Ordinance | R299.99 | 10 | 8 |
| Chancellor's Writ | R399.99 | 15 | 10 |
| Regency Mandate | R469.99 | 15 | 12 |
| Artisan Charter | R149.99 | 5 | 3 |
| Guildmasters Charter | R199.99 | 8 | 5 |
| Free Destiny Map | R0.00 | Free tier | No paid entitlement |

Foundational Accord retains 8 accommodation routes. CV Revamp remains a separate R49.99 product with a target of 15 CV versions and 15 motivation letters within 3 business days. Its conditional 2-route bonus applies only after verified ownership and the qualifying upgrade. Plans control priority volume/service level/concurrent capacity, not access to the six-pathway catalogue.

## Safe delivery rules

- Preserve checkpoints and Git history. No destructive data, schema or source cleanup before inventory, backup and approval.
- Reconcile source migrations with the live ledger before any new SQL is applied. Do not invent migration numbers or silently renumber history.
- Implement RLS and permissions with each feature; prove Candidate A/B data isolation and document ownership.
- Do not change repository visibility, recover/replace cloud resources, incur costs, enable production payments, or perform provider submissions without the required explicit approval.
- No self-approval, force-merge shortcuts or fabricated review evidence.
- A release claim requires a commit SHA, automated checks, runtime browser proof and the intended business outcome. Deployment is not proven by a started workflow.
- Release a stream independently when its own scope is secure and tested; advanced Jarvis work must not block a sound core application journey.

## Build priority

The highest product priority is the end-to-end candidate → founder/operator → candidate journey. Audit and protect existing work; establish the application foundation; prove durable identity/profile persistence and Candidate A/B isolation; populate a small but genuinely verified catalogue; implement the unified application engine; then expand document review, finance, communications and controlled automation.
