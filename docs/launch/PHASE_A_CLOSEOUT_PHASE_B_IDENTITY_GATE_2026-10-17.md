# Phase A Closeout and Phase B Identity-Linking Execution Gate

Date: 2026-10-17  
Repository: `kingsmenportal-ctrl/kingsmen-platform`  
Staging Supabase project: `euhubhhnumtibbyufghm` (`kingsmen-portal-staging`)

## Purpose

This document converts the current launch blockers into an auditable, ordered execution gate. It deliberately separates verified observations from work that still requires an authenticated browser session, a CI runner, or a controlled staging test. It does not certify launch readiness by itself.

## Live observations gathered for this batch

- Supabase staging is reported `ACTIVE_HEALTHY`.
- The live migration inventory contains marketplace migrations through `0058`, including `0056 marketplace_review_event_audit`, `0057 marketplace_https_url_constraints`, and `0058 marketplace_public_dns_url_constraints`. **Do not reuse 0056–0058.** The next migration number must be reconciled with repository history and reviewed before use.
- Supabase security advisor returned zero lint findings at inspection time. This is not proof of correct candidate isolation or performance health.
- `public.candidates` exists with UUID `id`, `email`, `is_active`, and lifecycle fields.
- `public.candidate_auth_identity_links` exists with `supabase_user_id UUID`, `candidate_id UUID`, `link_status`, verification metadata, and timestamps.
- `public.document_files` is candidate-owned through non-null `candidate_id`. An authenticated SELECT policy compares it to `kingsmen_security.current_authenticated_candidate_id()`.
- `public.candidates` currently has more than one permissive authenticated SELECT policy. Policies combine with OR; a new restrictive-looking policy is not sufficient unless the effective policy set is tested.
- Live table discovery found `public.candidate_saved_listings` and `public.candidate_saved_routes`. The previously assumed generic names `saved_listings` and `application_tracker` were not confirmed by the inspected table inventory.
- Netlify project `kingsmen-portal-staging` requires team SSO for non-production deployments. This setting has not been changed. Do not remove access protection from a shared staging project without confirming that no private candidate data or internal routes are exposed and agreeing on an appropriate replacement control.
- The connected GitHub repository reports previous workflow attempts with runner-assignment failures. No current-head green build/test result has been established in this batch.

## Phase A — evidence required before certification

### A1. Real verified listing

Use a real organisation account and a real authenticated founder session. Do not seed synthetic data or fabricate approval evidence.

1. Register/submit the organisation through the supported partner workflow.
2. Verify the organisation and listing source information.
3. Approve through the founder-authorized review path.
4. Query the public API without privileged credentials.
5. Confirm the response contains the same published listing, an actionable HTTPS destination, and no private/internal fields.
6. Save the exact response (not a reconstructed example) to `evidence/launch/verified-listing-2026-10-17.json`.
7. Record request URL, UTC timestamp, HTTP status, response SHA-256, and the non-secret identity of the approving role. Redact personal data and tokens.

**Pass condition:** the response can be reproduced from the public endpoint and traces to the genuine review event. If no legitimate listing is available, keep this gate blocked.

### A2. Reproducible API build and tests

Run in a real GitHub Actions runner or trusted repository checkout:

```bash
npm --prefix apps/api run build
npm --prefix apps/api test
```

Before relying on `npm ci`, reconcile the missing API lockfile against the exact `apps/api/package.json`. Generate the lockfile with a network-enabled trusted npm environment, review the diff, and commit the generated lockfile. Do not fabricate it, use an unpinned install as a substitute, or weaken CI gates.

Save raw command output and exit codes under `evidence/build/`; include commit SHA, Node/npm versions, and timestamp. A log is evidence only when the command actually ran and exited successfully.

### A3. Reviewer preview

Keep production access controls unchanged. Before changing non-production visitor access, inspect the deployed preview for private candidate routes/data and choose an appropriate reviewer access model. Prefer a dedicated sanitized preview or a site password over removing all access control from shared staging. Then verify pathway cards in a clean browser session and capture the URL, deploy ID, and result.

