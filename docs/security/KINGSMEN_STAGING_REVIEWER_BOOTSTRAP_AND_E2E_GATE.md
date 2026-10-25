# Kingsmen staging reviewer bootstrap and live-journey gate

**Purpose:** establish the first reviewer without weakening candidate isolation or inventing an administrator identity.

## Current staging facts (2026-10-22)

- Supabase project: `euhubhhnumtibbyufghm` (staging).
- `auth.users`: 3 rows.
- `public.platform_reviewers`: 0 rows.
- `public.candidate_identity_review_requests`: 0 rows.
- `public.candidate_auth_identity_links`: 0 rows.
- `public.candidate_private_documents`: 0 rows.
- `private.current_verified_candidate_id()`: present; the public-schema copy is absent.
- Review queue/audit tables are backend-only; do not add broad client table grants or policies to silence the linter.

These counts are point-in-time observations, not proof that a real candidate/reviewer journey has passed.

## First reviewer: controlled owner operation

There is no self-service reviewer-grant endpoint documented in the current staging contract. Do not create a `PLATFORM_ADMIN` row just to make tests pass, and do not infer authority from an email address or from being present in `auth.users`.

1. Obtain explicit, out-of-band approval from the Kingsmen project owner for the named human reviewer and the minimum required role (`EVIDENCE_VERIFIER` for document review; reserve `PLATFORM_ADMIN` for identity decisions and administrative duties).
2. In Supabase Dashboard for the staging project, open **Authentication → Users** and copy the immutable Auth user UUID for the reviewer. Confirm the person controls that account through the normal sign-in process. Do not use a candidate UUID or a candidate's email as a substitute.
3. In SQL Editor, inspect the live constraints and privileges before writing anything:

   ```sql
   select conname, pg_get_constraintdef(oid)
   from pg_constraint
   where conrelid = 'public.platform_reviewers'::regclass
   order by conname;

   select grantee, privilege_type
   from information_schema.role_table_grants
   where table_schema = 'public'
     and table_name = 'platform_reviewers'
   order by grantee, privilege_type;
   ```

4. Use a project-owner-authorized, transaction-scoped insert that records the actual granting operator in `granted_by_auth_user_id`, the approved role, and the approved Auth UUID. Do not grant direct `anon` or `authenticated` write access to `platform_reviewers`. If the schema's constraints or grantor semantics do not permit an honest record of the operator, stop and implement a dedicated owner-controlled, audited grant mechanism first; do not improvise a bypass.
5. Record the approval/ticket reference, operator, target Auth UUID, role, timestamp, and resulting reviewer-row UUID in the internal change record. Never record access tokens, passwords, or service-role keys.
6. Verify the new row is active, not revoked, and tied to the intended Auth UUID. Verify a non-reviewer is still denied from the reviewer queue and document-review RPC.

## Candidate identity review test

- Use two test accounts controlled by the test operator and two distinct, explicitly approved candidate fixtures.
- Submit identity claims through the supported backend workflow; do not directly insert a verified identity link.
- Have the authorised human reviewer check the candidate's supplied reference against the active candidate record before approving.
- Verify the decision, reviewer UUID, timestamp, note, and audit event are persisted.
- Verify candidate A cannot read candidate B's profile, preparation items, document metadata, or signed-download route. Also test unauthenticated and unlinked users.
- Test `NEEDS_INFORMATION` followed by a candidate response and resubmission; ensure the audit trail is retained.
- Use synthetic documents only. Confirm upload finalization checks object existence, MIME/magic bytes, size and digest; verify signed read URLs expire and read-link issuance is audited.
- Remove test fixtures using the supported retention/deletion procedure after capturing redacted evidence.

## Release gate

Do not call this workflow complete until there is evidence for all of the following on the same deployed commit:

- migration integrity and source guard checks;
- actual authenticated API/browser requests for two separate candidates;
- positive and negative RLS/storage isolation tests;
- reviewer authorization and audited approve/reject/needs-information decisions;
- private upload, finalization, signed read, expiry and cross-candidate denial;
- Netlify deploy ID/commit SHA and a successful post-deploy smoke run.

A migration applied to staging, a source validator, a mocked test, or an empty workflow-run list does not satisfy the live end-to-end gate.
