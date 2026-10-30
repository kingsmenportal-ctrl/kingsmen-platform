# Kingsmen Identity, Candidate Onboarding and RC1 Integration Strategy
Date: 2026-10-30
Status: Registered execution plan; implementation and release gates remain open.

## Objective
Deliver one integrated Kingsmen website where new candidates register themselves, confirm their email, complete consent and profile setup, upload private evidence, recover an existing candidate record through identity review, and use the unified application workspace. Authorised reviewers use a protected queue and decisions workflow. Do not create a second identity model or bypass normal GitHub review, branch protection, Supabase security, or founder approval.

## Verified current baseline
- Repository: [kingsmen-platform](https://github.com/kingsmenportal-ctrl/kingsmen-platform).
- Backend consolidation PR #209: https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/209
- Candidate experience PR #216: https://github.com/kingsmenportal-ctrl/kingsmen-platform/pull/216
- Existing identity-review UI/work: PR #190; candidate portal entry: PR #202; Document Vault visual contribution: PR #200.
- PR #209 is the backend base for #216. Preserve dependency order: review/approve #209 first, then review #216. #190, #202 and #200 are source contributions to inspect and selectively reconcile, not blindly merge.
- The deployed candidate-master-profile Edge Function calls bootstrap_candidate_self_profile when a new authenticated user saves a consented initial profile. The website flow is registration/email confirmation -> profile setup -> explicit consent -> profile save/bootstrap. Registration alone does not create a complete candidate profile.
- Staging snapshot: 3 Auth users, 2 candidate rows, 0 verified Auth-to-candidate links, 0 identity-review requests/evidence, 0 private document objects, 0 candidate master applications/CAO choices/tracker rows, 0 candidate-specific opportunity matches. One active, non-revoked IDENTITY_REVIEWER grant maps to an existing, confirmed, non-deleted Auth user; identify the authorised operator account without disclosing its credentials and verify login before use.
- Staging migration ledger ends at 0095. PR #216 migration 0096 is code-only; its transactional dry-run was rolled back. Do not apply until provenance, independent review, preflight, backup/restore, grants and postconditions are approved.
- Exact Netlify published deployment ID/commit SHA is currently not verified. A site existing is not proof that the current candidate branch is deployed.
- Current recorded workflow runs for the fetched PR heads succeeded, but these are source/build/contract checks, not proof of an authenticated staging journey.

## Required execution sequence

### Batch 1 — Independent backend review and release reconciliation
1. Review PR #209 at its current head, including source diff, current-head CI, migrations 0087–0095, the backend authority/dependency matrix, migration provenance, SECURITY DEFINER grants, RLS policies, storage boundaries, pricing/checkout boundaries and lifecycle timestamp guards.
2. Keep #209 unmerged until an independent human reviewer approves. Green CI does not waive security review, backup/restore or staging journey gates.
3. Reconcile PR #206 / migration 0097 ACL hardening as a separate security dependency. Preserve duplicate historical migration-ledger entries and recovered migration bodies; do not replay or delete history based on labels.
4. Record implemented/tested/deployed/E2E status separately with exact SHA, workflow run IDs, migration ledger state, backup/restore evidence and owner.

### Batch 2 — Canonical candidate registration and profile
1. Keep the existing Supabase Auth registration/sign-in/recovery page.
2. On confirmed registration, route the candidate to profile setup. Require explicit PROFILE_PROCESSING consent before first save.
3. Call the existing /api/candidate/profile proxy -> candidate-master-profile Edge Function -> bootstrap_candidate_self_profile RPC. Do not create candidate rows directly from the browser.
4. Prove candidate reference creation, profile save/read/update/reload, consent state, pathway preferences, profile completeness, and correct pending-vs-verified identity status.
5. Existing candidate references must use the identity-recovery workflow; never auto-link by email equality or user-editable metadata.

### Batch 3 — Identity recovery and reviewer
1. Integrate existing PR #190 candidate request/status/follow-up/evidence pages and reviewer queue, using current APIs/functions where compatible.
2. Candidate submits their existing candidate reference and claim; server verifies session and request ownership. Upload only permitted PDF/JPEG/PNG evidence to the private identity-review bucket with size/signature checks, SHA-256 and metadata.
3. Reviewer signs in with the existing Auth account mapped to an active, non-revoked IDENTITY_REVIEWER grant. Server checks the grant on every queue/read/decision action; no email-only role mapping.
4. Reviewer records evidence decision and note; audit must succeed or the operation must safely roll back. Approval requires accepted evidence, exact candidate-reference match, conflict checks, verified Auth UUID link and audit.
5. Verify needs-information, rejection, resubmission, duplicate request and conflicting-link cases. Candidate status must reflect persisted evidence and decision, never UI-only state.

### Batch 4 — Merge the existing candidate experience, not duplicate it
1. Treat PR #216 as the candidate-experience integration line stacked on #209.
2. Compare PR #190, #202 and #200 against the files already present in #209/#216. Port only missing, still-valid components and tests. Resolve duplicate routes and old API assumptions deliberately.
3. Preserve one candidate portal shell, one reusable profile, one master application with child choices, one tracker and one private Document Vault. Keep all six pathways discoverable; only verified/open opportunities may be represented as open.
4. Review migration 0096 independently: composite child-parent ownership, exactly-one-parent check, choice ordering/limit, event allow-list, consent gate, SECURITY DEFINER search path, grants and rollback. Apply only after approval and a protected staging backup/restore.
5. Deploy/redeploy candidate-save-verified-opportunity only from reviewed source and prove the active consent and verified-match gates at runtime.

### Batch 5 — Real staging accounts and E2E
Use dedicated synthetic staging identities and synthetic files, never real national-ID documents.
1. Create Candidate A and Candidate B through the website registration and email-confirmation flow; use separate confirmed accounts and sessions.
2. Complete consent/profile setup for both through the website.
3. For reviewer-isolation test fixtures, establish separate verified candidate identities and two private test documents through the actual workflow and authorised reviewer. Do not seed direct Auth/candidate links to shortcut the test.
4. Use the existing opt-in profile persistence harness with explicit mutation flags only on a dedicated test account; restore its baseline after test.
5. Run profile create/read/update/reload, identity request/evidence/review/link/audit, private upload/signed-read/expiry, candidate A/B read/write isolation, reviewer-positive and candidate-negative authorisation, application parent/CAO child persistence, tracker persistence, consent withdrawal and stale opportunity rejection.
6. Record each test as PASS/FAIL/BLOCKED with timestamp, environment, exact commit and redacted evidence. Missing tokens/OTP/authorized test identities means BLOCKED, not PASS.

### Batch 6 — Publish and verify Netlify staging
1. Verify site build settings and public Supabase URL/anon key configuration; never expose service-role secrets.
2. Publish the approved integrated branch through the connected GitHub-to-Netlify build/deploy workflow. No direct promotion of the unapproved Lovable temporary project.
3. Capture the Netlify deploy ID, branch, commit SHA, state and deploy URL. Verify the published SHA equals the approved GitHub SHA.
4. Open the actual site and verify registration, email-confirmation return route, profile setup, identity recovery, document upload, reviewer login/queue, application workspace and error states. Run the authenticated E2E tests against that deployed URL.
5. Do not mark deployed or E2E verified until the exact published commit and authenticated results are available.

## Current code-review observations
- #209 is large (292 commits / 148 changed files in the current metadata) despite being titled backend consolidation. Require explicit file-scope/dependency review and do not merge merely because checks are green.
- #209 and #216 current fetched heads both have successful CI workflow results; this covers automated checks only.
- #216 adds migration 0096 and a candidate/reviewer isolation E2E harness. The harness requires separately provisioned verified Candidate A/B tokens, reviewer token and private document IDs; no live run can be claimed until these authorised fixtures exist.
- Existing UI source can be reused, but #190/#202/#200 are older branches with different bases. Reconcile file-by-file instead of blindly merging all three.
- Reviewer grant row is active and maps to a confirmed, non-deleted Auth user, but actual reviewer sign-in and a positive queue/decision runtime check remain unproven.
- Netlify published deployment metadata currently does not establish the exact source SHA.

## Release gates
Do not call RC1 complete until all are true:
- [ ] Independent human review of #209 and security dependency #206/0097 completed.
- [ ] #209 merged under normal repository controls; #216 rebased/reconciled onto the approved backend base and independently reviewed.
- [ ] Migration provenance, backup/restore, ACLs, RLS, SECURITY DEFINER and leaked-password protection addressed with evidence.
- [ ] Migration 0096 reviewed, approved, applied and verified only if required by the approved code path.
- [ ] Candidate registration/bootstrap and profile persistence pass through the website.
- [ ] Identity request, private evidence, reviewer decision, verified link and audit pass end-to-end.
- [ ] Candidate A/B isolation and reviewer-positive/candidate-negative tests pass.
- [ ] Document Vault upload/read/expiry/ownership tests pass.
- [ ] Application parent, CAO choices and tracker persist and reload correctly.
- [ ] Netlify deploy ID and published SHA match the approved release commit.
- [ ] Authenticated E2E results and redacted evidence are registered in Notion.

## Reporting contract
For every batch report four separate percentages: implemented, tested, deployed and end-to-end verified. A code build, PR merge, migration dry-run, empty table or deployed site alone is not end-to-end evidence. Preserve the existing Kingsmen plan, package rules, six pathways, South Africa scope, 500 initial active-candidate cap, POPIA, email-only communications, MAP-first/Phoenix-fallback and no branch-protection/review bypass.