### A4. Certification record

Update `KINGSMEN_MARKETPLACE_PHASE_A_COMPLETE.md` only after A1–A3 pass. Include the evidence paths and exact commit/deploy identifiers. Until then, the document must say **NOT CERTIFIED**.

## Phase B — candidate identity linking

### B1. Migration-history reconciliation

- Treat the live migration inventory as authoritative for what has been applied to staging.
- Reconcile the repository's migration directory and Supabase migration history before naming the next migration.
- The live inventory currently reaches 0058; do not create or apply another 0056, 0057, or 0058.
- Do not apply schema changes until the mandatory logical backup has been restored and verified in an isolated database, with timestamp, checksum, schema/data verification, and retained evidence.

### B2. Identity resolver contract

Implement `private.own_candidate_id()` only after verifying the existing identity-link status values and security conventions. The function must:

- derive the Auth UUID exclusively from `auth.uid()`;
- resolve only a single verified identity link;
- require an active candidate;
- never match by email, client-provided candidate ID, or public reference;
- return NULL (or raise a documented safe error) for missing, revoked, pending, or ambiguous links;
- use a fixed safe `search_path`, minimal execute grants, and the repository's approved RLS/security-definer pattern;
- avoid exposing another candidate's identity or link metadata.

Do not assume a status literal or function signature without inspecting the live constraints and existing helper definitions.

### B3. Ownership/RLS inventory

Before writing policies, inspect the exact schema, constraints, grants, existing RLS enablement, and all permissive policies for:

- `candidate_saved_listings`;
- `candidate_saved_routes`;
- the actual application tracker table (discover its real name and columns);
- `document_files` and related document metadata;
- organisation profile and partner listing tables.

Use the existing `candidate_id` ownership field where appropriate. Do not add a guessed organisation foreign key to documents: document ownership and an organisation association are separate concepts and require a verified relationship model. Avoid policy OR-bypass by testing the *effective* policy set.

### B4. Required tests

Use two real isolated test identities in staging (or a disposable isolated database), with no production personal data.

- A can read and mutate only A's saved listings/routes and application tracker.
- A cannot read B's rows, even with B's UUID supplied as a path, query, body, or filter.
- A cannot insert a row with B's candidate ID.
- Missing, pending, revoked, inactive, and ambiguous identity links fail closed.
- Unauthenticated/anonymous access is denied.
- Service-role/backend access works only through the approved server context and is audited where required.
- Candidate document metadata and signed-download endpoints enforce the same owner boundary.
- Tests assert expected row counts and verify B's records remain unchanged after A's negative mutation attempts.

Do not insert fabricated opportunities into the public marketplace to satisfy launch evidence.

## Phase C–E sequencing

1. **Phase C — Finance:** atomic PayFast ITN verification, signature validation, exact cents/currency, idempotency under concurrency, and ledger-backed invoice state changes. Return URLs are never payment proof.
2. **Phase D — Operations:** founder-only review queue, append-only audit, and tested approve/reject notifications.
3. **Phase E — Launch:** successful isolated backup/restore rehearsal, production environment review, and completed `docs/launch/GO_LIVE_CHECKLIST.md`.

No external application auto-submission or Jarvis expansion should jump ahead of the identity, finance, operations, and recovery gates.

## Current disposition

**Phase A: NOT CERTIFIED.** Real listing evidence, current-head green build/tests, and safe reviewer-preview verification remain outstanding.  
**Phase B: IN PROGRESS / NOT RUNTIME-VERIFIED.** The live schema contains identity-link and candidate-owned document tables, but the complete ownership/RLS test matrix has not been demonstrated here.  
**Production launch: NOT AUTHORIZED by this record.**

This is an execution contract and evidence checklist, not a claim that unexecuted commands passed or that migrations/deploys were performed.
