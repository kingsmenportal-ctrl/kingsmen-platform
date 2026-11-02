# Playwright operations — security review and rollout controls

**Status:** implementation scaffolding and source validation; not production-authorised.  
**Date:** 2 November 2026.

## Security invariants

The operations consumer is not a generic browser agent. It can only inspect founder-approved public sources through the worker code `playwright.public_source.scout`. It has a distinct database identity, a distinct browser context per claimed job, exact host allowlists, GET-only network methods and a fixed same-state result contract.

The empty adapter registry is intentional. Do not add a provider to it without the provider's written/technical authorisation, terms/privacy review evidence, Founder approval record, exact host list, semantic version and expiry.

## Database authority

The N16 scoped migration creates only a NOLOGIN group role and two SECURITY DEFINER RPCs. It does not create or store a login password.

After independent SQL review, backup/restore and approved staging migration:
1. Provision a dedicated `LOGIN NOINHERIT` database role outside Git and assign it only to `kingsmen_playwright_scout_worker`.
2. Grant only the database CONNECT privilege needed for the separate login. Do not grant it `service_role`, table privileges or generic N16 function privileges.
3. Store the restricted connection URL in the worker secret manager as `KINGSMEN_PLAYWRIGHT_DATABASE_URL`.
4. Mount the adapter registry read-only; leave it empty until evidence exists.
5. Verify the worker session uses `SET ROLE kingsmen_playwright_scout_worker`, and test that it cannot SELECT queue tables, call generic claim, call generic result or call `n16_mark_dispatch_sent`.

Do not use `DATABASE_URL`, `KINGSMEN_DATABASE_URL`, Supabase service-role key or a postgres superuser credential in the operations worker.

## Network and browser controls

The worker rejects non-HTTPS, non-default ports, sensitive URL parameters and unapproved hosts. It resolves allowlisted provider hosts, rejects private/reserved IP answers and pins Chromium host resolution for the approved host list. Requests are GET-only; downloads and service workers are disabled; new browser contexts are created per dispatch. CAPTCHA, OTP, login walls, access denial, unexpected redirect and portal errors create a manual handoff.

The deployment platform must also enforce network-level egress to the configured public provider hosts. Do not rely on browser routing alone as the container's network firewall.

## Provider approval

The supported adapter capability is `PUBLIC_SOURCE_INSPECTION` only. The policy rejects upload, form-fill, login, submission and payment actions. The authorization references in a dispatch must match the approved registry entry and the queue's immutable evidence references.

This does not authorise candidate-specific operations. A later L2 provider operation requires written provider permission, approved terms, candidate-specific consent, a specific application/target, time-bounded Founder/authorized-operator approval, route-specific tests, retry/reconciliation policy, and a separate capability review. No live provider adapters are currently registered.

## Live Supabase findings — 2 November 2026

The staging Security Advisor still reports leaked-password protection disabled. This must be enabled by an authorized project administrator in Supabase Auth security settings and then rechecked.

Six SECURITY DEFINER functions are executable by authenticated users. Their live definitions were inspected: owner postgres, hardened search_path, candidate identity/ownership/consent checks for candidate CAO and application functions, and active reviewer + verified outcome evidence checks for the reviewer function. They are intentional authenticated RPCs, not safe to blanket-revoke; retain explicit tests and independent review.

Seventeen RLS-enabled backend-only tables have no policies. A live grants query found zero grants to anon/authenticated for those tables; keep the current deny-by-default client privilege posture.

## Deployment gate

No worker is to be deployed until the scoped migration is merged, applied through change control, the separate login and secrets are provisioned, the egress firewall is verified, exact-head CI and independent review pass, staging isolation/runtime evidence exists, and Founder approval is recorded. This document is not itself an approval.
